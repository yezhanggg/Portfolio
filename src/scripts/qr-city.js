// The QR city on /professional. The page opens on the code itself, as large as the screen allows.
// Click it and it opens into a city: the streets part, a black-roofed building grows out of every
// dark module, and the camera tilts down to the corner while the whole city glides into its place
// at the left of the page. Click the city (or press Escape) and it folds back into the code. Once
// open, the city turns under a drag like the boxes on /notice (or with the arrow keys), all the way
// round, and settles back to the corner when the pointer leaves it.
//
// Everything is read from the page, which encodes the code at build time (professional.astro):
//   [data-qr-city]: where the city settles (code + quiet zone), with data-size, data-quiet and
//   data-bits (size*size "1"/"0", row-major), holding the SVG plan used without JS;
//   canvas.qr-canvas: one screen of the page, drawn on for both the code and the city.
// data-state on the slot is "qr" (the full-screen code, scannable), "moving" or "city".
const DEG = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => (t >= 1 ? b : a + (b - a) * t); // lands exactly on b
const span = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
const smooth = (e0, e1, x) => {
  const t = span(x, e0, e1);
  return t * t * (3 - 2 * t);
};
const outQuart = (t) => 1 - (1 - t) ** 4;
const outCubic = (t) => 1 - (1 - t) ** 3;
const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const hash = (x, y) => {
  const r = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return r - Math.floor(r);
};
const grey = (L, a = 1) => {
  const v = Math.round(clamp(L) * 255);
  return a < 1 ? `rgba(${v},${v},${v},${a.toFixed(3)})` : `rgb(${v},${v},${v})`;
};

// The model, in modules (1 module = 1 unit).
const FLOOR = 0.42;
const GAP = 0.12; // street between lots, closed at the lock
const PLINTH = 0.12; // light lots are paving slabs, never buildings
const BORDER = 1.5; // the white model base around the code, and its thickness
const SLAB = 0.6;
const DPR_CAP = 3;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const slot = document.querySelector("[data-qr-city]");
if (slot) setup(slot);

function setup(slot) {
  const N = Number(slot.dataset.size);
  const Q = Number(slot.dataset.quiet || 4);
  const G = N + 2 * Q;
  const bits = slot.dataset.bits;
  const canvas = document.querySelector(".qr-canvas");
  const ctx = canvas.getContext("2d");
  const root = document.documentElement;
  const dark = (x, y) => x >= 0 && y >= 0 && x < N && y < N && bits.charCodeAt(y * N + x) === 49;

  // ---- The city: what stands on each module -----------------------------------------------------
  // Finder patterns are three citadels (a 6-floor perimeter block round a courtyard and a 12-floor
  // core), the alignment pattern is a monument (4-floor ring, 18-floor spire with a mast), the
  // timing patterns are row houses, and the data is a city denser and taller towards the middle.
  const FINDERS = [[0, 0], [N - 7, 0], [0, N - 7]];
  const finderOf = (x, y) => FINDERS.findIndex(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const ax = N - 7; // centre of the alignment pattern (versions 2-6 have one)
  const inAlign = (x, y) => N >= 25 && Math.abs(x - ax) <= 2 && Math.abs(y - ax) <= 2;
  const lots = [];
  const at = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const lot = { x, y, dark: dark(x, y), h: 0, g: `${x},${y}`, detail: null };
      const wave = 420 + (640 * (x + y)) / (2 * (N - 1)) + 80 * hash(x, y);
      const f = finderOf(x, y);
      if (!lot.dark) {
        [lot.s0, lot.d0] = [wave - 120, 250]; // the paving goes down just ahead of the buildings
      } else if (f >= 0) {
        const core = x - FINDERS[f][0] >= 2 && x - FINDERS[f][0] <= 4 && y - FINDERS[f][1] >= 2 && y - FINDERS[f][1] <= 4;
        lot.h = (core ? 12 : 6) * FLOOR;
        lot.g = `f${f}${core ? "c" : "r"}`;
        if (core && x - FINDERS[f][0] === 3 && y - FINDERS[f][1] === 3) lot.detail = [0.45, 0.25]; // rooftop plant
        [lot.s0, lot.d0] = [[150, 230, 310][f], 700];
      } else if (inAlign(x, y)) {
        const spire = x === ax && y === ax;
        lot.h = (spire ? 18 : 4) * FLOOR;
        lot.g = spire ? lot.g : "ar";
        if (spire) lot.detail = [0.2, 0.8]; // the mast
        [lot.s0, lot.d0] = [1150, 700];
      } else {
        let floors;
        if (x === 6 || y === 6) floors = 3;
        else {
          const u = (x + 0.5) / N, v = (y + 0.5) / N;
          const D = Math.exp(-((u - 0.46) ** 2 + (v - 0.46) ** 2) / (2 * 0.22 ** 2));
          let k = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && dark(x + dx, y + dy)) k++;
          const s = 0.6 * D + 0.25 * (k / 8) + 0.15 * hash(y, x);
          floors = Math.min(26, 2 + Math.round(28 * s ** 2.2));
          if ((x <= 8 && y <= 8) || (x >= N - 8 && y <= 8) || (x <= 8 && y >= N - 8)) floors = Math.min(floors, 4); // low-rise by the citadels
          if (floors >= 14) lot.detail = [0.45, 0.25];
        }
        lot.h = floors * FLOOR;
        [lot.s0, lot.d0] = [wave, 400 + 50 * lot.h];
      }
      lots.push(lot);
      at[y * N + x] = lot;
    }
  }
  // Lots of one landmark share walls: no street, no outline and no wall between them.
  for (const lot of lots) {
    const same = (dx, dy) => {
      const o = lot.x + dx >= 0 && lot.x + dx < N && lot.y + dy >= 0 && lot.y + dy < N && at[(lot.y + dy) * N + lot.x + dx];
      return !!o && o.dark && lot.dark && o.g === lot.g;
    };
    lot.L = same(-1, 0);
    lot.R = same(1, 0);
    lot.T = same(0, -1);
    lot.B = same(0, 1);
  }
  const buildings = lots.filter((l) => l.dark);
  const groups = [...new Set(buildings.map((l) => l.g))];
  const plinths = lots.filter((l) => !l.dark);
  // Painter's order, fixed for each quarter the camera can be in: on the (xs, ys) side (each +1 or
  // -1) a building can only hide one further from that side, so they are drawn far side first.
  const orders = new Map();
  const orderFor = (xs, ys) => {
    const key = xs * 2 + ys;
    if (!orders.has(key)) orders.set(key, [...buildings].sort((a, b) => xs * a.x + ys * a.y - (xs * b.x + ys * b.y) || ys * (a.y - b.y)));
    return orders.get(key);
  };
  const tallest = Math.max(...buildings.map((l) => l.h + (l.detail ? l.detail[1] : 0)));
  const runs = []; // dark runs per row, for the crisp plan: [y, x0, length]
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; ) {
      if (!dark(x, y)) {
        x++;
        continue;
      }
      let x1 = x;
      while (dark(x1, y)) x1++;
      runs.push([y, x, x1 - x]);
      x = x1;
    }
  }

  // ---- Layout -----------------------------------------------------------------------------------------
  // The canvas is one screen of the page (it scrolls away with it on a phone). Two places matter:
  // the full-screen code (F: a whole number of device px per module, so it is crisp to scan) and
  // where the city settles, over the slot at the left of the page (D, seen from the corner).
  let dpr = 1, W = 0, H = 0;
  let F = { S: 1, cx: 0, cy: 0 }, D = { S: 1, cx: 0, cy: 0 };
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, DPR_CAP);
    const vw = root.clientWidth, vh = innerHeight, wide = vw >= 980;
    // the slot's module (CSS sizes the slot from it)
    const target = wide ? Math.min(420, 0.52 * vh) : Math.min(vw, 560) - 32;
    let md = Math.floor((target * dpr) / G);
    md = wide ? Math.max(md, Math.round(8 * dpr)) : Math.min(md, Math.floor(11 * dpr));
    root.style.setProperty("--m", `${md / dpr}px`);
    Object.assign(canvas.style, { width: `${vw}px`, height: `${vh}px` });
    const w = Math.round(vw * dpr), h = Math.round(vh * dpr);
    if (w !== W || h !== H) [W, H, canvas.width, canvas.height] = [w, h, w, h]; // (this clears it: callers redraw)
    // The code: as big as the screen allows, above the line under it.
    const mf = Math.max(1, Math.floor((Math.min(vw - 48, vh - 120) * dpr) / N));
    F = { S: mf, cx: Math.round(w / 2), cy: Math.round((vh / 2 - 14) * dpr) };
    // The city: centred on the slot, sized so the base seen corner-on spans it.
    const r = slot.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    const across = 2 * (N + 2 * BORDER) * Math.SQRT1_2;
    // (larger than the slot on a wide screen, reaching out into the margin, away from the text)
    const big = wide ? 1.55 : 1.2, out = wide ? ((big - 1) * r.width) / 2 : 0, half = (r.width * big) / 2;
    const mid = Math.max(r.left + r.width / 2 - out, 24 + half); // (never past the window's left edge)
    D = { S: (r.width * dpr * big) / across, cx: (mid - c.left) * dpr, cy: (r.top + r.height / 2 - c.top) * dpr };
  }

  // ---- One frame ---------------------------------------------------------------------------------
  // cam: yaw, elev (degrees; 90 = straight down), S (device px per module), cx, cy (where the middle
  // of the code is, device px), gap, sunEl, sunAz, slab (0..1, the base fading in), build (how far
  // each building has risen), lift (per landmark/building, the one under the pointer).
  let cam = null;
  const lift = new Map();
  let hot = null; // the building under the pointer

  function project(c) {
    const cy = Math.cos(c.yaw * DEG), sy = Math.sin(c.yaw * DEG);
    const se = Math.sin(c.elev * DEG), ce = c.elev >= 90 ? 0 : Math.cos(c.elev * DEG);
    const S = c.S, ox = c.cx, oy = c.cy, h2 = N / 2;
    return {
      cy, sy, se, ce, S,
      x: (x, y) => ox + ((x - h2) * cy - (y - h2) * sy) * S,
      y: (x, y, z) => oy + (((x - h2) * sy + (y - h2) * cy) * se - z * ce) * S,
    };
  }
  const isCode = (c) => c.elev >= 90 && c.yaw === 0 && c.gap <= 0 && c.build === null && c.S === F.S && !hot && ![...lift.values()].some((v) => v > 0.001);

  function draw(c) {
    cam = c;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (isCode(c)) return drawCode();
    const P = project(c);
    const { cy, sy, ce, S } = P;
    // Which x side and which y side of every building face the camera (it can go all the way round).
    const side = sy >= 0 ? 1 : -1, ys = cy >= 0 ? 1 : -1;
    const pad = 0.6 / S; // lots that touch overlap by 0.6 device px, so no seam shows between them
    const gp = c.gap / 2;
    // Every grey reaches nothing at 90 degrees, keyed to the elevation, not to time.
    const edgeA = 0.38 * (1 - smooth(70, 88, c.elev));
    const floorA = 0.12 * (1 - smooth(45, 65, c.elev));
    const shadowA = c.sunEl < 89.9 ? 1 - smooth(70, 86, c.elev) : 0;
    const gridA = 1 - smooth(40, 75, c.elev);
    const slabT = 1 - smooth(80, 90, c.elev);
    // Facades: lit by the sun's side, unlit ones a mid grey; two visible faces are kept apart.
    const sx = Math.cos(c.sunAz * DEG), sy2 = Math.sin(c.sunAz * DEG), k = 0.4 + 0.6 * Math.cos(c.sunEl * DEG);
    let Lf = 0.56 + 0.4 * Math.max(0, ys * sy2) * k, Ls = 0.56 + 0.4 * Math.max(0, side * sx) * k;
    if (Math.abs(Lf - Ls) < 0.1) {
      const mid = (Lf + Ls) / 2, s = Lf >= Ls ? 1 : -1;
      [Lf, Ls] = [mid + 0.05 * s, mid - 0.05 * s];
    }
    const showF = Math.abs(cy) * S >= 0.35, showS = Math.abs(sy) * S >= 0.35;
    const quad = (pts) => {
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.closePath();
    };
    const pt = (x, y, z) => [P.x(x, y), P.y(x, y, z)];

    // The model base: its sides, its top, the faint module grid.
    ctx.globalAlpha = c.slab;
    const x0 = -BORDER, x1 = N + BORDER, yEdge = ys > 0 ? x1 : x0;
    ctx.beginPath();
    quad([...pt(x0, yEdge, 0), ...pt(x1, yEdge, 0), ...pt(x1, yEdge, -SLAB), ...pt(x0, yEdge, -SLAB)]);
    ctx.fillStyle = grey(lerp(1, 0.953, slabT));
    ctx.fill();
    const sxEdge = side > 0 ? x1 : x0;
    ctx.beginPath();
    quad([...pt(sxEdge, x0, 0), ...pt(sxEdge, x1, 0), ...pt(sxEdge, x1, -SLAB), ...pt(sxEdge, x0, -SLAB)]);
    ctx.fillStyle = grey(lerp(1, 0.902, slabT));
    ctx.fill();
    const top = new Path2D();
    top.moveTo(...pt(x0, x0, 0));
    top.lineTo(...pt(x1, x0, 0));
    top.lineTo(...pt(x1, x1, 0));
    top.lineTo(...pt(x0, x1, 0));
    top.closePath();
    ctx.fillStyle = "#fff";
    ctx.fill(top);
    ctx.lineWidth = 1;
    if (edgeA > 0.004) {
      ctx.strokeStyle = `rgba(0,0,0,${(0.55 * edgeA).toFixed(3)})`;
      ctx.stroke(top);
    }
    if (gridA > 0.004) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        ctx.moveTo(...pt(i, 0, 0));
        ctx.lineTo(...pt(i, N, 0));
        ctx.moveTo(...pt(0, i, 0));
        ctx.lineTo(...pt(N, i, 0));
      }
      ctx.strokeStyle = `rgba(0,0,0,${(0.071 * gridA).toFixed(3)})`;
      ctx.stroke();
    }

    // Light lots: low white slabs (their faces only show while the camera is low).
    const pf = new Path2D(), ps = new Path2D(), pt2 = new Path2D(), po = new Path2D();
    for (const l of plinths) {
      const g = c.build ? c.build.plinth(l) : 1;
      if (g <= 0) continue;
      const h = PLINTH * g, lift = S * h * ce;
      const L = l.x + gp, R = l.x + 1 - gp, T = l.y + gp, B = l.y + 1 - gp;
      const [ax, ay] = pt(L, T, h), [bx, by] = pt(R, T, h), [cx, cyy] = pt(R, B, h), [dx, dy] = pt(L, B, h);
      if (lift >= 0.35) {
        if (showF) {
          const [px, py, qx, qy] = ys > 0 ? [dx, dy, cx, cyy] : [ax, ay, bx, by];
          pf.moveTo(px, py); pf.lineTo(qx, qy); pf.lineTo(qx, qy + lift); pf.lineTo(px, py + lift); pf.closePath();
        }
        if (showS) {
          const [ex, ey] = side > 0 ? [bx, by] : [ax, ay], [fx2, fy2] = side > 0 ? [cx, cyy] : [dx, dy];
          ps.moveTo(ex, ey); ps.lineTo(fx2, fy2); ps.lineTo(fx2, fy2 + lift); ps.lineTo(ex, ey + lift); ps.closePath();
        }
      }
      pt2.moveTo(ax, ay); pt2.lineTo(bx, by); pt2.lineTo(cx, cyy); pt2.lineTo(dx, dy); pt2.closePath();
    }
    ctx.fillStyle = "#f7f7f7";
    ctx.fill(pf);
    ctx.fillStyle = "#ebebeb";
    ctx.fill(ps);
    ctx.fillStyle = "#fff";
    ctx.fill(pt2);
    if (edgeA > 0.004) {
      po.addPath(pt2);
      ctx.strokeStyle = `rgba(0,0,0,${(0.35 * edgeA).toFixed(3)})`;
      ctx.stroke(po);
    }
    ctx.globalAlpha = 1;

    // Shadows: one path (overlaps don't darken twice), multiplied onto the base top and its slabs.
    if (shadowA > 0.004) {
      const t = 1 / Math.tan(c.sunEl * DEG), ddx = -Math.cos(c.sunAz * DEG) * t, ddy = -Math.sin(c.sunAz * DEG) * t;
      // The outline of a footprint swept along the shadow: corners lit side first, then shifted ones.
      const N4 = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // outward normals of the edges A-B, B-C, C-D, D-A
      const front = N4.map(([nx, ny]) => nx * ddx + ny * ddy > 0);
      const tpl = [];
      for (let i = 0; i < 4; i++) {
        const fp = front[(i + 3) % 4], fn = front[i];
        if (!fp && !fn) tpl.push([i, 0]);
        else if (fp && fn) tpl.push([i, 1]);
        else if (fn) tpl.push([i, 0], [i, 1]);
        else tpl.push([i, 1], [i, 0]);
      }
      const sh = new Path2D();
      for (const l of buildings) {
        const h = l.h * (c.build ? c.build.grow(l) : 1) + (lift.get(l.g) || 0);
        if (h < 0.02) continue;
        const L = l.x + (l.L ? 0 : gp), R = l.x + 1 - (l.R ? 0 : gp), T = l.y + (l.T ? 0 : gp), B = l.y + 1 - (l.B ? 0 : gp);
        const cs = [[L, T], [R, T], [R, B], [L, B]];
        tpl.forEach(([i, s], j) => {
          const [X, Y] = cs[i], q = pt(X + s * ddx * h, Y + s * ddy * h, 0);
          j ? sh.lineTo(...q) : sh.moveTo(...q);
        });
        sh.closePath();
      }
      ctx.save();
      ctx.clip(top);
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = c.slab;
      ctx.fillStyle = grey(lerp(1, 0.86, shadowA));
      ctx.fill(sh);
      ctx.restore();
    }

    // Buildings, back to front: front face, side face, black roof, then their hairlines. The front
    // face is the y side facing the camera, FL-FR (its x = L and x = R ends); the side face the x side.
    const floorsShow = floorA > 0.004 && (0.84 * S * ce) / dpr >= 4;
    const faceF = grey(Lf), faceS = grey(Ls);
    const box = (L, R, T, B, z0, z1, l, roofA) => {
      const zl = S * (z1 - z0) * ce;
      const A = pt(L, T, z1), Bp = pt(R, T, z1), C = pt(R, B, z1), D = pt(L, B, z1);
      const [FL, FR] = ys > 0 ? [D, C] : [A, Bp];
      const F = showF && zl >= 0.35 && !(l && (ys > 0 ? l.B : l.T));
      const Sd = showS && zl >= 0.35 && !(l && (side > 0 ? l.R : l.L));
      // the visible x face runs e0 (back) to e1 (front)
      const [e0, e1] = side > 0 ? (ys > 0 ? [Bp, C] : [C, Bp]) : ys > 0 ? [A, D] : [D, A];
      if (F) {
        ctx.beginPath();
        quad([FL[0], FL[1], FR[0], FR[1], FR[0], FR[1] + zl, FL[0], FL[1] + zl]);
        ctx.fillStyle = faceF;
        ctx.fill();
      }
      if (Sd) {
        ctx.beginPath();
        quad([e0[0], e0[1], e1[0], e1[1], e1[0], e1[1] + zl, e0[0], e0[1] + zl]);
        ctx.fillStyle = faceS;
        ctx.fill();
      }
      ctx.beginPath();
      quad([...A, ...Bp, ...C, ...D]);
      ctx.fillStyle = roofA < 1 ? `rgba(0,0,0,${roofA.toFixed(3)})` : "#000";
      ctx.fill();
      return { F, Sd, FL, FR, e0, e1, zl };
    };
    const order = orderFor(side, ys);
    for (const l of order) {
      const g = c.build ? c.build.grow(l) : 1;
      if (g <= 0) continue;
      const lf = lift.get(l.g) || 0;
      const h = l.h * g + lf;
      const L = l.x + (l.L ? -pad : gp || -pad), R = l.x + 1 - (l.R ? -pad : gp || -pad);
      const T = l.y + (l.T ? -pad : gp || -pad), B = l.y + 1 - (l.B ? -pad : gp || -pad);
      const f = box(L, R, T, B, 0, h, l, c.build ? c.build.roof(l) : 1);
      const ea = l.g === hot ? Math.max(edgeA, 0.8 * (lf / 0.6)) : edgeA;
      if (ea > 0.004 && (f.F || f.Sd)) {
        // Hairlines on true building edges only: none where a landmark's lots meet.
        ctx.beginPath();
        if (f.F) {
          const [D, C] = [f.FL, f.FR];
          ctx.moveTo(D[0], D[1] + f.zl); ctx.lineTo(C[0], C[1] + f.zl);
          ctx.moveTo(D[0], D[1]); ctx.lineTo(C[0], C[1]);
          if (!l.L && !(side < 0 && f.Sd)) (ctx.moveTo(D[0], D[1]), ctx.lineTo(D[0], D[1] + f.zl));
          if (!l.R && !(side > 0 && f.Sd)) (ctx.moveTo(C[0], C[1]), ctx.lineTo(C[0], C[1] + f.zl));
        }
        if (f.Sd) {
          const [e0, e1] = [f.e0, f.e1];
          ctx.moveTo(e0[0], e0[1] + f.zl); ctx.lineTo(e1[0], e1[1] + f.zl); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e0[0], e0[1]);
          if (!(ys > 0 ? l.T : l.B)) ctx.lineTo(e0[0], e0[1] + f.zl);
        }
        ctx.strokeStyle = `rgba(0,0,0,${ea.toFixed(3)})`;
        ctx.stroke();
      }
      if (floorsShow && (f.F || f.Sd)) {
        ctx.beginPath();
        for (let z = 0.84; z < h - 0.1; z += 0.84) {
          if (f.F) (ctx.moveTo(...pt(L, ys > 0 ? B : T, z)), ctx.lineTo(...pt(R, ys > 0 ? B : T, z)));
          if (f.Sd) {
            const X = side > 0 ? R : L;
            ctx.moveTo(...pt(X, T, z));
            ctx.lineTo(...pt(X, B, z));
          }
        }
        ctx.strokeStyle = `rgba(0,0,0,${floorA.toFixed(3)})`;
        ctx.stroke();
      }
      // A rooftop plant or the mast: black on top, inside its roof, so it vanishes into it in plan.
      if (l.detail && g > 0.98) {
        const [w, dh] = l.detail, cxm = l.x + 0.5, cym = l.y + 0.5;
        box(cxm - w / 2, cxm + w / 2, cym - w / 2, cym + w / 2, h, h + dh, null, 1);
      }
    }
  }

  // The code itself: whole-pixel rectangles, one per run of dark modules. No anti-aliasing, no seams.
  function drawCode() {
    const left = Math.round(F.cx - (N / 2) * F.S), top = Math.round(F.cy - (N / 2) * F.S);
    ctx.fillStyle = "#000";
    for (const [y, x, n] of runs) ctx.fillRect(left + x * F.S, top + y * F.S, n * F.S, F.S);
  }

  // ---- Poses and the two scripts --------------------------------------------------------------------
  const CODE = () => ({ yaw: 0, elev: 90, S: F.S, cx: F.cx, cy: F.cy, gap: 0, sunEl: 90, sunAz: 140, slab: 0, build: null });
  const CITY = () => ({ yaw: 47, elev: 32, S: D.S, cx: D.cx, cy: D.cy, gap: GAP, sunEl: 32, sunAz: 150, slab: 1, build: null });
  // Opening: the streets part, the camera tilts and swings to the corner as the code shrinks into
  // its place, and the buildings grow out of their roofs in a wave, the three citadels first.
  const OPEN_MS = 2500;
  for (const l of buildings) [l.u0, l.u1] = [200 + (l.s0 - 150) * 0.8, l.d0 * 0.9];
  // (never quite 0: a building that has not started yet is still its roof, a module of the code)
  const growth = (t) => ({ grow: (l) => Math.max(1e-3, outQuart(span(t, l.u0, l.u0 + l.u1))), roof: () => 1, plinth: () => 1 });
  function opening(t) {
    const e = inOutCubic(span(t, 120, 2300)), turn = inOutCubic(span(t, 350, 2350));
    const elev = lerp(90, 32, e);
    return {
      yaw: lerp(0, 47, turn),
      elev,
      S: lerp(F.S, D.S, e),
      cx: lerp(F.cx, D.cx, e),
      cy: lerp(F.cy, D.cy, e),
      gap: GAP * outCubic(span(t, 0, 380)),
      sunEl: elev,
      sunAz: lerp(140, 150, e),
      slab: smooth(200, 900, t),
      build: t < OPEN_MS ? growth(t) : null,
    };
  }
  const SCRIPTS = {
    open: { end: OPEN_MS, at: opening, to: "city" },
    // Folding back is the opening played backwards: the city sinks into its roofs, the code returns.
    fold: { end: OPEN_MS, at: (t) => (t >= OPEN_MS ? CODE() : opening(OPEN_MS - t)), to: "qr" },
  };
  // ---- Turning: the drag of the boxes on /notice (cubes.js) ------------------------------------------
  // Half a degree per pixel, the near side of the city following the pointer, and the same spring
  // (stiffness 100, damping 30) between where the camera is and where it is heading. It turns all the
  // way round; the tilt stops at straight down and gives a little, then springs back, near the ground.
  // When the pointer leaves the city it turns back to the corner the shorter way.
  const REST = { yaw: 47, elev: 32 }, LOW = 14;
  const nearest = (to, from, step = 360) => to + step * Math.round((from - to) / step);
  const give = (v) => (v >= 90 ? 90 : v >= LOW ? v : LOW - 10 * (1 - Math.exp(-(LOW - v) / 20)));
  const pose = (yaw, elev) => ({ ...CITY(), yaw, elev: Math.min(90, elev), sunEl: Math.max(20, elev) });
  // Folding back from a turned city: first round to the corner, then the fold.
  const settle = (from) => {
    const to = nearest(REST.yaw, from.yaw);
    return { end: 450, to: "city", then: SCRIPTS.fold, at: (t) => {
      const e = inOutCubic(span(t, 0, 450));
      return pose(lerp(from.yaw, to, e), lerp(from.elev, REST.elev, e));
    } };
  };

  // ---- The loop -------------------------------------------------------------------------------------
  let mode = "qr"; // "qr" (the full-screen code), "moving", "city"
  let script = null, clock = 0; // a running script and how far it has played (ms)
  let turn = null; // turning: the camera's yaw/elev (x, y), their speeds and where they head (tx, ty)
  let drag = null;
  let raf = 0, last = 0, idle = 0, leaving = 0;
  const atRest = () => !turn || (turn.tx === nearest(REST.yaw, turn.tx) && turn.ty === REST.elev && turn.x === turn.tx && turn.y === turn.ty);
  function tick(now) {
    raf = 0;
    const dt = Math.min(50, last ? now - last : 16); // a hidden tab pauses rather than skips
    last = now;
    let moving = false;
    if (script) {
      clock += dt;
      draw(script.at(Math.min(clock, script.end)));
      if (clock >= script.end) {
        mode = script.to;
        script = script.then || null;
        clock = 0;
        if (script) mode = "moving";
        else if (mode === "qr") draw(CODE());
      }
      moving = !!script;
    } else if (turn) {
      const T = turn;
      for (let left = dt / 1000; left > 1e-5; left -= 1 / 240) {
        const h = Math.min(left, 1 / 240); // small steps keep the spring steady
        T.vx += (100 * (T.tx - T.x) - 30 * T.vx) * h;
        T.vy += (100 * (T.ty - T.y) - 30 * T.vy) * h;
        T.x += T.vx * h;
        T.y += T.vy * h;
      }
      const still = !drag && Math.abs(T.tx - T.x) + Math.abs(T.ty - T.y) < 0.02 && Math.abs(T.vx) + Math.abs(T.vy) < 0.05;
      if (still) [T.x, T.y, T.vx, T.vy] = [T.tx, T.ty, 0, 0];
      if (still && atRest()) (turn = null), draw(CITY()); // home: the corner view, whole turns forgotten
      else draw(pose(T.x, T.y));
      moving = !still;
    }
    // The building under the pointer rises a little (only in the city).
    let lifting = false;
    for (const g of groups) {
      const target = g === hot ? 0.6 : 0, v = lift.get(g) || 0;
      if (Math.abs(target - v) < 0.002) {
        if (v) target ? lift.set(g, target) : lift.delete(g);
        continue;
      }
      lift.set(g, v + (target - v) * (1 - Math.exp((-dt / 1000) * 12)));
      lifting = true;
    }
    if (lifting && !moving) draw(cam);
    slot.dataset.state = mode;
    if (moving || lifting) raf = requestAnimationFrame(tick);
    else last = 0;
  }
  const play = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const run = (s) => {
    script = s;
    clock = 0;
    turn = null;
    hot = null;
    mode = "moving";
    clearTimeout(idle);
    clearTimeout(leaving);
    root.classList.remove("qr-grab");
    play();
  };
  // Open the code into the city, or fold the city back into the code.
  function toggle() {
    if (script) return;
    const opening = mode === "qr";
    // the page's text arrives with the city (CSS times it) and leaves at once with it
    root.classList.toggle("qr-full", !opening);
    if (opening) layout(); // where the slot is, now the page is laid out for it
    if (reduceMotion) {
      mode = opening ? "city" : "qr";
      turn = null;
      draw(opening ? CITY() : CODE());
      slot.dataset.state = mode;
      return;
    }
    run(opening ? SCRIPTS.open : atRest() ? SCRIPTS.fold : settle(cam));
  }
  const turnTo = (yaw, elev) => {
    if (!turn) turn = { x: cam.yaw, y: cam.elev, vx: 0, vy: 0, tx: cam.yaw, ty: cam.elev };
    [turn.tx, turn.ty] = [yaw, elev];
    if (reduceMotion) [turn.x, turn.y] = [yaw, elev];
    play();
  };
  const home = () => turn && turnTo(nearest(REST.yaw, turn.x), REST.elev);
  // On a touch screen there is no leaving: left alone, the city comes back to the corner by itself.
  const idleBack = () => {
    clearTimeout(idle);
    idle = setTimeout(() => mode === "city" && !drag && home(), 2400);
  };

  // ---- Input --------------------------------------------------------------------------------------
  canvas.addEventListener("click", () => mode === "qr" && toggle());
  // Where the city is on screen: its base and the height of its tallest tower, seen from the camera.
  const overCity = (e) => {
    const r = canvas.getBoundingClientRect(), P = project(cam), pts = [];
    for (const [x, y] of [[-BORDER, -BORDER], [N + BORDER, -BORDER], [N + BORDER, N + BORDER], [-BORDER, N + BORDER]]) {
      pts.push([P.x(x, y), P.y(x, y, -SLAB)], [P.x(x, y), P.y(x, y, tallest)]);
    }
    return inHull(pts, (e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr);
  };
  const busy = (e) => e.target.closest?.("a, button, input, textarea, select, label");
  // A mouse takes the city anywhere it is drawn; a finger on the slot (sideways only: up and down
  // still scrolls the page).
  addEventListener("pointerdown", (e) => {
    if (e.button || mode !== "city" || script || busy(e)) return;
    const mouse = e.pointerType === "mouse";
    if (mouse ? !overCity(e) : e.target.closest?.("[data-qr-city]") !== slot) return;
    if (mouse) e.preventDefault(); // no text selection while turning
    const from = turn ? [turn.tx, Math.max(LOW, turn.ty)] : [cam.yaw, cam.elev];
    drag = { id: e.pointerId, px: e.clientX, py: e.clientY, yaw: from[0], elev: from[1], moved: false, touch: !mouse };
    clearTimeout(idle);
    clearTimeout(leaving);
  });
  addEventListener("pointermove", (e) => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.px, dy = e.clientY - drag.py;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        root.classList.add("qr-turning");
        slot.classList.add("dragging");
        if (hot !== null) hot = null;
      }
      turnTo(drag.yaw - dx / 2, drag.touch ? drag.elev : give(drag.elev + dy / 2));
      return;
    }
    if (e.pointerType !== "mouse" || mode !== "city" || script) return;
    const over = !busy(e) && overCity(e);
    root.classList.toggle("qr-grab", over);
    if (over) {
      clearTimeout(leaving);
      hover(e);
    } else {
      if (hot !== null) (hot = null), play();
      if (turn && !leaving) leaving = setTimeout(() => ((leaving = 0), home()), 140);
    }
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { moved, touch } = drag;
    drag = null;
    root.classList.remove("qr-turning");
    slot.classList.remove("dragging");
    if (!moved) return toggle(); // a plain click on the city folds it back
    if (turn && turn.ty < LOW) turnTo(turn.tx, LOW); // back up off the ground
    if (touch) idleBack();
    else if (!overCity(e)) home();
    play();
  };
  addEventListener("pointerup", release);
  addEventListener("pointercancel", (e) => {
    if (drag && e.pointerId === drag.id) (drag = null), root.classList.remove("qr-turning"), slot.classList.remove("dragging"), idleBack();
  });
  // The pointer left the window.
  document.addEventListener("pointerout", (e) => {
    if (e.relatedTarget || drag || mode !== "city") return;
    root.classList.remove("qr-grab");
    if (hot !== null) (hot = null), play();
    home();
  });
  slot.addEventListener("keydown", (e) => {
    const by = { ArrowLeft: [15, 0], ArrowRight: [-15, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[e.key];
    if (by && mode === "city" && !script) {
      e.preventDefault();
      const from = turn ? [turn.tx, turn.ty] : [cam.yaw, cam.elev];
      turnTo(from[0] + by[0], Math.min(90, Math.max(LOW, from[1] + by[1])));
      idleBack();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mode === "city") toggle();
    else if ((e.key === "Enter" || e.key === " ") && mode === "qr" && document.activeElement === document.body) (e.preventDefault(), toggle());
  });
  // The building under a resting mouse rises; never in the code, so it holds still to be scanned.
  function hover(e) {
    let found = null;
    if (cam.elev < 80) {
      const r = canvas.getBoundingClientRect();
      const px = (e.clientX - r.left) * dpr, py = (e.clientY - r.top) * dpr;
      const P = project(cam);
      const order = orderFor(Math.sin(cam.yaw * DEG) >= 0 ? 1 : -1, Math.cos(cam.yaw * DEG) >= 0 ? 1 : -1);
      for (let i = order.length - 1; i >= 0 && !found; i--) {
        const l = order[i], h = l.h + (lift.get(l.g) || 0);
        const pts = [];
        for (const [x, y] of [[l.x, l.y], [l.x + 1, l.y], [l.x + 1, l.y + 1], [l.x, l.y + 1]]) pts.push([P.x(x, y), P.y(x, y, 0)], [P.x(x, y), P.y(x, y, h)]);
        if (inHull(pts, px, py)) found = l.g;
      }
    }
    if (found !== hot) {
      hot = found;
      play();
    }
  }

  // ---- Start --------------------------------------------------------------------------------------
  layout();
  // (resizing the canvas clears it, so every layout is followed by a frame)
  new ResizeObserver(() => {
    layout();
    if (script || turn) return play();
    draw(mode === "qr" ? CODE() : CITY());
  }).observe(document.body);
  slot.toggleAttribute("data-live", true);
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "QR code: email yezhang1@upenn.edu. Click to open it into a city.");
  canvas.removeAttribute("aria-hidden");
  slot.querySelector("svg")?.setAttribute("aria-hidden", "true");
  draw(CODE());
}

// Whether (px, py) is inside the convex hull of these points (a building seen from any side).
function inHull(pts, px, py) {
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const lo = [], hi = [];
  for (const p of pts) {
    while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (hi.length > 1 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
    hi.push(p);
  }
  const hull = lo.slice(0, -1).concat(hi.slice(0, -1));
  for (let i = 0; i < hull.length; i++) {
    const p = hull[i], q = hull[(i + 1) % hull.length];
    if (cross(p, q, [px, py]) < 0) return false;
  }
  return hull.length > 2;
}
