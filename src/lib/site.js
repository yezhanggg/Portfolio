// Shared helpers: page data (extracted from Wix into src/data/pages), routes, links and media.
import media from "../data/media.json";
import { applyFixups } from "./fixups.js";

const modules = import.meta.glob("../data/pages/*.json", { eager: true });
export const pages = Object.values(modules).map((m) => applyFixups(structuredClone(m.default ?? m)));

// yz index → "/", yz foo → "/foo", zhaeng index → "/zhaeng", zhaeng foo → "/zhaeng/foo"
export function routeOf(page) {
  const slug = page.slug === "index" ? "" : page.slug;
  return page.site === "zhaeng" ? ["zhaeng", slug].filter(Boolean).join("/") : slug;
}

const ORIGINS = [
  ["https://www.yezhang.net", ""],
  ["https://yezhang.net", ""],
  ["https://yegnahz.wixsite.com/zhaeng", "/zhaeng"],
];

// Old absolute Wix URLs become site-relative paths; everything else is left alone.
export function localHref(href) {
  if (!href) return undefined;
  for (const [origin, prefix] of ORIGINS) {
    if (href === origin || href.startsWith(origin + "/") || href.startsWith(origin + "?") || href.startsWith(origin + "#")) {
      const rest = href.slice(origin.length).replace(/\?lightbox=[^#]*/, "");
      return decodeURI(prefix + rest) || "/";
    }
  }
  return href;
}
export const isExternal = (href) => /^https?:\/\//.test(href || "");
// Lulo Clean (Wix) has capitals only; its substitute needs an explicit uppercase.
const CAPS_ONLY = /lulo-clean/;
export const rewriteLinks = (html) =>
  html
    .replace(/href="([^"]+)"/g, (_, h) => `href="${localHref(h)}"`)
    .replace(/font-family:lulo-clean/g, "text-transform:uppercase;font-family:lulo-clean");
export const fontFix = (style = {}) => (CAPS_ONLY.test(style["font-family"] || "") ? { ...style, "text-transform": "uppercase" } : style);
export const maskCss = (m) =>
  m ? { "-webkit-mask-image": m.image, "mask-image": m.image, "-webkit-mask-size": m.size, "mask-size": m.size, "-webkit-mask-position": m.position, "mask-position": m.position, "-webkit-mask-repeat": m.repeat, "mask-repeat": m.repeat } : {};

export const mediaId = (src) => (String(src || "").match(/\/media\/([^/?]+)/) || [])[1];

// Wix encodes how an image was cropped/fitted in its URL: /v1/crop/x_,y_,w_,h_/fill/w_,h_,al_c…
export function parseTransform(src) {
  const t = { mode: null, crop: null, align: "c" };
  const s = String(src || "");
  const crop = s.match(/\/crop\/x_(\d+),y_(\d+),w_(\d+),h_(\d+)/);
  if (crop) t.crop = crop.slice(1).map(Number);
  const mode = s.match(/\/(fill|fit)\/w_(\d+),h_(\d+)(?:,al_([a-z]+))?/);
  if (mode) {
    t.mode = mode[1];
    t.align = mode[4] || "c";
  }
  return t;
}

export function mediaFor(src) {
  const id = mediaId(src);
  return id ? media[id] : undefined;
}

// srcset for an image displayed at `cssWidth` px on a canvas of `canvas` px.
export function srcset(m) {
  if (!m || !m.widths) return undefined;
  return m.widths.map((w) => `${m.base}-${w}.${m.ext} ${w}w`).join(", ");
}
export function largest(m) {
  if (!m) return undefined;
  return m.widths ? `${m.base}-${m.widths[m.widths.length - 1]}.${m.ext}` : m.file;
}
export function smallest(m) {
  if (!m) return undefined;
  return m.widths ? `${m.base}-${m.widths[0]}.${m.ext}` : m.file;
}
export const px = (n) => `${Math.round(n * 10) / 10}px`;
export const css = (obj) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
