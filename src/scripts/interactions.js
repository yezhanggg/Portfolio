// Client-side behaviour for the page canvases: zine slideshows, gallery strips + lightbox, forms,
// and the motion carried over from the original site (entrances, drift, pointer tracking).
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
import "./cubes.js"; // the 3D boxes

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const zoom = () => Number(getComputedStyle(document.documentElement).getPropertyValue("--z")) || 1;
const lightboxOpen = () => !!document.querySelector(".pswp--open");

// ---- Slideshows ------------------------------------------------------------------------------
for (const show of document.querySelectorAll("[data-slideshow]")) {
  const slides = [...show.querySelectorAll(":scope > .slides > .slide")];
  const dots = [...show.querySelectorAll(".show-dots .dot")];
  if (slides.length < 2) continue;
  const slideMs = reduceMotion ? 0 : Number(show.dataset.slide || 0);
  let current = 0;
  let busy = false;

  const go = (i, dir = 1) => {
    const next = (i + slides.length) % slides.length;
    if (next === current || busy) return;
    const from = slides[current], to = slides[next];
    dots[current]?.classList.remove("on");
    dots[next]?.classList.add("on");
    from.setAttribute("aria-hidden", "true");
    to.removeAttribute("aria-hidden");
    if (slideMs) {
      // Sideways slide: the new page enters from the side the visitor is heading to.
      busy = true;
      to.style.transform = `translateX(${dir * 100}%)`;
      to.classList.add("on");
      void to.offsetWidth;
      to.classList.add("moving");
      from.classList.add("moving");
      to.style.transform = "translateX(0)";
      from.style.transform = `translateX(${-dir * 100}%)`;
      setTimeout(() => {
        from.classList.remove("on", "moving");
        to.classList.remove("moving");
        from.style.transform = "";
        to.style.transform = "";
        busy = false;
      }, slideMs + 40);
    } else {
      from.classList.remove("on");
      to.classList.add("on");
    }
    current = next;
    // Warm the following slide so flipping stays instant.
    slides[(current + 1) % slides.length].querySelectorAll("img[loading='lazy']").forEach((img) => (img.loading = "eager"));
  };
  show.querySelector(".show-nav.prev")?.addEventListener("click", () => go(current - 1, -1));
  show.querySelector(".show-nav.next")?.addEventListener("click", () => go(current + 1, 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => go(i, i > current ? 1 : -1)));

  let startX = null;
  show.addEventListener("pointerdown", (e) => (startX = e.clientX));
  show.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  show.tabIndex = 0;
  show.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(current - 1, -1);
    if (e.key === "ArrowRight") go(current + 1, 1);
  });

  // Slideshows that advanced on their own keep doing so; pause while the pointer is over them.
  const auto = Number(show.dataset.auto || 0);
  if (auto && !reduceMotion) {
    let paused = false;
    show.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && (paused = true));
    show.addEventListener("pointerleave", () => (paused = false));
    setInterval(() => !paused && !lightboxOpen() && show.offsetParent && go(current + 1, 1), Math.max(auto, slideMs + 600));
  }
  slides[1].querySelectorAll("img[loading='lazy']").forEach((img) => (img.loading = "eager"));
}

// ---- Gallery strips: start where the original did, drift on their own, drag to scroll -----------
for (const strip of document.querySelectorAll(".gal.scrolls")) {
  const inner = strip.querySelector(".gal-inner");
  const speed = reduceMotion ? 0 : Number(strip.dataset.speed || 0); // px/s, negative = content moves left
  let period = 0;
  if (speed && inner) {
    // Duplicate the strip once so the drift can loop without a visible jump.
    period = inner.offsetWidth;
    for (const item of [...inner.children]) {
      const clone = item.cloneNode(true);
      clone.dataset.clone = "1";
      clone.style.left = parseFloat(item.style.left) + period + "px";
      inner.appendChild(clone);
    }
    inner.style.width = period * 2 + "px";
    strip.classList.add("drift");
  }
  const start = Number(strip.dataset.start || 0);
  let pos = period ? start % period : start;
  strip.scrollLeft = pos;

  let down = null;
  let moved = false;
  let hover = false;
  strip.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && (hover = true));
  strip.addEventListener("pointerleave", () => (hover = false));
  strip.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    down = { x: e.clientX, left: strip.scrollLeft };
    moved = false;
  });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = (e.clientX - down.x) / zoom();
    if (Math.abs(dx) > 4) moved = true;
    strip.scrollLeft = down.left - dx;
  });
  addEventListener("pointerup", () => (down = null));
  addEventListener("pointercancel", () => (down = null));
  // Links and pictures are draggable by default; that native drag would take over the pointer
  // (no more pointermove, and no pointerup to end the scroll).
  strip.addEventListener("dragstart", (e) => e.preventDefault());
  // A drag shouldn't open the lightbox.
  strip.addEventListener("click", (e) => moved && (e.preventDefault(), e.stopPropagation()), true);

  if (speed && period) {
    let last = performance.now();
    let resumeAt = 0;
    strip.addEventListener("touchstart", () => (resumeAt = Infinity), { passive: true });
    strip.addEventListener("touchend", () => (resumeAt = performance.now() + 1500), { passive: true });
    const tick = (now) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      if (!down && !hover && now > resumeAt && !lightboxOpen()) {
        pos -= speed * dt;
        if (pos >= period) pos -= period;
        if (pos < 0) pos += period;
        strip.scrollLeft = pos;
      } else {
        pos = strip.scrollLeft % period;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

// ---- Lightbox ---------------------------------------------------------------------------------
for (const gallery of document.querySelectorAll(".gal")) {
  // Some strips were captured with the original's own loop copies; the lightbox shows each
  // picture once, and a repeat opens the first one (below).
  const seen = new Set();
  for (const item of gallery.querySelectorAll("a.gal-item:not([data-clone])")) {
    if (seen.has(item.getAttribute("href"))) item.dataset.clone = "1";
    seen.add(item.getAttribute("href"));
  }
  const lightbox = new PhotoSwipeLightbox({ gallery, children: "a.gal-item:not([data-clone])", pswpModule: () => import("photoswipe"), bgOpacity: 0.92 });
  lightbox.init();
  // Clicking a looped copy opens the matching original.
  gallery.addEventListener("click", (e) => {
    const clone = e.target.closest("a.gal-item[data-clone]");
    if (!clone) return;
    e.preventDefault();
    const originals = [...gallery.querySelectorAll("a.gal-item:not([data-clone])")];
    const index = originals.findIndex((a) => a.getAttribute("href") === clone.getAttribute("href"));
    if (index >= 0) lightbox.loadAndOpen(index, { gallery });
  });
}
for (const view of document.querySelectorAll(".view")) {
  if (view.querySelector("a.zoom")) new PhotoSwipeLightbox({ gallery: view, children: "a.zoom", pswpModule: () => import("photoswipe"), bgOpacity: 0.92 }).init();
}

// ---- Entrance animations start when their element scrolls into view -----------------------------
const entering = [...document.querySelectorAll(".enter")];
if (entering.length) {
  // Position comes from layout (offsetTop), not from the painted box: at frame 0 an element may
  // be clipped, shrunk or shifted far away.
  const release = () => {
    const z = zoom();
    for (const el of entering) {
      if (el.classList.contains("go") || !el.offsetParent) continue;
      const top = el.offsetParent.getBoundingClientRect().top + el.offsetTop * z;
      if (reduceMotion || (top < innerHeight * 0.92 && top + el.offsetHeight * z > 0)) el.classList.add("go");
    }
  };
  addEventListener("scroll", release, { passive: true });
  addEventListener("resize", release);
  release();
}

// ---- Pictures that follow the pointer ("track mouse") -------------------------------------------
// The original's rule, per axis: shift = distance (data-mouse) × the pointer's offset from where
// the picture rests on screen ÷ that point's distance to the farther edge of the window. Until
// the pointer moves it counts as being in the middle of the window. (data-mouse-inset: ZHAENG
// was measured with Wix's 50px banner above the page; keep its pictures where they sat.)
const trackers = [...document.querySelectorAll("[data-mouse]")];
if (trackers.length) {
  const rest = new Map();
  let shown = [], pointer = null;
  const still = (el, fn) => {
    el.style.transition = "none";
    fn();
    void el.offsetWidth;
    el.style.transition = "";
  };
  const measure = () => {
    shown = trackers.filter((el) => el.offsetParent);
    for (const el of shown) {
      const was = el.style.translate;
      still(el, () => {
        el.style.translate = "none";
        const r = el.getBoundingClientRect();
        rest.set(el, [r.left + scrollX + r.width / 2, r.top + scrollY + r.height / 2]);
        el.style.translate = was;
      });
    }
  };
  const place = (px, py, instantly) => {
    for (const el of shown) {
      const [x, y] = rest.get(el), cx = x - scrollX, cy = y - scrollY + Number(el.dataset.mouseInset || 0), d = Number(el.dataset.mouse);
      const to = `${((d * (px - cx)) / Math.max(cx, innerWidth - cx)).toFixed(1)}px ${((d * (py - cy)) / Math.max(cy, innerHeight - cy)).toFixed(1)}px`;
      if (instantly) still(el, () => (el.style.translate = to));
      else el.style.translate = to;
    }
  };
  const settle = () => {
    measure();
    place(...(pointer || [innerWidth / 2, innerHeight / 2]), true);
  };
  for (const el of trackers) el.style.setProperty("--mouse-ms", (el.dataset.mouseMs || 500) + "ms");
  settle();
  addEventListener("resize", settle);
  if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", (e) => {
      pointer = [e.clientX, e.clientY];
      place(e.clientX, e.clientY);
    }, { passive: true });
  }
}

// ---- Pictures that drift with the scroll position ----------------------------------------------
const drifters = [...document.querySelectorAll("[data-scroll-k]")];
if (drifters.length && !reduceMotion) {
  const place = () => {
    const z = zoom();
    for (const el of drifters) if (el.offsetParent) el.style.translate = `0 ${((scrollY * Number(el.dataset.scrollK)) / z).toFixed(1)}px`;
  };
  addEventListener("scroll", place, { passive: true });
  place();
}

// ---- Looping animations that run faster under the pointer (the logo on /notice) ------------------
// The picture turns edge-on as it spins, so a still copy of its box is what catches the pointer.
for (const el of document.querySelectorAll("[data-rate]")) {
  const hot = document.createElement("div");
  hot.className = "n";
  for (const p of ["left", "top", "width", "height"]) hot.style[p] = el.style[p];
  el.after(hot);
  const rate = (r) => el.getAnimations().forEach((a) => a.updatePlaybackRate(r));
  hot.addEventListener("pointerenter", () => rate(Number(el.dataset.rate)));
  hot.addEventListener("pointerleave", () => rate(1));
}

// ---- Phone menu ---------------------------------------------------------------------------------
for (const btn of document.querySelectorAll("[data-menu]")) {
  const panel = btn.nextElementSibling;
  if (!panel) continue;
  const set = (open) => {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", () => set(true));
  panel.querySelector(".menu-close")?.addEventListener("click", () => set(false));
  addEventListener("keydown", (e) => e.key === "Escape" && set(false));
}

// ---- Videos that play by themselves never stop -------------------------------------------------
// Nothing on the page pauses them; this starts them again when the browser does (a hidden tab, a
// media key, a phone that refuses to start a video before the first touch).
const always = [...document.querySelectorAll("video[autoplay]")];
const keepPlaying = () => !document.hidden && always.forEach((v) => v.paused && v.getClientRects().length && v.play().catch(() => {}));
always.forEach((v) => v.addEventListener("pause", () => setTimeout(keepPlaying, 200)));
addEventListener("pageshow", keepPlaying);
addEventListener("pointerdown", keepPlaying, { passive: true });
document.addEventListener("visibilitychange", keepPlaying);

// ---- Video boxes: click to play or pause, with a sound switch -----------------------------------
for (const box of document.querySelectorAll("[data-vbox]")) {
  const video = box.querySelector("video");
  if (!video || video.autoplay) continue;
  const sync = () => {
    box.classList.toggle("playing", !video.paused);
    box.classList.toggle("sound", !video.muted);
  };
  ["play", "pause", "volumechange", "ended"].forEach((ev) => video.addEventListener(ev, sync));
  box.addEventListener("click", (e) => {
    if (e.target.closest(".vb-sound")) {
      video.muted = !video.muted;
      return;
    }
    if (video.paused) {
      // One box at a time, like the original.
      document.querySelectorAll("[data-vbox] video").forEach((v) => v !== video && !v.autoplay && v.pause());
      video.play().catch(() => {});
    } else video.pause();
  });
  sync();
}

// ---- YouTube thumbnails switch the player on the same page -------------------------------------
for (const thumb of document.querySelectorAll("a[data-yt]")) {
  thumb.addEventListener("click", (e) => {
    const frame = thumb.closest(".view")?.querySelector("iframe[data-yt-frame]");
    if (!frame) return;
    e.preventDefault();
    frame.src = `https://www.youtube-nocookie.com/embed/${thumb.dataset.yt}?rel=0&playsinline=1&autoplay=1`;
    frame.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

// ---- Forms ------------------------------------------------------------------------------------
const note = document.querySelector(".form-note");
const say = (text) => {
  if (!note) return;
  note.textContent = text;
  clearTimeout(say.timer);
  say.timer = setTimeout(() => (note.textContent = ""), 6000);
};
for (const form of document.querySelectorAll("form[data-form]")) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const body = { form: form.dataset.form, page: location.pathname };
    for (const [key, value] of new FormData(form)) body[key] = body[key] ? `${body[key]}, ${value}` : value;
    const button = form.querySelector("button[type='submit']");
    if (button) button.disabled = true;
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        form.reset();
        say("thank you!");
      } else {
        // The API answers in short plain sentences; anything else (an error page) gets a generic note.
        const text = (res.headers.get("content-type") || "").startsWith("text/plain") ? (await res.text()).slice(0, 160) : "";
        say(text || "Couldn't send right now — please try again later.");
      }
    } catch {
      say("Couldn't send right now — please check your connection.");
    }
    if (button) button.disabled = false;
  });
}

// ---- Dispersing grid ---------------------------------------------------------------------------
// The home page's video shows through a mask of tilted tiles. Near the pointer those tiles come
// apart: each is pushed away, turned and shrunk, on a spring, so they bounce back into the grid
// once the pointer leaves. While the grid is whole the original masked video shows; while it is
// moving, the tiles are drawn on a canvas from the same video.
function tilePoints(d) {
  const t = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)/g) || [];
  const pts = [];
  let x = 0, y = 0, sx = 0, sy = 0, cmd = "M", i = 0;
  const num = () => Number(t[i++]);
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case "M": case "L": {
        const a = num(), b = num();
        x = rel ? x + a : a; y = rel ? y + b : b;
        if (cmd.toUpperCase() === "M") { sx = x; sy = y; cmd = rel ? "l" : "L"; }
        break;
      }
      case "H": { const a = num(); x = rel ? x + a : a; break; }
      case "V": { const a = num(); y = rel ? y + a : a; break; }
      case "Z": x = sx; y = sy; continue;
      default: i++; continue;
    }
    pts.push([x, y]);
  }
  return pts;
}

for (const box of reduceMotion ? [] : document.querySelectorAll("[data-disperse]")) {
  const video = box.querySelector("video");
  const svg = decodeURIComponent(box.style.maskImage || box.style.webkitMaskImage || "");
  const vb = (svg.match(/viewBox='([^']+)'/) || [])[1]?.split(/[\s,]+/).map(Number);
  const ds = [...svg.matchAll(/ d='([^']+)'/g)].map((m) => m[1]);
  if (!video || !vb || !ds.length) continue;

  const W = box.offsetWidth, H = box.offsetHeight;
  const M = Math.round(Math.max(W, H) * 0.35); // room around the grid for tiles to fly into
  const fx = W / vb[2], fy = H / vb[3];
  const toBox = new DOMMatrix([fx, 0, 0, fy, -vb[0] * fx, -vb[1] * fy]);
  const tiles = ds.map((d, k) => {
    const path = new Path2D();
    path.addPath(new Path2D(d), toBox);
    const pts = tilePoints(d).map(([px, py]) => [(px - vb[0]) * fx, (py - vb[1]) * fy]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    // A fixed bit of character per tile so the scatter looks thrown rather than pushed.
    const r = Math.sin(k * 12.9898) * 43758.5453;
    const seed = r - Math.floor(r);
    return { path, cx, cy, spin: seed < 0.5 ? -1 : 1, kick: 0.75 + seed * 0.5, skew: (seed - 0.5) * 0.9, x: 0, y: 0, a: 0, s: 0, vx: 0, vy: 0, va: 0, vs: 0 };
  });

  const canvas = document.createElement("canvas");
  canvas.className = "n disperse";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { left: `${box.offsetLeft - M}px`, top: `${box.offsetTop - M}px`, width: `${W + 2 * M}px`, height: `${H + 2 * M}px` });
  box.after(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const pointer = { x: 0, y: 0, in: false, speed: 0 };
  let raf = 0;
  const R = Math.max(W, H) * 0.26; // how far from the pointer tiles still feel it

  const local = (e) => {
    const rect = canvas.getBoundingClientRect();
    const k = canvas.offsetWidth / rect.width;
    return [(e.clientX - rect.left) * k - M, (e.clientY - rect.top) * k - M];
  };
  const onMove = (e) => {
    const [x, y] = local(e);
    const inside = x > -R * 0.4 && y > -R * 0.4 && x < W + R * 0.4 && y < H + R * 0.4;
    if (pointer.in && inside) pointer.speed = Math.min(1, pointer.speed * 0.6 + Math.hypot(x - pointer.x, y - pointer.y) / 60);
    pointer.x = x; pointer.y = y; pointer.in = inside;
    if (inside) start();
  };
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", (e) => { onMove(e); if (pointer.in) pointer.speed = 1; }, { passive: true });
  document.addEventListener("pointerleave", () => (pointer.in = false));
  addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") pointer.in = false; });

  const start = () => {
    if (raf) return;
    canvas.width = Math.round((W + 2 * M) * dpr);
    canvas.height = Math.round((H + 2 * M) * dpr);
    raf = requestAnimationFrame(step);
  };

  function step() {
    raf = 0;
    pointer.speed *= 0.94;
    let moving = 0;
    for (const t of tiles) {
      let tx = 0, ty = 0, ta = 0, ts = 0;
      if (pointer.in) {
        const dx = t.cx - pointer.x, dy = t.cy - pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - dist / R) ** 1.6 * t.kick * (1 + pointer.speed * 0.4);
        if (f > 0) {
          // Away from the pointer, bent a little to the side so neighbours don't move as one.
          const ux = dx / dist, uy = dy / dist;
          const push = f * R * 0.4;
          tx = (ux - uy * t.skew) * push;
          ty = (uy + ux * t.skew) * push;
          ta = t.spin * f * 0.45;
          ts = -f * 0.2;
        }
      }
      t.vx = (t.vx + (tx - t.x) * 0.09) * 0.8;
      t.vy = (t.vy + (ty - t.y) * 0.09) * 0.8;
      t.va = (t.va + (ta - t.a) * 0.09) * 0.8;
      t.vs = (t.vs + (ts - t.s) * 0.09) * 0.8;
      t.x += t.vx; t.y += t.vy; t.a += t.va; t.s += t.vs;
      moving += Math.abs(t.x) + Math.abs(t.y) + Math.abs(t.a) * 40 + Math.abs(t.s) * 40 + Math.abs(t.vx) + Math.abs(t.vy);
    }

    const ready = video.readyState >= 2;
    const settled = !pointer.in && moving < 0.5;
    if (settled || !ready) {
      for (const t of tiles) Object.assign(t, { x: 0, y: 0, a: 0, s: 0, vx: 0, vy: 0, va: 0, vs: 0 });
      box.classList.remove("apart");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Cover-fit the video into the grid's box, as the original element does.
    const vw = video.videoWidth, vh = video.videoHeight;
    const k = Math.max(W / vw, H / vh);
    const dw = vw * k, dh = vh * k, dx = (W - dw) / 2, dy = (H - dh) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const t of tiles) {
      const s = 1 + t.s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(M + t.cx + t.x, M + t.cy + t.y);
      ctx.rotate(t.a);
      ctx.scale(s, s);
      ctx.translate(-t.cx, -t.cy);
      ctx.save();
      ctx.clip(t.path);
      ctx.drawImage(video, dx, dy, dw, dh);
      ctx.restore();
    }
    box.classList.add("apart");
    raf = requestAnimationFrame(step);
  }
}
