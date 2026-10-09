/*
 * ORBIT: full 3D for Hairline figures. Part of "How to Rebuild Everything".
 *
 * The Hairline kernel (kernel.js, HL) draws rounded solids from one fixed
 * camera. This file adds what a figure needs to be turned in the hand:
 *
 *   a camera that goes all the way round, over and under (azimuth, elevation);
 *   solids that stand along any axis, with marks that live on their faces;
 *   a paint order worked out again on every frame;
 *   drag to orbit, with a coast on release. Double-click goes home.
 *
 * The drawing rules are the kernel's: no perspective and no hidden-line
 * removal. Plates are filled with the ground colour and painted back to
 * front, so a nearer one covers. The kernel is not edited; this builds on it.
 *
 * World space is the kernel's: x and y on the ground, z up, in viewBox units
 * before the scale. The camera at az 45, el 30 is the kernel's 2:1 view.
 *
 * Solids
 *   box(id, [x0, y0, z0, x1, y1, z1], opts)    a rounded block; opts {axis, r, b, n, marks}: r the corner radius,
 *                                              b the crease's inset (0 for none), n the steps round a corner
 *                                              axis is the one it is extruded along ("z" by default): the two
 *                                              faces across that axis are flat, the edges around it are rounded by r
 *   cyl(id, axis, cu, cv, R, w0, w1, opts)     a cylinder along an axis, centred on (cu, cv) in the plane across it
 *                                              opts {b, n, marks}; b is the crease's inset, 0 for none
 *   The plane across an axis:  z: (u, v) = (x, y)    x: (u, v) = (y, z)    y: (u, v) = (x, z)
 *   A solid's `at` is [dx, dy, dz], where it stands now; a figure moves a part by writing it.
 * Marks: lines that lie on one flat face and are drawn only while it faces the camera
 *   mark(face, cls, shapes)                    face is "+x" "-x" "+y" "-y" "+z" "-z"; cls is the kernel's classes
 *   ringOn(axis, cu, cv, w, R, n)              a circle on the plane across axis, at height w along it
 *   rectOn(axis, u0, v0, u1, v1, w, r)         a rounded rectangle on that plane
 *   lineOn(axis, u0, v0, u1, v1, w)            one segment on that plane
 * The scene
 *   mount({ stage, svg }, spec)                spec {view: {az, el, S, cx, cy, pivot, elRange}, solids,
 *                                                    tick(dt, now), hover(point, event), leave(), after(scene)}
 *                                              tick moves the parts and returns whether they are still moving;
 *                                              hover and leave are the pointer when it is not dragging;
 *                                              after runs once a frame is drawn, for the read-out.
 *                                              Returns {view, solids, light(id), dragging(), turning(), home(), wake(), destroy()}
 */
var ORBIT = (() => {
  "use strict";
  const { clamp, rad, r2, hull, rrect, circ, run, mk, spring, stepS, reducedMotion, register, disposer } = HL;

  /* an axis is the direction a solid is extruded along; its ring lies in the other two */
  const AX = {
    z: { i: 2, to: (u, v, w) => [u, v, w] },
    x: { i: 0, to: (u, v, w) => [w, u, v] },
    y: { i: 1, to: (u, v, w) => [u, w, v] },
  };
  const FACE = { "+x": [1, 0, 0], "-x": [-1, 0, 0], "+y": [0, 1, 0], "-y": [0, -1, 0], "+z": [0, 0, 1], "-z": [0, 0, -1] };
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const path = (pts, closed) => (pts.length < 2 ? "" : "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join("L") + (closed ? "Z" : ""));

  /* ---------- the camera ---------- */

  /**
   * The projector for the view as it is now, and `v`, the unit vector that
   * points at the camera. Depth along `v` is what "in front" means; the
   * elevation may be negative, which looks up at the figure from below.
   */
  function frame(V) {
    const a = rad(V.az), e = rad(V.el), c = Math.cos(a), s = Math.sin(a), k = Math.sin(e), zf = Math.cos(e);
    const [px, py, pz] = V.pivot;
    return {
      v: [s * zf, c * zf, k],
      P: (x, y, z) => {
        x -= px; y -= py; z -= pz;
        return [V.cx + V.S * (x * c - y * s), V.cy + V.S * ((x * s + y * c) * k - z * zf)];
      },
    };
  }

  /* ---------- solids ---------- */

  function solid(id, axis, ring, inner, w0, w1, marks) {
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const q of ring) { u0 = Math.min(u0, q.u); u1 = Math.max(u1, q.u); v0 = Math.min(v0, q.v); v1 = Math.max(v1, q.v); }
    const to = AX[axis].to;
    return { id, axis, ring, inner, w0, w1, bounds: to(u0, v0, w0).concat(to(u1, v1, w1)), marks: marks || [], at: [0, 0, 0] };
  }

  function box(id, b, o = {}) {
    /* the kernel's four steps round a corner show as facets once the corner is large, so a larger one gets more */
    const axis = o.axis || "z", r = o.r ?? 3, bev = o.b ?? 1.2, n = o.n ?? Math.max(4, Math.round(r));
    const [u0, v0, u1, v1, w0, w1] =
      axis === "z" ? [b[0], b[1], b[3], b[4], b[2], b[5]]
      : axis === "x" ? [b[1], b[2], b[4], b[5], b[0], b[3]]
      : [b[0], b[2], b[3], b[5], b[1], b[4]];
    const inner = bev ? rrect(u0 + bev, v0 + bev, u1 - bev, v1 - bev, Math.max(0.3, r - bev), n) : null;
    return solid(id, axis, rrect(u0, v0, u1, v1, r, n), inner, w0, w1, o.marks);
  }

  function cyl(id, axis, cu, cv, R, w0, w1, o = {}) {
    const bev = o.b ?? 1.2, n = o.n ?? 64;
    const round = (rr) => circ(rr, n).map((q) => ({ u: q.u + cu, v: q.v + cv, nu: q.nu, nv: q.nv }));
    return solid(id, axis, round(R), bev ? round(R - bev) : null, w0, w1, o.marks);
  }

  /* ---------- marks ---------- */

  const mark = (face, cls, shapes) => ({ n: FACE[face], cls, shapes });
  const ringOn = (axis, cu, cv, w, R, n = 40) => ({
    closed: true,
    pts: Array.from({ length: n }, (_, k) => { const a = (k / n) * Math.PI * 2; return AX[axis].to(cu + R * Math.cos(a), cv + R * Math.sin(a), w); }),
  });
  const rectOn = (axis, u0, v0, u1, v1, w, r = 1.5) => ({ closed: true, pts: rrect(u0, v0, u1, v1, r, 3).map((q) => AX[axis].to(q.u, q.v, w)) });
  const lineOn = (axis, u0, v0, u1, v1, w) => ({ closed: false, pts: [AX[axis].to(u0, v0, w), AX[axis].to(u1, v1, w)] });

  /* ---------- drawing one solid ---------- */

  /** The silhouette: the hull of the two end rings, whichever way the solid is turned. */
  function outline(s, F) {
    const to = AX[s.axis].to, at = s.at, pts = [];
    for (const w of [s.w0, s.w1]) for (const q of s.ring) {
      const p = to(q.u, q.v, w);
      pts.push(F.P(p[0] + at[0], p[1] + at[1], p[2] + at[2]));
    }
    return path(hull(pts), true);
  }

  /**
   * The crease: the inset ring on the end that faces the camera. Seen from
   * the side only its near run is drawn, as the kernel does; as the end turns
   * to face the camera the run grows until the whole ring shows.
   */
  function crease(s, F) {
    if (!s.inner) return "";
    const to = AX[s.axis].to, at = s.at, v = F.v, vw = v[AX[s.axis].i];
    const w = vw >= 0 ? s.w1 : s.w0, m = Math.sqrt(Math.max(0, 1 - vw * vw)), g = smooth(0.6, 0.96, Math.abs(vw));
    const keep = (q) => {
      if (m < 1e-6) return true;
      const n = to(q.nu, q.nv, 0);
      return (n[0] * v[0] + n[1] * v[1] + n[2] * v[2]) / m >= -g - 1e-6;
    };
    const kept = run(s.inner, keep);
    const pts = kept.map((q) => { const p = to(q.u, q.v, w); return F.P(p[0] + at[0], p[1] + at[1], p[2] + at[2]); });
    return path(pts, kept.length === s.inner.length);
  }

  /** The marks on faces that look at the camera, as one path string per class. */
  function marks(s, F) {
    const out = {}, at = s.at, v = F.v;
    for (const m of s.marks) {
      if (m.n[0] * v[0] + m.n[1] * v[1] + m.n[2] * v[2] < 0.03) continue;
      let d = out[m.cls] || "";
      for (const sh of m.shapes) d += path(sh.pts.map((p) => F.P(p[0] + at[0], p[1] + at[1], p[2] + at[2])), sh.closed);
      out[m.cls] = d;
    }
    return out;
  }

  /* ---------- the paint order ---------- */

  /**
   * Whether A is painted before B. A plane across an axis that separates two
   * boxes settles it: the one on the far side of that plane cannot cover the
   * other. Boxes no plane separates fall back to depth. After the turntable's
   * order in the Hairline package, with the third axis added.
   */
  function behind(A, B, v, dA, dB) {
    for (let i = 0; i < 3; i++) {
      if (Math.abs(v[i]) < 1e-4) continue;
      if (A[i + 3] <= B[i] + 1e-3) return v[i] > 0;
      if (B[i + 3] <= A[i] + 1e-3) return v[i] < 0;
    }
    return dA < dB;
  }

  /** Indices back to front. Only pairs whose screen boxes overlap are constrained; then the farthest free one goes first. */
  function paintOrder(boxes, F) {
    const n = boxes.length, v = F.v;
    const d = boxes.map((b) => (b[0] + b[3]) * v[0] + (b[1] + b[4]) * v[1] + (b[2] + b[5]) * v[2]);
    const sb = boxes.map((b) => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const x of [b[0], b[3]]) for (const y of [b[1], b[4]]) for (const z of [b[2], b[5]]) {
        const p = F.P(x, y, z);
        x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
      }
      return [x0, y0, x1, y1];
    });
    const next = boxes.map(() => []), wait = boxes.map(() => 0);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = sb[i], b = sb[j];
      if (a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]) continue;
      if (behind(boxes[i], boxes[j], v, d[i], d[j])) { next[i].push(j); wait[j]++; } else { next[j].push(i); wait[i]++; }
    }
    const out = [], done = boxes.map(() => false);
    while (out.length < n) {
      let pick = -1;
      /* the farthest free one; if a cycle leaves none free, the farthest of those waiting */
      for (let pass = 0; pass < 2 && pick < 0; pass++)
        for (let i = 0; i < n; i++)
          if (!done[i] && (pass || !wait[i]) && (pick < 0 || d[i] < d[pick])) pick = i;
      done[pick] = true; out.push(pick);
      for (const j of next[pick]) wait[j]--;
    }
    return out;
  }

  /* ---------- the scene: a loop, the pointer and the hand ---------- */

  const GAIN = 0.55;      // degrees turned per viewBox unit dragged
  const COAST = 380;      // the coast's time constant, ms
  const WMAX = 480;       // the fastest a flick can throw it, degrees per second
  const SLOP = 3;         // how far a press may wander, in viewBox units, and still be a tap

  let styled = false;
  function style(doc) {
    if (styled) return;
    styled = true;
    const el = doc.createElement("style");
    el.textContent = ":where([data-orbit]){cursor:grab}:where([data-orbit=drag]){cursor:grabbing}";
    doc.head.appendChild(el);
  }

  function mount({ stage, svg }, spec) {
    const bag = disposer(), solids = spec.solids, o = spec.view || {};
    const V = { az: o.az ?? 45, el: o.el ?? 30, S: o.S ?? 2, cx: o.cx ?? 200, cy: o.cy ?? 166, pivot: o.pivot || [0, 0, 0] };
    const HOME = { az: V.az, el: V.el }, EL = o.elRange || [-75, 80];
    style(stage.ownerDocument);
    stage.setAttribute("data-orbit", "");

    /* one group per solid, in paint order: each frame the i-th group is given the i-th solid from the back */
    const g = mk("g", {}, svg);
    const slots = solids.map(() => {
      const sg = mk("g", {}, g);
      return { g: sg, sil: mk("path", { class: "sil" }, sg), cr: mk("path", { class: "nf lo" }, sg), marks: {} };
    });
    const write = (el, d) => { if (el.__d !== d) { el.__d = d; el.setAttribute("d", d); } };
    let lit = null;

    function draw() {
      const F = frame(V);
      const boxes = solids.map((s) => s.bounds.map((b, i) => b + s.at[i % 3]));
      paintOrder(boxes, F).forEach((j, i) => {
        const s = solids[j], sl = slots[i];
        write(sl.sil, outline(s, F));
        write(sl.cr, crease(s, F));
        sl.sil.classList.toggle("hi", s.id === lit);
        const ms = marks(s, F);
        for (const cls in ms) if (!sl.marks[cls]) sl.marks[cls] = mk("path", { class: cls }, sl.g);
        for (const cls in sl.marks) write(sl.marks[cls], ms[cls] || "");
      });
    }

    /* the hand: a drag turns the view, a release lets it coast, and a spring takes it anywhere it is sent */
    let mode = "rest";                                   // rest | drag | coast | goto
    const vel = { az: 0, el: 0 };                        // degrees per second
    const gaz = spring(V.az, { eps: 0.02 }), gel = spring(V.el, { eps: 0.02 });
    const press = { id: -1, x: 0, y: 0, t: 0, moved: 0, last: 0 };

    function stepView(dt) {
      if (mode === "coast") {
        const f = Math.exp((-dt * 1000) / COAST);
        vel.az *= f; vel.el *= f;
        V.az += vel.az * dt; V.el += vel.el * dt;
        if (V.el <= EL[0] || V.el >= EL[1]) { V.el = clamp(V.el, EL[0], EL[1]); vel.el = 0; }
        if (Math.hypot(vel.az, vel.el) < 3) mode = "rest";
      } else if (mode === "goto") {
        const a = stepS(gaz, dt), b = stepS(gel, dt);
        V.az = gaz.x; V.el = gel.x;
        if (!a && !b) mode = "rest";
      }
      return mode === "coast" || mode === "goto";
    }

    function go(az, el) {
      gaz.x = V.az; gaz.v = 0; gaz.t = az;
      gel.x = V.el; gel.v = 0; gel.t = clamp(el, EL[0], EL[1]);
      mode = "goto"; B.wake();
    }
    /* home by the shorter way round */
    const home = () => go(HOME.az + 360 * Math.round((V.az - HOME.az) / 360), HOME.el);

    const scene = {
      view: V,
      solids,
      light: (id) => { if (lit !== id) { lit = id; B.wake(); } },
      dragging: () => mode === "drag",
      turning: () => mode !== "rest",
      home,
      wake: () => B.wake(),
      destroy: bag.dispose,
    };

    const B = register(stage, (dt, now) => {
      let m = stepView(dt);
      if (spec.tick && spec.tick(dt, now)) m = true;
      draw();
      if (spec.after) spec.after(scene);
      return m;
    });
    bag.add(B.unregister);

    const pt = (e) => {
      const r = stage.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * 400, ((e.clientY - r.top) / r.height) * 320];
    };
    const hover = (p, e) => { if (spec.hover) spec.hover(p, e); B.wake(); };
    const leave = () => { if (spec.leave) spec.leave(); B.wake(); };

    bag.on(stage, "pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const p = pt(e);
      Object.assign(press, { id: e.pointerId, x: p[0], y: p[1], t: performance.now(), moved: 0, last: 0 });
      mode = "rest"; vel.az = vel.el = 0;
      /* the press keeps the pointer, so its release is heard wherever it happens */
      try { stage.setPointerCapture(e.pointerId); } catch { /* a pointer that is already gone */ }
    });
    bag.on(stage, "pointermove", (e) => {
      const p = pt(e), now = performance.now();
      if (e.pointerId !== press.id || (e.pointerType === "mouse" && !e.buttons)) { release(e); if (mode !== "drag") hover(p, e); return; }
      const dx = p[0] - press.x, dy = p[1] - press.y, dt = Math.max(0.008, (now - press.t) / 1000);
      press.x = p[0]; press.y = p[1]; press.t = now;
      if (mode !== "drag") {
        press.moved += Math.hypot(dx, dy);
        if (press.moved < SLOP) return;
        mode = "drag";
        stage.setAttribute("data-orbit", "drag");
      }
      /* the near side follows the hand: across turns it, down tips its top toward you */
      const daz = -dx * GAIN, del = dy * GAIN;
      V.az += daz; V.el = clamp(V.el + del, EL[0], EL[1]);
      vel.az = clamp(vel.az + (daz / dt - vel.az) * 0.4, -WMAX, WMAX);
      vel.el = clamp(vel.el + (del / dt - vel.el) * 0.4, -WMAX, WMAX);
      press.last = now;
      B.wake();
    });
    /* ends a press; returns whether it had become a drag */
    const release = (e) => {
      if (e.pointerId !== press.id) return false;
      press.id = -1;
      if (mode !== "drag") return false;
      stage.setAttribute("data-orbit", "");
      /* a hand that stopped before letting go throws nothing */
      if (reducedMotion() || performance.now() - press.last > 90) { vel.az = vel.el = 0; mode = "rest"; }
      else mode = "coast";
      B.wake();
      return true;
    };
    /* a press that never became a drag is a tap: it is heard as the pointer arriving there */
    bag.on(stage, "pointerup", (e) => { if (e.pointerId === press.id && !release(e)) hover(pt(e), e); });
    bag.on(stage, "pointercancel", release);
    /* a finger lifting is not a leave: what it tapped stays, so the figure can be turned as it was left */
    bag.on(stage, "pointerleave", (e) => { if (mode !== "drag" && e.pointerId !== press.id && e.pointerType !== "touch") leave(); });
    bag.on(stage, "dblclick", home);
    /* the arrow keys turn it a step at a time; Home goes home */
    bag.on(stage, "keydown", (e) => {
      const az = mode === "goto" ? gaz.t : V.az, el = mode === "goto" ? gel.t : V.el;
      if (e.key === "ArrowLeft") go(az + 15, el);
      else if (e.key === "ArrowRight") go(az - 15, el);
      else if (e.key === "ArrowUp") go(az, el + 10);
      else if (e.key === "ArrowDown") go(az, el - 10);
      else if (e.key === "Home") home();
      else return;
      e.preventDefault();
    });

    bag.add(() => { stage.removeAttribute("data-orbit"); svg.replaceChildren(); });
    return scene;
  }

  return { box, cyl, mark, ringOn, rectOn, lineOn, mount, frame, paintOrder };
})();
