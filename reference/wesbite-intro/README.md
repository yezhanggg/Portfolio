# Wesbite intro + animations (saved for later)

A copy of the source from `~/Documents/wesbite-next/wesbite`, saved on 2026-10-07 because the
intro and animations might be reused on yezhang.net. Nothing here is built or deployed with the
site — it is reference material only. The original folder was left untouched.

## What's worth reusing

| File | What it does |
|---|---|
| `src/components/ui/intro-animation.tsx` | Full-screen intro: the words **WE / EXPERIENCE / SPACE** fly up one at a time in huge orange Impact type over a black screen with a moving dithered shader, then the whole overlay fades out and calls `onComplete`. Timings are the constants at the top (`ENTER_MS`, `HOLD_MS`, `EXIT_MS`, `FADE_OUT_MS`); the words are the `WORDS` array. |
| `src/components/ui/hero-dithering-card.tsx` | Full-height hero with the same orange dithering shader behind it (speeds up on hover), a pulsing "Spatial Intelligence" pill and scrambling headlines. |
| `src/components/ui/text-scramble.tsx` | Text that scrambles through random characters and resolves left to right — on hover, or automatically after a delay (`autoPlay`, `autoPlayDelay`). |
| `src/app/page.tsx` | How they are wired together: intro first, hero underneath. |
| `src/app/globals.css` | Tailwind v4 theme tokens the components rely on (`--primary` etc.). |
| `legacy-vanilla/` | The earlier plain HTML/CSS/JS version, including a dependency-free scramble effect in `script.js`. |

Accent colour throughout: `#EC4E02`.

Naming notes from the project (`name.rtf`): WES = We Experience Stories / We Explore Smarter /
We Experience Spaces / We Engage Socially → "Wesbite".

## What it needs to run

It is a Next.js 16 + React 19 + Tailwind v4 project (`package.json` is included). The shader comes
from `@paper-design/shaders-react` (`Dithering` component). To run it as-is, copy this folder
somewhere, `npm install`, `npm run dev`.

The yezhang.net site is Astro without React. To use the intro there, either add
`@astrojs/react` and drop the components in as islands, or port the word animation to plain
CSS/JS (it is only transforms and timers) and keep the shader as a small React island.

## Left out of this copy

`node_modules`, `.next`, `.git`, the default Next.js starter SVGs, and one downloaded image
(`_102517783_…jpg.webp`) that isn't used by the code.
