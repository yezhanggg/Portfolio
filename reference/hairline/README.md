# Hairline (reference)

The isometric line figures saved from 21st.dev on 2026-10-08, kept here as a style and
engineering reference for the [How to Rebuild Everything](../../how-to-rebuild-everything/README.md)
collection.

- **Author:** Lucas Marques. **Licence:** MIT (see `LICENSE`; keep that notice with any copy).
- **Source:** <https://github.com/lucasmarkes/hairline>, commit `a221785`, package
  `@lucasmarkes/hairline` 0.5.0. Live: <https://hairline.lucasmarkes.com>.
- Nothing here is part of the site build. It is not deployed.

## See them

Open `preview/index.html` in a browser (double-click it). The fourteen saved figures run first,
then the other nineteen from the same set. It works offline.

## The fourteen that were saved

| Bookmark on 21st.dev | Figure | Source |
|---|---|---|
| Hairline Phone | `phone` | `src/figures/phone.ts` |
| Hairline Terminal | `terminal` | `src/figures/terminal.ts` |
| Hairline Router | `router` | `src/figures/router.ts` |
| Hairline Plot | `plot` | `src/figures/plot.ts` |
| Isometric Elevator | `elevator` | `src/figures/elevator.ts` |
| Hairline Query | `query` | `src/figures/query.ts` |
| Vault | `vault` | `src/figures/vault.ts` |
| Padlock | `padlock` | `src/figures/padlock.ts` |
| Hairline Lockers | `lockers` | `src/figures/lockers.ts` |
| Hairline Turntable | `turntable` | `src/figures/turntable.ts`, `turntable-geometry.ts` |
| Hairline Slow | `slow` | `src/figures/slow.ts` |
| Hairline Rail | `rail` | `src/figures/rail.ts` |
| Hairline Riffle | `riffle` | `src/figures/riffle.ts`, `riffle-geometry.ts` |
| Hairline Sieve | `sieve` | `src/figures/sieve.ts` |

The 21st.dev copies are thin React wrappers around these same files. The whole package is kept
rather than fourteen files cut out of it, because every figure shares one engine.

## What is in this folder

| Path | What it is |
|---|---|
| `src/core/` | The engine: `iso.ts` (projection and rounded solids), `motion.ts` (springs and tweens), `stage.ts` (svg, the one frame loop, the pointer), `styles.ts` (the palette). About 750 lines, no dependencies. |
| `src/figures/` | One file per figure, all 33. |
| `src/index.ts`, `src/react.tsx` | The plain-DOM functions and the React components. |
| `src/mount.ts`, `src/slab.ts`, `src/intensity.ts` | Shared by the figures: the wrapper that mounts one, thin upright slabs (Phone, Terminal, Elevator and others), and what `intensity` means for each. |
| `skill/` | The author's kit for drawing a new figure: `rules.md` (the ten rules), `concepts.md`, `look.md` (how to check one), `kernel.js` (the engine as a single script) and two worked examples. |
| `preview/` | The local page. `hairline.js` is `src/` bundled into one script. |
| `UPSTREAM-README.md` | The package's own README. |

## Why it looks the way it does

Worth reading before drawing anything new: `skill/rules.md`. The short version:

- Every solid is two lines: a silhouette, and one dim crease just inside it. Corners are always
  rounded and vertical edges are never drawn.
- Five greys and one stroke width. The only highlight is one stroke going bright.
- Shapes are filled with the background colour and painted back to front, so nearer things cover
  farther ones. There is no perspective.
- At rest the figure is already a composition. The pointer moves it on springs and it returns.

## Using a figure on the site

The site is Astro without React, so use the plain-DOM functions:

```sh
pnpm add @lucasmarkes/hairline
```

```astro
<div id="figure" style="max-width: 420px"></div>
<script>
  import { terminal } from "@lucasmarkes/hairline";
  terminal(document.getElementById("figure"), { play: true });
</script>
```

Colours come from six CSS variables (`--hairline-plate`, `-hi`, `-edge`, `-mid`, `-lo`,
`-stroke`); set `--hairline-plate` to the page background.

## Rebuilding the preview bundle

Only needed if `src/` changes:

```sh
npx esbuild@0.28.2 reference/hairline/preview/entry.ts --bundle --format=iife \
  --global-name=Hairline --target=es2020 --minify \
  --outfile=reference/hairline/preview/hairline.js
```
