// /portfolio as a page the visitor builds, with the manners of design software. The page's words,
// BACK and the figure ([data-piece], tagged in src/lib/fixups.js) start out as tiles in a tray at
// the left of a plain white page; only the footer (year, email, social links) never moves.
//
//   Click a tile and its word comes up off the tray inside a marching dotted frame; it then glides
//   after the pointer (with alignment guides and snapping) until a second
//   click sets it down, anywhere on the page. Once placed it is simply the link again. Escape, or a
//   click back on the tray, puts a held word back. RECIPE throws everything onto the page at
//   random, ORIGINAL puts it all where Ye designed it, CLEAR takes it all back to the tray. Nothing
//   is kept: every visit (a reload, the site closed and opened again) starts from the tray.
const KEY = "yz-build-v1"; // (where earlier versions kept a layout; cleared)
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(hover: none)").matches; // touch: nothing to follow, the tap says where
const root = document.documentElement;
const views = [...document.querySelectorAll(".view")].filter((v) => v.querySelector("[data-piece]"));
if (views.length) start();
else root.classList.remove("building");

function start() {
  const zoom = () => Number(getComputedStyle(root).getPropertyValue("--z")) || 1;
  const saved = {}; // each layout (desktop / phone) while the page is open
  try {
    sessionStorage.removeItem(KEY);
  } catch {}

  // ---- The tray, and the layer things fly in ------------------------------------------------------
  // (data-chat-quiet: the chat's page corner doesn't lift while the pointer is on the tray)
  const kit = el("aside", "kit", { "aria-label": "Pieces of this page: pick one, then click the page to place it", "data-chat-quiet": "" });
  kit.innerHTML =
    '<div class="kit-list"></div>' +
    '<p class="kit-say" aria-live="polite"></p>' +
    '<div class="kit-foot"><button type="button" class="kit-help">Recipe</button>' +
    '<div class="kit-more"><button type="button" data-act="original">ORIGINAL</button><button type="button" data-act="clear">CLEAR</button></div></div>';
  const layer = el("div", "kit-layer", { "aria-hidden": "true" });
  const heldAnts = ants();
  layer.append(heldAnts);
  document.body.append(kit, layer);
  const list = kit.querySelector(".kit-list");
  const say = kit.querySelector(".kit-say");

  // ---- One board per layout (desktop / phone); only the one on screen is live ----------------------
  let B = null;
  const boards = new Map();
  function board(view) {
    if (boards.has(view)) return boards.get(view);
    const name = view.classList.contains("view-mobile") ? "mobile" : "desktop";
    const pieces = [...view.querySelectorAll("[data-piece]")].map((node) => {
      const st = node.style, lbl = node.querySelector(".lbl");
      const [l, t, w, h] = [st.left, st.top, st.width, st.height].map(parseFloat);
      const centre = lbl ? [l + parseFloat(lbl.style.left), t + parseFloat(lbl.style.top)] : [l + w / 2, t + h / 2];
      node.classList.add("piece");
      return { node, id: node.dataset.piece, centre, at: null, chip: null };
    });
    const hint = el("p", "kit-hint"), guides = el("div", "kit-guides");
    hint.innerHTML = '<span class="kit-hint-big">DESIGN IT YOURSELF</span><span class="kit-hint-small">Manually Designed and Cared by Ye</span>';
    view.append(hint, guides);
    const b = { view, name, pieces, hint, guides, joints: [...view.querySelectorAll("[data-joint]")], original: false };
    boards.set(view, b);
    return b;
  }
  const visibleView = () => views.find((v) => v.offsetParent !== null) || views[0];

  // Where RECIPE throws pieces, in canvas px: anywhere in the window beside the tray, above the
  // footer, clear of what never moves. (By hand they go anywhere at all.)
  function bounds() {
    const v = B.view, W = v.offsetWidth, z = zoom(), vr = v.getBoundingClientRect();
    const fixed = [...v.children].filter((n) => n.classList.contains("n") && !n.hasAttribute("data-piece") && !n.hasAttribute("data-joint") && n.offsetWidth < W - 2);
    const low = fixed.filter((n) => n.offsetTop > v.offsetHeight * 0.6).map((n) => n.offsetTop);
    const top = 16, bottom = (low.length ? Math.min(...low) : v.offsetHeight) - 14;
    const avoid = fixed.filter((n) => n.offsetTop < bottom).map((n) => toCanvas(n.getBoundingClientRect()));
    const left = (kit.getBoundingClientRect().right - vr.left) / z + 16;
    const right = (root.clientWidth - vr.left) / z - 16;
    return { W, top, bottom, left, right, avoid };
  }
  function toCanvas(r) {
    const z = zoom(), vr = B.view.getBoundingClientRect();
    return { x: (r.left - vr.left) / z, y: (r.top - vr.top) / z, w: r.width / z, h: r.height / z };
  }
  const size = (p) => ({ w: p.node.offsetWidth, h: p.node.offsetHeight });
  const home = (p) => {
    const s = size(p);
    return p.node.classList.contains("img") ? [parseFloat(p.node.style.left), parseFloat(p.node.style.top)] : [p.centre[0] - s.w / 2, p.centre[1] - s.h / 2];
  };
  const overKit = (x) => x <= kit.getBoundingClientRect().right;

  // ---- The tray's tiles -------------------------------------------------------------------------------
  function fillKit() {
    list.textContent = "";
    for (const p of B.pieces) {
      const chip = el("button", "chip", { type: "button" });
      const img = p.node.querySelector("img");
      if (img) {
        chip.classList.add("pic");
        chip.append(el("img", "", { src: img.currentSrc || img.src, alt: "" }));
      } else {
        const word = el("span");
        word.textContent = p.id;
        word.style.fontFamily = p.node.querySelector(".lbl")?.style.fontFamily || "";
        chip.append(word);
      }
      chip.append(el("i", "chip-plus", { "aria-hidden": "true" }));
      chip.setAttribute("aria-label", `${img ? "The figure" : p.id}: pick it up, then click the page to place it`);
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        if (held && held.p === p) return letGo();
        if (held) letGo();
        pickUp(p, chip.getBoundingClientRect(), e.detail === 0);
      });
      p.chip = chip;
      list.append(chip);
    }
  }
  function sync() {
    const left = B.pieces.filter((p) => !p.at && !(held && held.p === p));
    for (const p of B.pieces) {
      p.chip.classList.toggle("gone", !!p.at || p.coming === "closed");
      p.chip.classList.toggle("held", !!held && held.p === p);
      p.node.classList.toggle("kit-off", !p.at);
    }
    root.classList.toggle("kit-empty", !B.pieces.some((p) => p.at) && !held);
    for (const j of B.joints) j.classList.toggle("kit-off", !B.original);
    say.textContent = held ? (coarse ? "TAP THE PAGE TO PLACE IT" : "CLICK THE PAGE TO PLACE IT") : left.length ? "" : "ALL ON THE PAGE";
  }
  function save() {
    const pos = {};
    for (const p of B.pieces) if (p.at) pos[p.id] = p.at.map((v) => Math.round(v));
    saved[B.name] = { pos, original: B.original };
  }
  function setAt(p, at) {
    p.at = at;
    if (at) {
      p.node.style.left = `${at[0]}px`;
      p.node.style.top = `${at[1]}px`;
    }
  }

  // ---- Holding a piece: it follows the pointer on a spring until the next click sets it down -------
  let held = null;
  let ptr = null, raf = 0, last = 0, swallow = false;
  function pickUp(p, fromRect, keyboard) {
    const s = size(p);
    const ghost = p.node.cloneNode(true);
    ghost.removeAttribute("href");
    ghost.classList.remove("kit-off", "kit-away");
    ghost.classList.add("kit-ghost");
    layer.prepend(ghost);
    const f = toCanvas(fromRect);
    held = { p, ghost, off: [s.w / 2, s.h / 2], x: f.x, y: f.y, sc: Math.min(1, f.h / s.h), vx: 0, tilt: 0 };
    // without a pointer to follow (keyboard, touch), it waits on the page beside the tray
    const b = bounds();
    if (!ptr || keyboard || coarse) [held.tx, held.ty] = [b.left + 24, clamp(f.y, b.top, b.bottom - s.h)];
    else aim();
    root.classList.add("kit-holding");
    sync();
    loop();
  }
  function aim() {
    if (!held || !ptr) return;
    const z = zoom(), vr = B.view.getBoundingClientRect();
    [held.tx, held.ty] = [(ptr.x - vr.left) / z - held.off[0], (ptr.y - vr.top) / z - held.off[1]];
    held.overKit = overKit(ptr.x);
    snapHeld(size(held.p));
  }
  // Snapping: the held piece's edges and middle line up with any placed piece's, and with the page's middle.
  function snapHeld(s) {
    let x = held.tx, y = held.ty;
    const xs = [B.view.offsetWidth / 2], ys = [];
    for (const q of B.pieces) {
      if (!q.at || q === held.p) continue;
      const t = size(q);
      xs.push(q.at[0], q.at[0] + t.w / 2, q.at[0] + t.w);
      ys.push(q.at[1], q.at[1] + t.h / 2, q.at[1] + t.h);
    }
    const near = (vals, mine) => {
      let best = null;
      for (const v of vals) for (const m of mine) if (Math.abs(v - m) < 6 && (!best || Math.abs(v - m) < best.d)) best = { d: Math.abs(v - m), v, shift: v - m };
      return best;
    };
    const gx = held.overKit ? null : near(xs, [x, x + s.w / 2, x + s.w]);
    const gy = held.overKit ? null : near(ys, [y, y + s.h / 2, y + s.h]);
    if (gx) x += gx.shift;
    if (gy) y += gy.shift;
    held.px = x;
    held.py = y;
    guides(gx && gx.v, gy && gy.v);
  }
  function guides(x, y) {
    const g = B.guides;
    g.textContent = "";
    if (x != null) g.append(el("i", "gx", { style: `left:${x}px` }));
    if (y != null) g.append(el("i", "gy", { style: `top:${y}px` }));
  }
  function loop() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!held) return;
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 20);
    const tx = held.overKit ? held.tx : held.px ?? held.tx, ty = held.overKit ? held.ty : held.py ?? held.ty;
    const ox = held.x;
    held.x += (tx - held.x) * k;
    held.y += (ty - held.y) * k;
    held.sc += (1.03 - held.sc) * k;
    held.vx = dt ? (held.x - ox) / dt : 0;
    held.tilt += (clamp(held.vx * 0.012, -7, 7) - held.tilt) * (1 - Math.exp(-dt * 10));
    const z = zoom(), vr = B.view.getBoundingClientRect(), s = size(held.p);
    const lx = vr.left / z + held.x, ly = vr.top / z + held.y, tilt = reduceMotion ? 0 : held.tilt;
    held.ghost.style.transform = `translate(${lx.toFixed(2)}px,${ly.toFixed(2)}px) rotate(${tilt.toFixed(2)}deg) scale(${held.sc.toFixed(3)})`;
    held.ghost.style.opacity = held.overKit ? "0.45" : "";
    heldAnts.style.width = `${s.w + 8}px`;
    heldAnts.style.height = `${s.h + 8}px`;
    heldAnts.style.transform = `translate(${lx - 4}px,${ly - 4}px) rotate(${tilt.toFixed(2)}deg) scale(${held.sc.toFixed(3)})`;
    if (held.landing && Math.abs(tx - held.x) + Math.abs(ty - held.y) < 0.6) return land();
    raf = requestAnimationFrame(frame);
  }
  // The second click: the piece glides the last bit to where it was put and settles there.
  function setDown(keys) {
    if (!held || held.overKit) return letGo();
    if (!keys) aim();
    else snapHeld(size(held.p));
    held.landing = true;
    loop();
  }
  function land() {
    const { p, ghost } = held;
    setAt(p, [held.px ?? held.x, held.py ?? held.y]);
    ghost.remove();
    held = null;
    B.original = false;
    root.classList.remove("kit-holding");
    guides(null, null);
    sync();
    save();
    if (!reduceMotion) p.node.animate([{ scale: "1.04" }, { scale: "0.985", offset: 0.55 }, { scale: "1" }], { duration: 320, easing: "cubic-bezier(.3,.7,.3,1)" });
  }
  // Escape, or a click back on the tray: it goes back to the tray.
  function letGo() {
    if (!held) return;
    const { p, ghost } = held;
    const from = ghost.getBoundingClientRect();
    ghost.remove();
    held = null;
    root.classList.remove("kit-holding");
    guides(null, null);
    sync();
    flyHome(p, from);
    save();
  }

  // ---- Flights: RECIPE, ORIGINAL, CLEAR, and anything going back to the tray ------------------------
  const ghostOf = (p) => {
    const ghost = p.node.cloneNode(true);
    ghost.removeAttribute("href");
    ghost.classList.remove("kit-off", "kit-away");
    ghost.classList.add("kit-ghost", "kit-flying");
    ghost.style.transformOrigin = "0 0";
    layer.prepend(ghost);
    return ghost;
  };
  const tf = (x, y, sc, r = 0) => `translate(${x}px,${y}px) rotate(${r}deg) scale(${sc})`;
  // Onto the page (RECIPE, ORIGINAL): the piece itself travels, not a copy, so the figure's drawing
  // keeps moving all the way and nothing is swapped when it lands. It is already at its new place
  // (setAt); it is drawn back to where it was and eased home, up in an arc. From the tray it comes
  // out from under it.
  function fly(p, from, to, delay = 0) {
    if (reduceMotion) return;
    const z = zoom(), r = p.node.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const sc = from.height / r.height, dx = (from.left - r.left) / z, dy = (from.top - r.top) / z;
    const turn = (Math.random() - 0.5) * 24;
    p.node.style.transformOrigin = "0 0";
    p.node.animate(
      [
        { transform: `translate(${dx}px,${dy}px) scale(${sc})` },
        { transform: `translate(${dx / 2}px,${Math.min(dy, 0) - 40}px) rotate(${turn}deg) scale(${(sc + 1) / 2})`, offset: 0.5 },
        { transform: "none" },
      ],
      { duration: 620 + Math.random() * 220, delay, easing: "cubic-bezier(.45,.05,.25,1)", fill: "backwards" }
    ).finished.then(() => (p.node.style.transformOrigin = ""), () => {});
  }
  // Back into the tray (CLEAR, Escape): a word that was on the page has its tile closed; the tile
  // opens as an empty dotted slot while the word is on its way, pushing the tiles below it down, and
  // the word shrinks into it, steered every frame to where the slot is now, so it lands exactly.
  // Then the tile fills and gives a little.
  function flyHome(p, from, delay = 0) {
    const chip = p.chip;
    if (reduceMotion) {
      p.coming = null;
      return sync();
    }
    chip.classList.add("slot");
    if (chip.classList.contains("gone")) p.coming = "closed";
    const z = zoom(), s = size(p);
    const ghost = ghostOf(p);
    const start = [from.left / z, from.top / z, from.height / z / s.h];
    const turn = (Math.random() - 0.5) * 28, lift = 30 + Math.random() * 40, dur = 680 + Math.random() * 160;
    ghost.style.transform = tf(...start);
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    let t0 = 0;
    const step = (now) => {
      t0 ||= now + delay;
      const t = Math.min(1, Math.max(0, now - t0) / dur);
      if (t > 0.18 && p.coming) {
        p.coming = null;
        chip.classList.remove("gone");
      }
      // where the tile's word (or picture) is right now, centred, a little larger than the word
      const r = (chip.firstElementChild || chip).getBoundingClientRect();
      const sc = Math.max(0.05, (r.height * (chip.classList.contains("pic") ? 1 : 1.3)) / z / s.h);
      const tx = (r.left + r.width / 2) / z - (s.w * sc) / 2, ty = (r.top + r.height / 2) / z - (s.h * sc) / 2;
      const e = ease(t), bump = Math.sin(Math.PI * e);
      ghost.style.transform = tf(start[0] + (tx - start[0]) * e, start[1] + (ty - start[1]) * e - lift * bump, start[2] + (sc - start[2]) * e, turn * bump);
      if (t < 1) return requestAnimationFrame(step);
      ghost.remove();
      chip.classList.remove("slot");
      chip.animate([{ transform: "scale(0.94)" }, { transform: "scale(1.03)", offset: 0.5 }, { transform: "none" }], { duration: 360, easing: "cubic-bezier(.3,.7,.3,1)" });
      chip.querySelector(".chip-plus")?.animate([{ transform: "rotate(-180deg) scale(0.4)" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
    };
    requestAnimationFrame(step);
  }
  // A free spot for a w x h piece: the best of many random tries, clear of everything already down.
  function freeSpot(s, taken, b) {
    let best = null, worst = Infinity;
    for (let i = 0; i < 90 && worst > 0; i++) {
      const x = b.left + Math.random() * Math.max(0, b.right - b.left - s.w), y = b.top + Math.random() * Math.max(0, b.bottom - b.top - s.h);
      let o = 0;
      for (const r of taken) {
        const ox = Math.min(x + s.w, r.x + r.w + 16) - Math.max(x, r.x - 16), oy = Math.min(y + s.h, r.y + r.h + 16) - Math.max(y, r.y - 16);
        if (ox > 0 && oy > 0) o += ox * oy;
      }
      if (o < worst) [worst, best] = [o, [x, y]];
    }
    return best;
  }
  function everything(to) {
    if (held) letGo();
    const b = bounds();
    const taken = [...b.avoid];
    const order = [...B.pieces].sort((p, q) => size(q).w * size(q).h - size(p).w * size(p).h); // big ones first
    const moves = [];
    for (const p of order) {
      const from = p.at ? p.node.getBoundingClientRect() : p.chip.getBoundingClientRect();
      const s = size(p);
      let at = null;
      if (to === "help") {
        at = freeSpot(s, taken, b);
        taken.push({ x: at[0], y: at[1], w: s.w, h: s.h });
      } else if (to === "original") at = home(p);
      if (!at && !p.at) continue;
      setAt(p, at);
      moves.push([p, from, at]);
    }
    B.original = to === "original";
    // Home to the tray: top tile first, so the column fills from the top down.
    const homeward = moves.filter(([, , at]) => !at).sort(([p], [q]) => B.pieces.indexOf(p) - B.pieces.indexOf(q));
    for (const [p] of homeward) p.coming = reduceMotion ? null : "closed";
    sync();
    moves.filter(([, , at]) => at).forEach(([p, from, at], i) => fly(p, from, at, i * 45));
    homeward.forEach(([p, from], i) => flyHome(p, from, i * 70));
    save();
  }

  // ---- Input -----------------------------------------------------------------------------------------
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    ptr = { x: e.clientX, y: e.clientY };
    if (held) aim();
  }, { passive: true });
  // While a piece is held, the next press anywhere but the tray sets it down (and clicks nothing else).
  addEventListener("pointerdown", (e) => {
    if (!held || e.button) return;
    ptr = { x: e.clientX, y: e.clientY };
    if (kit.contains(e.target)) return;
    e.preventDefault();
    swallow = true;
    aim();
    setDown();
  }, true);
  addEventListener("click", (e) => {
    if (!swallow) return;
    swallow = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  addEventListener("keydown", (e) => {
    if (!held) return;
    if (e.key === "Escape") return letGo();
    // held from the keyboard: arrows carry it, Enter or Space sets it down
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (d) {
      e.preventDefault();
      held.tx = (held.px ?? held.tx) + d[0] * (e.shiftKey ? 40 : 10);
      held.ty = (held.py ?? held.ty) + d[1] * (e.shiftKey ? 40 : 10);
      snapHeld(size(held.p));
      loop();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setDown(true);
    }
  });
  list.addEventListener("click", (e) => {
    if (held && e.target === list) letGo();
  });
  kit.querySelector(".kit-help").addEventListener("click", () => everything("help"));
  kit.querySelector(".kit-more").addEventListener("click", (e) => {
    const act = e.target.closest("button")?.dataset.act;
    if (act) everything(act === "clear" ? "clear" : "original");
  });

  // ---- Start, and the switch between the desktop and phone layouts --------------------------------
  function activate() {
    const v = visibleView();
    if (B && B.view === v) return;
    if (held) letGo();
    B = board(v);
    fillKit();
    const mine = saved[B.name];
    if (mine) {
      for (const p of B.pieces) if (mine.pos[p.id]) setAt(p, mine.pos[p.id]);
      B.original = !!mine.original;
    }
    // the hint, in the middle of the page beside the tray
    const b = bounds();
    B.hint.style.top = `${(b.top + b.bottom) / 2 - 20}px`;
    B.hint.style.left = `${Math.max(0, b.left)}px`;
    sync();
  }
  activate();
  root.classList.remove("building");
  addEventListener("resize", activate);
}

function el(tag, cls, attrs = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
// The marching dotted frame with a handle at each corner.
function ants() {
  const a = el("div", "kit-ants");
  a.innerHTML = "<i></i><i></i><i></i><i></i>";
  return a;
}
function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
