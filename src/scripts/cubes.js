// 3D boxes: the CREATIVE / PROFESSIONAL boxes on /notice (and the explore box, data-intro, that
// /copy-of-notice had before it came off the site).
// Binds each [data-cube] on the page once, at load. Kept apart from interactions.js so a page that
// is not a canvas page can have the boxes without the rest of that file.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// --z scales the canvas pages (.view); on an ordinary responsive page nothing is scaled by it.
const zoom = () => (document.querySelector(".view") ? Number(getComputedStyle(document.documentElement).getPropertyValue("--z")) || 1 : 1);

// ---- 3D boxes: drag to turn ---------------------------------------------------------------------
// A plain-JS version of the React "CSS Box" component: the same drag (half a degree per pixel) and
// the same spring (stiffness 100, damping 30) between where the box is and where it is heading.
// Added here: a box that is one button turns by itself under the pointer (data-spin, degrees per
// second), and tabbing to a button on a hidden side brings that side round.
const FACING = { front: [0, 0], back: [0, 180], right: [0, -90], left: [0, 90], top: [-90, 0], bottom: [90, 0] };
const noHover = matchMedia("(hover: none)").matches;
// Chrome paints anything under perspective at one image pixel per CSS pixel: soft on dense screens.
// There the box is laid out --ck times larger and scaled back down (site.css).
const blink = "userAgentData" in navigator || /Chrome\//.test(navigator.userAgent);
const dense = blink ? Math.max(1, Math.min(3, Math.round(devicePixelRatio * zoom()))) : 1;
for (const el of document.querySelectorAll("[data-cube]")) {
  const box = el.querySelector(".cube-box");
  const rest = el.dataset.cube.split(",").map(Number);
  const spin = reduceMotion ? 0 : Number(el.dataset.spin || 0);
  const shown = () => el.getClientRects().length > 0; // its phone or desktop twin is display:none
  let [tx, ty] = rest, x = tx, y = ty, vx = 0, vy = 0;
  let drag = null, moved = false, over = false, leaving = 0, raf = 0, last = 0;

  const draw = () => (box.style.setProperty("--rx", `${x.toFixed(2)}deg`), box.style.setProperty("--ry", `${y.toFixed(2)}deg`));
  el.style.setProperty("--ck", dense);
  const turning = () => spin && !drag && (over || noHover);
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (turning()) ty += spin * dt;
    for (let left = dt; left > 1e-5; left -= 1 / 240) {
      const h = Math.min(left, 1 / 240); // small steps keep the spring steady
      vx += (100 * (tx - x) - 30 * vx) * h;
      vy += (100 * (ty - y) - 30 * vy) * h;
      x += vx * h;
      y += vy * h;
    }
    const still = !drag && !turning() && Math.abs(tx - x) + Math.abs(ty - y) < 0.05 && Math.abs(vx) + Math.abs(vy) < 0.05;
    if (still) [x, y, vx, vy] = [tx, ty, 0, 0];
    draw();
    raf = still || !shown() ? 0 : requestAnimationFrame(frame);
  };
  const wake = () => {
    if (raf || !shown()) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  // The same view of the box closest to where it is now, so it never unwinds whole turns.
  const near = (to, from, step = 360) => to + step * Math.round((from - to) / step);

  el.addEventListener("pointerdown", (e) => {
    if (e.button) return;
    drag = { id: e.pointerId, px: e.clientX, py: e.clientY, x: tx, y: ty };
    moved = false;
  });
  addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.px, dy = e.clientY - drag.py;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    moved = true;
    el.classList.add("dragging");
    tx = drag.x - dy / 2;
    ty = drag.y + dx / 2;
    wake();
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    el.classList.remove("dragging");
  };
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);
  // Letting go after a drag must not open the button under the pointer.
  el.addEventListener("click", (e) => moved && (e.preventDefault(), e.stopPropagation()), true);
  el.addEventListener("dragstart", (e) => e.preventDefault());

  if (spin) {
    // Under the pointer (or keyboard focus) the box keeps turning and shows its words; afterwards
    // it carries on to the next quarter turn, which looks the same as where it started.
    const enter = () => {
      clearTimeout(leaving);
      over = true;
      el.classList.add("on");
      wake();
    };
    const leave = () => {
      clearTimeout(leaving);
      leaving = setTimeout(() => {
        over = false;
        el.classList.remove("on");
        tx = rest[0];
        ty = rest[1] + 90 * (spin > 0 ? Math.ceil : Math.floor)((y - rest[1]) / 90);
        wake();
      }, 120);
    };
    el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && enter());
    el.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && leave());
    el.addEventListener("focus", () => el.matches(":focus-visible") && enter());
    el.addEventListener("blur", () => over && leave());
    if (noHover) (wake(), addEventListener("resize", wake));
  } else {
    el.addEventListener("focusin", (e) => {
      const to = FACING[e.target.closest("[data-side]")?.dataset.side];
      if (!to || !e.target.matches(":focus-visible")) return;
      [tx, ty] = [near(to[0], tx), near(to[1], ty)];
      wake();
    });
  }
  // The explore box arrives with one full turn, so every side is seen once.
  if (el.hasAttribute("data-intro") && !reduceMotion) {
    y = ty - 360;
    draw();
    wake();
  }
}
