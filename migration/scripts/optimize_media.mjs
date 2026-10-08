// Builds the web copies of every image and video the pages actually use.
//   originals:  ~/Desktop/yezhang-site-archive (never committed)
//   output:     public/media/<id>-<width>.webp, public/video/<id>.mp4 (+ .jpg poster)
//   index:      src/data/media.json (Wix media id → local files), migration/inventory/rename-map.csv
//
// usage: node migration/scripts/optimize_media.mjs [archiveDir]
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const ARCHIVE = path.resolve((process.argv[2] || "~/Desktop/yezhang-site-archive").replace(/^~/, os.homedir()));
const PAGES = "src/data/pages";
const OUT_IMG = "public/media";
const OUT_VID = "public/video";
const WIDTHS = [480, 960, 2000];
for (const d of [OUT_IMG, OUT_VID, path.join(ARCHIVE, "extra")]) fs.mkdirSync(d, { recursive: true });

// ---- what do the pages reference? -------------------------------------------------------------
const imageIds = new Set();
const videoIds = new Map(); // id → needs audio?
const ytIds = new Set();
const visit = (nodes) => {
  for (const n of nodes) {
    const yt = String(n.src || "").match(/i\.ytimg\.com\/vi\/([\w-]+)\//);
    if (yt) ytIds.add(yt[1]);
    const srcs = [n.type === "image" ? n.src : null, ...(n.items || []).map((i) => i.src)];
    for (const s of srcs) {
      const m = String(s || "").match(/\/media\/([^/?]+)/);
      if (m) imageIds.add(m[1]);
    }
    if (n.type === "video" && n.id) videoIds.set(n.id, (videoIds.get(n.id) || false) || !n.autoplay);
    for (const s of n.slides || []) visit(s);
  }
};
for (const f of fs.readdirSync(PAGES).filter((f) => f.endsWith(".json"))) {
  const page = JSON.parse(fs.readFileSync(path.join(PAGES, f), "utf8"));
  for (const v of Object.values(page.views)) visit(v.nodes);
}
// Media named directly in the fix-ups (widgets rebuilt by hand).
for (const m of fs.readFileSync("src/lib/fixups.js", "utf8").matchAll(/"([0-9a-f]{6}_[0-9a-f]{32}~mv2\.\w+)"/g)) imageIds.add(m[1]);

// ---- index the archive ------------------------------------------------------------------------
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const archiveFiles = [...walk(path.join(ARCHIVE, "wix-media")), ...walk(path.join(ARCHIVE, "zhaeng-media")), ...walk(path.join(ARCHIVE, "extra"))];
const byPrefix = new Map();
for (const f of archiveFiles) {
  const m = path.basename(f).match(/^([0-9a-f]{6}_[0-9a-f]{32}|[0-9a-f]{32})__/);
  if (m) byPrefix.set(m[1], f);
}
const csvRows = (file) =>
  fs.existsSync(file)
    ? fs.readFileSync(file, "utf8").split("\n").slice(1).filter(Boolean).map((l) => {
        // id,name,bytes,type,… — names may contain commas inside quotes
        const m = l.match(/^([^,]+),("(?:[^"]|"")*"|[^,]*),(\d+),(\w+)/);
        return m && { id: m[1], name: m[2].replace(/^"|"$/g, ""), bytes: Number(m[3]), type: m[4] };
      }).filter(Boolean)
    : [];
const manifest = [...csvRows("migration/inventory/media-manager.csv"), ...csvRows("migration/inventory/zhaeng-media-manager.csv")];
const videoFiles = archiveFiles.filter((f) => /\/videos\//.test(f));

async function originalFor(id) {
  const prefix = id.split("~")[0].replace(/\.[a-z0-9]+$/i, "");
  if (byPrefix.has(prefix)) return byPrefix.get(prefix);
  // Not in the Media Manager export (e.g. the favicon): fetch the original once into the archive.
  const dest = path.join(ARCHIVE, "extra", `${prefix}__${id.replace(/[^\w.~-]/g, "_")}`);
  const res = await fetch("https://static.wixstatic.com/media/" + id);
  if (!res.ok) return null;
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  byPrefix.set(prefix, dest);
  return dest;
}

const short = (id) => (id.match(/[0-9a-f]{32}/) || [id])[0].slice(0, 14);
const media = {};
const renameRows = [["wix_id", "original_file", "output", "width", "height"]];
let made = 0, kept = 0;
const missing = [];

// ---- images -----------------------------------------------------------------------------------
for (const id of [...imageIds].sort()) {
  if (!/^[0-9a-f]{6}_[0-9a-f]{32}~/.test(id) && !/^f8d0cd_/.test(id)) { missing.push(id + " (not account media — handled in code)"); continue; }
  const src = await originalFor(id);
  if (!src) { missing.push(id); continue; }
  const animated = /\.gif$/i.test(id);
  const meta = await sharp(src, { animated }).metadata();
  const rotated = (meta.orientation || 1) >= 5;
  const w = rotated ? meta.height : meta.width;
  const h = rotated ? meta.pageHeight || meta.width : meta.pageHeight || meta.height;
  const top = Math.min(w, animated ? 960 : WIDTHS[WIDTHS.length - 1]);
  const widths = [...WIDTHS.filter((x) => x < top * 0.85 && (!animated || x <= 960)), top];
  const base = `/media/${short(id)}`;
  for (const width of widths) {
    const out = path.join("public", `${base}-${width}.webp`);
    if (fs.existsSync(out)) { kept++; continue; }
    await sharp(src, { animated, limitInputPixels: false }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90, effort: 5 }).toFile(out);
    made++;
  }
  media[id] = { base, ext: "webp", w, h, widths };
  renameRows.push([id, path.relative(ARCHIVE, src), base, w, h]);
}

// ---- videos -----------------------------------------------------------------------------------
for (const [id, audio] of videoIds) {
  const row = manifest.find((r) => r.id === id);
  const src = row && videoFiles.find((f) => fs.statSync(f).size === row.bytes);
  if (!src) { missing.push("video " + id); continue; }
  const file = `/video/${short(id)}.mp4`, poster = `/video/${short(id)}.jpg`;
  const out = path.join("public", file), outPoster = path.join("public", poster);
  if (!fs.existsSync(out)) {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src,
      "-vf", "scale=w='if(gt(iw,ih),min(1920,iw),-2)':h='if(gt(iw,ih),-2,min(1920,ih))'",
      "-c:v", "libx264", "-crf", "26", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      ...(audio ? ["-c:a", "aac", "-b:a", "128k"] : ["-an"]), out]);
    made++;
  } else kept++;
  if (!fs.existsSync(outPoster)) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", out, "-frames:v", "1", "-q:v", "4", outPoster]);
  const probe = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", out]).toString().trim().split(",");
  media[id] = { file, poster, w: Number(probe[0]), h: Number(probe[1]) };
  renameRows.push([id, path.relative(ARCHIVE, src), file, probe[0], probe[1]]);
}

// ---- YouTube thumbnails (so the page makes no third-party request until a video is played) ---
for (const vid of ytIds) {
  const out = `public/media/yt-${vid}.jpg`;
  if (fs.existsSync(out)) continue;
  for (const name of ["maxresdefault", "hqdefault"]) {
    const res = await fetch(`https://i.ytimg.com/vi/${vid}/${name}.jpg`);
    if (!res.ok) continue;
    await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 960, withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(out);
    break;
  }
}

// ---- favicon ----------------------------------------------------------------------------------
const logo = await originalFor("f8d0cd_fd8bbe6fb2e04736883c85bb35460f36~mv2.png");
if (logo) await sharp(logo).resize(192, 192, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile("public/favicon.png");

fs.writeFileSync("src/data/media.json", JSON.stringify(media, null, 1));
fs.writeFileSync("migration/inventory/rename-map.csv", renameRows.map((r) => r.map((c) => (/[",]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(",")).join("\n") + "\n");
const size = (dir) => walk(dir).reduce((a, f) => a + fs.statSync(f).size, 0) / 1e6;
console.log(`images ${imageIds.size}, videos ${videoIds.size}; wrote ${made} files, ${kept} already present`);
console.log(`public/media ${size(OUT_IMG).toFixed(0)} MB, public/video ${size(OUT_VID).toFixed(0)} MB`);
if (missing.length) console.log("NOT CONVERTED:\n  " + missing.join("\n  "));
