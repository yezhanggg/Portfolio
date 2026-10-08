// Motion audit of the live Wix pages: records every animation that runs (entrance, loops,
// slideshow transitions), anything that moves by itself, scroll-linked movement, and what
// changes on hover. Output: <archive>/inventory/motion/<site>__<slug>__<view>.json
//
// usage: node migration/scripts/motion_audit.mjs [slugRegex] [desktop|mobile]
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const INV = path.join(os.homedir(), "Desktop/yezhang-site-archive/inventory");
const OUT = path.join(INV, "motion");
fs.mkdirSync(OUT, { recursive: true });
const FILTER = process.argv[2];
const ONLY_VIEW = process.argv[3];
const VIEWS = [
  { name: "desktop", opts: { viewport: { width: 1440, height: 900 } } },
  { name: "mobile", opts: { ...devices["iPhone 13"] } },
].filter((v) => !ONLY_VIEW || v.name === ONLY_VIEW);
const CONCURRENCY = 4;

// Runs before any page script: log every animation the page ever plays.
function installLogger() {
  window.__anims = new Map();
  const compOf = (el) => el?.closest?.("[id^='comp-'], [id^='pro-gallery'], [id^='SITE_'], [id^='PAGES_'], [id^='BACKGROUND']") || el;
  const scan = () => {
    let list = [];
    try { list = document.getAnimations(); } catch { return; }
    for (const a of list) {
      const eff = a.effect;
      const target = eff?.target;
      if (!target || !eff.getKeyframes) continue;
      const comp = compOf(target);
      const name = a.animationName || a.transitionProperty || a.id || "waapi";
      const key = (comp?.id || "?") + "|" + (target.id || target.className?.toString().slice(0, 40) || target.tagName) + "|" + name + "|" + (a.transitionProperty ? "t" : "a");
      if (window.__anims.has(key)) continue;
      const t = eff.getTiming();
      const r = comp?.getBoundingClientRect?.();
      const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
      window.__anims.set(key, {
        kind: a.transitionProperty ? "transition" : a.animationName ? "css" : "waapi",
        name, comp: comp?.id, target: target.tagName.toLowerCase() + (target.id ? "#" + target.id : ""), targetCls: (target.className?.toString() || "").slice(0, 80),
        pseudo: eff.pseudoElement || undefined,
        timing: { duration: t.duration, delay: t.delay, iterations: t.iterations, easing: t.easing, fill: t.fill, direction: t.direction },
        keyframes: eff.getKeyframes().map((k) => { const o = {}; for (const [p, v] of Object.entries(k)) if (!["composite", "computedOffset"].includes(p) && v !== undefined && v !== null) o[p] = v; return o; }),
        rect: r ? [Math.round(r.left + scrollX), Math.round(r.top + scrollY - ads), Math.round(r.width), Math.round(r.height)] : null,
        at: Math.round(performance.now()),
      });
    }
  };
  setInterval(scan, 60);
  document.addEventListener("DOMContentLoaded", scan);
}

function snapshotRects() {
  const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
  const out = {};
  let i = 0;
  for (const el of document.querySelectorAll("#SITE_CONTAINER [id^='comp-'], #SITE_CONTAINER img, #SITE_CONTAINER .gallery-item-container")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    const key = el.id || "img" + i++ + ":" + (el.currentSrc || el.src || "").split("/media/")[1]?.slice(0, 20);
    out[key] = { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY - ads), w: Math.round(r.width), h: Math.round(r.height), o: cs.opacity, t: cs.transform === "none" ? "" : cs.transform, pos: cs.position, inView: r.bottom > 0 && r.top < innerHeight };
  }
  return out;
}

const HOVER_PROPS = ["color", "background-color", "opacity", "transform", "filter", "border-top-color", "border-top-width", "text-decoration-line", "letter-spacing", "box-shadow", "fill", "scale", "font-weight"];
function hoverTargets() {
  const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
  const seen = new Set(), out = [];
  const els = document.querySelectorAll("#SITE_CONTAINER a[href], #SITE_CONTAINER .wixui-button, #SITE_CONTAINER .wixui-image, #SITE_CONTAINER [role='button'], #SITE_CONTAINER .gallery-item-container, #SITE_CONTAINER .wixui-gallery__item, #SITE_CONTAINER button");
  let n = 0;
  for (const el of els) {
    const host = el.closest("[id^='comp-']") || el;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const key = Math.round(r.left) + "," + Math.round(r.top + scrollY) + "," + Math.round(r.width);
    if (seen.has(key)) continue;
    seen.add(key);
    el.setAttribute("data-hv", String(n));
    out.push({ i: n++, comp: host.id, tag: el.tagName.toLowerCase(), text: (el.innerText || "").trim().slice(0, 30), rect: [Math.round(r.left + scrollX), Math.round(r.top + scrollY - ads), Math.round(r.width), Math.round(r.height)] });
    if (n >= 40) break;
  }
  return out;
}
function styleProbe(i, props) {
  const root = document.querySelector(`[data-hv="${i}"]`);
  if (!root) return null;
  const els = [root, ...root.querySelectorAll("*")].slice(0, 14);
  const up = root.closest("[id^='comp-']");
  if (up && up !== root) els.push(up);
  return els.map((el) => {
    const cs = getComputedStyle(el), o = { _: el.tagName.toLowerCase() + "." + (el.className?.toString() || "").split(" ").filter(Boolean).slice(-1)[0], _tr: cs.transitionDuration + " " + cs.transitionTimingFunction };
    for (const p of props) o[p] = cs.getPropertyValue(p);
    const r = el.getBoundingClientRect();
    o.rect = [Math.round(r.width), Math.round(r.height)];
    o.vis = cs.visibility + "/" + cs.display;
    return o;
  });
}

async function audit(browser, pg, view) {
  const name = `${pg.site}__${pg.slug}__${view.name}`;
  if (!FILTER && !process.env.FORCE && fs.existsSync(path.join(OUT, name + ".json"))) return; // resumable
  const ctx = await browser.newContext(view.opts);
  await ctx.addInitScript(installLogger);
  const page = await ctx.newPage();
  const result = { page: name, url: pg.url };
  try {
    await page.goto(pg.url, { waitUntil: "load", timeout: 60000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelector("#SITE_PAGES img, #SITE_PAGES a, #SITE_PAGES video, #SITE_PAGES iframe"), null, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(2500);

    // idle motion at the top of the page
    const a = await page.evaluate(snapshotRects);
    await page.waitForTimeout(2000);
    const b = await page.evaluate(snapshotRects);
    result.idle = Object.keys(a).filter((k) => b[k] && a[k].inView && (Math.abs(a[k].x - b[k].x) > 1 || Math.abs(a[k].y - b[k].y) > 1 || a[k].t !== b[k].t || a[k].o !== b[k].o)).slice(0, 40).map((k) => ({ k, from: a[k], to: b[k] }));

    // scroll through: entrance animations fire, and we look for scroll-linked movement
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const track = {};
    for (let y = 0; y <= h; y += 300) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(350);
      const s = await page.evaluate(snapshotRects);
      for (const [k, v] of Object.entries(s)) {
        if (!k.startsWith("comp-") || !v.inView) continue;
        const t = (track[k] ||= { ys: [], pos: v.pos, w: v.w, h: v.h });
        t.ys.push(v.y);
      }
    }
    result.scrollLinked = Object.entries(track).filter(([, t]) => t.ys.length > 2 && Math.max(...t.ys) - Math.min(...t.ys) > 6).map(([k, t]) => ({ k, pos: t.pos, range: [Math.min(...t.ys), Math.max(...t.ys)], samples: t.ys.length, size: [t.w, t.h] })).slice(0, 30);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    // slideshows: does the slide change on its own?
    result.slideshows = [];
    for (const id of await page.evaluate(() => [...document.querySelectorAll(".wixui-slideshow")].map((s) => s.id))) {
      const cur = () => page.evaluate((sid) => { const s = document.getElementById(sid); const c = [...s.children].find((x) => x.id?.startsWith("comp-")) || s.querySelector("[id^='comp-']"); return c?.id; }, id);
      const seq = [];
      const t0 = Date.now();
      let last = await cur();
      for (let i = 0; i < 40; i++) {
        await page.waitForTimeout(250);
        const c = await cur();
        if (c !== last) { seq.push(Date.now() - t0); last = c; }
      }
      // then one manual step so its transition animation gets logged
      await page.click(`#${id} [data-testid='nextButton']`, { force: true, timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(1500);
      result.slideshows.push({ id, autoChangesAtMs: seq });
    }

    // hover effects (desktop only)
    result.hover = [];
    if (view.name === "desktop") {
      const targets = await page.evaluate(hoverTargets);
      for (const t of targets) {
        const loc = page.locator(`[data-hv="${t.i}"]`);
        await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await page.mouse.move(2, 2);
        await page.waitForTimeout(150);
        const before = await page.evaluate(([i, p]) => (window.__probe = undefined, null) || null, [t.i, HOVER_PROPS]).then(() => page.evaluate(new Function("a", `return (${styleProbe.toString()})(a[0], a[1])`), [t.i, HOVER_PROPS]));
        await loc.hover({ force: true, timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(700);
        const after = await page.evaluate(new Function("a", `return (${styleProbe.toString()})(a[0], a[1])`), [t.i, HOVER_PROPS]);
        if (!before || !after) continue;
        const diffs = [];
        for (let i = 0; i < Math.min(before.length, after.length); i++) {
          const d = {};
          for (const p of [...HOVER_PROPS, "vis"]) if (before[i][p] !== after[i][p]) d[p] = [before[i][p], after[i][p]];
          if (before[i].rect.join() !== after[i].rect.join()) d.rect = [before[i].rect, after[i].rect];
          if (Object.keys(d).length) diffs.push({ el: before[i]._, tr: after[i]._tr, ...d });
        }
        if (diffs.length) result.hover.push({ ...t, diffs });
      }
      await page.mouse.move(2, 2);
    }

    result.animations = await page.evaluate(() => {
      // Settled layout box of each animated component (centre is stable even while it spins).
      const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
      return [...window.__anims.values()].map((a) => {
        const el = a.comp && document.getElementById(a.comp);
        if (el) {
          const r = el.getBoundingClientRect();
          const w = el.offsetWidth || r.width, h = el.offsetHeight || r.height;
          a.box = [Math.round(r.left + scrollX + r.width / 2 - w / 2), Math.round(r.top + scrollY - ads + r.height / 2 - h / 2), Math.round(w), Math.round(h)];
          a.fixed = getComputedStyle(el).position === "fixed" || !!el.closest("#BACKGROUND_GROUP, #SITE_BACKGROUND") || undefined;
        }
        return a;
      });
    });
    // Auto-scrolling gallery strips: measure their drift.
    result.galleries = [];
    for (const id of await page.evaluate(() => [...document.querySelectorAll("[id^='pro-gallery-container']")].map((g) => g.id))) {
      const probe = () => page.evaluate((gid) => { const g = document.getElementById(gid); const it = g.querySelector(".gallery-item-container"); const r = g.getBoundingClientRect(); const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0; return { x: it?.getBoundingClientRect().left, y: it?.getBoundingClientRect().top, box: [Math.round(r.left + scrollX), Math.round(r.top + scrollY - ads), Math.round(r.width), Math.round(r.height)], t: performance.now() }; }, id);
      await page.evaluate((gid) => document.getElementById(gid).scrollIntoView({ block: "center" }), id);
      await page.waitForTimeout(600);
      const p1 = await probe();
      await page.waitForTimeout(2000);
      const p2 = await probe();
      result.galleries.push({ id, box: p1.box, speedX: Math.round(((p2.x - p1.x) / (p2.t - p1.t)) * 10000) / 10, speedY: Math.round(((p2.y - p1.y) / (p2.t - p1.t)) * 10000) / 10 });
    }
    result.viewTransition = await page.evaluate(() => {
      const out = [];
      for (const sheet of document.styleSheets) { try { for (const r of sheet.cssRules) if (/view-transition/.test(r.cssText) && r.cssText.length < 600) out.push(r.cssText); } catch {} }
      return { rules: out.slice(0, 12), htmlAttrs: [...document.documentElement.attributes].map((a) => a.name + "=" + a.value.slice(0, 60)) };
    });
  } catch (e) {
    result.error = e.message.split("\n")[0];
  }
  await ctx.close();
  fs.writeFileSync(path.join(OUT, name + ".json"), JSON.stringify(result, null, 1));
  const an = result.animations || [];
  const names = [...new Set(an.filter((x) => x.kind !== "transition").map((x) => x.name))];
  console.log(result.error ? "FAIL" : "ok", name, "| anims:", names.join(",") || "-", "| idle:", result.idle?.length || 0, "| scroll:", result.scrollLinked?.length || 0, "| slideshows:", JSON.stringify((result.slideshows || []).map((s) => s.autoChangesAtMs.length)), "| galleries:", JSON.stringify((result.galleries || []).map((g) => g.speedX)), "| hover:", result.hover?.length || 0);
}

let pages = JSON.parse(fs.readFileSync(path.join(INV, "page-list.json"), "utf8"));
if (FILTER) pages = pages.filter((p) => new RegExp(FILTER).test(`${p.site}__${p.slug}`));
const jobs = pages.flatMap((pg) => VIEWS.map((view) => ({ pg, view })));
const browser = await chromium.launch();
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (next < jobs.length) { const j = jobs[next++]; await audit(browser, j.pg, j.view); } }));
await browser.close();
