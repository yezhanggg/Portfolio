// Turns the raw motion audit (motion_audit.mjs) into src/data/motion.json: per page and view,
// the animations, hover effects, gallery drift and slideshow behaviour to reproduce.
// Coordinates are converted to the same canvas space as src/data/pages (980 / 320 wide).
//
// usage: node migration/scripts/apply_motion.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const DIR = path.join(os.homedir(), "Desktop/yezhang-site-archive/inventory/motion");
const out = {};
const transparent = (c) => !c || /rgba\([^)]*,\s*0\)$/.test(c) || c === "transparent";
const LABEL_PROPS = { color: "color", "letter-spacing": "letter-spacing", "text-decoration-line": "text-decoration", "font-weight": "font-weight" };
const ROOT_PROPS = { "background-color": "background-color", opacity: "opacity", transform: "transform", filter: "filter", "box-shadow": "box-shadow", "border-top-color": "border-color" };

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
  const [site, slug, view] = file.replace(/\.json$/, "").split("__");
  const dx = view === "desktop" ? (1440 - 980) / 2 : 0;
  const shift = (b, fixed) => (b ? [fixed ? b[0] : b[0] - dx, b[1], b[2], b[3]] : null);
  const v = { anims: [], hovers: [], galleries: [], shows: {}, stickyBg: false };

  // --- named Wix motion effects (entrance + loops), grouped per component
  const byComp = new Map();
  const looping = new Set();
  for (const a of d.animations || []) {
    if (a.kind !== "css" || !/^motion-/.test(a.name) || !a.box || typeof a.timing.duration !== "number") continue;
    const loop = a.timing.iterations === null || a.timing.iterations > 50;
    if (loop) looping.add(a.comp);
    const entry = byComp.get(a.comp) || { box: shift(a.box, a.fixed), fixed: a.fixed, list: [] };
    if (!entry.list.some((x) => x.name === a.name)) {
      entry.list.push({
        name: a.name, duration: Math.round(a.timing.duration), delay: Math.round(a.timing.delay || 0), loop, easing: a.timing.easing,
        direction: a.timing.direction,
        keyframes: a.keyframes.map(({ offset, easing, ...props }) => ({ offset, easing, props })),
      });
    }
    byComp.set(a.comp, entry);
  }
  v.anims = [...byComp.values()];

  // --- hover
  for (const h of d.hover || []) {
    if (looping.has(h.comp)) continue; // a spinning element "changes" on its own
    const label = {}, root = {}, base = {};
    let tr = 200, mouse = null;
    for (const x of h.diffs) {
      const isLabel = /__label$|label/.test(x.el);
      const isRoot = !/svg|path|icon|SVG|undefined/.test(x.el);
      const sec = parseFloat(x.tr) || 0;
      for (const [p, val] of Object.entries(x)) {
        if (!Array.isArray(val) || p === "rect" || p === "vis") continue;
        const [from, to] = val;
        if (isLabel && LABEL_PROPS[p]) { label[LABEL_PROPS[p]] = to; if (sec) tr = sec * 1000; }
        else if (isRoot && ROOT_PROPS[p]) {
          if (p === "background-color" && transparent(from) && transparent(to)) continue;
          if (p === "border-top-color" && isLabel) continue;
          // A pure translate that follows the pointer is Wix's "track mouse" effect, not a hover state.
          const m0 = p === "transform" && String(from).match(/^matrix\(1, 0, 0, 1, ([-\d.]+), ([-\d.]+)\)$/), m1 = p === "transform" && String(to).match(/^matrix\(1, 0, 0, 1, ([-\d.]+), ([-\d.]+)\)$/);
          if (p === "transform" && (m0 || from === "none") && m1) {
            const dxm = h.rect[0] + h.rect[2] / 2 - 2; // pointer travelled from (2,2) to the element's centre
            const k = (Number(m1[1]) - Number(m0 ? m0[1] : 0)) / dxm;
            if (Math.abs(k) > 0.002) mouse = { k: Math.round(k * 10000) / 10000, ms: Math.round(sec * 1000) || 500 };
            continue;
          }
          if (root[ROOT_PROPS[p]] === undefined) { root[ROOT_PROPS[p]] = to; base[ROOT_PROPS[p]] = from; if (sec) tr = sec * 1000; }
        }
      }
    }
    if (Object.keys(label).length || Object.keys(root).length || mouse) v.hovers.push({ rect: shift(h.rect), text: h.text || undefined, label, root, base, mouse: mouse || undefined, tr: Math.round(tr) });
  }

  // --- auto-scrolling gallery strips (px per second, negative = content moves left)
  for (const g of d.galleries || []) if (Math.abs(g.speedX) > 2) v.galleries.push({ box: shift(g.box), speed: Math.round(g.speedX) });

  // --- slideshows: autoplay interval + slide transition
  const slide = (d.animations || []).find((a) => a.kind === "transition" && a.name === "transform" && /0\.87, 0, 0\.13, 1/.test(a.timing.easing));
  for (const s of d.slideshows || []) {
    const t = s.autoChangesAtMs;
    const gaps = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b);
    v.shows[s.id] = { auto: gaps.length ? Math.round(gaps[Math.floor(gaps.length / 2)] / 100) * 100 : undefined, slideMs: slide ? Math.round(slide.timing.duration) : undefined };
  }

  // --- background media pinned to the screen while the page scrolls
  v.stickyBg = (d.scrollLinked || []).some((s) => s.pos === "sticky" && s.size[0] >= 1400);

  (out[`${site}__${slug}`] ||= {})[view] = v;
}

fs.writeFileSync("src/data/motion.json", JSON.stringify(out));
const count = (f) => Object.values(out).reduce((a, p) => a + Object.values(p).reduce((b, v) => b + f(v), 0), 0);
console.log(`pages ${Object.keys(out).length}: ${count((v) => v.anims.length)} animated components, ${count((v) => v.hovers.length)} hover effects, ${count((v) => v.galleries.length)} drifting galleries, ${count((v) => Object.values(v.shows).filter((s) => s.auto).length)} autoplay slideshows, ${count((v) => (v.stickyBg ? 1 : 0))} pinned backgrounds`);
console.log("size", (fs.statSync("src/data/motion.json").size / 1024).toFixed(0), "KB");
