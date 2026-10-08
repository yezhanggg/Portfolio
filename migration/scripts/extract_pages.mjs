// Pass 2 of the Wix export: turn every published page into a flat list of positioned nodes
// (text, images, buttons, galleries, slideshows, videos, forms…) for desktop and phone layouts.
// Output: src/data/pages/<site>__<slug>.json — the data the Astro pages are rendered from.
//
// usage: node migration/scripts/extract_pages.mjs [slugFilter]
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("src/data/pages");
const FILTER = process.argv[2];
const SITES = [
  { key: "yz", base: "https://www.yezhang.net", sitemap: "https://www.yezhang.net/pages-sitemap.xml" },
  { key: "zhaeng", base: "https://yegnahz.wixsite.com/zhaeng", sitemap: "https://yegnahz.wixsite.com/zhaeng/pages-sitemap.xml" },
];
const VIEWS = [
  { name: "desktop", canvas: 980, opts: { viewport: { width: 1440, height: 900 } } },
  { name: "mobile", canvas: 320, opts: { ...devices["iPhone 13"] } },
];
const CONCURRENCY = 5;
fs.mkdirSync(OUT, { recursive: true });

async function pageList(site) {
  const xml = await (await fetch(site.sitemap)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    const url = m[1];
    const slug = decodeURIComponent(url.slice(site.base.length).replace(/^\/|\/$/g, "")) || "index";
    return { site: site.key, url, slug };
  });
}

// ---- runs inside the page -------------------------------------------------------------------
function installExtractor() {
  const TEXT_PROPS = ["font-family", "font-size", "font-weight", "font-style", "color", "letter-spacing", "line-height", "text-align", "text-transform", "text-shadow"];
  const adsH = document.getElementById("WIX_ADS")?.offsetHeight || 0;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const transparent = (c) => !c || c === "transparent" || /rgba\(.*,\s*0\)$/.test(c);

  function rect(el, fixed) {
    const r = el.getBoundingClientRect();
    const sx = fixed ? 0 : window.scrollX, sy = fixed ? (r.top >= adsH ? -adsH : 0) : window.scrollY - adsH;
    return [Math.round((r.left + sx) * 10) / 10, Math.round((r.top + sy) * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10];
  }
  function textRect(el, fixed) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    if (!r.width) return rect(el, fixed);
    const sx = fixed ? 0 : window.scrollX, sy = fixed ? 0 : window.scrollY - adsH;
    return [Math.round(r.left + sx), Math.round(r.top + sy), Math.round(r.width), Math.round(r.height)];
  }
  function textStyle(el) {
    const cs = getComputedStyle(el), o = {};
    for (const p of TEXT_PROPS) o[p] = cs.getPropertyValue(p);
    if (cs.textDecorationLine !== "none") o["text-decoration"] = cs.textDecorationLine;
    return o;
  }
  // Rotation applied to a component (collage pages): returns degrees + the unrotated box.
  function rotation(el, fixed) {
    for (let e = el, i = 0; e && i < 3; e = e.parentElement, i++) {
      const t = getComputedStyle(e).transform;
      if (!t || t === "none") continue;
      const m = t.match(/matrix\(([^)]+)\)/);
      if (!m) continue;
      const [a, b] = m[1].split(",").map(Number);
      const deg = Math.round(Math.atan2(b, a) * 1800 / Math.PI) / 10;
      if (!deg) continue;
      const [x, y, w, h] = rect(e, fixed);
      return { deg, box: [x + w / 2 - e.offsetWidth / 2, y + h / 2 - e.offsetHeight / 2, e.offsetWidth, e.offsetHeight] };
    }
    return null;
  }
  function richText(root) {
    function ser(node, parent) {
      if (node.nodeType === 3) return esc(node.textContent);
      if (node.nodeType !== 1) return "";
      const tag = node.tagName.toLowerCase();
      if (tag === "br") return "<br>";
      const cs = getComputedStyle(node);
      if (cs.display === "none") return "";
      const style = textStyle(node);
      const diff = Object.entries(style).filter(([k, v]) => parent[k] !== v);
      if (!transparent(cs.backgroundColor)) diff.push(["background-color", cs.backgroundColor]);
      const keep = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "span", "strong", "em", "u"];
      const out = keep.includes(tag) ? tag : cs.display === "inline" ? "span" : "div";
      let attrs = diff.length ? ` style="${diff.map(([k, v]) => `${k}:${v.replace(/"/g, "'")}`).join(";")}"` : "";
      if (tag === "a" && node.getAttribute("href")) attrs += ` href="${node.href}"`;
      const inner = [...node.childNodes].map((c) => ser(c, style)).join("");
      return inner || tag === "p" ? `<${out}${attrs}>${inner}</${out}>` : "";
    }
    const base = textStyle(root);
    const range = document.createRange();
    range.selectNodeContents(root);
    const tops = new Set([...range.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.bottom / 4)));
    return { style: base, lines: tops.size, html: [...root.childNodes].map((c) => ser(c, base)).join("") };
  }
  function boxStyle(cs) {
    const o = {};
    if (!transparent(cs.backgroundColor)) o.bg = cs.backgroundColor;
    if (cs.backgroundImage && cs.backgroundImage !== "none" && /gradient/.test(cs.backgroundImage)) o.bgImage = cs.backgroundImage;
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none" && !transparent(cs.borderTopColor)) o.border = `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`;
    if (cs.borderTopLeftRadius !== "0px") o.radius = cs.borderRadius;
    if (cs.boxShadow && cs.boxShadow !== "none") o.shadow = cs.boxShadow;
    if (cs.opacity !== "1") o.opacity = cs.opacity;
    return o;
  }
  // CSS masks (shaped images/videos): look on the element and its nearest wrappers.
  function mask(el) {
    for (let e = el, i = 0; e && i < 5; e = e.parentElement, i++) {
      const cs = getComputedStyle(e);
      const img = cs.maskImage || cs.webkitMaskImage;
      if (img && img !== "none") return { image: img, size: cs.maskSize || cs.webkitMaskSize, position: cs.maskPosition || cs.webkitMaskPosition, repeat: cs.maskRepeat || cs.webkitMaskRepeat, box: rect(e, false) };
    }
    return undefined;
  }
  const videoId = (s) => (String(s || "").match(/[0-9a-f]{6}_[0-9a-f]{32}/) || [])[0];

  function walk(el, ctx, out) {
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "noscript", "link", "meta", "template"].includes(tag)) return;
    if (el.id === "WIX_ADS" || el.id === "SCROLL_TO_TOP" || el.id === "SCROLL_TO_BOTTOM") return;
    const cs = getComputedStyle(el);
    // Note: opacity 0 is NOT skipped — Wix parks scroll-in animations at opacity 0.
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const fixed = ctx.fixed || cs.position === "fixed";
    const r = el.getBoundingClientRect();
    const hasSize = r.width > 0 && r.height > 0;
    const cls = typeof el.className === "string" ? el.className : "";
    const href = tag === "a" && el.getAttribute("href") ? el.href : ctx.href;
    const push = (n) => {
      if (fixed) n.fixed = true;
      const rot = rotation(el, fixed);
      if (rot) { n.rotate = rot.deg; n.box = rot.box.map((v) => Math.round(v * 10) / 10); }
      out.push(n);
    };

    if (tag === "iframe") {
      if (hasSize) push({ type: "iframe", box: rect(el, fixed), src: el.src || el.getAttribute("data-src"), title: el.title || undefined });
      return;
    }
    if (tag === "video") {
      if (!hasSize) return;
      const host = el.closest("[data-video-info]");
      push({
        type: "video", box: rect(el, fixed), src: el.currentSrc || el.src || undefined, poster: el.poster || undefined,
        id: videoId(el.currentSrc) || videoId(el.src) || videoId(el.poster) || videoId(host?.getAttribute("data-video-info")),
        autoplay: el.autoplay || !el.paused, loop: el.loop, muted: el.muted, controls: el.controls, fit: cs.objectFit, mask: mask(el),
        info: host?.getAttribute("data-video-info") || undefined,
      });
      return;
    }
    if (/\bwixui-rich-text\b/.test(cls) || el.getAttribute("data-testid") === "richTextElement") {
      if (hasSize && el.innerText.trim()) push({ type: "text", box: rect(el, fixed), ...richText(el), href: ctx.href });
      return;
    }
    if (/\bwixui-slideshow\b/.test(cls)) {
      const q = (s) => { const b = el.querySelector(s); return b && b.getBoundingClientRect().width ? rect(b, fixed) : null; };
      const dots = [...el.querySelectorAll("nav a, a[href*='#comp-']")].filter((a) => a.getBoundingClientRect().width);
      push({
        type: "slideshow", id: el.id, box: rect(el, fixed), prev: q("[data-testid='prevButton']"), next: q("[data-testid='nextButton']"),
        dots: dots.length ? { count: dots.length, first: rect(dots[0], fixed), step: dots[1] ? rect(dots[1], fixed)[0] - rect(dots[0], fixed)[0] : 0,
          active: getComputedStyle(dots.find((d) => /JPnvZO|selected/i.test(d.className)) || dots[0]).backgroundColor,
          idle: getComputedStyle(dots[dots.length - 1]).backgroundColor } : null,
        arrowColor: (() => { const p = el.querySelector("[data-testid='nextButton'] svg path, [data-testid='nextButton'] svg"); return p ? getComputedStyle(p).fill : undefined; })(),
        slides: [],
      });
      return;
    }
    if (/\bpro-gallery\b/.test(cls) && !/pro-gallery-/.test(cls.replace(/\bpro-gallery\b/, "")) || (el.id || "").startsWith("pro-gallery-")) {
      const imgs = [...el.querySelectorAll("img")].filter((i) => (i.currentSrc || i.src || "").includes("wixstatic.com/media"));
      if (imgs.length && hasSize) {
        const base = rect(el, fixed);
        const seen = new Set();
        const items = [];
        for (const i of imgs) {
          const holder = i.closest(".gallery-item-container") || i;
          const b = rect(holder, fixed);
          const key = (i.currentSrc || i.src).split("/media/")[1].split("/")[0] + "@" + Math.round(b[0]) + "," + Math.round(b[1]);
          if (seen.has(key) || !b[2]) continue;
          seen.add(key);
          items.push({ src: i.currentSrc || i.src, alt: i.alt || undefined, box: [b[0] - base[0], b[1] - base[1], b[2], b[3]] });
        }
        const scroller = el.querySelector(".gallery-horizontal-scroll, [data-hook='gallery-horizontal-scroll'], .pro-gallery-margin-container");
        push({ type: "gallery", box: base, items, horizontal: !!el.querySelector(".gallery-horizontal-scroll, .slider, .gallery-slideshow, [class*='horizontal']"), scrollW: scroller?.scrollWidth });
        return;
      }
    }
    if (/\bwixui-button\b|StylableButton\d*__root/.test(cls) || (tag === "button" && el.innerText.trim() && !el.closest(".wixui-slideshow"))) {
      if (!hasSize) return;
      const labelEl = el.querySelector("[class*='__label']") || el;
      const label = labelEl.innerText.trim();
      const icon = !label && el.querySelector("svg") ? el.querySelector("svg").outerHTML : undefined;
      push({
        type: "button", box: rect(el, fixed), label, icon, labelBox: label ? textRect(labelEl, fixed) : undefined, style: textStyle(labelEl), ...boxStyle(cs),
        href, target: el.getAttribute("target") || undefined, submit: el.getAttribute("type") === "submit" || !!el.closest("form") || undefined,
      });
      return;
    }
    if (tag === "input" || tag === "textarea" || tag === "select") {
      if (el.type === "hidden" || (!hasSize && !["checkbox", "radio"].includes(el.type))) return;
      const toggle = el.type === "checkbox" || el.type === "radio";
      const label = (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest("label") || el.parentElement?.querySelector(":scope > label") || el.parentElement?.parentElement?.querySelector(":scope > label");
      // Custom checkboxes hide the real input; use the label row as the clickable area.
      const shown = toggle && r.width < 5 && label ? label : el;
      push({
        type: "input", tag, inputType: el.type, name: el.name || undefined, placeholder: el.placeholder || undefined, required: el.required || undefined,
        value: toggle ? (label?.innerText.trim() || el.value) : undefined,
        label: label?.innerText.trim() || el.getAttribute("aria-label") || undefined, labelBox: label && label.getBoundingClientRect().width ? rect(label, fixed) : undefined,
        labelStyle: label ? textStyle(label) : undefined, box: rect(shown, fixed), style: textStyle(el), ...boxStyle(cs),
        borderBottom: parseFloat(cs.borderBottomWidth) > 0 ? `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}` : undefined,
        padding: cs.padding, placeholderColor: getComputedStyle(el, "::placeholder").color,
      });
      return;
    }
    if (tag === "img") {
      const src = el.currentSrc || el.src || "";
      if (hasSize && src && !src.startsWith("data:")) {
        push({ type: "image", box: rect(el, fixed), src, alt: el.alt || undefined, natural: [el.naturalWidth, el.naturalHeight], fit: cs.objectFit, position: cs.objectPosition, radius: cs.borderRadius !== "0px" ? cs.borderRadius : undefined, opacity: cs.opacity !== "1" ? cs.opacity : undefined, mask: mask(el), href, zoom: !!el.closest("[data-popupaction], [role='button'][aria-haspopup]") || undefined });
      }
      return;
    }
    if (tag === "svg") {
      if (hasSize && !el.closest("button")) push({ type: "svg", box: rect(el, fixed), html: el.outerHTML, fill: cs.fill, color: cs.color, href });
      return;
    }
    // Plain link with its own text (menus, text links outside rich text)
    if (tag === "a" && href && hasSize && !el.querySelector("img, svg, video, .wixui-rich-text") && el.innerText.trim()) {
      const labelEl = [...el.querySelectorAll("*")].reverse().find((e) => e.children.length === 0 && e.innerText?.trim()) || el;
      push({ type: "button", box: rect(el, fixed), label: el.innerText.trim(), labelBox: textRect(labelEl, fixed), style: textStyle(labelEl), ...boxStyle(cs), href, target: el.getAttribute("target") || undefined });
      return;
    }
    // Containers: emit a box if it paints something, then descend.
    if (hasSize) {
      const bs = boxStyle(cs);
      if (bs.bg || bs.bgImage || bs.border) push({ type: "box", box: rect(el, fixed), ...bs });
      else if (/\bwixui-horizontal-line\b|\bwixui-vertical-line\b/.test(cls)) {
        push({ type: "box", box: rect(el, fixed), border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, line: true, borderLeft: `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}` });
      }
      const bi = cs.backgroundImage;
      if (bi && bi.includes("url(") && bi.includes("wixstatic")) push({ type: "image", box: rect(el, fixed), src: bi.match(/url\(["']?([^"')]+)/)[1], fit: cs.backgroundSize === "contain" ? "contain" : "cover", position: cs.backgroundPosition });
    }
    const next = { fixed, href };
    for (const c of el.children) walk(c, next, out);
    if (el.shadowRoot) for (const c of el.shadowRoot.children) walk(c, next, out);
  }

  window.__ex = {
    page() {
      const out = [];
      walk(document.body, { fixed: false, href: undefined }, out);
      return {
        title: document.title,
        description: document.querySelector("meta[name='description']")?.content || undefined,
        width: document.documentElement.clientWidth,
        height: document.documentElement.scrollHeight - adsH,
        viewportH: window.innerHeight,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        nodes: out,
      };
    },
    slide(id) {
      const el = document.getElementById(id);
      const out = [];
      for (const c of el.children) {
        if (c.matches("button, nav, [data-testid='prevButton'], [data-testid='nextButton']") || c.querySelector(":scope > a[href*='#comp-']")) continue;
        walk(c, { fixed: false, href: undefined }, out);
      }
      return out;
    },
  };
}
// ---------------------------------------------------------------------------------------------

async function extractView(browser, pg, view) {
  const ctx = await browser.newContext(view.opts);
  const page = await ctx.newPage();
  await page.goto(pg.url, { waitUntil: "load", timeout: 60000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
  // Wix renders the page body after load; don't measure an empty shell.
  await page.waitForFunction(() => document.querySelector("#SITE_PAGES img, #SITE_PAGES a, #SITE_PAGES video, #SITE_PAGES iframe, #SITE_PAGES [data-testid='richTextElement']"), null, { timeout: 25000 }).catch(() => {});
  let h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(250);
    h = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.evaluate(installExtractor);
  let data = await page.evaluate(() => window.__ex.page());

  for (const node of data.nodes.filter((n) => n.type === "slideshow" && n.id)) {
    const dots = page.locator(`#${node.id} a[href*='#comp-']`);
    const count = (await dots.count()) || 1;
    for (let i = 0; i < Math.min(count, 60); i++) {
      if (i > 0) {
        await dots.nth(i).click({ force: true }).catch(() => {});
        await page.waitForTimeout(1300);
      }
      node.slides.push(await page.evaluate((id) => window.__ex.slide(id), node.id));
    }
  }
  // Classic slideshow galleries (/photos) keep one photo in the DOM: step through to collect them all.
  const galleries = await page.evaluate(() => [...document.querySelectorAll(".wixui-gallery")].filter((g) => g.querySelector("[data-testid='gallery-nextButton']")).map((g) => g.id));
  for (const id of galleries) {
    // The gallery DOM holds the current photo plus its neighbours; keep clicking "next" until no new photo shows up.
    const read = () => page.evaluate((gid) => {
      const g = document.getElementById(gid);
      const r = g.getBoundingClientRect();
      const imgs = [...g.querySelectorAll("img")].filter((i) => i.getBoundingClientRect().width > 50).map((i) => {
        const ir = i.getBoundingClientRect();
        return { src: i.currentSrc || i.src, alt: i.alt, imgBox: [ir.left + scrollX, ir.top + scrollY, ir.width, ir.height] };
      });
      return { box: [r.left + scrollX, r.top + scrollY, r.width, r.height], imgs };
    }, id);
    const first = await read();
    const slides = [];
    const seen = new Set();
    for (let i = 0, quiet = 0, cur = first; i < 80 && quiet < 4; i++) {
      let fresh = 0;
      for (const im of cur.imgs) {
        const key = (im.src || "").split("/media/")[1]?.split("/")[0];
        if (!key || seen.has(key)) continue;
        seen.add(key);
        fresh++;
        slides.push([{ type: "image", box: im.imgBox.map((v) => Math.round(v * 10) / 10), src: im.src, alt: im.alt || undefined, fit: "cover" }]);
      }
      quiet = fresh ? 0 : quiet + 1;
      await page.click(`#${id} [data-testid='gallery-nextButton']`, { force: true }).catch(() => {});
      await page.waitForTimeout(1000);
      cur = await read();
    }
    if (slides.length > 1) {
      const b = first.box.map((v) => Math.round(v * 10) / 10);
      const within = (n) => n.type === "image" && n.box[0] >= b[0] - 2 && n.box[1] >= b[1] - 2 && n.box[0] + n.box[2] <= b[0] + b[2] + 2 && n.box[1] + n.box[3] <= b[1] + b[3] + 2;
      const at = data.nodes.findIndex(within);
      data.nodes = data.nodes.filter((n) => !within(n));
      data.nodes.splice(at < 0 ? data.nodes.length : at, 0, { type: "slideshow", id, box: b, prev: [b[0] + 12, b[1] + b[3] / 2 - 10, 10, 20], next: [b[0] + b[2] - 22, b[1] + b[3] / 2 - 10, 10, 20], dots: null, arrowColor: "rgb(255, 255, 255)", slides });
    }
  }
  await ctx.close();

  // Normalise x to the centred content column; mark full-bleed nodes.
  const off = (data.width - view.canvas) / 2;
  const norm = (nodes, dx, dy) => {
    for (const n of nodes) {
      if (!n.fixed && n.box[0] <= 1 && n.box[2] >= data.width - 2 && view.canvas !== data.width) n.bleed = true;
      n.box = [Math.round((n.box[0] - dx) * 10) / 10, Math.round((n.box[1] - dy) * 10) / 10, n.box[2], n.box[3]];
      for (const k of ["labelBox", "prev", "next"]) if (n[k]) n[k] = [n[k][0] - dx, n[k][1] - dy, n[k][2], n[k][3]];
      if (n.dots) n.dots.first = [n.dots.first[0] - dx, n.dots.first[1] - dy, n.dots.first[2], n.dots.first[3]];
      if (n.slides) for (const s of n.slides) norm(s, dx, dy);
    }
  };
  norm(data.nodes.filter((n) => !n.fixed), off, 0);
  for (const n of data.nodes.filter((n) => n.fixed)) n.vw = data.width, n.vh = data.viewportH;
  return { canvas: view.canvas, crawlWidth: data.width, ...data };
}

let pages = (await Promise.all(SITES.map(pageList))).flat();
if (FILTER) pages = pages.filter((p) => new RegExp(FILTER).test(`${p.site}__${p.slug}`));
const browser = await chromium.launch();
let next = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < pages.length) {
      const pg = pages[next++];
      const outFile = path.join(OUT, `${pg.site}__${pg.slug}.json`);
      // Resumable: SINCE=<epoch ms> re-extracts only files older than that; default skips existing files.
      if (!FILTER && fs.existsSync(outFile) && fs.statSync(outFile).mtimeMs > Number(process.env.SINCE || 0)) continue;
      try {
        const views = {};
        for (const view of VIEWS) {
          for (let attempt = 0; attempt < 3; attempt++) {
            views[view.name] = await extractView(browser, pg, view);
            if (views[view.name].nodes.some((n) => n.type !== "box")) break; // retry empty captures
          }
        }
        const { title, description } = views.desktop;
        fs.writeFileSync(path.join(OUT, `${pg.site}__${pg.slug}.json`), JSON.stringify({ site: pg.site, slug: pg.slug, url: pg.url, title, description, views }, null, 1));
        const count = (v) => v.nodes.reduce((a, n) => ((a[n.type] = (a[n.type] || 0) + 1), a), {});
        console.log("ok", pg.site, pg.slug, JSON.stringify(count(views.desktop)), "| m", JSON.stringify(count(views.mobile)));
      } catch (e) {
        console.log("FAIL", pg.site, pg.slug, e.message.split("\n")[0]);
      }
    }
  })
);
await browser.close();
