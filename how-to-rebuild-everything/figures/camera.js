/*
 * How to Rebuild Everything · 01 · camera
 *
 * A camera in eleven parts. At rest it hangs apart around its body, the way
 * a manual lays it out. Moving across the stage puts it back together one
 * part at a time, in the order you would build it; moving back takes it
 * apart again. Dragging turns the whole thing in the hand.
 *
 * The lens points along +y, so the home view shows the front, one end and
 * the top. Turn it over for the tripod socket, and round for the screen.
 */
(() => {
  const { clamp, tween, tset, tval, tdone } = HL;
  const { box, cyl, mark, ringOn, rectOn, lineOn } = ORBIT;

  const LX = 6, LZ = -1;        // the lens axis, where it meets the front face
  const DX = 22, SX = -24;      // the dial and the shutter button, along the top
  const STEP = 50;              // the stagger between one part and the next, ms

  const ticks = Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    return lineOn("z", DX + 4.4 * c, 4.4 * s, DX + 6 * c, 6 * s, 32);
  });

  /* each part: its solid, and how far it hangs from its seat when apart. The body first, then the order they go on. */
  const PARTS = [
    [box("body", [-36, -12, -20, 36, 12, 20], { r: 10, b: 1.4, marks: [
      mark("+y", "nf lo", [ringOn("y", LX, LZ, 12, 14), ringOn("y", -15, 12, 12, 1.8, 16)]),
    ] }), [0, 0, 0]],
    [box("base", [-36, -12, -25, 36, 12, -20], { r: 10, b: 1.4, marks: [
      mark("-z", "nf", [ringOn("z", 0, 0, -25, 3)]),
      mark("-z", "nf lo", [rectOn("z", 12, -7, 30, 7, -25, 2)]),
    ] }), [0, 0, -18]],
    [box("screen", [-28, -15, -14, 22, -12, 14], { axis: "y", r: 3, b: 1.1, marks: [
      mark("-y", "nf lo", [rectOn("y", -24, -10, 8, 10, -15, 2), ringOn("y", 15, 6, -15, 1.7, 16), ringOn("y", 15, 0, -15, 1.7, 16), ringOn("y", 15, -6, -15, 1.7, 16)]),
    ] }), [0, -16, 0]],
    [box("grip", [-36, 12, -18, -22, 18, 14], { r: 3, b: 1 }), [0, 11, 0]],
    [cyl("mount", "y", LX, LZ, 17, 12, 16), [0, 10, 0]],
    [cyl("barrel", "y", LX, LZ, 13.5, 16, 30), [0, 22, 0]],
    [cyl("glass", "y", LX, LZ, 15.5, 30, 36, { marks: [
      mark("+y", "nf", [ringOn("y", LX, LZ, 36, 10.5)]),
      mark("+y", "nf lo", [ringOn("y", LX, LZ, 36, 5.5)]),
    ] }), [0, 36, 0]],
    [box("top", [-36, -12, 20, 36, 12, 27], { r: 10, b: 1.4, marks: [
      mark("+y", "nf", [rectOn("y", -24, 21.8, -13, 25.2, 12, 1)]),
      mark("+y", "nf lo", [ringOn("y", 17, 23.5, 12, 1.7, 16)]),
      mark("-y", "nf", [rectOn("y", -24, 21.8, -15, 25.2, -12, 1)]),
      mark("+z", "nf lo", [ringOn("z", DX, 0, 27, 5), ringOn("z", SX, 1, 27, 2.6, 20)]),
    ] }), [0, 0, 16]],
    [cyl("dial", "z", DX, 0, 7.5, 27, 32, { marks: [
      mark("+z", "nf lo", ticks),
      mark("+z", "dot", [ringOn("z", DX + 2.4, 0, 32, 0.9, 12)]),
    ] }), [0, 0, 32]],
    [cyl("shutter", "z", SX, 1, 4.2, 27, 30.5, { b: 1, marks: [
      mark("+z", "nf lo", [ringOn("z", SX, 1, 30.5, 1.7, 16)]),
    ] }), [0, 0, 28]],
    [box("shoe", [-8, -7, 27, 8, 7, 29.5], { r: 1.5, b: 0.9, marks: [
      mark("+z", "nf lo", [lineOn("z", -4.5, -5, -4.5, 5, 29.5), lineOn("z", 4.5, -5, 4.5, 5, 29.5)]),
    ] }), [0, 0, 24]],
  ];
  const N = PARTS.length - 1;

  REBUILD.figure({
    no: "01",
    name: "camera",
    means: "A camera in eleven parts. Moving across puts it back together, one part at a time; dragging turns it in the hand.",
    /* how far apart the parts hang, as a share of their full spread */
    range: [0.5, 0.75, 1],

    mount({ stage, svg, read }, value) {
      let spread = value;
      let built = 0;                                    // how many parts are on: 0 is apart, N is whole
      const tw = PARTS.map(() => tween(1));             // 1 hangs apart, 0 is seated

      /* parts go on in order and come off in reverse, each a step after the one before */
      function build(k, now) {
        if (k === built) return;
        for (let i = 1; i <= N; i++) tset(tw[i], i <= k ? 0 : 1, now, (k > built ? i - built - 1 : built - i) * STEP);
        built = k;
        sc.light(PARTS[k][0].id);
      }

      const sc = ORBIT.mount({ stage, svg }, {
        view: { az: 45, el: 30, S: 2, cx: 200, cy: 168, pivot: [0, 12, 5] },
        solids: PARTS.map((p) => p[0]),
        tick(dt, now) {
          let moving = false;
          for (let i = 1; i <= N; i++) {
            const t = tval(tw[i], now) * spread, [solid, away] = PARTS[i];
            solid.at = [away[0] * t, away[1] * t, away[2] * t];
            if (!tdone(tw[i], now)) moving = true;
          }
          return moving;
        },
        hover: (p) => build(Math.round(clamp((p[0] - 60) / 280, 0, 1) * N), performance.now()),
        leave: () => build(0, performance.now()),
        after(scene) {
          const V = scene.view;
          read.textContent = scene.turning()
            ? `az ${String(Math.round(((V.az % 360) + 360) % 360)).padStart(3, "0")}° · el ${Math.round(V.el)}°`
            : built ? `${String(built).padStart(2, "0")} · ${PARTS[built][0].id}` : "rest";
        },
      });
      sc.light("body");

      return { set: (v) => { spread = v; sc.wake(); }, destroy: sc.destroy, scene: sc };
    },
  });
})();
