// Client-side behaviour for the page canvases: zine slideshows, gallery strips + lightbox, forms,
// and the motion carried over from the original site (entrances, drift, pointer tracking).
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

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
