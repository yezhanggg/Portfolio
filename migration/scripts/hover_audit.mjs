// Hover behaviour of the live Wix pages (desktop layout), read from the pages' own CSS and state
// instead of sampled: the first motion audit missed italics, hover boxes and how far the
// pointer-following pictures really travel.
//   1. Hover boxes — a second picture (or button) that shows while the pointer is over the box.
//      The hidden parts are extracted and the box becomes an "hbox" node in src/data/pages/*.json.
//   2. Button hover styles (label colour, spacing, italic, underline, weight, size; background,
//      border, shadow), measured with :hover forced on the button.
//   3. Pictures that follow the pointer (Wix "track mouse"): where they really rest, and how far
//      they travel.
//   2 and 3 are written to src/data/hover.json and applied by src/lib/fixups.js.
//
// usage: node migration/scripts/hover_audit.mjs [slugRegex]     (needs the Wix sites to be live)
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { installExtractor } from "./extract_pages.mjs";

const INV = path.join(os.homedir(), "Desktop/yezhang-site-archive/inventory");
const PAGES = "src/data/pages";
const OUT = "src/data/hover.json";
const FILTER = process.argv[2];
const VIEW = { width: 1440, height: 900 };
const CANVAS = 980;
const CONCURRENCY = 4;

// ---- in the page ----------------------------------------------------------------------------
// Hover boxes are plain CSS on Wix: "#BOX:hover #PART { opacity: 1; visibility: visible }" over
// "#PART { opacity: 0; visibility: hidden }".
function findHoverBoxes() {
  const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return [r.left + scrollX, r.top + scrollY - ads, r.width, r.height].map((v) => Math.round(v * 10) / 10); };
  const shown = {};
  const walk = (rules, media) => {
    for (const r of rules) {
      if (r.cssRules && !r.selectorText) { walk(r.cssRules, r.conditionText || media); continue; }
      if (!r.selectorText || !r.selectorText.includes(":hover") || /max-width: 0px/.test(media || "")) continue;
      for (const sel of r.selectorText.split(",")) {
        const m = sel.trim().match(/^#(comp-[\w-]+):hover\s+#(comp-[\w-]+)$/);
        if (m && /opacity:\s*1/.test(r.style.cssText)) (shown[m[1]] ||= new Set()).add(m[2]);
      }
    }
  };
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules, ""); } catch {} }
  const boxes = [];
  for (const [id, parts] of Object.entries(shown)) {
    const box = document.getElementById(id);
    if (!box || !box.getBoundingClientRect().width) continue;
    // the box's parts: components that contain no further component
    const leaves = [...box.querySelectorAll("[id^='comp-']")].filter((e) => !e.querySelector("[id^='comp-']"));
    const children = leaves.map((e) => ({ id: e.id, hover: parts.has(e.id) && getComputedStyle(e).visibility === "hidden" }));
    if (!children.some((c) => c.hover)) continue;
    const hidden = document.getElementById(children.find((c) => c.hover).id);
    boxes.push({ id, rect: rectOf(box), ms: Math.round((parseFloat(getComputedStyle(hidden).transitionDuration) || 0.4) * 1000), children });
  }
  // document order = paint order
  return boxes.sort((a, b) => (document.getElementById(a.id).compareDocumentPosition(document.getElementById(b.id)) & 4 ? -1 : 1));
}

const LABEL_PROPS = ["color", "letter-spacing", "text-decoration-line", "font-weight", "font-style", "font-size"];
const ROOT_PROPS = ["background-color", "border-top-color", "opacity", "filter", "box-shadow"];
function markButtons() {
  const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
  const out = [];
  let n = 0;
  for (const el of document.querySelectorAll("#SITE_CONTAINER .wixui-button, #SITE_CONTAINER [class*='StylableButton'][class*='__root'], #SITE_CONTAINER a[href]")) {
    if (el.hasAttribute("data-hv") || el.closest("[data-hv]") || el.closest(".wixui-slideshow nav")) continue;
    const isButton = /\bwixui-button\b|StylableButton\d*__root/.test(el.className?.toString() || "");
    if (!isButton && (el.querySelector("img, svg, video, .wixui-rich-text, [class*='StylableButton']") || !el.innerText.trim())) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || getComputedStyle(el).visibility === "hidden") continue;
    const label = el.querySelector("[class*='__label']") || [...el.querySelectorAll("*")].reverse().find((e) => e.children.length === 0 && e.innerText?.trim()) || el;
    label.setAttribute("data-hv-label", String(n));
    el.setAttribute("data-hv", String(n));
    const dur = (e) => Math.max(0, ...getComputedStyle(e).transitionDuration.split(",").map((s) => parseFloat(s) * (s.includes("ms") ? 1 : 1000) || 0));
    out.push({ i: n++, text: el.innerText.trim().slice(0, 40), rect: [r.left + scrollX, r.top + scrollY - ads, r.width, r.height].map((v) => Math.round(v * 10) / 10), tr: Math.round(Math.max(dur(el), dur(label))) || 200 });
  }
  return out;
}
function probeButton([i, labelProps, rootProps]) {
  const root = document.querySelector(`[data-hv="${i}"]`), label = document.querySelector(`[data-hv-label="${i}"]`);
  const a = getComputedStyle(label), b = getComputedStyle(root);
  return { label: Object.fromEntries(labelProps.map((p) => [p, a.getPropertyValue(p)])), root: Object.fromEntries(rootProps.map((p) => [p, b.getPropertyValue(p)])) };
}
function snapshotTransforms() {
  const ads = document.getElementById("WIX_ADS")?.offsetHeight || 0;
  const out = {};
  for (const el of document.querySelectorAll("#SITE_CONTAINER [id^='comp-']")) {
    const cs = getComputedStyle(el);
    if (cs.transform === "none" && !/transform/.test(cs.transitionProperty)) continue;
    const m = new DOMMatrix(cs.transform), r = el.getBoundingClientRect();
    if (!r.width || m.a !== 1 || m.d !== 1 || m.b || m.c) continue; // a pure shift only
    out[el.id] = { t: [m.e, m.f], rect: [r.left, r.top, r.width, r.height], ads, ms: Math.round((parseFloat(cs.transitionDuration) || 0) * 1000) };
  }
  return out;
}
// ---------------------------------------------------------------------------------------------

const transparent = (c) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);
const round = (v) => Math.round(v * 10) / 10;
const near = (a, b, tol = 3) => a.every((v, i) => Math.abs(v - b[i]) <= tol);
const mediaId = (src) => (String(src || "").match(/\/media\/([^/?]+)/) || [])[1];

async function audit(browser, pg) {
  const ctx = await browser.newContext({ viewport: VIEW });
  const page = await ctx.newPage();
  await page.goto(pg.url, { waitUntil: "load", timeout: 60000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
  await page.waitForFunction(() => document.querySelector("#SITE_PAGES img, #SITE_PAGES a, #SITE_PAGES video, #SITE_PAGES iframe, #SITE_PAGES [data-testid='richTextElement']"), null, { timeout: 25000 }).catch(() => {});
  const off = ((await page.evaluate(() => document.documentElement.clientWidth)) - CANVAS) / 2;
  const canvas = (r) => [round(r[0] - off), round(r[1]), round(r[2]), round(r[3])];
  const result = { boxes: [], buttons: [], trackers: [] };

  // --- 3. pictures that follow the pointer: compare two pointer positions
  // Wix's rule (checked against the live pages to 0.1px): shift = distance × (pointer − centre) /
  // (centre's distance to the farther edge of the window), per axis, centre = where the picture
  // rests on screen. With the pointer untouched the page behaves as if it were mid-window.
  const P0 = [VIEW.width / 2, VIEW.height / 2], P1 = [VIEW.width / 4, VIEW.height / 4];
  await page.mouse.move(...P0);
  await page.waitForTimeout(1100);
  const a = await page.evaluate(snapshotTransforms);
  await page.mouse.move(...P1, { steps: 3 });
  await page.waitForTimeout(1100);
  const b = await page.evaluate(snapshotTransforms);
  await page.mouse.move(...P0, { steps: 3 });
  await page.waitForTimeout(1100);
  const back = await page.evaluate(snapshotTransforms);
  for (const [id, s0] of Object.entries(a)) {
    const s1 = b[id], s2 = back[id];
    if (!s1 || (Math.abs(s1.t[0] - s0.t[0]) < 1 && Math.abs(s1.t[1] - s0.t[1]) < 1)) continue;
    // moving on its own (a sliding banner), not with the pointer
    if (!s2 || Math.abs(s2.t[0] - s0.t[0]) > 1 || Math.abs(s2.t[1] - s0.t[1]) > 1) continue;
    const layout = [s0.rect[0] - s0.t[0], s0.rect[1] - s0.t[1], s0.rect[2], s0.rect[3]];
    const c = [layout[0] + layout[2] / 2, layout[1] + layout[3] / 2];
    const d = [0, 1].map((k) => { const far = Math.max(c[k], [VIEW.width, VIEW.height][k] - c[k]); return Math.abs(P1[k] - c[k]) > 25 ? (s1.t[k] * far) / (P1[k] - c[k]) : null; }).filter((v) => v !== null);
    if (!d.length || d.some((v) => v < 20 || Math.abs(v - d[0]) > 0.15 * d[0])) continue;
    result.trackers.push({
      rect: canvas([s0.rect[0], s0.rect[1] - s0.ads, s0.rect[2], s0.rect[3]]), // as extracted (pointer mid-window)
      layout: canvas([layout[0], layout[1] - s0.ads, layout[2], layout[3]]),
      d: Math.round(d.reduce((x, y) => x + y, 0) / d.length), ms: s0.ms,
      inset: s0.ads || undefined, // the free-Wix banner above ZHAENG's pages counted as window
    });
  }
  await page.mouse.move(1, 1);
  await page.waitForTimeout(700);

  // --- 1. hover boxes
  let h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { // let lazy pictures load
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(200);
    h = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const boxes = await page.evaluate(findHoverBoxes);
  if (boxes.length) {
    const hoverIds = boxes.flatMap((bx) => bx.children.filter((c) => c.hover).map((c) => c.id));
    await page.addStyleTag({ content: hoverIds.map((id) => `#${id}, #${id} * { opacity: 1 !important; visibility: visible !important; }`).join("\n") });
    await page.waitForTimeout(800);
    await page.evaluate(installExtractor);
    for (const bx of boxes) {
      const children = [];
      for (const c of bx.children) {
        const nodes = await page.evaluate((id) => window.__ex.sub(id), c.id);
        for (const n of nodes) {
          n.box = canvas(n.box);
          if (n.labelBox) n.labelBox = [n.labelBox[0] - off, n.labelBox[1], n.labelBox[2], n.labelBox[3]];
          if (n.mask) delete n.mask.box;
          if (c.hover) n.hshow = true;
          children.push(n);
        }
      }
      result.boxes.push({ id: bx.id, box: canvas(bx.rect), ms: bx.ms, children });
    }
  }

  // --- 2. button hover styles, with :hover forced (no pointer, no transitions)
  const buttons = await page.evaluate(markButtons);
  if (buttons.length) {
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
    for (const bt of buttons) {
      const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: `[data-hv="${bt.i}"]` });
      if (!nodeId) continue;
      const rest = await page.evaluate(probeButton, [bt.i, LABEL_PROPS, ROOT_PROPS]);
      await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
      const hover = await page.evaluate(probeButton, [bt.i, LABEL_PROPS, ROOT_PROPS]);
      await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
      const label = {}, rootDiff = {}, base = {};
      for (const p of LABEL_PROPS) if (rest.label[p] !== hover.label[p]) label[p === "text-decoration-line" ? "text-decoration" : p] = hover.label[p];
      for (const p of ROOT_PROPS) {
        if (rest.root[p] === hover.root[p] || (p === "background-color" && transparent(rest.root[p]) && transparent(hover.root[p]))) continue;
        const key = p === "border-top-color" ? "border-color" : p;
        rootDiff[key] = hover.root[p];
        base[key] = rest.root[p];
      }
      if (Object.keys(label).length || Object.keys(rootDiff).length) result.buttons.push({ rect: canvas(bt.rect), text: bt.text || undefined, label, root: rootDiff, base, tr: bt.tr });
    }
  }
  await ctx.close();
  return result;
}

// Put the hover boxes into the page's desktop nodes: the parts already extracted move inside an
// "hbox" node, next to the hover-only parts (marked hshow).
function applyBoxes(key, boxes) {
  const file = path.join(PAGES, key + ".json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const view = data.views.desktop;
  // a second run starts from the flat list again
  view.nodes = view.nodes.flatMap((n) => (n.type === "hbox" ? n.children.filter((c) => !c.hshow) : [n]));
  let added = 0;
  for (const bx of boxes) {
    const taken = new Set();
    const children = bx.children.map((c) => {
      if (c.hshow) { added++; return c; }
      const at = view.nodes.findIndex((n, i) => !taken.has(i) && n.type === c.type && near(n.box, c.box) && (c.type !== "image" || mediaId(n.src) === mediaId(c.src)));
      if (at < 0) { console.log(`   ${key}: ${c.type} at ${c.box} was not in the page data; taken from the live page`); return c; }
      taken.add(at);
      return view.nodes[at];
    });
    const first = taken.size ? Math.min(...taken) : view.nodes.length;
    const node = { type: "hbox", id: bx.id, box: bx.box, ms: bx.ms, children };
    view.nodes = [...view.nodes.slice(0, first), node, ...view.nodes.slice(first).filter((_, i) => !taken.has(i + first))];
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
  return added;
}

let pages = JSON.parse(fs.readFileSync(path.join(INV, "page-list.json"), "utf8"));
if (FILTER) pages = pages.filter((p) => new RegExp(FILTER).test(`${p.site}__${p.slug}`));
const out = FILTER && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const browser = await chromium.launch();
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < pages.length) {
    const pg = pages[next++];
    const key = `${pg.site}__${pg.slug}`;
    try {
      const r = await audit(browser, pg);
      const added = r.boxes.length ? applyBoxes(key, r.boxes) : 0;
      delete out[key];
      if (r.buttons.length || r.trackers.length) out[key] = { buttons: r.buttons, trackers: r.trackers };
      console.log("ok", key, `| hover boxes ${r.boxes.length} (+${added} hidden parts) | buttons ${r.buttons.length} | follow the pointer ${r.trackers.length}`);
    } catch (e) {
      console.log("FAIL", key, e.message.split("\n")[0]);
    }
  }
}));
await browser.close();
fs.writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(out).sort(([x], [y]) => x.localeCompare(y))), null, 1));
