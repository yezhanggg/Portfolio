// QA: screenshot every rebuilt page (desktop + phone) and place it next to the Wix original.
// Needs a running preview:  pnpm build && pnpm preview   (default http://localhost:4321)
// Output: <archive>/inventory/compare/<site>__<slug>__<view>.jpg   (left = Wix, right = rebuilt)
//
// usage: node migration/scripts/compare.mjs [baseUrl] [slugFilter]
import { chromium, devices } from "playwright";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const BASE = process.argv[2] || "http://localhost:4321";
const FILTER = process.argv[3];
const INV = path.join(os.homedir(), "Desktop/yezhang-site-archive/inventory");
const OUT = path.join(INV, "compare");
fs.mkdirSync(OUT, { recursive: true });
const VIEWS = [
  { name: "desktop", opts: { viewport: { width: 1440, height: 900 } }, colW: 720 },
  { name: "mobile", opts: { ...devices["iPhone 13"] }, colW: 390 },
];

let pages = JSON.parse(fs.readFileSync(path.join(INV, "page-list.json"), "utf8"));
if (FILTER) pages = pages.filter((p) => `${p.site}__${p.slug}`.includes(FILTER));
const routeOf = (p) => "/" + [p.site === "zhaeng" ? "zhaeng" : "", p.slug === "index" ? "" : p.slug].filter(Boolean).join("/");

const browser = await chromium.launch();
const problems = [];
for (const view of VIEWS) {
  const ctx = await browser.newContext(view.opts);
  for (const pg of pages) {
    const name = `${pg.site}__${pg.slug}__${view.name}`;
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("requestfailed", (r) => !/\.mp4$/.test(r.url()) && errors.push("failed " + r.url())); // videos abort when the tab closes
    page.on("response", (r) => r.status() >= 400 && errors.push(r.status() + " " + r.url()));
    await page.goto(BASE + encodeURI(routeOf(pg)), { waitUntil: "load", timeout: 60000 }).catch((e) => errors.push(e.message));
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    const shot = await page.screenshot({ fullPage: true });
    await page.close();
    if (errors.length) problems.push([name, [...new Set(errors)].slice(0, 4)]);

    const wix = path.join(INV, "screenshots", name + ".png");
    const col = async (input) => sharp(input, { limitInputPixels: false }).resize({ width: view.colW }).extract({ left: 0, top: 0, width: view.colW, height: 1 }).toBuffer().catch(() => null) && sharp(input, { limitInputPixels: false }).resize({ width: view.colW }).toBuffer({ resolveWithObject: true });
    const a = fs.existsSync(wix) ? await col(wix) : null;
    const b = await col(shot);
    const height = Math.min(Math.max(a?.info.height || 0, b.info.height), 9000);
    const crop = async (c) => (c ? sharp(c.data).extract({ left: 0, top: 0, width: view.colW, height: Math.min(c.info.height, height) }).toBuffer() : null);
    const layers = [];
    if (a) layers.push({ input: await crop(a), left: 0, top: 0 });
    layers.push({ input: await crop(b), left: view.colW + 12, top: 0 });
    await sharp({ create: { width: view.colW * 2 + 12, height, channels: 3, background: "#ff00aa" } }).composite(layers).jpeg({ quality: 72 }).toFile(path.join(OUT, name + ".jpg"));
    console.log("ok", name, a ? `${a.info.height} vs ${b.info.height}` : "(no original)");
  }
  await ctx.close();
}
await browser.close();
if (problems.length) {
  console.log("\nPAGES WITH ERRORS");
  for (const [n, e] of problems) console.log(n, "\n   " + e.join("\n   "));
}
