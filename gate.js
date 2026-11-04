/* Student Audit sign-in: student ID + 6-digit PIN (Firebase, see cloud.js).
   First time: the student makes their own PIN. The class list is checked in Firebase; it is not in this site's files. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var n = $("gName"), id = $("gId"), pin = $("gPin"), pin2 = $("gPin2"), go = $("gGo"), err = $("gErr");
  var KEY = "ia-student", NEW = false;
  function digits(el, max) { var d = el.value.replace(/\D/g, "").slice(0, max); if (el.value !== d) el.value = d; return d; }
  function setMode(isNew) {
    NEW = isNew;
    $("gModeIn").classList.toggle("on", !isNew); $("gModeIn").setAttribute("aria-selected", String(!isNew));
    $("gModeNew").classList.toggle("on", isNew); $("gModeNew").setAttribute("aria-selected", String(isNew));
    $("gNameF").hidden = !isNew; $("gPin2F").hidden = !isNew;
    $("gPinL").textContent = isNew ? "Make a PIN" : "PIN";
    $("gPinHint").textContent = isNew ? "Choose 6 numbers you will remember. Do not use 123456 or your birthday." : "The 6-number PIN you made the first time.";
    pin.setAttribute("autocomplete", isNew ? "new-password" : "current-password");
    err.textContent = ""; check();
  }
  function check() {
    var d = digits(id, 6), p = digits(pin, 6), p2 = digits(pin2, 6);
    var idOk = /^0\d{5}$/.test(d), pinOk = /^\d{6}$/.test(p), nameOk = n.value.trim().length >= 3, sameOk = p2 === p;
    var msg = d.length && d[0] !== "0" ? "MNU student IDs start with S0. Check the first number." : "";
    if (!msg && NEW && p2.length === 6 && !sameOk) msg = "The two PINs are not the same.";
    err.textContent = msg;
    var all = idOk && pinOk && (!NEW || (nameOk && sameOk && p2.length === 6));
    go.disabled = !all; go.textContent = NEW ? "Create my PIN and start" : "Sign in";
    return all;
  }
  [n, id, pin, pin2].forEach(function (el) { el.addEventListener("input", check); });
  $("gModeIn").addEventListener("click", function () { setMode(false); });
  $("gModeNew").addEventListener("click", function () { setMode(true); });
  $("gShow").addEventListener("change", function () { pin.type = pin2.type = this.checked ? "text" : "password"; });

  function enter(sid, name) {
    var rec = { name: name, sid: sid, email: sid.toLowerCase() + "@student.mnu.edu.mv", verified: true, cloud: true, at: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
    try { sessionStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
    go.textContent = "Signed in. Opening the tool...";
    setTimeout(function () { location.href = "tool.html"; }, 300);
  }
  $("gate").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!check()) return;
    if (!window.SAC || !SAC.ok) { err.textContent = "The sign-in could not load. Check your internet connection and refresh the page."; return; }
    var sid = "S" + id.value, name = n.value.trim().replace(/\s+/g, " ");
    go.disabled = true; go.textContent = NEW ? "Creating your PIN..." : "Signing in..."; err.textContent = "";
    var fail = function (e) { go.disabled = false; check(); err.textContent = SAC.say(e); };
    if (NEW) SAC.create(sid, pin.value, name).then(function () { enter(sid, name); }, fail);
    else SAC.signIn(sid, pin.value).then(function () {
      return SAC.profile(sid).then(function (p) { enter(sid, (p && p.name) || ""); }, function () { enter(sid, ""); });
    }, fail);
  });
  /* Digital Presence Audit 2.0: everyone is signed out once (see tool.html), then signs in again */
  var FORCE = false; try { if (localStorage.getItem("ia-v2-out") !== "1") { localStorage.setItem("ia-v2-out", "1"); localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); FORCE = true; } } catch (e) {}
  var OUT = FORCE || /[?&]out=1/.test(location.search);
  if (FORCE || /[?&]v2=1/.test(location.search)) {
    var note = document.createElement("div"); note.className = "sa-note sa-v2note"; note.setAttribute("role", "status");
    note.innerHTML = "<b>Digital Presence Audit 2.0 is here.</b> We signed everyone out for the update. Sign in again with your student ID and PIN. Your work is saved in your account and will open where you left off.";
    $("gate").parentNode.insertBefore(note, $("gate"));
  }
  /* Already signed in on this device: go straight on, unless they came here to sign out. */
  if (window.SAC && SAC.ok && !OUT) SAC.ready().then(function (u) {
    var sid = SAC.sidOf(u); if (!sid) return;
    SAC.profile(sid).then(function (p) { if (p) enter(sid, p.name || ""); }, function () {});
  });
  if (OUT && window.SAC && SAC.ok) SAC.signOut();
  setMode(false);
  $("saTheme").addEventListener("click", function () {
    var d = document.documentElement, dark = d.dataset.theme !== "dark";
    if (dark) d.dataset.theme = "dark"; else delete d.dataset.theme;
    try { localStorage.setItem("ia-theme", dark ? "dark" : "light"); } catch (e) {}
  });
  $("saYr").textContent = new Date().getFullYear();
})();
