/* Guest demo (tool.html?demo=1): plays a finished audit of Ruka Maldives, a real guesthouse used with a fictional scenario.
   Nothing is saved: no sign-in, no cloud, no local draft. Each page fills itself in, then moves on after 4 seconds (or on Next).
   The last page shows the PDF report as a preview; downloading is for enrolled students only. The scenario lives in demo-ruka.js. */
(function () {
  "use strict";
  if (!/[?&]demo=1/.test(location.search)) return;
  var T = null, Q = [], qi = 0, timers = [], paused = false, waiting = null, PDFJS = "vendor/pdfjs/";
  var DISCLAIMER = "Ruka Maldives is a real guesthouse on Dhiffushi, used here with a fictional scenario to demonstrate the tool. The audit answers, figures, target market, objectives, strategies and budget are invented for teaching. They do not describe Ruka Maldives, its performance or its marketing.";
  function $(id) { return document.getElementById(id); }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function stop() { timers.forEach(clearTimeout); timers = []; waiting = null; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function css() {
    var st = document.createElement("style");
    st.textContent = ".sa-demo .sa-tools,.sa-demo .sa-resetbar,.sa-demo .sa-jump,.sa-demo #saCloud,.sa-demo #saAddSegNav,.sa-demo .sa-backobj,.sa-demo .sa-who a{display:none!important}" +
      ".sa-demo #saStep{pointer-events:none}.sa-demo #saStep .sa-demo-live{pointer-events:auto}" +
      ".sa-demobar{position:sticky;top:64px;z-index:15;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 14px;padding:10px 14px;border-radius:16px;background:var(--raised);border:1px solid var(--line);box-shadow:0 8px 24px rgba(6,20,32,.08);font-size:.88rem}" +
      ".sa-demobar b{font-weight:800}.sa-demobar .sp{flex:1 1 auto}.sa-demobar button{font:inherit;font-weight:700;padding:6px 14px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer}" +
      ".sa-demobar .tag{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;font-weight:800;padding:3px 9px;border-radius:999px;background:var(--accent);color:#fff}" +
      ".sa-demobar .pri{background:var(--accent);border-color:var(--accent);color:#fff;min-width:88px}@media (max-width:560px){.sa-demobar .lbl,.sa-demobar .tag{display:none}.sa-demobar{top:60px;padding:8px 10px;gap:6px}.sa-demobar button{padding:6px 10px}}" +
      ".sa-demonote{font-size:.8rem;color:var(--muted);margin:-6px 0 14px}" +
      ".sa-fill{animation:saFill .7s ease-out}@keyframes saFill{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 55%,transparent)}100%{box-shadow:0 0 0 10px transparent}}" +
      ".sa-pdfprev{display:grid;gap:14px;margin-top:6px}.sa-pdfprev canvas{width:100%;height:auto;border-radius:6px;box-shadow:0 6px 24px rgba(6,20,32,.18);background:#fff}" +
      ".sa-pdfwrap{position:relative}.sa-pdfwrap::after{content:'Demo preview';position:absolute;top:10px;right:10px;font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:rgba(6,20,32,.7);color:#fff}" +
      "@media (prefers-reduced-motion:reduce){.sa-fill{animation:none}}";
    document.head.appendChild(st);
  }

  function bar() {
    var b = document.createElement("div"); b.className = "sa-demobar"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Demo controls");
    b.innerHTML = '<span class="tag">Guest demo</span><span class="lbl"><b>Ruka Maldives</b>, a fictional scenario</span><span class="sp"></span>' +
      '<button type="button" id="dmBack" aria-label="Previous page">Back</button><button type="button" id="dmPause">Pause</button><button type="button" id="dmNext" class="pri">Next</button><button type="button" id="dmReplay">Start again</button>';
    var main = $("saMain"); main.insertBefore(b, main.firstChild);
    var n = document.createElement("p"); n.className = "sa-demonote"; n.textContent = "This demo fills in each page by itself and moves on after 4 seconds. Tap Next to go faster. Nothing is saved. " + DISCLAIMER;
    main.insertBefore(n, b.nextSibling);
    $("dmPause").onclick = function () { paused = !paused; this.textContent = paused ? "Play" : "Pause"; if (!paused && waiting) { var w = waiting; waiting = null; w(); } else if (!paused) countdown(); else setNext("Next"); };
    $("dmReplay").onclick = function () { paused = false; $("dmPause").textContent = "Pause"; show(0); };
  }

  function setNext(t) { ["saNext", "dmNext"].forEach(function (id) { var n = $(id); if (n) n.textContent = t; }); }
  function nav() {
    ["saNext", "saPrev"].forEach(function (id) { var o = $(id), c = o.cloneNode(true); o.parentNode.replaceChild(c, o); });
    $("saNext").addEventListener("click", function () { show(Math.min(Q.length - 1, qi + 1)); });
    $("saPrev").addEventListener("click", function () { show(Math.max(0, qi - 1)); });
    $("dmNext").onclick = function () { show(Math.min(Q.length - 1, qi + 1)); };
    $("dmBack").onclick = function () { show(Math.max(0, qi - 1)); };
  }

  function countdown() {
    stop(); if (paused) { setNext("Next"); return; }
    var n = 4; setNext("Next (" + n + ")");
    (function tick() { later(function () { if (paused) return; n--; if (n <= 0) { show(qi + 1); return; } setNext("Next (" + n + ")"); tick(); }, 1000); })();
  }

  function inView(el) { var r = el.getBoundingClientRect(); return r.top > 90 && r.bottom < innerHeight - 90; }
  function animate(done) {
    var root = $("saStep"), items = [];
    root.querySelectorAll('input,textarea,select,[aria-pressed="true"]').forEach(function (el) {
      if (el.getAttribute("aria-pressed") === "true") { items.push({ el: el, k: "chip" }); el.setAttribute("aria-pressed", "false"); }
      else if (el.type === "checkbox" || el.type === "radio") { if (el.checked) { items.push({ el: el, k: "ck" }); el.checked = false; } }
      else if (el.tagName === "SELECT") { if (el.selectedIndex > 0) { items.push({ el: el, k: "sel", v: el.selectedIndex }); el.selectedIndex = 0; } }
      else if (el.type === "range") { items.push({ el: el, k: "sel", v: el.value }); el.value = el.min || 0; }
      else if (el.type !== "file" && el.type !== "hidden" && el.value) { items.push({ el: el, k: "txt", v: el.value }); el.value = ""; }
    });
    if (!items.length) return glide(done);
    var per = Math.max(70, Math.min(420, 9000 / items.length)), i = 0;
    (function step() {
      if (i >= items.length) { done(); return; }
      var it = items[i++], el = it.el;
      if (!inView(el)) el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("sa-fill"); later(function () { el.classList.remove("sa-fill"); }, 800);
      if (it.k === "chip") { el.setAttribute("aria-pressed", "true"); later(step, per); }
      else if (it.k === "ck") { el.checked = true; later(step, per); }
      else if (it.k === "sel") { if (el.tagName === "SELECT") el.selectedIndex = it.v; else el.value = it.v; later(step, per); }
      else {
        var v = it.v, dur = Math.min(900, Math.max(150, v.length * 14)), parts = Math.max(1, Math.min(30, Math.round(dur / 30))), k = 0;
        (function type() { k++; el.value = v.slice(0, Math.ceil(v.length * k / parts)); if (k < parts) later(type, dur / parts); else later(step, Math.max(60, per - dur / 3)); })();
      }
    })();
  }
  function glide(done) {
    var h = document.documentElement.scrollHeight - innerHeight, y0 = scrollY;
    if (h - y0 < 200) { later(done, 1200); return; }
    var dur = Math.min(9000, (h - y0) * 6), t0 = performance.now();
    (function f(now) { if (!timers.length && now - t0 > 50) return; var p = Math.min(1, (now - t0) / dur); scrollTo(0, y0 + (h - y0) * p); if (p < 1) timers.push(requestAnimationFrame(f)); else done(); })(t0);
  }

  function show(i) {
    stop(); qi = Math.max(0, Math.min(Q.length - 1, i)); var it = Q[qi], S = T.S;
    S.step = it[0]; if (T.pagesFor(it[0])) T.setSub(it[0], it[1]);
    $("dmNext").disabled = it[0] === 10; $("dmBack").disabled = qi === 0;
    if (it[0] === 10) { final(); return; }
    $("saNav").hidden = false; T.render(); scrollTo(0, 0); setNext("Next");
    later(function () { animate(function () { if (paused) { waiting = countdown; setNext("Next"); } else countdown(); }); }, 450);
  }

  function final() {
    var S = T.S, A = window.SA.audit(S), B = window.SA.budget(S.plan, S.biz), nseg = S.tm.segs.filter(function (g) { return g.target === "yes"; }).length;
    T.render(); scrollTo(0, 0);
    $("saStep").innerHTML = '<h1 class="sa-h">The finished report</h1><p class="sa-lede">This is the PDF a student gets at the end: the audit evidence, target market, personas, objectives, strategies, Gantt chart, budget, and control and evaluation table. In this demo it opens as a preview.</p>' +
      '<div class="sa-card sa-demo-live"><p><b>' + esc(S.biz.name) + "</b>: digital visibility " + A.overall + "/100. " + S.objs.length + " objectives, " + S.plan.strats.filter(function (s) { return s.on; }).length + " strategies, " + nseg + " persona" + (nseg === 1 ? "" : "s") + ", total budget MVR " + Math.round(B.total).toLocaleString("en-US") + ".</p>" +
      '<div class="sa-actions"><button type="button" class="btn btn-primary" id="dmDl">Download PDF</button><button type="button" class="btn btn-ghost" id="dmAgain">Watch the demo again</button></div><p class="sa-ms" id="dmMsg" role="status">Building the report preview...</p></div>' +
      '<div class="sa-pdfwrap sa-demo-live"><div class="sa-pdfprev" id="dmPdf"></div></div>';
    $("saNav").hidden = true;
    $("dmDl").onclick = notice; $("dmAgain").onclick = function () { show(0); };
    T.deriveLines();
    var S2 = JSON.parse(JSON.stringify(S)); S2.code = "DEMO000000"; S2.gaps = T.gaps().map(function (g) { return { step: g.step, text: g.text }; });
    window.SA_DEMO_PDF = function (buf) { preview(buf); };
    if (!window.jspdf) { $("dmMsg").textContent = "The PDF maker did not load. Check the internet connection and refresh."; return; }
    window.SA_PDF(S2, T.getImg(), {}).then(function (res) { $("dmMsg").textContent = "A " + res.pages + "-page report. Scroll to read it."; }, function (e) { $("dmMsg").textContent = "The preview could not be made: " + (e && e.message || e); });
  }
  function loadJs(src) { return new Promise(function (ok, bad) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); }
  function preview(buf) {
    var box = $("dmPdf"); if (!box) return;
    (window.pdfjsLib ? Promise.resolve() : loadJs(PDFJS + "pdf.min.js")).then(function () {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
      return pdfjsLib.getDocument({ data: buf }).promise;
    }).then(function (pdf) {
      var w = Math.min(box.clientWidth || 800, 900) * Math.min(2, window.devicePixelRatio || 1), n = 0;
      (function next() {
        if (++n > pdf.numPages || !document.body.contains(box)) return;
        pdf.getPage(n).then(function (pg) {
          var v = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: w / v.width }), c = document.createElement("canvas");
          c.width = vp.width; c.height = vp.height; c.setAttribute("role", "img"); c.setAttribute("aria-label", "Report page " + n + " of " + pdf.numPages);
          box.appendChild(c); return pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
        }).then(next);
      })();
    }).catch(function () { box.innerHTML = '<p class="sa-ms">The preview viewer did not load. Check the internet connection and refresh.</p>'; });
  }
  function notice() {
    var m = document.createElement("div"); m.className = "sa-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "dmH");
    m.innerHTML = '<div class="sa-modal-box"><h2 id="dmH">Downloads are for students</h2><p>Downloading the PDF is open to enrolled students signed in with their own account. This is a demo, so the report opens as a preview only.</p><p>' + DISCLAIMER + '</p><div class="sa-actions"><button type="button" class="btn btn-primary" id="dmOk">Got it</button></div></div>';
    document.body.appendChild(m);
    function close() { m.remove(); document.removeEventListener("keydown", k); $("dmDl").focus(); }
    function k(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", k); m.addEventListener("click", function (e) { if (e.target === m) close(); });
    $("dmOk").onclick = close; $("dmOk").focus();
  }

  /* Placeholder "screenshots" for the review listings, clearly marked as demo images. */
  function shots(S) {
    var out = {}, P = { google: ["Google", "google.com/maps", 5], booking: ["Booking.com", "booking.com", 10], tripadvisor: ["TripAdvisor", "tripadvisor.com", 5] };
    Object.keys(P).forEach(function (id) {
      var r = (S.rep || {})[id]; if (!r || r.status !== "listed") return;
      var c = document.createElement("canvas"); c.width = 900; c.height = 520; var g = c.getContext("2d");
      g.fillStyle = "#f3f5f8"; g.fillRect(0, 0, 900, 520); g.fillStyle = "#ffffff"; g.fillRect(0, 0, 900, 56); g.fillStyle = "#e3e7ee"; g.fillRect(24, 14, 852, 28);
      g.fillStyle = "#5d6478"; g.font = "16px sans-serif"; g.fillText("https://" + P[id][1] + "/  (demo placeholder)", 40, 34);
      g.fillStyle = "#1e2742"; g.font = "bold 40px sans-serif"; g.fillText("Ruka Maldives", 48, 130);
      g.font = "22px sans-serif"; g.fillStyle = "#5d6478"; g.fillText(P[id][0] + " listing  ·  Dhiffushi, Kaafu Atoll", 48, 168);
      g.fillStyle = "#0b8794"; g.font = "bold 64px sans-serif"; g.fillText(r.rating + " / " + P[id][2], 48, 268);
      g.fillStyle = "#1e2742"; g.font = "26px sans-serif"; g.fillText(r.count + " reviews  ·  newest " + r.lastDate, 48, 312);
      g.save(); g.translate(450, 420); g.rotate(-0.12); g.fillStyle = "rgba(232,131,58,.9)"; g.font = "bold 34px sans-serif"; g.textAlign = "center"; g.fillText("DEMO SCREENSHOT: FICTIONAL FIGURES", 0, 0); g.restore();
      out[id] = c.toDataURL("image/jpeg", 0.8);
    });
    return out;
  }
  window.SA_DEMO = {
    start: function (api) {
      T = api; window.SA_DEMO.api = api; var S = api.stamp(JSON.parse(JSON.stringify(window.SA_DEMO_STATE))); if (window.SA.migrate) window.SA.migrate(S);
      S.step = 0; S.sub = {}; S.seen2 = true; S.agree = true; api.S = S; api.setLoaded();
      api.setImg(shots(S));
      document.body.classList.add("sa-demo"); document.title = "Guest demo: Ruka Maldives | Digital Presence Audit";
      Q = []; for (var i = 0; i < 10; i++) { var P = api.pagesFor(i), n = P ? P.length : 1; for (var k = 0; k < n; k++) Q.push([i, k]); } Q.push([10, 0]);
      css(); bar(); nav(); show(0);
    }
  };
})();
