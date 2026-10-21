/* Student Audit landing page: name and MNU student ID. The ID is checked against roster.js, which holds scrambled IDs only (built by tools/build-roster.py). Names are not checked. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var n = $("gName"), id = $("gId"), mail = $("gMail"), mt = $("gMailTxt"), go = $("gGo"), err = $("gErr");
  var KEY = "ia-student";
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && s.sid) { n.value = s.name || ""; id.value = String(s.sid).slice(1); } } catch (e) {}
  function check() {
    var d = id.value.replace(/\D/g, "").slice(0, 6); if (id.value !== d) id.value = d;
    mt.innerHTML = "s" + esc(d) + (d.length < 6 ? "<i>" + "0xxxxx".slice(d.length) + "</i>" : "") + "@student.mnu.edu.mv";
    var idOk = /^0\d{5}$/.test(d), nameOk = n.value.trim().length >= 3;
    mail.classList.toggle("ok", idOk);
    err.textContent = d.length && d[0] !== "0" ? "MNU student IDs start with S0. Check the first number." : "";
    go.disabled = !(idOk && nameOk);
    return idOk && nameOk;
  }
  n.addEventListener("input", check); id.addEventListener("input", check);
  $("gate").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!check()) { err.textContent = n.value.trim().length < 3 ? "Enter your full name." : "Enter the 6 numbers of your student ID."; return; }
    var sid = "S" + id.value;
    go.disabled = true; go.textContent = "Checking the class list..."; err.textContent = "";
    var done = function (msg) { go.textContent = "Verify and start"; check(); err.textContent = msg; };
    var R = typeof ROSTER !== "undefined" ? ROSTER : null;
    if (!R || !R.hashes || !R.hashes.length || !window.crypto || !crypto.subtle) { done("The class list could not load. Refresh the page and try again."); return; }
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(R.salt + "|" + sid)).then(function (b) {
      var h = Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
      if (R.hashes.indexOf(h) < 0) { done("This ID is not on the MKT303 class list for " + R.term + ". Check the number, or ask your lecturer to add you."); return; }
      var rec = { name: n.value.trim().replace(/\s+/g, " "), sid: sid, email: sid.toLowerCase() + "@student.mnu.edu.mv", verified: true, at: new Date().toISOString() };
      try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
      try { sessionStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
      go.textContent = "Verified. Opening the tool...";
      setTimeout(function () { location.href = "tool.html"; }, 500);
    }, function () { done("The class list could not be checked. Refresh the page and try again."); });
  });
  check();
  $("saTheme").addEventListener("click", function () {
    var d = document.documentElement, dark = d.dataset.theme !== "dark";
    if (dark) d.dataset.theme = "dark"; else delete d.dataset.theme;
    try { localStorage.setItem("ia-theme", dark ? "dark" : "light"); } catch (e) {}
  });
  $("saYr").textContent = new Date().getFullYear();
})();
