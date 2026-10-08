// Client-side behaviour for the page canvases: zine slideshows, gallery strips + lightbox, forms.
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

// ---- Slideshows ------------------------------------------------------------------------------
for (const show of document.querySelectorAll("[data-slideshow]")) {
  const slides = [...show.querySelectorAll(":scope > .slide")];
  const dots = [...show.querySelectorAll(".show-dots .dot")];
  if (slides.length < 2) continue;
  let current = 0;
  const go = (i) => {
    const next = (i + slides.length) % slides.length;
    slides[current].classList.remove("on");
    slides[current].setAttribute("aria-hidden", "true");
    dots[current]?.classList.remove("on");
    current = next;
    slides[current].classList.add("on");
    slides[current].removeAttribute("aria-hidden");
    dots[current]?.classList.add("on");
    // Warm the following slide so flipping stays instant.
    slides[(current + 1) % slides.length].querySelectorAll("img[loading='lazy']").forEach((img) => (img.loading = "eager"));
  };
  show.querySelector(".show-nav.prev")?.addEventListener("click", () => go(current - 1));
  show.querySelector(".show-nav.next")?.addEventListener("click", () => go(current + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => go(i)));

  let startX = null;
  show.addEventListener("pointerdown", (e) => (startX = e.clientX));
  show.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
  });
  // Galleries that flipped pages on their own keep doing so; pause while the pointer is over them.
  const auto = Number(show.dataset.auto || 0);
  if (auto && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let paused = false;
    show.addEventListener("pointerenter", () => (paused = true));
    show.addEventListener("pointerleave", () => (paused = false));
    setInterval(() => !paused && !document.querySelector(".pswp--open") && show.offsetParent && go(current + 1), Math.max(auto, 3500));
  }
  show.tabIndex = 0;
  show.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(current - 1);
    if (e.key === "ArrowRight") go(current + 1);
  });
  go(0);
}

// ---- Gallery strips: start where the original did, drag to scroll ------------------------------
for (const strip of document.querySelectorAll(".gal.scrolls")) {
  const start = Number(strip.dataset.start || 0);
  if (start) strip.scrollLeft = start;
  let down = null;
  let moved = false;
  strip.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    down = { x: e.clientX, left: strip.scrollLeft };
    moved = false;
  });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    const zoom = Number(getComputedStyle(document.documentElement).getPropertyValue("--z")) || 1;
    const dx = (e.clientX - down.x) / zoom;
    if (Math.abs(dx) > 4) moved = true;
    strip.scrollLeft = down.left - dx;
  });
  addEventListener("pointerup", () => (down = null));
  // A drag shouldn't open the lightbox.
  strip.addEventListener("click", (e) => moved && (e.preventDefault(), e.stopPropagation()), true);
}

// ---- Lightbox ---------------------------------------------------------------------------------
for (const gallery of document.querySelectorAll(".gal")) {
  new PhotoSwipeLightbox({ gallery, children: "a.gal-item", pswpModule: () => import("photoswipe"), bgOpacity: 0.92 }).init();
}
for (const view of document.querySelectorAll(".view")) {
  if (view.querySelector("a.zoom")) new PhotoSwipeLightbox({ gallery: view, children: "a.zoom", pswpModule: () => import("photoswipe"), bgOpacity: 0.92 }).init();
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
