// Pass 1 of the Wix export: for every published page of both sites, at desktop and phone widths,
// save the rendered DOM, a full-page screenshot, every wixstatic request, and a flat dump of the
// Wix component tree with bounding boxes. Output goes to the archive folder (not the repo).
//
// usage: node migration/scripts/crawl_pages.mjs [archiveDir] [slugFilter]
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const OUT = path.resolve((process.argv[2] || "~/Desktop/yezhang-site-archive/inventory").replace(/^~/, os.homedir()));
const FILTER = process.argv[3];
const SITES = [
  { key: "yz", base: "https://www.yezhang.net", sitemap: "https://www.yezhang.net/pages-sitemap.xml" },
  { key: "zhaeng", base: "https://yegnahz.wixsite.com/zhaeng", sitemap: "https://yegnahz.wixsite.com/zhaeng/pages-sitemap.xml" },
];
const VIEWS = [
  { name: "desktop", opts: { viewport: { width: 1440, height: 900 } } },
  { name: "mobile", opts: { ...devices["iPhone 13"] } },
];
const CONCURRENCY = 4;

for (const d of ["rendered", "screenshots", "tree"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });

async function pageList(site) {
  const xml = await (await fetch(site.sitemap)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    const url = m[1];
    const slug = decodeURIComponent(url.slice(site.base.length).replace(/^\/|\/$/g, "")) || "index";
    return { site: site.key, url, slug };
  });
}

// Runs in the page: one row per Wix component / media element, in document order.
function dumpTree() {
  const rows = [];
  const sx = window.scrollX, sy = window.scrollY;
  const all = document.querySelectorAll("[id^='comp-'], [id^='SITE_'], [id^='PAGES_'], img, video, iframe, svg, form, input, textarea, button, a[href]");
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const cs = getComputedStyle(el);
    const parentComp = el.parentElement?.closest("[id^='comp-'], [id^='SITE_'], [id^='PAGES_']");
    rows.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || undefined,
      parent: parentComp?.id,
      testid: el.getAttribute("data-testid") || undefined,
      cls: (typeof el.className === "string" ? el.className : "").slice(0, 120) || undefined,
      box: [Math.round(r.left + sx), Math.round(r.top + sy), Math.round(r.width), Math.round(r.height)],
      src: el.currentSrc || el.src || el.getAttribute("data-src") || undefined,
      poster: el.poster || undefined,
      href: el.getAttribute("href") || undefined,
      alt: el.getAttribute("alt") || undefined,
      pos: cs.position !== "static" ? cs.position : undefined,
      vis: cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0" ? "hidden" : undefined,
      bg: cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : undefined,
      text: el.matches("[data-testid='richTextElement']") ? el.innerText.slice(0, 300) : undefined,
    });
  }
  return {
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    title: document.title,
    rows,
  };
}

async function capture(browser, pg, view) {
  const name = `${pg.site}__${pg.slug}__${view.name}`;
  if (!FILTER && fs.existsSync(path.join(OUT, "screenshots", name + ".png"))) return [name, null]; // resumable
  const ctx = await browser.newContext(view.opts);
  const page = await ctx.newPage();
  const requests = [];
  page.on("request", (r) => /wixstatic\.com|wixmp\.com|youtube|files\.wix\.com/.test(r.url()) && requests.push(r.url()));
  try {
    await page.goto(pg.url, { waitUntil: "load", timeout: 60000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {}); // video pages never go idle
    let h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 600) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(250);
      h = await page.evaluate(() => document.documentElement.scrollHeight);
    }
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    const tree = await page.evaluate(dumpTree);
    fs.writeFileSync(path.join(OUT, "tree", name + ".json"), JSON.stringify(tree));
    fs.writeFileSync(path.join(OUT, "rendered", name + ".html"), await page.content());
    await page.screenshot({ path: path.join(OUT, "screenshots", name + ".png"), fullPage: true });
    console.log("ok", name, tree.width + "x" + tree.height, tree.rows.length, "rows", requests.length, "req");
  } catch (e) {
    console.log("FAIL", name, e.message.split("\n")[0]);
  }
  await ctx.close();
  return [name, [...new Set(requests)]];
}

let pages = (await Promise.all(SITES.map(pageList))).flat();
if (FILTER) pages = pages.filter((p) => `${p.site}__${p.slug}`.includes(FILTER));
fs.writeFileSync(path.join(OUT, "page-list.json"), JSON.stringify(pages, null, 1));
const jobs = pages.flatMap((pg) => VIEWS.map((view) => ({ pg, view })));
const browser = await chromium.launch();
const assetsFile = path.join(OUT, "page-assets.json");
const assets = fs.existsSync(assetsFile) ? JSON.parse(fs.readFileSync(assetsFile, "utf8")) : {};
let next = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) {
      const { pg, view } = jobs[next++];
      const [name, reqs] = await capture(browser, pg, view);
      if (reqs) assets[name] = reqs;
      fs.writeFileSync(assetsFile, JSON.stringify(assets, null, 1));
    }
  })
);
fs.writeFileSync(assetsFile, JSON.stringify(assets, null, 1));
await browser.close();
console.log("pages", pages.length, "captures", jobs.length);
