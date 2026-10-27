// yezhang.net chat bubble. Load with:
//   <script src="https://<deployment>/widget.js" defer></script>
// Talks to /api/chat on the same deployment the script was loaded from.
(function () {
  if (window.__yzChatLoaded) return;
  window.__yzChatLoaded = true;

  var script = document.currentScript;
  var API = new URL("/api/chat", script ? script.src : location.href).href;
  var STORE_KEY = "yz-chat-v1";
  var EMAIL = "yezhang1@upenn.edu";
  var GREETING = "anything…";
  var REDUCED = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  var history = [];
  try {
    history = JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]");
  } catch (e) {}
  function save() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-20)));
    } catch (e) {}
  }

  var host = document.createElement("div");
  host.id = "yz-chat";
  host.style.cssText = "position:fixed;z-index:2147483000;right:0;bottom:0;";
  var root = host.attachShadow({ mode: "open" });

  var EASE = "cubic-bezier(.22,1,.36,1)";
  root.innerHTML =
    "<style>" +
    ":host{--ink:#111;--mute:#8a8a8a;--line:rgba(0,0,0,.08);--glass:rgba(255,255,255,.78);" +
    "font-family:'helvetica-w01-roman','Helvetica Neue',Helvetica,Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;}" +
    "*{box-sizing:border-box;margin:0;padding:0;font:inherit;}" +
    "button{-webkit-tap-highlight-color:transparent;}" +
    // the orb button
    ".bubble{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;" +
    "background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 6px 24px rgba(0,0,0,.18);transition:transform .35s " + EASE + ";}" +
    ".bubble:hover{transform:scale(1.08);}.bubble:active{transform:scale(.94);}" +
    ".bubble svg{width:24px;height:24px;}" +
    ".bubble canvas{display:none;width:56px;height:56px;}" +
    ".bubble.orb{background:transparent;box-shadow:none;}" +
    ".bubble.orb svg{display:none;}.bubble.orb canvas{display:block;}" +
    "button:focus-visible{outline:2px solid var(--ink);outline-offset:3px;}" +
    // No box: the conversation is written straight onto a white haze that spreads out of the orb
    // and fades into the page with no edge. The haze is a pseudo-element so the text stays crisp.
    ".panel{position:fixed;right:0;bottom:0;width:min(600px,100vw);height:min(780px,100vh);" +
    "padding:56px 40px 30px 150px;display:flex;flex-direction:column;color:var(--ink);pointer-events:none;}" +
    // The haze's box is larger than its fade, so it reaches nothing before any edge.
    ".panel::before{content:'';position:absolute;right:-40px;bottom:-40px;width:1200px;height:1200px;z-index:-1;pointer-events:none;" +
    "background:radial-gradient(circle at 100% 100%,#fff 0,#fff 620px,rgba(255,255,255,.88) 760px,rgba(255,255,255,.45) 920px,rgba(255,255,255,0) 1120px);" +
    "clip-path:circle(0px at calc(100% - 92px) calc(100% - 92px));transition:clip-path .45s ease-in;}" +
    ".panel.open::before{clip-path:circle(1200px at calc(100% - 92px) calc(100% - 92px));transition:clip-path 1s " + EASE + ";}" +
    ".panel>*{opacity:0;transform:translateY(12px);filter:blur(4px);" +
    "transition:opacity .25s ease,transform .25s ease,filter .25s ease;}" +
    ".panel.open>*{opacity:1;transform:none;filter:none;pointer-events:auto;" +
    "transition:opacity .6s ease,transform .8s " + EASE + ",filter .6s ease;}" +
    ".panel.open>.head{transition-delay:.25s;}.panel.open>.log{transition-delay:.15s;}" +
    ".panel.open>.form{transition-delay:.05s;}.panel.open>.foot{transition-delay:.3s;}" +
    // header: a whisper, not a bar
    ".head{display:flex;align-items:center;gap:10px;}" +
    ".head canvas{width:28px;height:28px;flex:none;}" +
    ".who{flex:1;min-width:0;}" +
    ".title{font-family:'helvetica-w01-bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;font-size:12px;letter-spacing:.16em;text-transform:uppercase;}" +
    ".sub{font-size:12px;color:var(--mute);margin-top:1px;}" +
    ".close{width:28px;height:28px;border:none;background:none;cursor:pointer;color:var(--mute);" +
    "display:flex;align-items:center;justify-content:center;transition:color .2s,transform .4s " + EASE + ";}" +
    ".close:hover{color:var(--ink);transform:rotate(90deg);}" +
    ".close svg{width:14px;height:14px;}" +
    // conversation: plain words on the page; older lines dissolve at the top
    ".log{flex:1;overflow-y:auto;padding:40px 0 16px;display:flex;flex-direction:column;gap:18px;font-size:16px;line-height:1.6;" +
    "scrollbar-width:none;overscroll-behavior:contain;" +
    "-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 64px);mask-image:linear-gradient(to bottom,transparent 0,#000 64px);}" +
    ".log::-webkit-scrollbar{display:none;}" +
    ".log>:first-child{margin-top:auto;}" +
    ".msg{white-space:pre-wrap;word-wrap:break-word;animation:ink .9s " + EASE + " both;}" +
    ".msg.bot{align-self:flex-start;max-width:100%;}" +
    ".msg.user{align-self:flex-end;max-width:85%;text-align:right;color:var(--mute);font-style:italic;}" +
    ".msg.err{align-self:flex-start;color:var(--mute);font-size:14px;}" +
    ".msg a{color:inherit;text-decoration:underline;text-decoration-thickness:1px;text-decoration-color:rgba(0,0,0,.3);text-underline-offset:4px;}" +
    ".msg a:hover{text-decoration-color:currentColor;}" +
    ".thinking{display:flex;align-items:center;gap:8px;color:var(--mute);font-size:14px;}" +
    ".thinking canvas{width:22px;height:22px;}" +
    "@keyframes ink{from{opacity:0;transform:translateY(6px);filter:blur(6px);}}" +
    // composer: a bare line of writing beside the orb
    ".form{display:flex;align-items:flex-end;gap:10px;margin-right:72px;padding:10px 0;" +
    "border-bottom:1px solid rgba(0,0,0,.12);transition:border-color .3s;}" +
    ".form:focus-within{border-bottom-color:var(--ink);}" +
    "textarea{flex:1;resize:none;border:none;padding:4px 0;font-size:16px;line-height:1.5;max-height:120px;" +
    "color:var(--ink);background:transparent;outline:none;caret-color:var(--ink);}" +
    "textarea::placeholder{color:var(--mute);font-style:italic;}" +
    ".send{flex:none;width:28px;height:28px;border:none;background:none;color:var(--ink);cursor:pointer;" +
    "display:flex;align-items:center;justify-content:center;transition:transform .3s " + EASE + ",opacity .3s;}" +
    ".send:hover:not(:disabled){transform:translateY(-2px);}" +
    ".send:disabled{opacity:0;cursor:default;}" +
    ".send svg{width:18px;height:18px;}" +
    ".foot{font-size:10.5px;color:var(--mute);padding:10px 72px 0 0;}" +
    ".foot a{color:inherit;}" +
    "@media (max-width:480px){.panel{width:100%;height:100%;padding:24px 20px 16px;}" +
    ".panel::before{inset:0;width:auto;height:auto;background:rgba(255,255,255,.97);" +
    "clip-path:circle(0px at calc(100% - 44px) calc(100% - 44px));}" +
    ".panel.open::before{clip-path:circle(150% at calc(100% - 44px) calc(100% - 44px));}" +
    ".bubble{right:16px;bottom:16px;}.form,.foot{margin-right:64px;padding-right:0;}}" +
    "@media (prefers-reduced-motion:reduce){*,.panel::before,.panel.open::before{transition:none !important;animation:none !important;}}" +
    "</style>" +
    '<div class="panel" role="dialog" aria-label="Chat with Ye\'s assistant">' +
    '<div class="head"><canvas aria-hidden="true"></canvas>' +
    '<div class="who"><div class="title">ye\'s assistant</div><div class="sub">ask anything about the site</div></div>' +
    '<button class="close" aria-label="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
    '<path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="log" aria-live="polite"></div>' +
    '<form class="form"><textarea rows="1" maxlength="1000" placeholder="say something…" aria-label="Message"></textarea>' +
    '<button class="send" type="submit" aria-label="Send" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form>' +
    '<div class="foot">AI replies can be wrong · for anything important, email <a href="mailto:' + EMAIL + '">' + EMAIL + "</a></div>" +
    "</div>" +
    '<button class="bubble" aria-label="Open chat" aria-expanded="false">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/></svg>' +
    '<canvas aria-hidden="true"></canvas></button>';

  var panel = root.querySelector(".panel");
  var bubble = root.querySelector(".bubble");
  var sub = root.querySelector(".sub");
  var log = root.querySelector(".log");
  var form = root.querySelector(".form");
  var input = root.querySelector("textarea");
  var send = root.querySelector(".send");
  var busy = false;

  // ---- thinking orbs (thinking-orbs engine, vendored; no React) ----
  // Every orb is black dots on a transparent ground: depth comes from opacity, not grey,
  // so the far side fades into whatever page sits behind it. One rAF loop drives them all.
  var engine = null;
  var orbs = [];
  var raf = 0;
  var enginePromise = import(new URL("/vendor/thinking-orbs/engine.js", API).href).then(function (m) {
    engine = m;
    orbs.forEach(setup);
    tick();
    return m;
  });
  enginePromise.catch(function () {});

  // preset: 64 (avatar) or 20 (inline) tuning; px: the CSS size it is drawn at.
  function orb(canvas, state, preset, px) {
    var o = { canvas: canvas, state: state, preset: preset, px: px, ctx: canvas.getContext && canvas.getContext("2d") };
    if (!o.ctx) return null;
    o.set = function (s) {
      if (o.state === s) return;
      o.state = s;
      if (engine) setup(o);
    };
    o.remove = function () {
      orbs.splice(orbs.indexOf(o), 1);
    };
    orbs.push(o);
    if (engine) {
      setup(o);
      if (!raf) tick();
    }
    return o;
  }

  function setup(o) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    o.canvas.width = o.canvas.height = Math.round(o.px * dpr);
    o.scale = (dpr * o.px) / o.preset;
    var p = engine.r(o.state, o.preset); // resolvePreset
    o.frame = engine.M[p.mode]; // MODE_FRAMES
    o.opts = p.opts;
    o.speed = p.speed;
    o.ready = true;
    if (o.onready) o.onready();
  }

  function ink(w, a) {
    w = Math.min(1, Math.max(0, w));
    return "rgba(0,0,0," + (a == null ? 1 : a) * (1 - 0.8 * w) + ")";
  }

  function draw(o, t) {
    var ctx = o.ctx;
    var f = o.frame(o.preset, t * o.speed, o.opts);
    ctx.setTransform(o.scale, 0, 0, o.scale, 0, 0);
    ctx.clearRect(0, 0, o.preset, o.preset);
    for (var i = 0; i < f.lines.length; i++) {
      var l = f.lines[i];
      ctx.strokeStyle = ink(l.white, l.a);
      ctx.lineWidth = l.w;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    }
    for (var j = 0; j < f.dots.length; j++) {
      var d = f.dots[j];
      ctx.fillStyle = ink(d.white, d.a);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick() {
    var t = REDUCED ? 0.6 : performance.now() / 1000;
    orbs.forEach(function (o) {
      if (o.ready) draw(o, t);
    });
    raf = REDUCED || document.visibilityState === "hidden" ? 0 : requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange", function () {
    cancelAnimationFrame(raf);
    raf = 0;
    if (engine && document.visibilityState !== "hidden") tick();
  });

  // The button is the "solving" orb; the speech-bubble icon stays as the fallback.
  var bubbleOrb = orb(bubble.querySelector("canvas"), "solving", 64, 56);
  if (bubbleOrb) bubbleOrb.onready = function () { bubble.classList.add("orb"); };
  // The header orb mirrors what the assistant is doing.
  var headOrb = orb(root.querySelector(".head canvas"), "listening", 20, 34);
  function status(state, text) {
    if (headOrb) headOrb.set(state);
    sub.textContent = text;
  }

  // ---- messages ----

  // Plain text with bare URLs turned into links; never injects HTML.
  function render(el, text) {
    el.textContent = "";
    var re = /https?:\/\/[^\s)]+/g;
    var last = 0, m;
    while ((m = re.exec(text))) {
      var url = m[0].replace(/[.,;:!?'"]+$/, "");
      el.appendChild(document.createTextNode(text.slice(last, m.index)));
      var a = document.createElement("a");
      a.href = url;
      a.textContent = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      if (!/^https?:\/\/(www\.)?yezhang\.net/.test(url)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      el.appendChild(a);
      last = m.index + url.length;
    }
    el.appendChild(document.createTextNode(text.slice(last)));
  }

  function add(role, text) {
    var el = document.createElement("div");
    el.className = "msg " + role;
    render(el, text);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function paint() {
    log.textContent = "";
    add("bot", GREETING);
    history.forEach(function (m) {
      add(m.role === "user" ? "user" : "bot", m.content);
    });
  }

  function toggle(open) {
    panel.classList.toggle("open", open);
    bubble.setAttribute("aria-expanded", String(open));
    bubble.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    if (open) setTimeout(function () { input.focus(); }, 250);
  }

  bubble.addEventListener("click", function () {
    toggle(!panel.classList.contains("open"));
  });
  root.querySelector(".close").addEventListener("click", function () {
    toggle(false);
    bubble.focus();
  });
  panel.addEventListener("keydown", function (e) {
    if (e.key === "Escape") toggle(false);
  });

  function sync() {
    send.disabled = busy || !input.value.trim();
  }
  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
    sync();
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;
    busy = true;
    input.value = "";
    input.style.height = "auto";
    sync();

    history.push({ role: "user", content: text });
    add("user", text);

    // Placeholder: a small solving orb until the first words arrive.
    var el = document.createElement("div");
    el.className = "msg bot thinking";
    el.innerHTML = '<canvas aria-hidden="true"></canvas><span>thinking</span>';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    var inline = orb(el.querySelector("canvas"), "solving", 20, 22);
    status("solving", "thinking…");

    var answer = "";
    try {
      var res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, page: { path: location.pathname, title: document.title } }),
      });
      if (!res.ok || !res.body) {
        var msg = await res.text().catch(function () { return ""; });
        throw new Error(res.status < 500 && msg.length < 200 ? msg : "");
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      for (;;) {
        var chunk = await reader.read();
        if (chunk.done) break;
        answer += decoder.decode(chunk.value, { stream: true });
        if (inline) {
          inline.remove();
          inline = null;
          el.className = "msg bot";
          status("composing", "writing…");
        }
        render(el, answer);
        log.scrollTop = log.scrollHeight;
      }
      if (!answer) throw new Error("");
      history.push({ role: "assistant", content: answer });
      save();
    } catch (err) {
      history.pop();
      el.remove();
      add("err", (err && err.message) || "couldn't reach the assistant — try again in a moment.");
    } finally {
      if (inline) inline.remove();
      status("listening", "ask anything about the site");
      busy = false;
      sync();
      input.focus();
    }
  });

  paint();
  (document.body || document.documentElement).appendChild(host);
})();
