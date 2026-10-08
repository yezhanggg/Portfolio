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

// ---- Elements that follow the pointer ("track mouse") -------------------------------------------
// Each one shifts by a multiple of the pointer's offset from its own resting centre.
const trackers = [...document.querySelectorAll("[data-mouse]")].filter((el) => el.offsetParent);
if (trackers.length && !reduceMotion && matchMedia("(pointer: fine)").matches) {
  const rest = new Map();
  const measure = () => {
    for (const el of trackers) {
      el.style.translate = "none";
      const r = el.getBoundingClientRect();
      rest.set(el, [r.left + scrollX + r.width / 2, r.top + scrollY + r.height / 2]);
      el.style.translate = "";
    }
  };
  for (const el of trackers) el.style.setProperty("--mouse-ms", (el.dataset.mouseMs || 500) + "ms");
  measure();
  addEventListener("resize", measure);
  addEventListener("pointermove", (e) => {
    const z = zoom();
    for (const el of trackers) {
      const [cx, cy] = rest.get(el);
      const kx = Number(el.dataset.mouse), ky = Number(el.dataset.mouseY || kx * 1.53);
      el.style.translate = `${(((e.clientX + scrollX - cx) * kx) / z).toFixed(1)}px ${(((e.clientY + scrollY - cy) * ky) / z).toFixed(1)}px`;
    }
  }, { passive: true });
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

// ---- Video boxes: click to play or pause, with a sound switch -----------------------------------
for (const box of document.querySelectorAll("[data-vbox]")) {
  const video = box.querySelector("video");
  if (!video) continue;
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
