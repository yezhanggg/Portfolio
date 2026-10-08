# Moving off Wix — what was done and how to repeat it

`MIGRATION_PLAN.md` is the original plan. This file records what was actually run.
All scripts are run from the repository root. Large outputs go to
`~/Desktop/yezhang-site-archive` (not committed).

| Step | Script | Output |
|---|---|---|
| 1. Download every original image | `python3 migration/scripts/download_media.py migration/inventory/media-manager.csv ~/Desktop/yezhang-site-archive/wix-media` (and the same with `zhaeng-media-manager.csv` → `zhaeng-media`) | originals, byte-checked against the manifest. Videos and the PDF came as ZIPs from the Wix Media Manager API. |
| 2. Archive the rendered pages | `node migration/scripts/crawl_pages.mjs` | `inventory/screenshots`, `rendered`, `tree`, `page-assets.json` in the archive: all 57 pages at desktop and phone widths |
| 3. Extract page content | `node migration/scripts/extract_pages.mjs` | `src/data/pages/*.json` |
| 4. Make web-sized media | `node migration/scripts/optimize_media.mjs` | `public/media`, `public/video`, `src/data/media.json`, `inventory/rename-map.csv` |
| 5. Compare with the originals | `pnpm build && pnpm preview`, then `node migration/scripts/compare.mjs` | side-by-side images in the archive under `inventory/compare` |

Notes:

- 16 images were uploaded to Wix as HEIC; Wix only keeps a PNG conversion, so their sizes differ
  from the manifest (`wix-media/size-differs.csv`).
- `inventory/rename-map.csv` maps each Wix media ID to its original file and its name on this site.
- Steps 2, 3 and 5 need the Wix sites to still be published.
- `migration/scripts/data_census.py` prints which fonts, media, videos, embeds and form fields the
  extracted pages use.
