/* Student Audit: free web services that give students evidence for the website step. Nothing here is required:
   if a service is busy, blocked or offline, the tool says so and the student answers by hand as before.
   - Google PageSpeed Insights API: mobile Performance and SEO scores.
     Works without a key at low volume. For a whole class, put a browser key in PSI_KEY (see README, "PageSpeed key").
   - Microlink (api.microlink.io, free plan, no key): the home page title, description and a screenshot.
   - The QR code on the PDF is drawn by vendor/qrcode.js in the browser, with no web service. */
(function () {
  "use strict";
  var PSI_KEY = ""; // Google Cloud API key restricted to https://abdullamuizfuad.github.io/* and the PageSpeed Insights API only
  function timeout(ms, p) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error("timeout")); }, ms); p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); }); }
  function getJson(u, ms) { return timeout(ms, fetch(u, { mode: "cors", credentials: "omit" })).then(function (r) { if (!r.ok) { var e = new Error("http " + r.status); e.status = r.status; throw e; } return r.json(); }); }
  function norm(u) { u = String(u || "").trim(); if (!u) return ""; if (!/^https?:\/\//i.test(u)) u = "https://" + u; try { return new URL(u).href; } catch (e) { return ""; } }

  /* PageSpeed Insights, mobile. Takes 10 to 40 seconds. */
  function psi(url) {
    var u = norm(url); if (!u) return Promise.reject(new Error("no url"));
    var q = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" + encodeURIComponent(u) + "&strategy=mobile&category=performance&category=seo" + (PSI_KEY ? "&key=" + encodeURIComponent(PSI_KEY) : "");
    return getJson(q, 90000).then(function (d) {
      var c = (d.lighthouseResult || {}).categories || {}, au = (d.lighthouseResult || {}).audits || {}, sc = function (k) { return c[k] && c[k].score != null ? Math.round(c[k].score * 100) : null; };
      var lcp = au["largest-contentful-paint"] && au["largest-contentful-paint"].numericValue;
      var out = { perf: sc("performance"), seo: sc("seo"), lcp: lcp ? Math.round(lcp / 100) / 10 : null, at: new Date().toISOString().slice(0, 10) };
      if (out.perf == null && out.seo == null) throw new Error("no scores");
      return out;
    });
  }

  /* Microlink: what search engines and AI tools read from the home page, plus a screenshot */
  function peek(url) {
    var u = norm(url); if (!u) return Promise.reject(new Error("no url"));
    return getJson("https://api.microlink.io/?url=" + encodeURIComponent(u) + "&screenshot=true&meta=true", 45000).then(function (d) {
      if (!d || d.status !== "success" || !d.data) throw new Error((d && d.message) || "no data");
      var x = d.data;
      return { title: x.title || "", desc: x.description || "", lang: x.lang || "", shotUrl: x.screenshot && x.screenshot.url || "", at: new Date().toISOString().slice(0, 10) };
    });
  }
  /* turn the screenshot into a small JPEG the PDF can hold. Fails quietly if the image host blocks it. */
  function shrink(src, max) {
    return timeout(30000, fetch(src, { mode: "cors", credentials: "omit" })).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.blob(); }).then(function (b) {
      return new Promise(function (res, rej) {
        var im = new Image(), ou = URL.createObjectURL(b);
        im.onload = function () { var k = Math.min(1, (max || 1000) / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); var cx = c.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(ou); res(c.toDataURL("image/jpeg", 0.72)); };
        im.onerror = function () { URL.revokeObjectURL(ou); rej(new Error("bad image")); };
        im.src = ou;
      });
    });
  }
  /* why a call failed, in plain words */
  function say(e) {
    var s = e && e.status;
    if (s === 429) return "the free service is busy right now (too many tests today)";
    if (e && e.message === "timeout") return "the test took too long";
    if (s === 400 || s === 500) return "the service could not open that address";
    if (!navigator.onLine) return "you are offline";
    return "the service could not be reached";
  }
  /* QR code as a grid of squares (true = dark), for the PDF */
  function qr(text) { if (!window.qrcode) return null; try { var q = window.qrcode(0, "M"); q.addData(text); q.make(); var n = q.getModuleCount(), g = []; for (var r = 0; r < n; r++) { g.push([]); for (var c = 0; c < n; c++) g[r].push(q.isDark(r, c)); } return g; } catch (e) { return null; } }
  var SITE = "https://abdullamuizfuad.github.io/student-audit/";
  function verifyUrl(code) { return SITE + "admin.html#code=" + encodeURIComponent(code); }
  window.SAX = { psi: psi, peek: peek, shrink: shrink, say: say, qr: qr, verifyUrl: verifyUrl, hasKey: !!PSI_KEY };
})();
