// Adjustments applied to the extracted Wix data before rendering: things that only worked
// inside Wix (its widgets, its hosted icons) are swapped for self-hosted equivalents here.
import { siSpotify, siInstagram } from "simple-icons";
import motion from "../data/motion.json";
import hover from "../data/hover.json";
import exploreHome from "../data/pages/yz__home.json";

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
    if (n.children) n.children = fixNodes(n.children, page);
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
    const visit = (nodes) => nodes.forEach((n) => (all.push(n), n.slides?.forEach(visit), n.children && visit(n.children)));
    visit(view.nodes);
    const atRect = (rect, types) => all.find((x) => types.includes(x.type) && Math.abs(x.box[0] - rect[0]) <= 3 && Math.abs(x.box[1] - rect[1]) <= 3 && Math.abs(x.box[2] - rect[2]) <= 4);
    const setHover = (n, h) => {
      const root = { ...h.root }, base = { ...h.base };
      if (base.opacity === "0") delete root.opacity; // hover-only overlays are not rebuilt
      // The first audit caught fades and cross-fades mid-way; no picture changes opacity on hover.
      if (n.type === "image") delete root.opacity;
      if (root.opacity !== undefined) n.opacity = String(Math.round(Number(base.opacity) * 20) / 20);
      if (Object.keys(h.label).length || Object.keys(root).length) n.hover = { label: h.label, root, tr: h.tr };
    };

    for (const a of mv.anims) {
      const [cx, cy] = centre(a.box);
      const movable = all.filter((n) => !n.bleed && ["image", "text", "button", "svg", "video", "box"].includes(n.type));
      const hits = movable.filter((n) => Math.abs(centre(n.box)[0] - cx) < 10 && Math.abs(centre(n.box)[1] - cy) < 10 && n.box[2] <= a.box[2] * 1.6 + 10 && n.box[3] <= a.box[3] * 1.6 + 10);
      // A box holding several items, none of them its own size, is a group that moves as one piece
      // (the footer on the phone /portfolio): each item turns about the group's centre.
      const members = movable.filter((n) => inside(n.box, a.box));
      if (members.length > 1 && !hits.some((n) => n.box[2] >= a.box[2] * 0.75 && n.box[3] >= a.box[3] * 0.75)) {
        for (const n of members) {
          n.anim = a.list;
          n.origin = [cx - n.box[0], cy - n.box[1]];
        }
        continue;
      }
      for (const n of hits) {
        n.anim = a.list;
        // A spinning element was photographed mid-turn; use its resting box instead.
        if (a.list.some((x) => x.loop) && hits.length === 1) n.box = a.box;
      }
    }
    for (const h of mv.hovers) {
      const n = h.rect && atRect(h.rect, ["button", "image", "svg"]);
      if (n) setHover(n, h);
    }
    // Re-measured on the live pages (migration/scripts/hover_audit.mjs): every button's hover
    // style, and the pictures that follow the pointer. A follower is stored where it really rests;
    // the page data mostly has it where it sat with the pointer mid-window.
    const hv = name === "desktop" && hover[`${page.site}__${page.slug}`];
    if (hv) {
      for (const b of hv.buttons) {
        const n = atRect(b.rect, ["button"]);
        if (n) (delete n.hover, setHover(n, b));
      }
      for (const t of hv.trackers) {
        const n = atRect(t.rect, ["image", "video", "svg", "button"]) || atRect(t.layout, ["image", "video", "svg", "button"]);
        if (!n) continue;
        n.mouse = { d: t.d, ms: t.ms, inset: t.inset, at: [t.rect[0] - t.layout[0], t.rect[1] - t.layout[1]] };
        n.box = t.layout;
      }
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

// ZHAENG home: the top picture follows the pointer and uncovers the one beneath it (hover.json).
// On phones the same picture drifts down as the page scrolls (0.44px per pixel scrolled).
function zhaengHome(page) {
  const phoneTop = page.views.mobile.nodes.filter((n) => n.type === "image" && n.href).pop();
  if (phoneTop) phoneTop.scrollK = 0.437;
}

// Hover boxes: a link that exists only on the hover picture (first tile of /photography) can never
// be reached on a phone, where the hover picture is not shown. Give it to the picture that is.
function hoverLinksOnPhones(page) {
  const mediaId = (src) => (String(src || "").match(/\/media\/([^/?]+)/) || [])[1];
  for (const box of page.views.desktop.nodes.filter((n) => n.type === "hbox")) {
    const shown = box.children.find((c) => c.type === "image" && !c.hshow && !c.href);
    const onHover = box.children.find((c) => c.hshow && c.href);
    if (!shown || !onHover) continue;
    for (const n of page.views.mobile.nodes) if (n.type === "image" && !n.href && mediaId(n.src) === mediaId(shown.src)) n.href = onHover.href;
  }
}

// /photomagazine: the banner at the bottom was captured mid-cycle; it opens on "click on the magazine".
function zineBanner(page) {
  const banner = page.views.desktop.nodes.find((n) => n.type === "slideshow" && n.bleed);
  const first = banner ? banner.slides.findIndex((s) => s.some((n) => /magazine/.test(n.html || ""))) : -1;
  if (first > 0) banner.slides = [...banner.slides.slice(first), ...banner.slides.slice(0, first)];
}

// ZHAENG's phone pages had a three-bar button opening this list of pages.
const ZHAENG_MENU = [["peace", "/zhaeng"], ["2", "/zhaeng/2"], ["3", "/zhaeng/3"], ["still", "/zhaeng/still"], ["electron", "/zhaeng/blank"], ["cautious", "/zhaeng/cautious"], ["sec 33", "/zhaeng/33-sec"], ["me", "/zhaeng/me"]];
function zhaengPhoneMenu(page) {
  const m = page.views.mobile;
  const bars = m.nodes.filter((n) => n.type === "box" && n.box[2] <= 24 && n.box[3] <= 3);
  if (bars.length < 3) return;
  m.nodes.push({ type: "menu", box: [259, 10, 50, 50], items: ZHAENG_MENU.map(([label, href]) => ({ label, href })), fixed: bars[0].fixed, vw: bars[0].vw, vh: bars[0].vh });
}

// ---- 3D boxes ------------------------------------------------------------------------------------
// A box is one node with six sides; each side holds ordinary nodes placed in that side's own
// pixels. Node.astro draws it and interactions.js turns it (by dragging, or under the pointer).
const cube = (cx, cy, size, more) => ({ type: "cube", box: [cx - size / 2, cy - size / 2, size, size], ...more });
const moveDown = (n, dy) => {
  n.box = [n.box[0], n.box[1] + dy, n.box[2], n.box[3]];
  if (n.labelBox) n.labelBox = [n.labelBox[0], n.labelBox[1] + dy, n.labelBox[2], n.labelBox[3]];
};
// The logo turning at the foot of these two pages turns much faster under the pointer.
const logoSpinsFaster = (view) => view.nodes.forEach((n) => n.type === "image" && n.anim?.some((a) => a.loop) && (n.rate = 16));

// /notice: the two text buttons became boxes, Portfolio on the left and Explore on the right.
// Under the pointer a box turns and its words appear on its sides; a click enters that mode.
// The phone page had no way on; it gets the same two boxes, always turning, words always shown.
function modeBoxes(page) {
  page.noChat = true; // no chat bubble on this page
  const MODES = [["PORTFOLIO MODE", "/portfolio"], ["EXPLORE MODE", "/copy-of-notice"]];
  const at = { desktop: { size: 200, xs: [235.5, 744.5], y: 390 }, mobile: { size: 96, xs: [85, 235], y: 342 } };
  for (const [name, view] of Object.entries(page.views)) {
    const { size, xs, y } = at[name];
    const font = view.nodes.find((n) => n.type === "button")?.style?.["font-family"];
    view.nodes = view.nodes.filter((n) => !(n.type === "button" && n.href));
    // The two boxes mirror each other: each shows the side that faces the middle of the page.
    MODES.forEach(([label, href], i) => view.nodes.push(cube(xs[i], y, size, { href, label, words: label.split(" "), font, rest: [-20, i ? 30 : -30], spin: i ? -70 : 70 })));
    logoSpinsFaster(view);
  }
}

// /copy-of-notice ("explore with curiosity") said "under maintenance". It is now one large box to
// drag around. Its six sides carry the eight buttons of the old explore home (/home) as designed
// there, hover styles included; two sides hold two buttons each. [label, x, y] in parts of a side.
const EXPLORE_SIDES = {
  front: [["THOUGHTS", 0.5, 0.5]],
  right: [["NOTEpad", 0.5, 0.5]],
  back: [["「CITY VISION」", 0.5, 0.5]],
  left: [["magaZINE", 0.5, 0.5]],
  top: [["I SHOOT PHOTOS NOW", 0.5, 0.33], ["some RANDOM photos edits", 0.5, 0.67]],
  bottom: [["ARTWORK", 0.55, 0.36], ["session.ARCHIVE", 0.5, 0.72]],
};
function exploreBox(page) {
  const at = { desktop: { size: 340, y: 310, hint: [564, 13] }, mobile: { size: 180, y: 265, hint: [394, 10] } };
  const centre = (b) => [b[0] + b[2] / 2, b[1] + b[3] / 2];
  for (const [name, view] of Object.entries(page.views)) {
    const { size, y, hint } = at[name];
    const buttons = structuredClone(exploreHome.views[name].nodes).filter((n) => n.type === "button" && n.href);
    const same = (a, b) => a.replace(/\s+/g, " ") === b.replace(/\s+/g, " "); // one label has a no-break space
    const find = (label) => buttons.find((n) => same(n.label, label));
    // A button on a side: its label centred on (cx, cy); `area` (part of the side) takes the click.
    const put = (n, cx, cy, area) => {
      const h = name === "desktop" && hover.yz__home.buttons.find((b) => same(b.text, n.label));
      return {
        ...n,
        box: area || [cx - n.box[2] / 2, cy - n.box[3] / 2, n.box[2], n.box[3]],
        labelBox: [cx - n.labelBox[2] / 2, cy - n.labelBox[3] / 2, n.labelBox[2], n.labelBox[3]],
        rotate: area ? undefined : n.rotate,
        hover: h ? { label: h.label, root: {}, tr: h.tr } : undefined,
      };
    };
    const faces = {};
    for (const [side, list] of Object.entries(EXPLORE_SIDES)) {
      faces[side] = list.map(([label, fx, fy], i) => put(find(label), fx * size, fy * size, [0, (i * size) / list.length, size, size / list.length]));
    }
    // "untitled" keeps its tilt and its place above the start of ARTWORK.
    const [art, un] = [find("ARTWORK"), find("untitled")];
    faces.bottom.push(put(un, 0.55 * size + centre(un.box)[0] - centre(art.box)[0], 0.36 * size + centre(un.box)[1] - centre(art.box)[1]));

    const font = view.nodes.find((n) => n.type === "button")?.style?.["font-family"];
    view.nodes = view.nodes.filter((n) => n.label !== "UNDER MAINTENANCE" && n.alt !== "7256208.png");
    if (name === "mobile") {
      // Room for the box: the note moves up; the swinging link that led to /portfolio becomes a
      // still BACK, as on the desktop page.
      const note = view.nodes.find((n) => n.label === "BEST EXPERIENCE ON COMPUTER");
      const back = view.nodes.find((n) => n.label === "EXPLORE WITH CURIOSITY");
      if (note) moveDown(note, 60 - note.box[1]);
      if (back) (Object.assign(back, { label: "BACK", href: "/notice", anim: undefined }), moveDown(back, 58));
    }
    view.nodes.push(
      cube(view.canvas / 2, y, size, { faces, rest: [-13, -15], intro: true }), // at this angle no far edge runs behind the front label
      { type: "text", box: [view.canvas / 2 - 100, hint[0], 200, hint[1] + 4], lines: 1, html: "<p>DRAG TO TURN</p>", style: { "font-family": font, "font-size": `${hint[1]}px`, "letter-spacing": "0.22em", "text-align": "center", color: "rgb(40, 38, 38)" } },
    );
    logoSpinsFaster(view);
  }
}

export function applyFixups(page) {
  for (const view of Object.values(page.views)) view.nodes = fixNodes(view.nodes, page);
  if (page.site === "zhaeng" && page.slug === "index") zhaengHome(page);
  if (page.site === "zhaeng") zhaengPhoneMenu(page);
  if (page.site === "yz" && page.slug === "photomagazine") zineBanner(page);
  hoverLinksOnPhones(page);
  applyMotion(page);
  if (page.site === "yz" && page.slug === "portfolio") addPortfolioEntries(page);
  if (page.site === "yz" && page.slug === "notice") modeBoxes(page);
  if (page.site === "yz" && page.slug === "copy-of-notice") exploreBox(page);
  return page;
}
