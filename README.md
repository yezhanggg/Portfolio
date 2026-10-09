# yezhang.net

Ye Zhang's personal site, self-hosted. It was rebuilt from two Wix sites (yezhang.net and ZHAENG)
so that everything — pages, images, videos, forms — lives in this repository and deploys from it.

- **Live site:** Vercel builds and deploys every push to `main`.
- **Pages:** 47 from yezhang.net (same URLs as before) and 10 from ZHAENG under `/zhaeng/`.
- **Mini-apps:** the five browser features (camera, fortune cookie, poster designer, image
  scrambler, chatbot) are unchanged under `/features/`.

## Run it locally

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # static site in dist/
```

Node 22 and pnpm are required.

## How it is put together

| Path | What it is |
|---|---|
| `src/data/pages/*.json` | One file per page: every text, image, button and video with its position, for desktop (980px canvas) and phone (320px canvas). This is the content. |
| `src/pages/[...path].astro` | Turns each data file into a page. |
| `src/components/Node.astro` | Draws one item (text, image, gallery, slideshow, video, form field…). |
| `src/lib/fixups.js` | Hand-made changes on top of the extracted data (e.g. the ZHAENG, Features and BLUEPRINT entries on `/portfolio`). |
| `src/data/motion.json`, `src/data/hover.json` | Motion measured on the original site: animations, drifting galleries, hover styles, pictures that follow the pointer. |
| `src/data/meta.json` | Page descriptions for search engines — edit freely. |
| `src/styles/fonts.css` | Which open-licensed font stands in for each font Wix used. |
| `public/media`, `public/video` | Web-sized images and videos. |
| `public/features/` | The mini-apps, plain HTML. |
| `public/how-to-rebuild-everything/` | The blueprint figures you can take apart and turn (BLUEPRINT on `/portfolio`), plain HTML. See its README. |
| `api/chat.js`, `api/_prompt.js` | Chat bubble backend (DeepSeek). Edit `_prompt.js` to change what it knows. |
| `api/contact.js` | Receives the contact and zine-request forms and emails them via Resend. |
| `migration/` | Scripts and inventories used to move off Wix. See `migration/README.md`. |

### Editing a page

Small text or link changes: edit the page's file in `src/data/pages/`. Each item has a `box`
(`[x, y, width, height]` in canvas pixels) and its content. Desktop and phone layouts are separate
entries (`views.desktop`, `views.mobile`) in the same file.

### The 3D boxes

The two mode buttons on `/notice` and the explore menu on `/copy-of-notice` are boxes you can turn.
They are built in `src/lib/fixups.js` (`modeBoxes`, `exploreBox`): which button sits on which side,
the sizes and the resting angles are set there. `Node.astro` draws a box (`cube`),
`src/scripts/interactions.js` turns it, and the look (line weight, word size) is in
`src/styles/site.css` under "3D boxes".

## Environment variables (set in Vercel → Project → Settings → Environment Variables)

| Name | Used by | Notes |
|---|---|---|
| `DEEPSEEK_API_KEY` | chat bubble | without it the bubble replies "not set up yet" |
| `RESEND_API_KEY` | forms | without it the forms reply "not set up yet" |
| `CONTACT_TO` | forms | the address that receives submissions |
| `CONTACT_FROM` | forms | optional; a sender on a domain verified in Resend |
| `EXTRA_ORIGINS` | both | optional; extra allowed origins, comma-separated |

## Originals

Full-resolution originals from Wix (467 files, about 1.4 GB), page screenshots and form exports are
kept outside this repository in `~/Desktop/yezhang-site-archive`. Keep a second copy somewhere safe.
