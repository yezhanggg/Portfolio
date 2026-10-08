// Interaction audit of the live Wix pages: what happens when things are clicked (zoom dialogs,
// popups, anchor scrolls, video play/sound), which overlays appear on hover, and which elements
// move with the scroll position. Output: <archive>/inventory/interaction/<site>__<slug>__<view>.json
//
// usage: node migration/scripts/interaction_audit.mjs [slugRegex] [desktop|mobile]
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const INV = path.join(os.homedir(), "Desktop/yezhang-site-archive/inventory");
const OUT = path.join(INV, "interaction");
fs.mkdirSync(OUT, { recursive: true });
const FILTER = process.argv[2];
const ONLY_VIEW = process.argv[3] || "desktop";
const VIEWS = [
  { name: "desktop", opts: { viewport: { width: 1440, height: 900 } } },
  { name: "mobile", opts: { ...devices["iPhone 13"] } },
].filter((v) => v.name === ONLY_VIEW);
const CONCURRENCY = 4;

function collectTargets() {
  const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
  const out = [];
  const perComp = {};
  let n = 0;
  for (const el of document.querySelectorAll("#SITE_CONTAINER *")) {
    const cs = getComputedStyle(el);
    if (cs.cursor !== "pointer" || cs.visibility === "hidden") continue;
    if (el.parentElement && getComputedStyle(el.parentElement).cursor === "pointer") continue; // top-most clickable only
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) continue;
    const link = el.closest("a[href]");
    const href = link?.getAttribute("href") || "";
    const comp = el.closest("[id^='comp-'], [id^='pro-gallery']")?.id || "";
    perComp[comp] = (perComp[comp] || 0) + 1;
    if (perComp[comp] > 2) continue; // sample repeated items (gallery cells)
    el.setAttribute("data-ia", String(n));
    out.push({
      i: n++, comp, tag: el.tagName.toLowerCase(), role: el.getAttribute("role") || el.closest("[role]")?.getAttribute("role") || undefined,
      popup: el.getAttribute("aria-haspopup") || el.closest("[aria-haspopup]")?.getAttribute("aria-haspopup") || undefined,
      testid: el.getAttribute("data-testid") || el.closest("[data-testid]")?.getAttribute("data-testid") || undefined,
      text: (el.innerText || el.getAttribute("aria-label") || el.querySelector("img")?.alt || "").trim().slice(0, 40) || undefined,
      href: href && !href.startsWith("#") ? href.slice(0, 80) : href || undefined,
      rect: [Math.round(r.left + scrollX), Math.round(r.top + scrollY - ads), Math.round(r.width), Math.round(r.height)],
    });
  }
  return out;
}
function pageState() {
  const dialogs = [...document.querySelectorAll("[role='dialog'], #POPUPS_ROOT > *, [data-testid*='imageZoom'], [data-testid*='Zoom'] , .pro-fullscreen-wrapper, [data-hook='fullscreen-wrapper']")].filter((d) => d.getBoundingClientRect().width > 50);
  return {
    url: location.pathname + location.search + location.hash,
    scrollY: Math.round(scrollY),
    dialogs: dialogs.length,
    dialogInfo: dialogs.slice(0, 1).map((d) => ({ testid: d.getAttribute("data-testid") || d.id || d.className.toString().slice(0, 40), imgs: d.querySelectorAll("img").length, text: (d.innerText || "").trim().slice(0, 80), btns: [...d.querySelectorAll("button, [role='button']")].map((b) => b.getAttribute("aria-label") || b.getAttribute("data-testid") || "").filter(Boolean).slice(0, 6) }))[0],
    videos: [...document.querySelectorAll("video")].map((v) => [v.paused ? "paused" : "playing", v.muted ? "muted" : "sound"].join("/")),
  };
}
function videoInfo() {
  const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
  return [...document.querySelectorAll("video")].map((v) => {
    const box = v.closest(".wixui-video-box, [id^='comp-']");
    const r = v.getBoundingClientRect();
    const q = (s) => { const e = box?.querySelector(s); if (!e) return null; const er = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { rect: [Math.round(er.left + scrollX), Math.round(er.top + scrollY - ads), Math.round(er.width), Math.round(er.height)], opacity: cs.opacity, fill: getComputedStyle(e.querySelector("svg, path") || e).fill }; };
    return {
      comp: box?.id, videoBox: !!v.closest(".wixui-video-box"), rect: [Math.round(r.left + scrollX), Math.round(r.top + scrollY - ads), Math.round(r.width), Math.round(r.height)],
      paused: v.paused, muted: v.muted, loop: v.loop, autoplay: v.autoplay,
      play: q("[data-testid*='play']"), audio: q("[data-testid='vb-audio'], [data-testid*='audio']"),
      fixed: getComputedStyle(v).position === "fixed" || !!v.closest("#BACKGROUND_GROUP, #SITE_BACKGROUND"),
    };
  });
}
function hoverOverlaySnapshot(i) {
  const root = document.querySelector(`[data-ia="${i}"]`);
  const host = root?.closest(".gallery-item-container, .wixui-gallery__item, [id^='comp-']") || root;
  if (!host) return null;
  return [...host.querySelectorAll("*")].slice(0, 60).map((el) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { k: el.tagName.toLowerCase() + "." + (el.className?.toString() || "").split(" ").filter(Boolean).slice(0, 2).join("."), o: cs.opacity, v: cs.visibility, d: cs.display, bg: cs.backgroundColor, w: Math.round(r.width), h: Math.round(r.height), text: el.children.length === 0 ? (el.textContent || "").trim().slice(0, 40) : "", tf: cs.transform === "none" ? "" : cs.transform, fl: cs.filter === "none" ? "" : cs.filter };
  });
}
function scrollSample() {
  const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
  const out = {};
  for (const el of document.querySelectorAll("#SITE_CONTAINER [id^='comp-']")) {
    const cs = getComputedStyle(el);
    if (cs.position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || r.bottom < -200 || r.top > innerHeight + 200) continue;
    out[el.id] = { y: Math.round((r.top + scrollY - ads) * 10) / 10, x: Math.round((r.left + scrollX) * 10) / 10, w: Math.round(r.width), h: Math.round(r.height), o: cs.opacity, t: cs.transform === "none" ? "" : cs.transform, lay: [el.offsetWidth, el.offsetHeight], pos: cs.position };
  }
  return out;
}

async function audit(browser, pg, view) {
  const name = `${pg.site}__${pg.slug}__${view.name}`;
  if (!FILTER && !process.env.FORCE && fs.existsSync(path.join(OUT, name + ".json"))) return;
  const ctx = await browser.newContext(view.opts);
  const page = await ctx.newPage();
  const result = { page: name, url: pg.url, clicks: [], hoverOverlays: [], scroll: [] };
  const load = async () => {
    await page.goto(pg.url, { waitUntil: "load", timeout: 60000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelector("#SITE_PAGES img, #SITE_PAGES a, #SITE_PAGES video, #SITE_PAGES iframe"), null, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(2500);
  };
  try {
    await load();
    result.videos = await page.evaluate(videoInfo);

    // --- scroll-linked movement: sample component boxes at several scroll positions (pointer parked)
    await page.mouse.move(3, 3);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = await page.evaluate(() => innerHeight);
    const track = {};
    for (let y = 0; y <= Math.max(0, h - vh) + 1; y += 150) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(450);
      const s = await page.evaluate(scrollSample);
      for (const [k, v] of Object.entries(s)) (track[k] ||= []).push({ s: y, ...v });
      if (y > 6000) break;
    }
    for (const [k, list] of Object.entries(track)) {
      const ys = list.map((v) => v.y), os_ = list.map((v) => Number(v.o)), ts = new Set(list.map((v) => v.t));
      if (list.length > 2 && (Math.max(...ys) - Math.min(...ys) > 4 || Math.max(...os_) - Math.min(...os_) > 0.15 || ts.size > 2) && list[0].pos !== "sticky") {
        result.scroll.push({ comp: k, lay: list[0].lay, samples: list.map((v) => [v.s, v.x, v.y, v.o, v.t.replace(/matrix\(|\)/g, "").slice(0, 60)]).slice(0, 14) });
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);

    // --- clicks and hover overlays
    const targets = await page.evaluate(collectTargets);
    result.targets = targets.length;
    for (const t of targets) {
      const loc = page.locator(`[data-ia="${t.i}"]`);
      if (!(await loc.count())) continue;
      await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      // hover overlay (desktop)
      if (view.name === "desktop") {
        await page.mouse.move(3, 3);
        await page.waitForTimeout(200);
        const a = await page.evaluate(new Function("i", `return (${hoverOverlaySnapshot.toString()})(i)`), t.i);
        await loc.hover({ force: true, timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(650);
        const b = await page.evaluate(new Function("i", `return (${hoverOverlaySnapshot.toString()})(i)`), t.i);
        if (a && b && a.length === b.length) {
          const shown = b.filter((x, i) => (Number(a[i].o) < 0.2 && Number(x.o) > 0.5) || (a[i].v === "hidden" && x.v === "visible") || (a[i].d === "none" && x.d !== "none") || a[i].tf !== x.tf || a[i].fl !== x.fl).map((x, i) => ({ ...x }));
          if (shown.length) result.hoverOverlays.push({ comp: t.comp, rect: t.rect, text: t.text, shown: shown.slice(0, 8) });
        }
      }
      if (t.href && !t.href.startsWith("#") && !t.popup) continue; // plain links: nothing to learn by clicking
      const before = await page.evaluate(pageState);
      await loc.click({ force: true, timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(1400);
      const after = await page.evaluate(pageState).catch(() => null);
      if (!after) { await load(); continue; }
      const outcome = after.url !== before.url ? (/lightbox=/.test(after.url) ? "popup-url" : "navigate") : after.dialogs > before.dialogs ? "dialog" : Math.abs(after.scrollY - before.scrollY) > 40 ? "scroll" : after.videos.join() !== before.videos.join() ? "video" : "nothing";
      result.clicks.push({ ...t, outcome, to: outcome === "navigate" || outcome === "popup-url" ? after.url : outcome === "scroll" ? after.scrollY : undefined, dialog: outcome === "dialog" || outcome === "popup-url" ? after.dialogInfo : undefined, videos: outcome === "video" ? [before.videos, after.videos] : undefined });
      if (outcome === "navigate") { await load(); await page.evaluate(collectTargets); }
      else if (outcome !== "nothing") { await page.keyboard.press("Escape"); await page.waitForTimeout(500); if ((await page.evaluate(pageState)).dialogs > before.dialogs) { await load(); await page.evaluate(collectTargets); } }
    }
  } catch (e) {
    result.error = e.message.split("\n")[0];
  }
  await ctx.close();
  fs.writeFileSync(path.join(OUT, name + ".json"), JSON.stringify(result, null, 1));
  const oc = {};
  for (const c of result.clicks) oc[c.outcome] = (oc[c.outcome] || 0) + 1;
  console.log(result.error ? "FAIL " + result.error : "ok", name, "| clicks", JSON.stringify(oc), "| hoverOverlays", result.hoverOverlays.length, "| scroll", result.scroll.length, "| videos", (result.videos || []).filter((v) => v.play || v.audio).length);
}

let pages = JSON.parse(fs.readFileSync(path.join(INV, "page-list.json"), "utf8"));
if (FILTER) pages = pages.filter((p) => new RegExp(FILTER).test(`${p.site}__${p.slug}`));
const jobs = pages.flatMap((pg) => VIEWS.map((view) => ({ pg, view })));
const browser = await chromium.launch();
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (next < jobs.length) { const j = jobs[next++]; await audit(browser, j.pg, j.view); } }));
await browser.close();
