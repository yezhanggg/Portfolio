# yezhang.net — Wix → self-hosted migration plan

Prepared 2026-10-07 from a live audit of the Wix site (pages, Media Manager, domain, apps).
Everything measured here is in `inventory/` next to this file.

**Goal:** move *everything* — every page, every text, every image and video, the forms, the domain —
off Wix into a GitHub repository that deploys to Vercel, so you own the files and pay nothing beyond
the domain. Keep the look of the current site; add the DeepSeek chat bubble that is already built in
this folder.

---

## 0. Quick facts (what we are moving)

| Item | Value |
|---|---|
| Wix site | "YE ZHANG" · Premium plan · classic Wix Editor · created Dec 2022 · last edited Feb 2026 |
| Published pages | **47** (full list in `inventory/pages.csv`) |
| Media Manager | **439 files, 1.30 GB** in 8 folders: 426 images · 12 videos (≈660 MB) · 1 PDF (Anima font license) |
| Media actually shown on pages | 275 files (the other 164 are unused uploads, duplicates, and the videos) |
| Image sizes | 150 files longer than 3000 px, 183 between 2000–3000 px; largest single image 25.6 MB (7200×4800) |
| Videos | all in the root folder; three are over GitHub's 100 MB file limit (154 / 148 / 122 MB `.mov`) |
| Forms | contact form ("wanna say something to YE") on 3 pages · zine request form on `/order` |
| Galleries | Wix Pro Gallery on `/art`, `/ua`, `/photography`, `/typeface`; slideshows on all zine pages; one Slicebox 3-D slideshow iframe |
| Video embeds | 3 YouTube videos on `/my-clothing-brand` (430 trailers) — stay on YouTube, nothing to move |
| Fonts | 6 families licensed through Wix (DIN Neuzeit Grotesk, DIN Next, Helvetica, Futura, Lulo Clean, Proxima Nova) — cannot be copied; need substitutes or your own licenses |
| External links | Instagram @ye_zhangy, Spotify profile, Google Drive (typeface download) |
| Domain | `yezhang.net`, **registered through Wix**, expires 2028-08-07, nameservers `ns6/ns7.wixdns.net`, no email (no MX records) |
| Velo / custom code | enabled but no custom page code found — nothing to port |
| SEO | only `/home` and `/portfolio` have meta descriptions; `robots.txt` blocks `?lightbox=` URLs |
| Wix apps installed | Promote SEO, Wix Forms, Forms & Payments, Wix Hotels, Wix Invoices, Wix Video (Hotels/Invoices/Video appear unused) |

**Bottom line:** this is a 47-page image portfolio with two forms. There is nothing on the site that
needs a database or a server except the forms and the chat bubble, so it can be a static site. The
hard parts are (1) getting the originals out of Wix cleanly, (2) rebuilding Wix's absolute-positioned
layouts so they look the same on desktop *and* phone, and (3) the fonts.

---

## 1. Target architecture

```
GitHub repo  yezhang-site  (private or public, your choice)
│
├── src/                     page sources (Astro) — one file per page, same slugs as today
├── public/
│   ├── media/               optimized images (WebP/AVIF, ≤2560 px)  ≈150–250 MB
│   ├── video/               web-encoded MP4s (H.264, ≤1080p)         ≈100–150 MB
│   └── fonts/               only fonts you are licensed to self-host
├── api/
│   ├── chat.js              DeepSeek chat backend (already written in ../api)
│   └── contact.js           form handler → emails you via Resend
├── vercel.json              redirects for old Wix URLs, headers, caching
└── migration/               this plan + inventory + scripts (kept for reference)

Vercel (Hobby, free)  ←  auto-deploys every push to main
   └── yezhang.net + www.yezhang.net  (DNS changed at Wix, or domain transferred out)

Cold archive (NOT in the repo): all 439 original files (1.3 GB) + original .mov videos
   → ~/Desktop/yezhang-site-archive  and a copy in Google Drive / external drive
```

Why these choices:

- **Static site on Vercel** — free for personal sites (100 GB bandwidth/month is far more than a
  portfolio uses), global CDN, automatic HTTPS, deploys from GitHub in ~30 s. Netlify or Cloudflare
  Pages would work equally well; Vercel is chosen because your account is already connected here.
- **Astro** as the site generator — plain HTML/CSS output, zero JavaScript unless a page needs it,
  built-in image optimization (`<Image>` resizes and converts to WebP at build time), Markdown
  content if you ever want a blog. If you would rather have *no* framework at all, every page can be
  a hand-written `.html` file instead; the plan is the same.
- **Originals stay out of git.** GitHub refuses files over 100 MB and gets slow past ~1 GB; Vercel
  does not need originals. The site serves resized copies; the originals live in an archive folder
  and a cloud backup.

---

## 2. Phases at a glance

| Phase | What | Who | Time |
|---|---|---|---|
| 0 | Decisions + accounts (GitHub, Vercel, DeepSeek, Resend) | you | 30 min |
| 1 | **Export everything from Wix** (media, pages, forms data, SEO, settings) | me (via the Wix connection) + you | 2–3 h, mostly downloads |
| 2 | Build the new site (two tracks, see §4) | me, you review | 2–4 days |
| 3 | QA: page-by-page comparison, phones, links, forms, chat | me + you | half a day |
| 4 | Cut-over: connect domain, go live | me (Vercel) + you (Wix DNS) | 1 h + DNS wait |
| 5 | Decommission Wix, cancel Premium, keep domain | you | 15 min, after 2 weeks of monitoring |

---

## 3. Phase 1 — Export everything from Wix

Nothing in this phase changes the live site. Do it all before touching anything else.

### 3.1 Media — all 439 files, original quality

Wix stores the *original upload* for every file; the URLs on the pages are resized copies. We want
the originals.

**Method A (preferred, one API call):** Wix's Media Manager API can package up to 1000 files into a
single ZIP with a permanent download link (`Generate Files Download URL`). I can run it from here
with all 439 file IDs from `inventory/media-manager.csv`, then download the ZIP (≈1.3 GB) into
`~/Desktop/yezhang-site-archive/wix-media/`. Folder names are preserved.

**Method B (fallback, no API needed):** every image is public at
`https://static.wixstatic.com/media/<file id>` — that bare URL returns the original file. The script
below downloads from the manifest with a polite delay. Videos and the PDF are not on that host; they
need the API download URL, so Method A is simpler.

```python
# migration/scripts/download_media.py  — fallback downloader (images only)
import csv, pathlib, time, urllib.request
root = pathlib.Path.home() / "Desktop/yezhang-site-archive/wix-media"
for row in csv.DictReader(open("migration/inventory/media-manager.csv")):
    if row["type"] != "IMAGE": continue
    folder = root / row["folder"].replace("(root)", "root")
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / f'{row["id"].split("~")[0]}__{row["name"]}'
    if dest.exists() and dest.stat().st_size == int(row["bytes"]): continue
    urllib.request.urlretrieve("https://static.wixstatic.com/media/" + row["id"], dest)
    time.sleep(0.3)
```

After download, verify: file count = 439, total ≈ 1.30 GB, and spot-check a few sizes against the
manifest (`bytes` column). Then compute SHA-256 for every file and save `checksums.txt` — this is
your proof the archive is complete.

Things to know about the files:
- **28 files were uploaded as HEIC** (iPhone photos, folder `green` and root). Wix converted them to
  PNG on upload; the PNG *is* the best copy Wix has. If you still have the original HEICs on your
  phone/Mac, those are better.
- **Duplicates:** several files exist twice with the same name and byte size (e.g. `IMG_9449.jpg`,
  `20-21_Saviiii.jpg`, `k 2.jpg` / `k 2 copy.jpg`, `butterflyd.mov` ×2 at different sizes). The
  archive keeps both; the site will use one.
- **Chinese file and folder names** (`未命名作品 4.jpg`, folder `波兰。1`) are fine in the archive but
  will be renamed to ASCII slugs for web URLs, with a `rename-map.csv` so nothing is lost.
- **Wix file IDs** (`f8d0cd_…~mv2.jpg`) are kept as a prefix in the archive so each file can be traced
  back to its Media Manager entry and to the page that used it.

### 3.2 Pages — layout, text, and which image goes where

Wix has no page export. We capture the rendered site three ways, all scripted with Playwright:

1. **Rendered DOM** of each of the 47 pages after full load and scroll (lazy-loaded galleries only
   appear after scrolling). Saved to `inventory/rendered/<slug>.html`.
2. **Full-page screenshots** at desktop (1440 px) and phone (390 px) widths —
   `inventory/screenshots/<slug>-desktop.png` and `-mobile.png`. These are the reference for the
   rebuild and for the final side-by-side comparison. Wix builds a *separate* mobile layout, so the
   mobile screenshots are essential.
3. **Network log** of every `static.wixstatic.com` / `video.wixstatic.com` request per page →
   `inventory/page-assets.json`. This maps each page to its exact images (including gallery items
   and any background videos that only load through JavaScript) and the crop/size Wix displayed.

```js
// migration/scripts/crawl_pages.mjs  (npm i playwright)
import { chromium } from "playwright"; import fs from "fs";
const pages = fs.readFileSync("migration/inventory/pages.csv","utf8").split("\n").slice(1)
  .filter(Boolean).map(l => l.split(",")[1]);
const browser = await chromium.launch(); const assets = {};
for (const url of pages) for (const [name, w, h] of [["desktop",1440,900],["mobile",390,844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const slug = new URL(url).pathname.replace(/^\/|\/$/g,"") || "home-root";
  assets[`${slug}-${name}`] = [];
  page.on("request", r => /wixstatic\.com/.test(r.url()) && assets[`${slug}-${name}`].push(r.url()));
  await page.goto(url, { waitUntil: "networkidle" });
  for (let y = 0; y < 20000; y += 800) { await page.mouse.wheel(0, 800); await page.waitForTimeout(150); }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `migration/inventory/screenshots/${slug}-${name}.png`, fullPage: true });
  if (name === "desktop") fs.writeFileSync(`migration/inventory/rendered/${slug}.html`, await page.content());
  await page.close();
}
fs.writeFileSync("migration/inventory/page-assets.json", JSON.stringify(assets, null, 1));
await browser.close();
```

Also captured per page (already in `inventory/pages.csv`): title tag, meta description, visible
text, which features it uses (gallery / slideshow / form / YouTube / Slicebox), external links.

The raw HTML as served by Wix (before JavaScript) is already saved in `inventory/html-snapshot/`
(47 files, 23 MB) — it contains the Wix layout data (`"layout":{"x":…,"y":…,"width":…}`) for every
element, which is what makes a faithful rebuild possible.

### 3.3 Form submissions and contacts

Wix keeps every message sent through "wanna say something to YE" and every zine request from
`/order` in its CRM. These disappear when the site is cancelled.

- Wix dashboard → **Contacts** → Export → CSV (all contacts).
- Wix dashboard → **Forms & Submissions** → each form → Export to CSV.
- I can also pull submissions through the Wix Forms API and save them as
  `inventory/form-submissions.json` so there is a machine-readable copy.

### 3.4 Settings worth copying

- SEO: page titles (captured), the two meta descriptions (captured), the social-share image
  (favicon is `f8d0cd_fd8bbe6fb2e04736883c85bb35460f36~mv2.png`, an "Untitled_Artwork 2.png").
- Site language `en`; the regional settings are wrongly set to Iceland/ISK — irrelevant after
  migration.
- The Google Drive link for the typeface download (on `/typeface`) — download the font file now and
  put it in the archive next to `Anima License Agreement.pdf`, so the new site can serve it directly
  instead of linking to Drive.

### 3.5 Phase 1 checklist

- [ ] `~/Desktop/yezhang-site-archive/wix-media/` holds 439 files, 1.30 GB, `checksums.txt` written
- [ ] Second copy of the archive in Google Drive or on an external drive
- [ ] 47 desktop + 47 mobile screenshots, 47 rendered DOM files, `page-assets.json`
- [ ] Contacts CSV and form submissions exported
- [ ] Typeface font file downloaded from Google Drive
- [ ] Original HEIC/RAW/ProRes files from your own devices located (optional, better than Wix's copies)

---

## 4. Phase 2 — Build the new site

Two tracks. **I recommend doing both**: Track A takes a few hours and gives you a frozen, exact
archive copy immediately; Track B gives you a site you can actually keep editing.

### Track A — frozen "pixel copy" (archive quality, ~half a day)

Take the rendered DOM from §3.2, strip every Wix script, keep the inline styles and layout, rewrite
every image URL to the local optimized copy, and serve the result as static HTML. Result: a page that
looks identical to today's desktop version. Limits: galleries/slideshows become static image
columns, lightboxes become plain links, the mobile layout has to be regenerated from the mobile DOM,
and the HTML is unmaintainable (Wix class names everywhere). Good as a snapshot
(`archive.yezhang.net` or a `/2026-archive/` folder), not as the live site.

### Track B — clean rebuild (recommended for the live site, 2–4 days)

Rebuild each page in Astro using **four templates** that cover all 47 pages:

| Template | Pages | Built with |
|---|---|---|
| **Hero / nav page** — one big image or title, links to sections | `/` (WELCOME), `/notice`, `/home`, `/portfolio`, `/aboutme`, `/about`, `/thoughtss`, `/magazine`, `/photos`, `/copy-of-notice`, `/blank`, `/可以`, `/hmm`, `/shuffle` | plain HTML + CSS grid; the Wix x/y layout data gives exact positions |
| **Gallery page** — grid of images with lightbox | `/art` (70 images), `/ua` (70), `/photography` (32), `/cloudss` (62), `/np` (62), `/typeface`, `/archive`, `/sessionarchive`, `/green`, `/book-no-1`, `/brain-cell-no-2`, `/brain-cell-no-3`, `/dream`, `/who`, `/cdtc`, `/ideation`, `/some-random-photos-edits`, `/city-vision`, `/arcgis` | CSS grid/masonry + **PhotoSwipe** (open-source lightbox, keyboard + pinch-zoom, same feel as Wix "press to zoom") |
| **Zine / slideshow page** — page-flip through 15–17 spreads | `/copy-of-magazine` (vol.1), `/copy-of-vol-1` (vol.2), `/copy-of-vol-2` (vol.3), `/zineone`, `/zinetwo`, `/zinethree`, `/photomagazine` | **Swiper** or CSS scroll-snap carousel; arrows + swipe on phone |
| **Media page** — video or embeds | `/motion`, `/chill`, `/dance`, `/skin`, `/fire` (IMMERSE), `/my-clothing-brand` (3 YouTube + gallery), `/order` (form) | `<video>` tags for your own clips, `lite-youtube-embed` for YouTube |

What each page needs, exactly, is in `inventory/pages.csv` (features column) and
`page-assets.json` (which images, in which order).

**Layout fidelity.** Wix pages are absolutely positioned on a 980 px canvas. The rebuild keeps the
same positions on desktop (converted to a CSS grid with the same column/row coordinates) and uses
the mobile screenshots to lay out phone widths — which is what Wix's separate mobile editor was
doing anyway. Expect: desktop ≈ identical; phone ≈ same order and spacing, cleaner.

**Fonts** (the one visible difference). Wix serves Monotype fonts under *its* license; copying the
font files is not allowed. Options, best first:
1. Buy the two you actually use most — DIN Next and DIN Neuzeit Grotesk — as web-font licenses from
   Monotype/MyFonts (one-time, roughly $30–80 per weight). Then the site is exact.
2. Use free look-alikes from Google Fonts: Helvetica → system Helvetica/Arial (free, already on
   every device); DIN Next → **Barlow**; DIN Neuzeit Grotesk / Futura → **Jost**; Lulo Clean →
   **Josefin Sans** (caps, wide tracking); Proxima Nova → **Montserrat**. I'll make a one-page font
   comparison so you can decide per heading.
3. Use **your own typeface (Anima)** for headings — the site is a portfolio; it would be on-brand.

**Images.** Build-time pipeline (Astro `<Image>` or a one-off `sharp` script):
- master copy ≤ 2560 px long side, WebP q82 (+ AVIF where it helps) — typical 7200×4800 25 MB JPEG
  becomes ~600 KB; the whole site ≈ 150–250 MB instead of 1.3 GB
- gallery thumbnails 800 px; lightbox opens the 2560 px master; "download original" link optional
- `width`/`height` attributes on every `<img>` so pages don't jump while loading; `loading="lazy"`
  below the fold
- GIF artwork (8 files) kept as GIF or converted to looping MP4/WebP for size

**Videos** (12 files, 660 MB). Re-encode with ffmpeg to H.264 MP4, 1080p max, CRF 23 — the three
150 MB iPhone `.mov` files become ~20–40 MB each. Then either (a) commit them to `public/video/`
if each is under 50 MB (simplest, served by Vercel's CDN), or (b) upload to Cloudflare R2 (free
10 GB, no egress fees) and link. Cross-checking the page HTML against the manifest shows **9 of the
12 videos are used on pages** (their poster frames `<id>f000.jpg` are referenced): `vikaku.mov`,
`jjj.mov`, `kaku.mp4`, the DJI clip, `butterflyd.mov` (the 42 MB copy), `IMG_1678.mov`,
`My Movie 2.mov`, `IMG_7465.mov`, `142.mov`. Three are not used anywhere — `butterflyd.mov`
(122 MB copy), `IMG_0581.MOV`, `145.mov` — and only go to the archive. `page-assets.json` from the
crawl will confirm which page each one belongs to (likely the IMMERSE pages and `/motion`).

```bash
ffmpeg -i vikaku.mov -vf "scale='min(1920,iw)':-2" -c:v libx264 -crf 23 -preset slow \
       -movflags +faststart -c:a aac -b:a 128k vikaku.mp4
```

**Forms.** Two forms, rebuilt as plain HTML `<form>` elements posting to `api/contact.js`
(Vercel serverless function, same pattern as the chat backend). The function validates, rate-limits,
and emails you through **Resend** (free: 3,000 emails/month) — you receive the message at
yezhang1@usc.edu exactly as Wix did, plus an auto-reply "thank you!" to match the current site.
Fields preserved: Name / contact / message, and for `/order`: first name, last name, email, phone,
address, issue (vol.1 / vol.2 / vol.3). Spam: honeypot field + Cloudflare Turnstile (free) if needed.
Alternative with zero code: Web3Forms or Formspree free tier.

**Chat bubble.** `public/widget.js` and `api/chat.js` from this folder move into the site repo
unchanged; the widget `<script>` goes in the site layout so it appears on every page. The DeepSeek
key is a Vercel environment variable. The assistant's knowledge file (`api/_prompt.js`) is updated
to describe the new page URLs.

**URLs.** Every current slug is kept so old links and Google results keep working:
`/copy-of-magazine`, `/copy-of-vol-1`, `/zinethree`, `/可以`, etc. Optional clean-up later
(`/copy-of-magazine` → `/zine/vol-1`) with 301 redirects in `vercel.json`. Wix-specific URLs get
redirects too: `?lightbox=<id>` → the page itself; `/copy-of-notice` ("under maintenance") and
`/blank` ("New Page") can be dropped or redirected to `/`.

**SEO & extras.**
- `sitemap.xml` and `robots.txt` generated at build; same titles; write the missing 45 meta
  descriptions (short, one line each — I'll draft them from the page content for you to approve)
- Open Graph image per page (the hero image) — Wix had one site-wide
- favicon from the existing PNG
- `404` page in the site's style
- Vercel Analytics (free, privacy-friendly) to replace Wix's visitor stats
- `llms.txt` and the structured data Wix was adding — optional

### Phase 2 checklist

- [ ] Repo `yezhang-site` created on GitHub, Vercel project linked, preview URL working
- [ ] Image pipeline run: 275 referenced files optimized; sizes logged
- [ ] 12 videos re-encoded; decision made on where they live
- [ ] 4 templates built; all 47 pages generated with original slugs
- [ ] Fonts decided (licensed / free substitutes / Anima) and loaded with `font-display: swap`
- [ ] Contact + zine forms working end-to-end (email received, auto-reply sent)
- [ ] Chat bubble live on the preview site with DeepSeek key set
- [ ] Redirect table in `vercel.json`; 404 page

---

## 5. Phase 3 — QA before going live

1. **Side-by-side visual check** — script takes the same desktop/mobile screenshots of the Vercel
   preview and places them next to the Wix ones (`inventory/compare/<slug>.png`). You review 47
   pairs; anything off gets fixed.
2. **Every image accounted for** — script confirms each of the 275 referenced files appears on the
   same page in the new site (by Wix ID → new filename map).
3. **Links** — run `lychee` (link checker) over the preview; zero broken internal links.
4. **Phones** — real test on your iPhone (Safari) and an Android if available; galleries swipe,
   zines flip, chat opens, forms submit.
5. **Performance** — Lighthouse ≥ 90 on home, a gallery page and a zine page (should be easy for a
   static site with optimized images).
6. **Forms & chat** — send a test message through each form; ask the chat bubble a few questions.
7. **Search** — `site:yezhang.net` in Google lists the current URLs; confirm each resolves on the
   preview (same slugs) so rankings carry over.

---

## 6. Phase 4 — Cut-over (going live on yezhang.net)

Your domain is registered through Wix, which is fine — Wix lets you edit DNS records or change
nameservers for domains bought from them. The Premium *site* plan and the *domain* registration are
separate subscriptions; cancelling one does not cancel the other.

Steps, in order:

1. **Vercel** → project → Domains → add `yezhang.net` and `www.yezhang.net`. Vercel shows the
   records it wants: `A 76.76.21.21` for the apex and `CNAME cname.vercel-dns.com` for `www`
   (or, simpler, its nameservers `ns1.vercel-dns.com` / `ns2.vercel-dns.com`).
2. **Wix** → Domains → `yezhang.net` → Advanced → **Edit DNS** (keep Wix nameservers, change the
   A/CNAME records) *or* **Change nameservers** to Vercel's. Changing nameservers moves *all* DNS to
   Vercel, which is cleaner since there is no email on this domain.
3. Wait for propagation (minutes to a few hours; up to 48 h in rare cases). Vercel issues the HTTPS
   certificate automatically once it sees the records.
4. Verify: `https://yezhang.net` and `https://www.yezhang.net` both show the new site with a valid
   certificate; `curl -I` returns `server: Vercel`.
5. Leave the Wix site *published* for two weeks as a safety net (it is simply no longer reachable at
   the domain; it still exists at `yezhang.wixsite.com/...`).

**Alternative — transfer the domain away from Wix** (optional, saves money long-term): Wix renews
`.net` domains at roughly $15–20/year; Cloudflare Registrar or Porkbun charge ~$10–12. Transfer
requires: unlock the domain in Wix, get the EPP/auth code, start the transfer at the new registrar,
approve the email. Takes 5–7 days; the site stays up throughout if DNS is already on Vercel. Do this
*after* the cut-over, not during.

---

## 7. Phase 5 — Decommission Wix

After two weeks with no problems:

- [ ] Confirm the archive (§3.1) and the form exports (§3.3) are complete and backed up — once more
- [ ] Wix dashboard → Billing → Premium plan → **cancel auto-renewal** (check the renewal date first;
      the plan runs to the end of the paid period)
- [ ] Keep the domain subscription active (or transfer it, §6)
- [ ] Unpublish the Wix site (Settings → Unpublish) so the `wixsite.com` copy doesn't compete with
      yezhang.net in Google
- [ ] Remove the Wix connection from this Claude setup when it's no longer needed

---

## 8. Costs after migration

| Item | Cost |
|---|---|
| Vercel Hobby (hosting, CDN, HTTPS, serverless functions for forms + chat) | $0 for personal, non-commercial sites |
| GitHub (private repo) | $0 |
| Domain renewal (`yezhang.net`) | ~$15–20/yr at Wix, ~$10–12/yr if transferred |
| Resend (form emails) | $0 up to 3,000/month |
| DeepSeek API (chat bubble) | pay-as-you-go, cents per day for a portfolio |
| Cloudflare R2 for videos (only if needed) | $0 under 10 GB |
| Optional font licenses | one-time, ~$30–80 per weight |
| **Wix Premium plan** | **cancelled** (currently the main cost) |

---

## 9. Risks and how the plan handles them

| Risk | Mitigation |
|---|---|
| Something is missed and lost when Wix is cancelled | Phase 1 exports *everything* (439 files + forms + rendered pages + screenshots) before any change; checksums; two copies; Wix stays published for 2 weeks after cut-over |
| Bulk downloads throttled by Wix's CDN | Use the API's single-ZIP export (Method A); fallback script has delays and resumes |
| Mobile layout differs from Wix's hand-tuned mobile view | Mobile screenshots captured for all 47 pages and used as the reference; QA on real phones |
| Fonts look slightly different | Decide early (§4 Fonts); comparison page before building; licensed fonts if exactness matters |
| Old links / Google results break | Same slugs; `vercel.json` redirects for Wix-only URLs; sitemap submitted to Search Console |
| Form messages stop arriving | Resend domain verification done before cut-over; test submissions; your USC address as fallback recipient |
| Repo too large (videos, originals) | Originals never enter git; videos re-encoded; anything > 50 MB goes to R2 |
| Domain change breaks site | DNS changed only after the preview passes QA; TTL lowered first; Wix DNS can be reverted in minutes |

---

## 10. Decisions I need from you

1. **Track B (clean rebuild) as the live site, plus Track A snapshot as archive?** — recommended.
2. **Fonts:** license the DIN fonts, use free look-alikes, or use your Anima typeface for headings?
3. **GitHub repo:** create it under your account (name: `yezhang-site`, private or public)? I can
   create it from here with the `gh` CLI once you're logged in, or you create it and give me the URL.
4. **Videos:** keep in the repo after re-encoding (simple) or Cloudflare R2?
5. **Clean up slugs** (`/copy-of-magazine` → `/zine/vol-1`) with redirects, or keep them exactly?
6. **Pages to drop:** `/blank` ("New Page"), `/copy-of-notice` ("under maintenance"), `/可以`, `/hmm`,
   `/shuffle` look like leftovers — keep, drop, or redirect?
7. **Domain:** keep registered at Wix (just change DNS) or transfer to Cloudflare/Porkbun later?
8. **Form delivery:** Resend via a serverless function (code, fully yours) or a no-code service?

---

## 11. What happens next

When you say go, Phase 1 starts with the things that need no decisions: I run the media export
through the Wix connection, download the ZIP to `~/Desktop/yezhang-site-archive/`, verify counts and
checksums, run the page crawl (screenshots + rendered DOM + asset map), and pull the form
submissions. That gives you a complete, verified copy of everything on Wix in a couple of hours —
useful even if you never finish the rebuild.

Files in this folder:

```
migration/
├── MIGRATION_PLAN.md                this document
├── inventory/
│   ├── summary.json                 the numbers above, machine-readable
│   ├── pages.csv                    47 pages: slug, title, meta, media count, features, text, links
│   ├── media-manager.csv            439 files: Wix id, name, bytes, type, width, height, folder
│   ├── page-media-urls.txt          276 image URLs referenced by the served HTML
│   └── html-snapshot/               the 47 pages as served by Wix on 2026-10-07 (23 MB)
└── scripts/                         (created in Phase 1) download_media.py, crawl_pages.mjs, …
```
