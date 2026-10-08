# How to Rebuild Everything

A collection of line figures: things taken apart, that you put back together with the pointer
and turn in your hand.

**Status: first sketch.** One figure, to try the idea. It is not on the live site; nothing in this
folder is deployed. Open `index.html` in a browser (double-click it) to use it.

## What it does now

- **Move across** a figure and it rebuilds, one part at a time, in the order you would build it.
  Move away and it comes apart again.
- **Drag** to turn it: all the way round, over the top, and underneath. Let go while moving and it
  coasts. Double-click, or the `home` button, returns the view.
- On a phone: tap to the right to build, to the left to take apart; swipe sideways to turn.
  Up-and-down swipes still scroll the page.
- With the figure focused, the arrow keys turn it and Home returns the view.

Under the figure: `spread` (how far apart the parts hang), `line` (stroke weight) and four example
styles.

## Decided, and not yet

Decided (from the brief on 2026-10-08):

- In the spirit of [Hairline](../reference/hairline/README.md): clean line drawing, one stroke,
  answers the pointer.
- Full 3D, and you can drag it around.

Still open:

- **The style.** The sketch uses Hairline's own look so there is something to react to. A style is
  only the block of colour values at the top of `index.html` plus the line weight; `blueprint` and
  `signal` (the orange from the site intro) are there as examples, not proposals.
- **What gets rebuilt.** The camera is a stand-in. The list of subjects is not chosen.
- **The gesture.** "Move across to rebuild" is one option. Another is to light up the part under
  the pointer and name it.
- **Where it lives on the site**, and whether figures sit on one page or each get their own.

## Files

| Path | What it is |
|---|---|
| `index.html` | The page: the styles, the controls, and the card each figure is shown in. |
| `figures/camera.js` | Figure 01. A list of parts, where each hangs when apart, and the build order. |
| `engine/orbit.js` | The 3D: the turning camera, solids along any axis, marks on faces, the paint order, drag. |
| `engine/kernel.js` | Hairline's engine, unchanged. MIT, © 2026 Lucas Marques: see `engine/LICENSE-hairline`. |

## Adding a figure

Copy `figures/camera.js`, change the parts, and add a `<script src="figures/name.js">` line at the
bottom of `index.html`. A part is one line:

```js
[box("base", [-36, -12, -25, 36, 12, -20], { r: 10 }), [0, 0, -18]],
//   name     x0   y0   z0   x1  y1   z1    corner       where it hangs when apart
[cyl("barrel", "y", 6, -1, 13.5, 16, 30), [0, 22, 0]],
//   name     axis  centre  radius from-to
```

`x` and `y` are the ground, `z` is up. The top of `engine/orbit.js` lists everything a figure
can call.

## How the 3D works, and its limits

Hairline draws from one fixed camera and paints shapes back to front. Here the camera moves, so
the order is worked out again on every frame: for any two parts, a flat plane between them says
which one is behind. That gives real 3D without a 3D library, and it keeps Hairline's look,
because nothing about how a solid is drawn has changed.

The limits that follow from it:

- Parts are rounded blocks and cylinders lined up with the three axes. No tilted parts yet, and
  no curved or hollow ones (a cup, a spring).
- Two parts must never overlap: there has to be a flat gap, or a flat touching face, between
  them. The camera's eleven parts were checked from 7,560 angles in nine build states.
- No perspective. Things do not get smaller with distance, which is what keeps it reading as a
  drawing.

## Putting it on the site later

The folder is plain HTML with no build step, like the mini-apps in `public/features/`. Moving it
into `public/` would publish it at `/how-to-rebuild-everything/` on the next push.
