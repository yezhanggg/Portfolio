// yezhang.ai chat. Load with:
//   <script src="https://<deployment>/widget.js" defer></script>
// Talks to /api/chat on the same deployment the script was loaded from.
//
// The page is a leaf of a book. Its bottom-right corner is dog-eared and stirs like the edge of a
// curtain in a draught. Bring the pointer near and the corner lifts toward it, uncovering pure
// black and a pair of eyes that live in it; rest there (or click / tap the corner) and the page
// turns back. There is no box, no field and no line: "type anywhere / ask anything" sinks slowly
// down the dark, a click anywhere puts a caret there, and what you type is written in the air.
// While the assistant thinks, three dots blink where the reply will be; then the reply is typed out
// there in green Courier, like a terminal answering.
(function () {
  if (window.__yzChatLoaded) return;
  window.__yzChatLoaded = true;

  var script = document.currentScript;
  var API = new URL("/api/chat", script ? script.src : location.href).href;
  var STORE_KEY = "yz-chat-v1";
  var INTRO_KEY = "yz-chat-intro";
  var EMAIL = "yezhang2003@gmail.com";
  var REDUCED = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var HOVER = !!(window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches);

  var DWELL = 0.45; // s resting on the uncovered words before the page turns
  var ZONE = 300; // px around the corner in which the page notices the pointer
  var DEG = Math.PI / 180;

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
  host.style.cssText = "position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483000;pointer-events:none;";
  var root = host.attachShadow({ mode: "open" });

  var EASE = "cubic-bezier(.22,1,.36,1)";
  var FLING = "cubic-bezier(.16,1,.3,1)";
  // Paper grain: fractal noise kept only as alpha, in black (0) or white (1).
  function grain(c, a) {
    return (
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E" +
      "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E" +
      "%3CfeColorMatrix values='0 0 0 0 " + c + " 0 0 0 0 " + c + " 0 0 0 0 " + c + " 0 0 0 " + a + " 0'/%3E%3C/filter%3E" +
      "%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
    );
  }
  var SANS = "'helvetica-w01-roman','Helvetica Neue',Helvetica,Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";
  root.innerHTML =
    "<style>" +
    ":host{--ink:#f4f2ec;--mute:rgba(244,242,236,.5);font-family:" + SANS + ";}" +
    "*{box-sizing:border-box;margin:0;padding:0;font:inherit;}" +
    "button{-webkit-tap-highlight-color:transparent;}" +
    ".scrim,.leaf,.end,.space{position:absolute;top:0;right:0;bottom:0;left:0;}" +
    ".scrim{pointer-events:none;}.open .scrim{pointer-events:auto;}" +
    // What the lifted page uncovers (clipped to it from script): pure black, and words floating on it.
    ".leaf{pointer-events:auto;cursor:pointer;clip-path:polygon(0 0,0 0,0 0);}" +
    ".open .leaf{cursor:text;}" +
    ".end{background:#000;}" +
    // The curl of the page itself, drawn on a canvas that hugs the corner.
    ".page{position:absolute;right:0;bottom:0;pointer-events:none;}" +
    // the eyes in the dark under the corner
    ".pal{position:absolute;left:0;top:0;pointer-events:none;opacity:0;transition:opacity .6s ease;}" +
    ".pal.on{opacity:1;}" +
    ".corner{position:absolute;right:0;bottom:0;width:72px;height:72px;border:none;background:none;cursor:pointer;pointer-events:auto;outline:none;}" +
    ".open .corner{visibility:hidden;}" +
    // The space: nothing but words, each floating on its own.
    ".space{visibility:hidden;pointer-events:none;color:var(--ink);}" +
    ".open .space{pointer-events:auto;}" +
    ".f{position:absolute;left:0;top:0;will-change:transform;white-space:pre-wrap;overflow-wrap:break-word;transition:opacity 1.2s ease;}" +
    // the invitation: its letters bob on a slow wave and scatter as soon as anything is typed
    ".prompt{font-size:11.5px;letter-spacing:.34em;text-transform:uppercase;line-height:2.2;text-align:center;white-space:nowrap;}" +
    ".prompt b{display:block;font-weight:inherit;}" +
    ".ch{display:inline-block;transition:transform 1.1s " + FLING + ",opacity .7s ease,filter .7s ease;transition-delay:calc(var(--i) * 14ms);}" +
    ".ch i{display:inline-block;font-style:normal;animation:bob 3.4s ease-in-out calc(var(--i) * -.17s) infinite alternate;}" +
    ".gone .ch{transform:translate(var(--gx),var(--gy)) rotate(var(--gr));opacity:0;filter:blur(5px);}" +
    "@keyframes bob{from{transform:translateY(-2.5px);}to{transform:translateY(2.5px);}}" +
    // what is being typed, written in the air; once sent it becomes a grey aside
    // what you write is in Courier, like a terminal
    ".draft{font-family:'Courier New',Courier,monospace;font-size:18px;line-height:1.45;opacity:0;transition:opacity .35s ease;}" +
    ".draft.on{opacity:1;}" +
    ".caret{display:inline-block;width:1.5px;height:1.05em;margin-left:2px;background:currentColor;vertical-align:-.14em;animation:caret 1.06s steps(1) infinite;}" +
    "@keyframes caret{50%{opacity:0;}}" +
    ".q{font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.5;color:var(--mute);animation:ink .8s " + EASE + " both;}" +
    ".q.read{opacity:.35;}" +
    // the reply: typed out in green Courier, like a terminal answering; "..." while it thinks
    ".a{font-family:'Courier New',Courier,monospace;font-size:15px;line-height:1.55;color:#39ff6a;text-shadow:0 0 6px rgba(57,255,106,.3);}" +
    ".a .caret{width:.6em;margin-left:1px;}" +
    ".dots i{font-style:normal;animation:dot 1.2s steps(1) infinite;}.dots i:nth-child(2){animation-delay:.2s;}.dots i:nth-child(3){animation-delay:.4s;}" +
    "@keyframes dot{0%{opacity:.15;}30%{opacity:1;}80%{opacity:.15;}}" +
    // a failure reads like a terminal: green Courier behind a block caret
    ".err{font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.5;color:#39ff6a;text-shadow:0 0 6px rgba(57,255,106,.35);}" +
    ".err .caret{width:.6em;margin-left:1px;}" +
    // letters of words that have had their turn, flying apart
    ".dust{position:absolute;left:0;top:0;pointer-events:none;}.dust span{position:absolute;white-space:pre;line-height:1;}" +
    ".past{opacity:.2;}.bye{opacity:0;transition-duration:.8s;}" +
    ".a a{color:inherit;text-decoration:underline;text-decoration-thickness:1px;text-decoration-color:rgba(255,255,255,.35);text-underline-offset:4px;}" +
    ".a a:hover{text-decoration-color:currentColor;}" +
    "@keyframes ink{from{opacity:0;transform:translateY(5px);filter:blur(5px);}}" +
    // typing lands in a field nobody sees
    ".ta{position:absolute;left:0;top:0;width:300px;height:28px;opacity:0;border:0;background:transparent;color:transparent;" +
    "caret-color:transparent;resize:none;font-size:16px;pointer-events:none;outline:none;}" +
    ".sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}" +
    "@media (prefers-reduced-motion:reduce){*{transition:none !important;animation:none !important;}}" +
    "</style>" +
    '<div class="book">' +
    '<div class="scrim"></div>' +
    '<div class="leaf"><div class="end"></div>' +
    '<div class="space" role="dialog" aria-label="Ask Ye\'s assistant" inert aria-hidden="true">' +
    '<div class="f prompt" aria-hidden="true"></div>' +
    '<div class="f draft" aria-hidden="true"></div>' +
    '<textarea class="ta" rows="1" maxlength="1000" enterkeyhint="send" aria-label="Ask anything about the site" aria-describedby="yz-note"></textarea>' +
    '<div class="sr" id="yz-note">AI replies can be wrong. For anything important, email ' + EMAIL + ".</div>" +
    '<div class="sr" aria-live="polite"></div>' +
    "</div></div>" +
    '<canvas class="page" aria-hidden="true"></canvas>' +
    '<canvas class="pal" aria-hidden="true"></canvas>' +
    '<button class="corner" aria-label="Open chat with Ye\'s assistant" aria-expanded="false"></button>' +
    "</div>";

  var book = root.querySelector(".book");
  var scrim = root.querySelector(".scrim");
  var leaf = root.querySelector(".leaf");
  var space = root.querySelector(".space");
  var promptEl = root.querySelector(".prompt");
  var draftEl = root.querySelector(".draft");
  var input = root.querySelector(".ta");
  var said = root.querySelector("[aria-live]");
  var pageCv = root.querySelector(".page");
  var corner = root.querySelector(".corner");
  var busy = false;
  var asked = history.some(function (m) { return m.role === "user"; }); // the invitation has done its job

  function clamp(x, a, b) {
    return x < a ? a : x > b ? b : x;
  }
  function smooth(a, b, x) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  // Smooth value noise in [-1, 1]: the draught that moves the corner.
  function hash(i) {
    var h = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return h - Math.floor(h);
  }
  function noise(x) {
    var i = Math.floor(x), f = x - i;
    f = f * f * (3 - 2 * f);
    return (hash(i) * (1 - f) + hash(i + 1) * f) * 2 - 1;
  }
  function fib(i, n) {
    var y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
    return [r * Math.cos(a), y, r * Math.sin(a)];
  }

  // ---- the page ----
  // Fold frame: n = (c, s) points from the fold line toward the corner (W, H); u is the distance
  // past the fold (0 on it, D at the corner) and v runs along it. Past the fold the page wraps over
  // a cylinder of radius r lying on it, then runs flat back over the page: a point u past the fold
  // shows at u' = r·sin(u/r) while u < πr, and at u' = πr − u after that.
  var W = 0, H = 0, small = false, DPR = 1, TOP0 = 0;
  var IDLE_D = 34, NEAR_D = 230;
  var OPEN = { D: 0, phi: 0 };
  var SPACE = { x0: 0, y0: 0, x1: 0, y1: 0 }; // where words may float while the page is turned
  var TUCKP = { x: 0, y: 0 }; // where the invitation waits under the corner
  var EYES = { x: 0, y: 0, s: 82 }; // where the eyes watch from: the corner itself

  function rOf(D) {
    return Math.max(3, Math.min(small ? 36 : 130, D * (small ? 0.14 : 0.2)));
  }
  function fold(D, phi) {
    return { D: D, c: Math.cos(phi), s: Math.sin(phi), r: rOf(D) };
  }
  function toFold(f, x, y) {
    var dx = x - W, dy = y - H;
    return [dx * f.c + dy * f.s + f.D, dy * f.c - dx * f.s];
  }
  function toScreen(f, u, v) {
    var a = u - f.D;
    return [W + a * f.c - v * f.s, H + a * f.s + v * f.c];
  }
  function foldU(x, y) {
    return toFold(fold(Math.max(0, pD.x), pPhi.x), x, y)[0];
  }
  // The part of a polygon (fold coordinates) with u >= k.
  function clipU(poly, k) {
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length], ina = a[0] >= k, inb = b[0] >= k;
      if (ina) out.push(a);
      if (ina !== inb) out.push([k, a[1] + ((k - a[0]) / (b[0] - a[0])) * (b[1] - a[1])]);
    }
    return out;
  }
  // Where the line u = const crosses the page: [lowest v, highest v], or null.
  function span(poly, u) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length];
      if ((a[0] - u) * (b[0] - u) > 0) continue;
      if (a[0] === b[0]) {
        lo = Math.min(lo, a[1], b[1]);
        hi = Math.max(hi, a[1], b[1]);
        continue;
      }
      var v = a[1] + ((u - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    return lo <= hi ? [lo, hi] : null;
  }
  // Outline (screen) of the stretch of page between u0 and u1 once it is wrapped on the roll.
  function roll(f, rect, u0, u1) {
    var hi = [], lo = [];
    for (var i = 0; i <= 14; i++) {
      var u = u0 + ((u1 - u0) * i) / 14, s = span(rect, u);
      if (!s) continue;
      var x = f.r * Math.sin(u / f.r);
      hi.push(toScreen(f, x, s[1]));
      lo.unshift(toScreen(f, x, s[0]));
    }
    return hi.length > 1 ? hi.concat(lo) : null;
  }
  function geometry(f) {
    var rect = [toFold(f, 0, 0), toFold(f, W, 0), toFold(f, W, H), toFold(f, 0, H)];
    var half = (Math.PI * f.r) / 2, D = f.D;
    return {
      // uncovered past the rim of the roll: the eyes are clipped to it, so they stay under the page
      beyond: clipU(rect, f.r).map(function (p) {
        return toScreen(f, p[0], p[1]);
      }),
      // uncovered: everything past the fold
      leaf: clipU(rect, 0).map(function (p) {
        return toScreen(f, p[0], p[1]);
      }),
      // the underside of the roll (front of the page, mostly hidden under the top of the roll)
      low: roll(f, rect, 0, Math.min(D, half)),
      // the top of the roll (back of the page)
      top: D > half ? roll(f, rect, half, Math.min(D, 2 * half)) : null,
      // the flap lying back over the page, tucked a little under the roll so no seam shows
      flat:
        D > 2 * half
          ? clipU(rect, 2 * half).map(function (p) {
              return toScreen(f, p[0] === 2 * half ? 1.5 : 2 * half - p[0], p[1]);
            })
          : null,
    };
  }

  var ctx = pageCv.getContext("2d");
  var shCv = document.createElement("canvas");
  var shCtx = shCv.getContext("2d");
  var SH = 0.125; // the cast shadow is drawn at an eighth of the size and blurred on the way up
  var alloc = { w: 0, h: 0 };
  var drawn = { D: -1, phi: 0, W: 0, H: 0 };
  var leafKey = "";
  // Shading across the roll, fold (0) to rim (1), and along the flap, fold (0) to far edge (1).
  var BACK = [246, 244, 238], FRONT = [255, 255, 255];
  var TOP = [[0, 1], [0.3, 1.025], [0.58, 0.94], [0.82, 0.82], [0.95, 0.7], [1, 0.8]];
  var LOW = [[0, 1], [1, 0.8]];
  var FLAT = [[0, 1], [1, 0.955]];

  function tint(base, k) {
    return "rgb(" + Math.min(255, Math.round(base[0] * k)) + "," + Math.min(255, Math.round(base[1] * k)) + "," + Math.min(255, Math.round(base[2] * k)) + ")";
  }
  function grad(a, b, prof, base) {
    var g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    prof.forEach(function (s) {
      g.addColorStop(s[0], tint(base, s[1]));
    });
    return g;
  }
  function trace(c, p) {
    c.moveTo(p[0][0], p[0][1]);
    for (var i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]);
    c.closePath();
  }
  function fill(p, style) {
    ctx.fillStyle = style;
    ctx.beginPath();
    trace(ctx, p);
    ctx.fill();
  }

  // The canvas only covers the corner the curl reaches into; it grows while the page turns and
  // shrinks back once the page lies still again.
  function fit(w, h, shrink) {
    w = Math.min(Math.ceil(W), Math.ceil(w / 64) * 64);
    h = Math.min(Math.ceil(H), Math.ceil(h / 64) * 64);
    var grow = w > alloc.w || h > alloc.h;
    var cut = shrink && (alloc.w > w + 256 || alloc.h > h + 256);
    if (!grow && !cut) return;
    if (!cut) {
      w = Math.max(w, alloc.w);
      h = Math.max(h, alloc.h);
    }
    alloc.w = w;
    alloc.h = h;
    pageCv.width = Math.max(1, Math.round(w * DPR));
    pageCv.height = Math.max(1, Math.round(h * DPR));
    pageCv.style.width = w + "px";
    pageCv.style.height = h + "px";
    shCv.width = Math.ceil(w * SH) + 8;
    shCv.height = Math.ceil(h * SH) + 8;
  }

  function clipLeaf(pts) {
    var s =
      pts.length > 2
        ? "polygon(" + pts.map(function (p) { return p[0].toFixed(1) + "px " + p[1].toFixed(1) + "px"; }).join(",") + ")"
        : "polygon(0 0,0 0,0 0)";
    if (s === leafKey) return;
    leafKey = s;
    leaf.style.clipPath = s;
    leaf.style.webkitClipPath = s;
  }

  function drawPage() {
    var D = Math.max(0, pD.x), phi = pPhi.x;
    if (Math.abs(D - drawn.D) < 0.04 && Math.abs(phi - drawn.phi) < 0.0004 && drawn.W === W && drawn.H === H) return;
    drawn = { D: D, phi: phi, W: W, H: H };
    var f = fold(D, phi), g = geometry(f);
    clipLeaf(D > 0.5 ? g.leaf : []);
    pal.beyond = D > 0.5 ? g.beyond : [];

    var blur = 4 + 0.32 * f.r, off = 1.5 + 0.12 * f.r, m = blur * 2 + off + 8;
    var minX = W, minY = H;
    [g.low, g.top, g.flat].forEach(function (p) {
      if (p) for (var i = 0; i < p.length; i++) {
        minX = Math.min(minX, p[i][0]);
        minY = Math.min(minY, p[i][1]);
      }
    });
    fit(W - minX + m, H - minY + m, state === "idle");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pageCv.width, pageCv.height);
    if (D <= 0.5 || !g.low) return;
    var ox = W - alloc.w, oy = H - alloc.h;
    ctx.setTransform(DPR, 0, 0, DPR, -ox * DPR, -oy * DPR);

    // Cast shadow: the whole lifted silhouette, small and blurred, dropped down and to the right.
    var pad = 4;
    shCtx.setTransform(1, 0, 0, 1, 0, 0);
    shCtx.clearRect(0, 0, shCv.width, shCv.height);
    shCtx.setTransform(SH, 0, 0, SH, pad - ox * SH, pad - oy * SH);
    shCtx.fillStyle = shCtx.shadowColor = "#000";
    shCtx.shadowBlur = blur * SH * 2;
    shCtx.beginPath();
    [g.low, g.top, g.flat].forEach(function (p) {
      if (p) trace(shCtx, p);
    });
    shCtx.fill();
    ctx.save();
    ctx.globalAlpha = 0.16 + 0.1 * Math.min(1, f.r / 60);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(shCv, ox - pad / SH + off * 0.55, oy - pad / SH + off * 0.8, shCv.width / SH, shCv.height / SH);
    ctx.restore();

    var a = toScreen(f, 0, 0), b = toScreen(f, f.r, 0);
    fill(g.low, grad(a, b, LOW, FRONT));
    if (g.top) fill(g.top, grad(a, b, TOP, BACK));
    if (g.flat) fill(g.flat, grad(a, toScreen(f, -Math.max(2, D - Math.PI * f.r), 0), FLAT, BACK));
  }

  // ---- the onlooker ----
  // A pair of eyes keeps watch from the dark under the bottom-right corner. They follow the
  // pointer, read along as you type, watch the thought gather and the reply land, glance about
  // when nothing happens, and blink now and then. (After the "live orb" shader.)
  var pal = {
    cv: root.querySelector(".pal"), gl: null, failed: false, size: 0, shown: false,
    look: { x: 0, y: 0.08 }, glance: { x: 0, y: 0.08 }, nextGlance: 0, nextBlink: 0, blinkAt: -10, movedAt: -10,
  };
  var gaze = null; // somewhere worth looking at for a while: { x, y, until }
  var PAL_VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var PAL_FRAG =
    "precision highp float;uniform vec2 u_res;uniform vec2 u_look;uniform float u_blink;uniform vec3 u_body;uniform vec3 u_eye;" +
    "vec3 orient(vec3 p,vec2 l){float y=l.x*.92,q=-l.y*.78,cy=cos(y),sy=sin(y),cp=cos(q),sp=sin(q);" +
    "vec3 a=vec3(p.x,p.y*cp-p.z*sp,p.y*sp+p.z*cp);return vec3(a.x*cy+a.z*sy,a.y,-a.x*sy+a.z*cy);}" +
    "float eye(vec3 n,vec3 e,vec3 r,vec3 u,float h,float rad){float x=dot(n,r)-dot(e,r),y=dot(n,u)-dot(e,u);" +
    "y-=clamp(y,-h,h);float d=length(vec2(x,y))-rad;return (1.-smoothstep(-.01,.01,d))*smoothstep(.12,.32,dot(n,e));}" +
    "void main(){vec2 p=(gl_FragCoord.xy/u_res)*2.-1.;p/=.94;float r2=dot(p,p);" +
    "float edge=1.-smoothstep(.985,1.012,sqrt(r2));if(edge<=.001){gl_FragColor=vec4(0.);return;}" +
    "vec3 n=normalize(vec3(p,sqrt(max(1.-r2,0.))));vec2 l=u_look;if(length(l)>1.)l/=length(l);" +
    "vec3 r=orient(vec3(1.,0.,0.),l),u=orient(vec3(0.,1.,0.),l);" +
    "float h=mix(.128,.012,u_blink),rad=mix(.054,.062,u_blink);" +
    "float e=max(eye(n,orient(normalize(vec3(-.32,.08,1.)),l),r,u,h,rad),eye(n,orient(normalize(vec3(.32,.08,1.)),l),r,u,h,rad));" +
    "gl_FragColor=vec4(u_eye,e*edge);}";

  // Built the first time the chat opens, so pages that never open it hold no WebGL context.
  function palInit() {
    if (pal.gl || pal.failed) return;
    var gl = pal.cv.getContext("webgl", { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
    var prog = gl && gl.createProgram();
    if (!prog) return void (pal.failed = true);
    [[gl.VERTEX_SHADER, PAL_VERT], [gl.FRAGMENT_SHADER, PAL_FRAG]].forEach(function (s) {
      var sh = gl.createShader(s[0]);
      gl.shaderSource(sh, s[1]);
      gl.compileShader(sh);
      gl.attachShader(prog, sh);
    });
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return void (pal.failed = true);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    pal.u = {};
    ["res", "look", "blink", "body", "eye"].forEach(function (k) {
      pal.u[k] = gl.getUniformLocation(prog, "u_" + k);
    });
    pal.gl = gl;
  }

  // Only the eyes show: they live in the black under the bottom-right corner, behind the page,
  // and are seen wherever the page is lifted off them.
  var palClip = "";
  function palFrame(dt) {
    var at = EYES;
    if (!pal.shown) {
      pal.shown = true;
      palInit();
      pal.cv.classList.toggle("on", !!pal.gl);
    }
    var gl = pal.gl;
    if (!gl) return;
    var s = Math.round(at.s), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (s !== pal.size) {
      pal.size = s;
      pal.cv.width = pal.cv.height = Math.round(s * dpr);
      pal.cv.style.width = pal.cv.style.height = s + "px";
      gl.viewport(0, 0, pal.cv.width, pal.cv.height);
    }
    var x0 = at.x - s / 2, y0 = at.y - s / 2;
    move(pal.cv, x0, y0);
    var b = pal.beyond || [];
    var clip = b.length > 2 ? "polygon(" + b.map(function (p) { return (p[0] - x0).toFixed(1) + "px " + (p[1] - y0).toFixed(1) + "px"; }).join(",") + ")" : "polygon(0 0,0 0,0 0)";
    if (clip !== palClip) {
      palClip = clip;
      pal.cv.style.clipPath = pal.cv.style.webkitClipPath = clip;
    }
    // What it looks at: the reply, the pointer, the writing, and otherwise wherever it likes.
    var goal = pal.glance, t = null;
    if (gaze && clock < gaze.until) t = gaze;
    else if (ptr && clock - pal.movedAt < 3) t = ptr;
    else if (draftF && clock - typedAt < 2.5) t = { x: draftF.px + draftF.w, y: draftF.py + draftF.h / 2 };
    else if (clock > pal.nextGlance && !REDUCED) {
      var back = Math.random() < 0.3;
      pal.glance = { x: back ? 0 : (Math.random() * 2 - 1) * 0.8, y: back ? 0.08 : (Math.random() * 2 - 1) * 0.5 };
      pal.nextGlance = clock + 0.9 + Math.random() * 2.1;
    }
    if (t) goal = { x: clamp((t.x - at.x) / 320, -1, 1), y: clamp((at.y - t.y) / 320, -1, 1) };
    var k = REDUCED ? 1 : 1 - Math.exp(-dt * 10);
    pal.look.x += (goal.x - pal.look.x) * k;
    pal.look.y += (goal.y - pal.look.y) * k;
    if (!REDUCED && clock > pal.nextBlink) {
      pal.blinkAt = clock;
      pal.nextBlink = clock + 2.2 + Math.random() * 3.8;
    }
    var bt = clock - pal.blinkAt, b = REDUCED ? 0 : bt < 0.055 ? bt / 0.055 : bt < 0.1 ? 1 : bt < 0.18 ? 1 - (bt - 0.1) / 0.08 : 0;
    // green while a reply is being typed out (the colour of its letters), white again after
    pal.g = (pal.g || 0) + ((typer ? 1 : 0) - (pal.g || 0)) * (REDUCED ? 1 : 1 - Math.exp(-dt * 8));
    var g = pal.g, body = [0, 0, 0], eye = [0.957 + (0.224 - 0.957) * g, 0.957 + (1 - 0.957) * g, 0.961 + (0.416 - 0.961) * g];
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(pal.u.res, pal.cv.width, pal.cv.height);
    gl.uniform2f(pal.u.look, pal.look.x, pal.look.y);
    gl.uniform1f(pal.u.blink, b);
    gl.uniform3f(pal.u.body, body[0], body[1], body[2]);
    gl.uniform3f(pal.u.eye, eye[0], eye[1], eye[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // ---- floating words ----
  // Everything said floats on its own: a slow drift, a little parallax against the pointer, and
  // never past the edge of the space. Only the last exchange stays bright; the one before fades
  // back, and anything older dissolves.
  var floats = [];
  var draftF = null, typedAt = -10;
  function move(el, x, y) {
    var s = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    if (el._at === s) return;
    el._at = s;
    el.style.transform = s;
  }
  function float(el, x, y, amp) {
    var f = { el: el, x: x, y: y, px: x, py: y, w: 0, h: 0, amp: amp == null ? 7 : amp, p1: Math.random() * 6.3, p2: Math.random() * 6.3, k1: 0.8 + Math.random() * 0.5, k2: 0.8 + Math.random() * 0.5, depth: 0.4 + Math.random() };
    if (el) measureF(f);
    floats.push(f);
    return f;
  }
  function measureF(f) {
    f.w = f.el.offsetWidth;
    f.h = f.el.offsetHeight;
  }
  function drop(f) {
    var i = floats.indexOf(f);
    if (i >= 0) floats.splice(i, 1);
    if (!f.el) return;
    f.el.classList.add("bye");
    setTimeout(function () {
      f.el.remove();
    }, 900);
  }
  function fitIn(x, y, w, h) {
    return [clamp(x, SPACE.x0, Math.max(SPACE.x0, SPACE.x1 - w)), clamp(y, SPACE.y0, Math.max(SPACE.y0, SPACE.y1 - h))];
  }
  function maxW(cap) {
    return Math.max(160, Math.min(cap, SPACE.x1 - SPACE.x0 - 8));
  }
  function rectOf(f) {
    return { x: f.px, y: f.py, w: f.w, h: f.h };
  }
  // A free place for a w × h block: the best of a few dozen random tries, keeping clear of `avoid`.
  function findSpot(w, h, avoid) {
    var best = null, worst = Infinity;
    for (var i = 0; i < 48 && worst > 0; i++) {
      var x = SPACE.x0 + Math.random() * Math.max(0, SPACE.x1 - SPACE.x0 - w);
      var y = SPACE.y0 + Math.random() * Math.max(0, SPACE.y1 - SPACE.y0 - h);
      var score = 0;
      avoid.forEach(function (r) {
        var ox = Math.min(x + w, r.x + r.w + 28) - Math.max(x, r.x - 28), oy = Math.min(y + h, r.y + r.h + 28) - Math.max(y, r.y - 28);
        if (ox > 0 && oy > 0) score += ox * oy;
      });
      if (score < worst) {
        worst = score;
        best = { x: x, y: y };
      }
    }
    return best;
  }
  function others(skip) {
    return floats
      .filter(function (f) { return f !== skip; })
      .map(rectOf)
      .concat([{ x: EYES.x - EYES.s / 2, y: EYES.y - EYES.s / 2, w: EYES.s, h: EYES.s }]);
  }

  // The invitation, letter by letter: each letter knows where it scatters to.
  var PROMPT = ["type anywhere", "ask anything"];
  (function () {
    var i = 0;
    PROMPT.forEach(function (line) {
      var b = document.createElement("b");
      line.split("").forEach(function (c) {
        var s = document.createElement("span"), a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 80;
        s.className = "ch";
        s.style.cssText = "--i:" + i++ + ";--gx:" + (Math.cos(a) * d).toFixed(0) + "px;--gy:" + (Math.sin(a) * d - 24).toFixed(0) + "px;--gr:" + ((Math.random() - 0.5) * 90).toFixed(0) + "deg";
        var t = document.createElement("i");
        t.textContent = c === " " ? " " : c;
        s.appendChild(t);
        b.appendChild(s);
      });
      promptEl.appendChild(b);
    });
  })();
  var promptOn = true, promptW = 0, promptH = 0, restUntil = 0, relocate = false;
  var anchor = { x: 0, y: 0, p: 0, q: 0, next: 0 };
  function showPrompt(on) {
    if (on === promptOn) return;
    promptOn = on;
    promptEl.classList.toggle("gone", !on);
  }
  function newAnchor(avoid) {
    var s = findSpot(promptW + 120, promptH + 80, avoid);
    anchor = { x: s.x + 60, y: s.y + 40, p: Math.random() * 6.3, q: Math.random() * 6.3, next: clock + 18 + Math.random() * 10 };
  }

  var caretEl = document.createElement("span");
  caretEl.className = "caret";
  var pin = null; // where a click on the dark put the caret
  // What is typed is written where the dark was clicked, else where the invitation was (or
  // somewhere free, if it was away).
  function mirror() {
    var v = input.value;
    if ((v || pin) && !draftF) {
      var start = pin || (promptOn ? { x: fX.x, y: fY.x } : findSpot(maxW(320), 40, others()));
      draftEl.style.maxWidth = maxW(320) + "px";
      draftF = float(draftEl, start.x, start.y, 3);
    }
    if (!draftF) return;
    // a new sentence begins: what was said before comes apart
    if (v && !draftF.scattered && !busy) {
      draftF.scattered = true;
      floats.slice().forEach(function (f) {
        if (f !== draftF && f.el && !(typer && typer.f === f)) disperse(f);
      });
    }
    if (!v && !pin) {
      // emptied: the invitation comes back where the writing was
      fX.x = fX.t = draftF.px;
      fY.x = fY.t = sink = draftF.py;
      anchor.x = draftF.px;
      anchor.y = draftF.py;
      relocate = false;
      draftEl.classList.remove("on");
      var i = floats.indexOf(draftF);
      if (i >= 0) floats.splice(i, 1);
      draftF = null;
      return;
    }
    var s = input.selectionStart == null ? v.length : input.selectionStart;
    draftEl.textContent = v.slice(0, s);
    draftEl.appendChild(caretEl);
    draftEl.appendChild(document.createTextNode(v.slice(s)));
    draftEl.classList.add("on");
    measureF(draftF);
    typedAt = clock;
    wake();
  }

  // Words that have had their turn come apart: every letter is lifted out where it stands and flies
  // off toward the nearer side of the dark, tumbling, blurring and fading.
  function disperse(f) {
    var i = floats.indexOf(f);
    if (i >= 0) floats.splice(i, 1);
    var el = f.el, cs = getComputedStyle(el), mid = (SPACE.x0 + SPACE.x1) / 2, range = document.createRange(), n = 0;
    var layer = document.createElement("div");
    layer.className = "dust";
    ["fontFamily", "fontSize", "fontStyle", "fontWeight", "letterSpacing", "color", "opacity", "textShadow"].forEach(function (k) {
      layer.style[k] = cs[k];
    });
    space.insertBefore(layer, input);
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), node;
    while ((node = walk.nextNode())) {
      for (var k = 0; k < node.data.length; k++) {
        if (!node.data[k].trim()) continue;
        range.setStart(node, k);
        range.setEnd(node, k + 1);
        var r = range.getBoundingClientRect();
        if (!r.width) continue;
        var c = document.createElement("span");
        c.textContent = node.data[k];
        c.style.left = r.left.toFixed(1) + "px";
        c.style.top = r.top.toFixed(1) + "px";
        layer.appendChild(c);
        if (REDUCED || !c.animate) continue;
        var side = r.left + r.width / 2 < mid ? -1 : 1, d = 140 + Math.random() * 340;
        c.animate(
          [
            { transform: "none", opacity: 1, filter: "blur(0)" },
            { transform: "translate(" + (side * d).toFixed(0) + "px," + ((Math.random() - 0.5) * 130 - 20).toFixed(0) + "px) rotate(" + ((Math.random() - 0.5) * 260).toFixed(0) + "deg)", opacity: 0, filter: "blur(3px)" },
          ],
          { duration: 900 + Math.random() * 700, delay: Math.min(n++ * 4, 500) + Math.random() * 120, easing: "cubic-bezier(.3,.6,.2,1)", fill: "both" }
        );
      }
    }
    el.remove();
    setTimeout(function () {
      layer.remove();
    }, REDUCED ? 0 : 2400);
  }

  // ---- motion ----
  function spring(x) {
    return { x: x, v: 0, t: x, k: 100, c: 14 };
  }
  function tune(s, k, c) {
    s.k = k;
    s.c = c;
  }
  function step(s, dt) {
    var n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (var i = 0; i < n; i++) {
      s.v += (s.k * (s.t - s.x) - s.c * s.v) * h;
      s.x += s.v * h;
    }
  }
  function settled(s, e) {
    return Math.abs(s.t - s.x) < e && Math.abs(s.v) < e * 6;
  }

  var pD = spring(0), pPhi = spring(45 * DEG); // the page: how far it is lifted, and at what angle
  var fX = spring(0), fY = spring(0); // the invitation
  var springs = [pD, pPhi, fX, fY];
  var state = "idle"; // idle → near → open → closing → idle
  var ptr = null; // the mouse, in viewport px
  var armed = true; // the page may turn on hover (not again until the pointer has left the corner)
  var peek = false; // the corner has keyboard focus
  var dwell = 0, clock = 0, tOpen = 0, tClose = 0, gustAt = 5, shake = 0, jolt = 0;
  var liveTimer = 0, focusTimer = 0;

  var sink = null; // how far the invitation has sunk down the dark
  function promptFade(o) {
    var v = o >= 0.999 ? "" : o.toFixed(3);
    if (promptEl.style.opacity !== v) promptEl.style.opacity = v;
  }
  function tuck(k, c) {
    promptFade(1);
    fX.t = TUCKP.x;
    fY.t = TUCKP.y;
    tune(fX, k, c);
    tune(fY, k, c);
  }

  // Closed: the corner drifts in the draught, lifts toward a nearby pointer, and turns if the
  // pointer rests on the words it uncovers.
  function drift(dt) {
    var near = 0, aim = 45 * DEG, wind = REDUCED ? 0 : 1;
    if (ptr) {
      near = Math.max(0, 1 - Math.hypot(W - ptr.x, H - ptr.y) / ZONE);
      if (near > 0) aim = clamp(Math.atan2(H - ptr.y, W - ptr.x), 24 * DEG, 66 * DEG);
    }
    if (peek) near = Math.max(near, 0.9);
    state = near > 0 ? "near" : "idle";
    var e = 1 - Math.pow(1 - near, 3);
    var D = IDLE_D * (1 + wind * (0.18 * noise(clock * 0.31) + 0.07 * noise(clock * 0.9 + 11.7)));
    D += (NEAR_D - IDLE_D) * e;
    var over = state === "near" && ptr && armed && foldU(ptr.x, ptr.y) > rOf(pD.x) + 6;
    dwell = clamp(dwell + (over ? dt : -2 * dt), 0, DWELL);
    pD.t = D + 56 * Math.pow(dwell / DWELL, 2);
    pPhi.t = 45 * DEG + (aim - 45 * DEG) * Math.min(1, near * 1.6) + wind * 5 * DEG * noise(clock * 0.23 + 40.1) * (1 - near);
    tune(pD, near ? 150 : 90, near ? 16 : 8);
    tune(pPhi, 90, 13);
    tuck(120, 19);
    if (state === "idle" && wind && clock > gustAt) {
      pD.v += 160 + Math.random() * 180;
      pPhi.v += (Math.random() - 0.5) * 1.4;
      gustAt = clock + 6 + Math.random() * 7;
    }
    if (dwell >= DWELL) open(false);
  }

  // Open: the page is held turned back. Over the turned page it sags a little, as if it would fall
  // back if let go. The invitation wanders slowly about the dark while nothing is being typed.
  function hold(dt) {
    var f = fold(Math.max(0, pD.x), pPhi.x), sag = 0;
    if (ptr) {
      var u = toFold(f, ptr.x, ptr.y)[0];
      sag = u < f.r && u > -(f.D - Math.PI * f.r) ? 1 : 0;
    }
    scrim.style.cursor = sag ? "pointer" : "";
    pD.t = OPEN.D - 16 * sag;
    pPhi.t = OPEN.phi;
    tune(pD, 46, 11);
    tune(pPhi, 40, 12);

    var waiting = !input.value && !draftF && !busy && clock > restUntil;
    // The invitation is only for the first question; after that a caret waits somewhere in the dark.
    showPrompt(waiting && !asked);
    if (waiting && asked) {
      pin = findSpot(maxW(320), 30, others());
      mirror();
    }
    var top = SPACE.y0, bottom = SPACE.y1 - promptH, fade = 1;
    if (promptOn) {
      if (relocate) {
        // back after a reply: re-forms somewhere free
        relocate = false;
        newAnchor(others());
        fX.x = fX.t = anchor.x;
        fY.x = fY.t = sink = anchor.y;
        fX.v = fY.v = 0;
      }
      // It sinks slowly from the top of the dark to the bottom, swaying a little, fades out at the
      // bottom and comes in again from the top in a free lane.
      var w = REDUCED ? 0 : 1;
      if (sink == null) sink = top + (bottom - top) * (0.1 + Math.random() * 0.25);
      sink += w * 26 * dt;
      if (sink > bottom) {
        newAnchor(others());
        sink = top;
        fX.x = fX.t = anchor.x;
        fY.x = fY.t = top;
        fX.v = fY.v = 0;
      }
      var p = fitIn(anchor.x + w * 48 * Math.sin(clock * 0.33 + anchor.p), sink, promptW, promptH);
      fX.t = p[0];
      fY.t = p[1];
      tune(fX, 3, 3.4);
      tune(fY, clock - tOpen < 1.5 ? 4 : 30, clock - tOpen < 1.5 ? 4 : 11);
      if (w) fade = smooth(top, top + 70, fY.x) * (1 - smooth(bottom - 90, bottom, fY.x));
    } else {
      fX.t = fX.x;
      fY.t = fY.x;
    }
    promptFade(fade);
  }

  // Let go: the words slip back under the corner, then the page falls under its own weight and
  // lands with a slap and a small bounce.
  function fall(dt) {
    pPhi.t = 45 * DEG;
    tune(pPhi, 50, 11);
    tuck(60, 15);
    if (REDUCED) {
      state = "idle";
      return false;
    }
    if (clock - tClose < 0.16) return false;
    pD.v = Math.min(pD.v, 0) - 5600 * dt;
    pD.x += pD.v * dt;
    if (pD.x <= IDLE_D * 0.4) {
      pD.x = IDLE_D * 0.4;
      pD.v *= -0.22;
      state = "idle";
    }
    return true;
  }

  function update(dt) {
    clock += dt;
    var falling = false;
    if (state === "idle" || state === "near") drift(dt);
    else if (state === "open") hold(dt);
    else falling = fall(dt);
    springs.forEach(function (s) {
      if (s !== pD || !falling) step(s, dt);
    });
    if (REDUCED) springs.forEach(function (s) {
      s.x = s.t;
      s.v = 0;
    });
    typeStep(dt);
    jolt *= Math.exp(-14 * dt);
  }

  var spaceShown = false;
  function placeSpace() {
    var show = state === "open" || state === "closing" || pD.x > (small ? 50 : 70);
    if (show !== spaceShown) {
      spaceShown = show;
      space.style.visibility = show ? "visible" : "hidden";
    }
    if (!show) return;
    var j = shake + jolt, px = 0, py = 0;
    if (ptr && !REDUCED && state === "open") {
      px = (ptr.x - (SPACE.x0 + SPACE.x1) / 2) * 0.012;
      py = (ptr.y - (SPACE.y0 + SPACE.y1) / 2) * 0.012;
    }
    move(promptEl, fX.x, fY.x);
    floats.forEach(function (f) {
      var w = REDUCED ? 0 : 1;
      var p = fitIn(
        f.x + w * f.amp * Math.sin(clock * 0.37 * f.k1 + f.p1) + px * f.depth + (j > 0.02 ? (Math.random() - 0.5) * 2 * j : 0),
        f.y + w * f.amp * 0.8 * Math.cos(clock * 0.29 * f.k2 + f.p2) + py * f.depth + (j > 0.02 ? (Math.random() - 0.5) * 2 * j : 0),
        f.w,
        f.h
      );
      f.px = p[0];
      f.py = p[1];
      if (f.el) move(f.el, p[0], p[1]);
    });
    // the hidden field follows the writing, so a phone keeps it in view
    if (draftF) move(input, draftF.px, draftF.py);
    else move(input, fX.x, fY.x);
  }

  var raf = 0, lastT = 0;
  function wake() {
    if (raf || document.visibilityState === "hidden") return;
    lastT = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    var dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    update(dt);
    drawPage();
    placeSpace();
    palFrame(dt);
    var moving = typer || state === "closing" || !springs.every(function (s) { return settled(s, 0.02); });
    if (!REDUCED || moving) raf = requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", function () {
    cancelAnimationFrame(raf);
    raf = 0;
    wake();
  });

  var greeted = false;
  function open(keyboard) {
    if (state === "open") return;
    state = "open";
    tOpen = clock;
    dwell = 0;
    armed = false;
    peek = false;
    book.classList.add("open");
    corner.setAttribute("aria-expanded", "true");
    space.removeAttribute("inert");
    space.removeAttribute("aria-hidden");
    sink = null;
    if (!greeted) {
      greeted = true;
      newAnchor([]);
      // coming back to an earlier conversation: its last reply is still there, faintly
      var last = history[history.length - 1];
      if (last && last.role === "assistant") {
        var el = document.createElement("div");
        el.className = "f a past";
        el.style.maxWidth = maxW(320) + "px";
        render(el, shown(last.content));
        space.insertBefore(el, input);
        var f = float(el, 0, 0);
        var s = findSpot(f.w, f.h, [{ x: anchor.x - 60, y: anchor.y - 40, w: promptW + 120, h: promptH + 80 }]);
        f.x = f.px = s.x;
        f.y = f.py = s.y;
        f.past = true;
      }
    }
    clearTimeout(liveTimer);
    clearTimeout(focusTimer);
    liveTimer = setTimeout(function () {
      space.classList.add("live");
    }, REDUCED ? 0 : 420);
    // Phones: no keyboard popping up over the page while it turns; a tap on the dark brings it.
    if (HOVER || keyboard) focusTimer = setTimeout(function () {
      if (state === "open") input.focus({ preventScroll: true });
    }, REDUCED ? 0 : 650);
    wake();
  }

  function close() {
    if (state !== "open") return;
    var inside = space.contains(root.activeElement);
    state = "closing";
    tClose = clock;
    clearTimeout(liveTimer);
    clearTimeout(focusTimer);
    book.classList.remove("open");
    space.classList.remove("live");
    space.setAttribute("inert", "");
    space.setAttribute("aria-hidden", "true");
    corner.setAttribute("aria-expanded", "false");
    scrim.style.cursor = "";
    pin = null;
    mirror();
    showPrompt(true);
    if (inside) corner.focus({ preventScroll: true });
    wake();
  }

  function measure() {
    var b = host.getBoundingClientRect();
    W = b.width || document.documentElement.clientWidth;
    H = b.height || window.innerHeight;
    small = W < 600;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    IDLE_D = small ? 26 : 34;
    NEAR_D = small ? 150 : 230;
    var vv = window.visualViewport, vh = H;
    TOP0 = 0;
    if (small && vv) {
      TOP0 = Math.max(0, vv.offsetTop);
      vh = Math.min(H - TOP0, vv.height);
    }
    promptW = promptEl.offsetWidth;
    promptH = promptEl.offsetHeight;
    // Turn the page back far enough to leave a band of dark for the words (on a phone, all of it).
    var phi = (small ? 3 : 6) * DEG, c = Math.cos(phi), s = Math.sin(phi), edge;
    if (small) {
      edge = 34; // a strip of the white page stays out: tapping it closes the chat
      SPACE = { x0: 52, y0: TOP0 + 100, x1: W - 18, y1: TOP0 + vh - 20 };
      TUCKP = { x: W - 150, y: H - 64 };
      EYES = { x: W - 34, y: H - 34, s: 66 }; // right in the corner
    } else {
      var band = clamp(W * 0.36, 440, 600);
      edge = W - band - 20;
      SPACE = { x0: W - band + 12, y0: 44, x1: W - 28, y1: H - 40 };
      TUCKP = { x: W - 200, y: H - 58 };
      EYES = { x: W - 42, y: H - 42, s: 82 };
    }
    // the roll's rim reaches `edge` at the top of the screen, where the turned page is narrowest
    var need = (W - edge) * c + H * s, D = need;
    for (var i = 0; i < 8; i++) D = need + rOf(D);
    OPEN = { D: D, phi: phi };
  }

  function relayout() {
    measure();
    drawn.D = -1;
    if (state !== "open") {
      fX.x = fX.t = TUCKP.x;
      fY.x = fY.t = TUCKP.y;
      fX.v = fY.v = 0;
    }
    wake();
  }

  // ---- messages ----

  function link(url) {
    var a = document.createElement("a");
    a.href = url;
    a.textContent = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    if (!/^https?:\/\/(www\.)?yezhang\.(ai|net)/.test(url)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    return a;
  }

  // A reply may end with [go:/path]: the assistant taking the visitor to a page of the site. The tag is
  // never shown (nor the start of one while it streams in); once the reply is typed, the page turns
  // back and the visitor goes there.
  function shown(text) {
    return text.replace(/\s*\[go:[^\]]*\]\s*$/, "").replace(/\s*\[(g(o(:[^\]]*)?)?)?$/, "");
  }
  function goTo(text) {
    var m = /\[go:\s*([^\]\s]+)\s*\]\s*$/.exec(text);
    if (!m) return null;
    var path = m[1].replace(/^https?:\/\/(www\.)?yezhang\.(ai|net)/, "");
    return /^\/(?!\/)[\w\-./#?=&%]*$/.test(path) ? path : null;
  }

  // Plain text with bare URLs turned into links; never injects HTML.
  function render(el, text) {
    el.textContent = "";
    var re = /https?:\/\/[^\s)]+/g;
    var last = 0, m;
    while ((m = re.exec(text))) {
      var url = m[0].replace(/[.,;:!?'"]+$/, "");
      el.appendChild(document.createTextNode(text.slice(last, m.index)));
      el.appendChild(link(url));
      last = m.index + url.length;
    }
    el.appendChild(document.createTextNode(text.slice(last)));
  }

  // The reply is typed out where it lands, a character at a time behind a caret, a little slower
  // after punctuation; once it is all there it is set again with its links.
  var typer = null;
  function typeOut(f) {
    var caret = document.createElement("span"), t = { f: f, text: document.createTextNode(""), n: 0, budget: 0, src: "", ended: false };
    caret.className = "caret";
    f.el.textContent = "";
    f.el.appendChild(t.text);
    f.el.appendChild(caret);
    t.caret = caret;
    t.done = new Promise(function (resolve) {
      t.resolve = resolve;
    });
    typer = t;
    return t;
  }
  function typeStep(dt) {
    var t = typer;
    if (!t) return;
    t.budget = REDUCED ? Infinity : t.budget + dt * 24; // characters a second: an unhurried typist
    var added = "";
    while (t.budget >= 1 && t.n < t.src.length) {
      var c = t.src[t.n++];
      added += c;
      t.budget -= 1;
      if (/[.!?。！？]/.test(c)) t.budget -= 9;
      else if (/[,;:，；：—\n]/.test(c)) t.budget -= 4;
    }
    if (t.n >= t.src.length) t.budget = Math.min(t.budget, 1);
    if (added) {
      t.text.data += added;
      measureF(t.f);
      var r = t.caret.getBoundingClientRect();
      gaze = { x: r.left, y: r.top + r.height / 2, until: clock + 1.2 };
    }
    if (t.ended && t.n >= t.src.length) {
      render(t.f.el, t.src);
      measureF(t.f);
      typer = null;
      t.resolve();
    }
  }

  // A new block of words, placed somewhere free in the dark.
  function block(cls, avoid, fill) {
    var el = document.createElement("div");
    el.className = "f " + cls;
    el.style.maxWidth = maxW(cls === "a" ? 320 : 280) + "px";
    el.style.visibility = "hidden";
    if (fill) fill(el);
    space.insertBefore(el, input);
    var f = float(el, 0, 0);
    var s = findSpot(f.w, f.h, avoid);
    f.x = f.px = s.x;
    f.y = f.py = s.y;
    move(el, s.x, s.y);
    el.style.visibility = "";
    return f;
  }

  // ---- wiring ----

  document.addEventListener(
    "pointermove",
    function (e) {
      if (e.pointerType === "touch") return;
      // A page's own tools near the corner (marked data-chat-quiet) don't make the corner lift.
      if (state !== "open" && e.target.closest && e.target.closest("[data-chat-quiet]")) {
        if (ptr) (ptr = null), wake();
        return;
      }
      ptr = { x: e.clientX, y: e.clientY };
      pal.movedAt = clock;
      if (!armed && Math.hypot(W - ptr.x, H - ptr.y) > ZONE * 0.85) armed = true;
      wake();
    },
    { passive: true }
  );
  document.documentElement.addEventListener("mouseleave", function () {
    ptr = null;
    wake();
  });

  // A press that starts among the words and ends on the page (selecting text) doesn't close it.
  var downIn = false;
  root.addEventListener("pointerdown", function (e) {
    downIn = space.contains(e.target);
  });
  // (Only from rest: the click that closes it from inside would otherwise bubble here and reopen it.)
  leaf.addEventListener("click", function (e) {
    if (state === "idle" || state === "near") open(e.detail === 0);
  });
  // Open, the dark is the writing surface: a click anywhere on it is ready to type (on the roll of
  // the page itself, it lets go).
  space.addEventListener("click", function (e) {
    if (state !== "open" || (e.target.closest && e.target.closest("a"))) return;
    if (foldU(e.clientX, e.clientY) < rOf(pD.x) + 4) return close();
    // a blinking caret where the dark was clicked; the writing (if any) moves there
    pin = { x: e.clientX - 1, y: e.clientY - 14 };
    if (draftF) {
      draftF.x = pin.x;
      draftF.y = pin.y;
    }
    input.focus({ preventScroll: true });
    mirror();
  });
  scrim.addEventListener("click", function () {
    if (state === "open" && !downIn) close();
  });
  corner.addEventListener("click", function (e) {
    if (state === "open") close();
    else open(e.detail === 0);
  });
  corner.addEventListener("focus", function () {
    try {
      peek = corner.matches(":focus-visible");
    } catch (e) {
      peek = true;
    }
    wake();
  });
  corner.addEventListener("blur", function () {
    peek = false;
    wake();
  });
  // Type anywhere: while it is open, any letter goes to the writing.
  document.addEventListener("keydown", function (e) {
    if (state !== "open") return;
    if (e.key === "Escape") return close();
    if (root.activeElement === input || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    input.focus({ preventScroll: true });
  });

  // Scrolling the page is a draught too.
  var scrollY0 = window.scrollY || 0;
  addEventListener(
    "scroll",
    function () {
      var y = window.scrollY || 0, d = Math.abs(y - scrollY0);
      scrollY0 = y;
      if (state !== "idle" || REDUCED) return;
      pD.v = Math.min(260, pD.v + Math.min(d * 1.6, 90));
      wake();
    },
    { passive: true }
  );

  addEventListener("resize", relayout);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  input.addEventListener("input", mirror);
  input.addEventListener("keyup", mirror);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      ask();
    }
  });

  async function ask() {
    var text = input.value.trim();
    if (!text || busy) return;
    busy = true;
    asked = true;
    input.value = "";

    // The last exchange fades back and the one before it goes.
    floats.slice().forEach(function (f) {
      if (f === draftF) return;
      if (f.past) drop(f);
      else if (f.el) {
        f.past = true;
        f.el.classList.add("past");
      }
    });

    // The writing becomes the question, a grey aside where it was written.
    var qF = draftF;
    draftF = null;
    pin = null;
    if (!qF) qF = block("q", others(), function (el) { el.textContent = text; });
    else {
      draftEl.className = "f q";
      draftEl.textContent = text;
      draftEl.style.maxWidth = maxW(280) + "px";
      measureF(qF);
      draftEl = document.createElement("div");
      draftEl.className = "f draft";
      draftEl.setAttribute("aria-hidden", "true");
      space.insertBefore(draftEl, input);
    }
    var mine = qF.el;
    qF.past = false;
    history.push({ role: "user", content: text });
    said.textContent = "thinking";

    // While it thinks: three dots, blinking where the reply will be (a place with room for a few
    // lines), which then becomes the reply.
    var aF = block("a dots", [rectOf(qF)].concat(others(qF)), function (el) {
      el.innerHTML = "<i>.</i><i>.</i><i>.</i>";
      el.style.width = maxW(320) + "px";
      el.style.height = "96px";
    });
    aF.el.style.width = aF.el.style.height = "";
    wake();

    var answer = "", ended = false, out = false, tw = null;
    function reveal() {
      out = true;
      aF.el.classList.remove("dots");
      tw = typeOut(aF);
      more();
    }
    function ready() {
      if (out || !answer) return;
      reveal();
    }
    function more() {
      tw.src = shown(answer);
      tw.ended = ended;
      wake();
    }

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
        if (out) more(false);
        else ready();
      }
      if (!answer) throw new Error("");
      ended = true;
      ready();
      more();
      await tw.done;
      said.textContent = shown(answer);
      history.push({ role: "assistant", content: answer });
      save();
      var path = goTo(answer);
      if (path && path !== location.pathname) {
        setTimeout(function () {
          close();
          setTimeout(function () {
            location.assign(path);
          }, REDUCED ? 0 : 650);
        }, REDUCED ? 0 : 900);
      }
    } catch (err) {
      history.pop();
      if (!out) drop(aF);
      mine.classList.remove("read");
      var why = (err && err.message) || "couldn't reach the assistant — try again in a moment.";
      // typed out somewhere in the dark, like a terminal
      why = "> " + why;
      typeOut(block("err", others(), function (el) { el.textContent = why; })).src = why;
      typer.ended = true;
      said.textContent = why;
    } finally {
      busy = false;
      restUntil = clock + 1.6;
      relocate = true;
      if (state === "open" && HOVER) input.focus({ preventScroll: true });
      wake();
    }
  }

  (document.body || document.documentElement).appendChild(host);
  measure();
  fX.x = fX.t = TUCKP.x;
  fY.x = fY.t = TUCKP.y;
  pD.x = pD.t = IDLE_D;
  wake();

  // Once a visit, a little while after the page settles, the corner catches a stronger draught.
  var introduced = false;
  try {
    introduced = !!sessionStorage.getItem(INTRO_KEY);
  } catch (e) {}
  if (!introduced && !REDUCED) setTimeout(function () {
    if (state === "idle") {
      pD.v += 420;
      pPhi.v -= 0.5;
      wake();
    }
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch (e) {}
  }, 1800);
})();
