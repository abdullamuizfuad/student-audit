/* Student Audit landing page: name and MNU student ID, then into the tool. Nothing is sent. */
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
    var sid = "S" + id.value, rec = { name: n.value.trim().replace(/\s+/g, " "), sid: sid, email: sid.toLowerCase() + "@student.mnu.edu.mv", at: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
    try { sessionStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
    go.disabled = true; go.textContent = "Opening the tool...";
    location.href = "tool.html";
  });
  check();
  $("saTheme").addEventListener("click", function () {
    var d = document.documentElement, dark = d.dataset.theme !== "dark";
    if (dark) d.dataset.theme = "dark"; else delete d.dataset.theme;
    try { localStorage.setItem("ia-theme", dark ? "dark" : "light"); } catch (e) {}
  });
  $("saYr").textContent = new Date().getFullYear();
})();
