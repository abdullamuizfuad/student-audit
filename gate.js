/* Student Audit landing page: name and MNU student ID, checked against the class list in the lecturer's Google Sheet (only the ID is sent). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var n = $("gName"), id = $("gId"), mail = $("gMail"), mt = $("gMailTxt"), go = $("gGo"), err = $("gErr");
  var KEY = "ia-student";
  var CHECK_URL = window.SA_COPY_URL || "https://script.google.com/macros/s/AKfycbzpXGVOhzHwtc9kz0xs4XgmtL-ZMFoI0oJwjf0a5Gv8GdDmCTe8xqatUFhcKrQOyMkaYQ/exec";
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
    var ctl = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    fetch(CHECK_URL + "?action=check&sid=" + encodeURIComponent(sid), { credentials: "omit", redirect: "follow", cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        clearTimeout(tm);
        if (!res || !res.ok) { done(res && res.reason === "not-listed" ? "This ID is not on the class list. Check the number, or ask your lecturer to add you." : "That ID could not be verified. Check the number."); return; }
        var rec = { name: (res.name || n.value.trim()).replace(/\s+/g, " "), sid: sid, email: sid.toLowerCase() + "@student.mnu.edu.mv", verified: !res.open, at: new Date().toISOString() };
        try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
        try { sessionStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
        go.textContent = res.name ? "Welcome, " + res.name.split(" ")[0] + ". Opening the tool..." : "Verified. Opening the tool...";
        setTimeout(function () { location.href = "tool.html"; }, 500);
      })
      .catch(function () {
        /* The class list could not be reached (Google down or busy). Let the student in, marked unverified: the copy sent to the lecturer is checked against the class list again. */
        clearTimeout(tm);
        var rec = { name: n.value.trim().replace(/\s+/g, " "), sid: sid, email: sid.toLowerCase() + "@student.mnu.edu.mv", verified: false, at: new Date().toISOString() };
        try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
        try { sessionStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
        go.textContent = "Opening the tool...";
        setTimeout(function () { location.href = "tool.html"; }, 500);
      });
  });
  check();
  $("saTheme").addEventListener("click", function () {
    var d = document.documentElement, dark = d.dataset.theme !== "dark";
    if (dark) d.dataset.theme = "dark"; else delete d.dataset.theme;
    try { localStorage.setItem("ia-theme", dark ? "dark" : "light"); } catch (e) {}
  });
  $("saYr").textContent = new Date().getFullYear();
})();
