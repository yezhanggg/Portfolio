// yezhang.net chat bubble. Load with:
//   <script src="https://<deployment>/widget.js" defer></script>
// Talks to /api/chat on the same deployment the script was loaded from.
(function () {
  if (window.__yzChatLoaded) return;
  window.__yzChatLoaded = true;

  var script = document.currentScript;
  var API = new URL("/api/chat", script ? script.src : location.href).href;
  var STORE_KEY = "yz-chat-v1";
  var GREETING = "hi — i'm the little assistant on ye's site. ask me about the work, the zines, the photos, or how to get in touch.";

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

  root.innerHTML =
    "<style>" +
    ":host{--ink:#282626;--mute:#8F8F8F;--line:#C7C7C7;--paper:#FFFFFF;--soft:#F4F4F4;" +
    "font-family:'din-next-w01-light','Helvetica Neue',Helvetica,Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;}" +
    "*{box-sizing:border-box;margin:0;padding:0;font:inherit;}" +
    ".bubble{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;" +
    "background:var(--ink);color:var(--paper);display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 6px 24px rgba(0,0,0,.18);transition:transform .2s ease;}" +
    ".bubble:hover{transform:scale(1.06);}" +
    ".bubble:focus-visible,.send:focus-visible,.close:focus-visible{outline:2px solid var(--mute);outline-offset:3px;}" +
    ".bubble svg{width:24px;height:24px;}" +
    ".panel{position:fixed;right:24px;bottom:92px;width:360px;height:520px;max-height:calc(100vh - 120px);" +
    "background:var(--paper);color:var(--ink);border:1px solid var(--ink);display:flex;flex-direction:column;" +
    "box-shadow:0 12px 40px rgba(0,0,0,.14);opacity:0;transform:translateY(12px);pointer-events:none;" +
    "transition:opacity .2s ease,transform .2s ease;}" +
    ".panel.open{opacity:1;transform:none;pointer-events:auto;}" +
    ".head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--line);}" +
    ".title{font-family:'helvetica-w01-bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;font-size:13px;letter-spacing:.14em;}" +
    ".sub{font-size:11px;color:var(--mute);letter-spacing:.06em;margin-top:2px;}" +
    ".close{background:none;border:none;cursor:pointer;color:var(--mute);font-size:20px;line-height:1;padding:4px 6px;}" +
    ".close:hover{color:var(--ink);}" +
    ".log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;font-size:14px;line-height:1.5;}" +
    ".msg{max-width:85%;white-space:pre-wrap;word-wrap:break-word;}" +
    ".msg.bot{align-self:flex-start;color:var(--ink);}" +
    ".msg.user{align-self:flex-end;background:var(--ink);color:var(--paper);padding:8px 12px;}" +
    ".msg.err{align-self:flex-start;color:var(--mute);font-style:italic;}" +
    ".msg a{color:inherit;text-decoration:underline;text-underline-offset:2px;}" +
    ".dots::after{content:'···';letter-spacing:.2em;color:var(--mute);animation:blink 1.2s infinite;}" +
    "@keyframes blink{50%{opacity:.3;}}" +
    ".form{display:flex;align-items:flex-end;gap:8px;padding:12px 16px 14px;border-top:1px solid var(--line);}" +
    "textarea{flex:1;resize:none;border:none;border-bottom:1px solid var(--line);padding:6px 0;font-size:14px;line-height:1.4;" +
    "max-height:96px;color:var(--ink);background:transparent;outline:none;}" +
    "textarea:focus{border-bottom-color:var(--ink);}" +
    "textarea::placeholder{color:var(--mute);}" +
    ".send{border:1px solid var(--ink);background:var(--ink);color:var(--paper);cursor:pointer;font-size:11px;letter-spacing:.14em;" +
    "padding:8px 12px;}" +
    ".send:disabled{background:var(--paper);color:var(--mute);border-color:var(--line);cursor:default;}" +
    ".foot{font-size:10px;color:var(--mute);text-align:center;padding:0 16px 10px;letter-spacing:.04em;}" +
    "@media (max-width:480px){.panel{right:0;left:0;bottom:0;width:100%;height:100%;max-height:none;border:none;}" +
    ".bubble{right:16px;bottom:16px;}.panel.open~.bubble{display:none;}}" +
    "@media (prefers-reduced-motion:reduce){.panel,.bubble{transition:none;}.dots::after{animation:none;}}" +
    "</style>" +
    '<div class="panel" role="dialog" aria-label="Chat with Ye\'s assistant">' +
    '<div class="head"><div><div class="title">YE ZHANG</div><div class="sub">assistant · ask me anything about the site</div></div>' +
    '<button class="close" aria-label="Close chat">×</button></div>' +
    '<div class="log" aria-live="polite"></div>' +
    '<form class="form"><textarea rows="1" maxlength="1000" placeholder="say something…" aria-label="Message"></textarea>' +
    '<button class="send" type="submit">SEND</button></form>' +
    '<div class="foot">AI replies can be wrong · for anything important, email yezhang1@usc.edu</div>' +
    "</div>" +
    '<button class="bubble" aria-label="Open chat" aria-expanded="false">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/></svg></button>';

  var panel = root.querySelector(".panel");
  var bubble = root.querySelector(".bubble");
  var log = root.querySelector(".log");
  var form = root.querySelector(".form");
  var input = root.querySelector("textarea");
  var send = root.querySelector(".send");
  var busy = false;

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
      a.textContent = url.replace(/^https?:\/\/(www\.)?/, "");
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
    if (open) setTimeout(function () { input.focus(); }, 150);
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

  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
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
    send.disabled = true;
    input.value = "";
    input.style.height = "auto";

    history.push({ role: "user", content: text });
    add("user", text);
    var el = add("bot", "");
    el.classList.add("dots");

    var answer = "";
    try {
      var res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        var msg = await res.text().catch(function () { return ""; });
        throw new Error(res.status < 500 && msg.length < 200 ? msg : "");
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      el.classList.remove("dots");
      for (;;) {
        var chunk = await reader.read();
        if (chunk.done) break;
        answer += decoder.decode(chunk.value, { stream: true });
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
      busy = false;
      send.disabled = false;
      input.focus();
    }
  });

  paint();
  (document.body || document.documentElement).appendChild(host);
})();
