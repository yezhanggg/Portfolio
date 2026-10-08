// Adjustments applied to the extracted Wix data before rendering: things that only worked
// inside Wix (its widgets, its hosted icons) are swapped for self-hosted equivalents here.
import { siSpotify, siInstagram } from "simple-icons";
import motion from "../data/motion.json";

const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";
const ICONS = { spotify: siSpotify.path, instagram: siInstagram.path, linkedin: LINKEDIN_PATH };
const iconSvg = (path) => `<svg viewBox="-5 -5 34 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${path}"/></svg>`;

// The "3D slideshow" on /city-vision was a Wix-hosted widget; these are the four images it showed.
const CITY_VISION_SLIDES = [
  "f8d0cd_7070d507660342bbac8b7370a00cface~mv2.jpg",
  "f8d0cd_f7607a25e032434caa05b6231ec1eb2c~mv2.jpg",
  "f8d0cd_a970ad8591874e468146080514478c44~mv2.jpg",
  "f8d0cd_a9a8c766d0594508978d524eddbc6957~mv2.jpg",
];

const inside = (inner, outer) =>
  inner[0] >= outer[0] - 1 && inner[1] >= outer[1] - 1 && inner[0] + inner[2] <= outer[0] + outer[2] + 1 && inner[1] + inner[3] <= outer[1] + outer[3] + 1;

// The typeface used to be a Google Drive link; the same file is now served from this site.
const TYPEFACE_DRIVE_ID = "15RBA6kJRwmavLavlhPaU0UvsdnrbD1E-";
const TYPEFACE_FILE = "/downloads/NewFont-Regular.otf";

function fixNodes(nodes, page) {
  const videos = nodes.filter((n) => n.type === "video");
  const out = [];
  for (const n of nodes) {
    if (n.href && n.href.includes(TYPEFACE_DRIVE_ID)) n.href = TYPEFACE_FILE;
    if (n.opacity === "0" && (n.type === "button" || n.type === "box")) continue; // hover-only overlays
    // Play/pause and sound glyphs Wix draws over its video boxes (rebuilt as real controls).
    if (n.type === "svg" && videos.some((v) => inside(n.box, v.box) && n.box[2] < 120)) continue;
    // Wix widget chrome that has no meaning off Wix: gallery page counters, "Now Playing" badge.
    if (n.type === "text" && n.plain && (/^\d+\/\d+$/.test(n.html) || n.html === "Now Playing")) continue;

    if (n.type === "image") {
      // Poster frame Wix layers over a video that is already playing in this view.
      const poster = String(n.src).match(/\/media\/([0-9a-f]{6}_[0-9a-f]{32})f\d{3}\.jpg/);
      if (poster && videos.some((v) => v.id === poster[1])) continue;
      const yt = String(n.src).match(/i\.ytimg\.com\/vi\/([\w-]+)\//);
      if (yt) {
        out.push({ ...n, type: "ytthumb", vid: yt[1] });
        continue;
      }
      const alt = (n.alt || "").trim().toLowerCase();
      if (!/\/media\/f8d0cd_/.test(n.src) && ICONS[alt]) {
        out.push({ type: "svg", box: n.box, html: iconSvg(ICONS[alt]), fill: "#000", href: n.href, label: n.alt.trim(), fixed: n.fixed, vw: n.vw, vh: n.vh });
        continue;
      }
    }
    if (n.type === "iframe") {
      const src = String(n.src || "");
      const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
      if (yt) {
        out.push({ ...n, src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&playsinline=1`, yt: yt[1] });
        continue;
      }
      if (src.includes("yezhanggg.github.io/ZHAENG")) {
        out.push({ ...n, src: "/features/" }); // the mini-apps now live on this site
        continue;
      }
      if (src.includes("slicebox")) {
        const [x, y, w, h] = n.box;
        // Image area inside the old widget, measured from the original screenshots.
        const [iw, ih, top] = w > 500 ? [737, 456, 53] : [259, 281, 30];
        const frame = [x + (w - iw) / 2, y + top, iw, ih];
        out.push({
          type: "slideshow", box: n.box, arrowColor: "rgb(0, 0, 0)",
          prev: [x + 4, y + h / 2 - 20, 10, 20], next: [x + w - 14, y + h / 2 - 20, 10, 20], dots: null,
          slides: CITY_VISION_SLIDES.map((id) => [{ type: "image", box: frame, src: `https://static.wixstatic.com/media/${id}/v1/fill/w_737,h_456,al_c/${id}`, fit: "cover" }]),
        });
        continue;
      }
    }
    if (n.slides) n.slides = n.slides.map((s) => fixNodes(s, page));
    out.push(n);
  }
  return out;
}

// New entries on the /portfolio menu: the ZHAENG pages and the mini-apps, styled like the
// existing "Clouds | Archive" row.
function addPortfolioEntries(page) {
  const entry = (like, label, href, box, labelW) => ({
    ...like, label, href, box,
    labelBox: [box[0] + box[2] / 2 - labelW / 2, box[1] + box[3] / 2 - like.labelBox[3] / 2, labelW, like.labelBox[3]],
  });
  const d = page.views.desktop;
  const dLike = d.nodes.find((n) => n.label === "Clouds");
  const dLine = d.nodes.find((n) => n.type === "box" && n.rotate);
  if (dLike) {
    d.nodes.push(entry(dLike, "ZHAENG", "/zhaeng", [174, 735, 128, 60], 80), entry(dLike, "Features", "/features/", [302, 735, 128, 60], 88));
    if (dLine) d.nodes.push({ ...dLine, box: [dLine.box[0], 762, dLine.box[2], dLine.box[3]] });
  }
  const m = page.views.mobile;
  const mLike = m.nodes.find((n) => n.label === "Archive");
  if (mLike) {
    const shift = 96;
    for (const n of m.nodes) {
      if (n.box[1] >= 560) {
        n.box = [n.box[0], n.box[1] + shift, n.box[2], n.box[3]];
        if (n.labelBox) n.labelBox = [n.labelBox[0], n.labelBox[1] + shift, n.labelBox[2], n.labelBox[3]];
      } else if (n.box[1] <= 1 && n.box[3] >= m.height - 1) n.box = [n.box[0], n.box[1], n.box[2], n.box[3] + shift];
    }
    m.height += shift;
    m.nodes.push(entry(mLike, "ZHAENG", "/zhaeng", [-2, 498, 201, 51], 42), entry(mLike, "Features", "/features/", [-2, 549, 201, 51], 46));
  }
}

// Motion measured on the live Wix pages (migration/scripts/motion_audit.mjs → apply_motion.mjs):
// entrance/loop animations, hover states, pointer tracking, drifting galleries, slideshow autoplay.
function applyMotion(page) {
  const m = motion[`${page.site}__${page.slug}`];
  if (!m) return;
  const centre = (b) => [b[0] + b[2] / 2, b[1] + b[3] / 2];
  for (const [name, view] of Object.entries(page.views)) {
    const mv = m[name];
    if (!mv) continue;
    const all = [];
    const visit = (nodes) => nodes.forEach((n) => (all.push(n), n.slides?.forEach(visit)));
    visit(view.nodes);

    for (const a of mv.anims) {
      const [cx, cy] = centre(a.box);
      const hits = all.filter((n) => !n.bleed && ["image", "text", "button", "svg", "video", "box"].includes(n.type) && Math.abs(centre(n.box)[0] - cx) < 10 && Math.abs(centre(n.box)[1] - cy) < 10 && n.box[2] <= a.box[2] * 1.6 + 10 && n.box[3] <= a.box[3] * 1.6 + 10);
      for (const n of hits) {
        n.anim = a.list;
        // A spinning element was photographed mid-turn; use its resting box instead.
        if (a.list.some((x) => x.loop) && hits.length === 1) n.box = a.box;
      }
    }
    for (const h of mv.hovers) {
      if (!h.rect) continue;
      const n = all.find((x) => ["button", "image", "svg"].includes(x.type) && Math.abs(x.box[0] - h.rect[0]) <= 3 && Math.abs(x.box[1] - h.rect[1]) <= 3 && Math.abs(x.box[2] - h.rect[2]) <= 4);
      if (!n) continue;
      const root = { ...h.root }, base = { ...h.base };
      if (base.opacity === "0") delete root.opacity; // hover-only overlays are not rebuilt
      if (root.opacity !== undefined) n.opacity = String(Math.round(Number(base.opacity) * 20) / 20);
      if (Object.keys(h.label).length || Object.keys(root).length) n.hover = { label: h.label, root, tr: h.tr };
      if (h.mouse) n.mouse = h.mouse;
    }
    for (const g of mv.galleries) {
      const n = all.find((x) => x.type === "gallery" && Math.abs(x.box[1] - g.box[1]) < 10);
      if (n) n.speed = g.speed;
    }
    for (const n of all) {
      const sh = n.type === "slideshow" && n.id && mv.shows[n.id];
      if (!sh) continue;
      if (sh.auto && !n.auto) n.auto = sh.auto;
      if (sh.slideMs) n.slideMs = sh.slideMs;
    }
    // Background video/image that stays put while the content scrolls over it.
    if (mv.stickyBg) for (const n of view.nodes) if (n.bleed && n.box[1] <= 1 && n.box[3] >= view.height - 2 && (n.type === "video" || n.type === "image")) n.sticky = true;
  }
}

// ZHAENG home: the top picture follows the pointer (and uncovers the one beneath it). Factors were
// measured on the original: it moves 1.11x the pointer's horizontal and 1.7x its vertical offset
// from the picture's own centre.
function zhaengHome(page) {
  const pics = page.views.desktop.nodes.filter((n) => n.type === "image" && n.href);
  const top = pics.pop(), under = pics.pop();
  if (!top) return;
  if (under) top.box = [...under.box]; // it was photographed mid-move; at rest it covers the other exactly
  top.mouse = { k: 1.111, ky: 1.7, ms: 120 };
  // On phones the same picture drifts down as the page scrolls (0.44px per pixel scrolled).
  const phoneTop = page.views.mobile.nodes.filter((n) => n.type === "image" && n.href).pop();
  if (phoneTop) phoneTop.scrollK = 0.437;
}

// ZHAENG's phone pages had a three-bar button opening this list of pages.
const ZHAENG_MENU = [["peace", "/zhaeng"], ["2", "/zhaeng/2"], ["3", "/zhaeng/3"], ["still", "/zhaeng/still"], ["electron", "/zhaeng/blank"], ["cautious", "/zhaeng/cautious"], ["sec 33", "/zhaeng/33-sec"], ["me", "/zhaeng/me"]];
function zhaengPhoneMenu(page) {
  const m = page.views.mobile;
  const bars = m.nodes.filter((n) => n.type === "box" && n.box[2] <= 24 && n.box[3] <= 3);
  if (bars.length < 3) return;
  m.nodes.push({ type: "menu", box: [259, 10, 50, 50], items: ZHAENG_MENU.map(([label, href]) => ({ label, href })), fixed: bars[0].fixed, vw: bars[0].vw, vh: bars[0].vh });
}

export function applyFixups(page) {
  for (const view of Object.values(page.views)) view.nodes = fixNodes(view.nodes, page);
  if (page.site === "zhaeng" && page.slug === "index") zhaengHome(page);
  if (page.site === "zhaeng") zhaengPhoneMenu(page);
  applyMotion(page);
  if (page.site === "yz" && page.slug === "portfolio") addPortfolioEntries(page);
  return page;
}
