/* Student Audit lecturer page. Signs in with a lecturer email and password; the account must have a document in /admins/{uid}.
   Reads the class list, progress and submissions. Adds IDs to the class list (small letters, as the rules expect). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); }, db = SAC.db, auth = SAC.auth, PENDING = [];
  var STEPS = ["About the business", "Social media", "Google profile", "Website", "Reviews", "Audit results", "Target market", "Objectives", "Strategies and budget", "Control and evaluation", "Download"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function msg(id, t, bad) { var el = $(id); el.textContent = t; el.classList.toggle("bad", !!bad); }
  function when(ts) { if (!ts) return ""; var d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }); }

  $("adForm").addEventListener("submit", function (ev) {
    ev.preventDefault(); msg("adLoginMsg", "Signing in...");
    auth.signInWithEmailAndPassword($("adEmail").value.trim(), $("adPass").value).catch(function (e) { msg("adLoginMsg", "Could not sign in: " + (e.code || e.message), true); });
  });
  $("adOut").addEventListener("click", function () { auth.signOut(); });
  auth.onAuthStateChanged(function (u) {
    if (!u) { $("adLogin").hidden = false; $("adApp").hidden = true; $("adOut").hidden = true; return; }
    if (SAC.sidOf(u)) { msg("adLoginMsg", "This is a student login. Sign out and use the lecturer account.", true); $("adOut").hidden = false; return; }
    db.collection("admins").doc(u.uid).get().then(function (d) {
      if (!d.exists) { msg("adLoginMsg", "This account is not set up as a lecturer. In Firestore, add admins/" + u.uid + " with role = lecturer.", true); $("adOut").hidden = false; return; }
      $("adLogin").hidden = true; $("adApp").hidden = false; $("adOut").hidden = false; load();
    }, function (e) { msg("adLoginMsg", "Could not check the lecturer account: " + (e.code || e.message), true); });
  });

  /* A QR code on a student's PDF opens admin.html#code=XXXX: that code is checked and its row highlighted */
  var WANT = (function () { var m = /code=([A-Za-z0-9]+)/.exec(location.hash || ""); return m ? m[1].toUpperCase() : ""; })();
  function load() {
    $("adTbl").innerHTML = "<tr><td>Loading...</td></tr>";
    Promise.all([db.collection("roster").get(), db.collection("progress").get(), db.collection("submissions").get()]).then(function (r) {
      var rows = {}, codes = {};
      r[0].forEach(function (d) { rows[d.id] = { id: d.id, term: d.data().term || "" }; });
      r[1].forEach(function (d) { var x = rows[d.id] || (rows[d.id] = { id: d.id, off: true }); var v = d.data(); x.name = v.name; x.step = v.step; x.business = v.business; x.updated = v.updated; });
      r[2].forEach(function (d) { var x = rows[d.id] || (rows[d.id] = { id: d.id, off: true }); var v = d.data(); x.sub = v; if (v.code) codes[v.code] = (codes[v.code] || 0) + 1; });
      var list = Object.keys(rows).sort().map(function (k) { return rows[k]; });
      var started = list.filter(function (x) { return x.updated; }).length, done = list.filter(function (x) { return x.sub; }).length, dups = Object.keys(codes).filter(function (c) { return codes[c] > 1; }).length;
      $("adStats").innerHTML = "<span>" + list.filter(function (x) { return !x.off; }).length + " on the class list</span><span>" + started + " started</span><span>" + done + " downloaded a final PDF</span>" + (dups ? '<span class="ad-dup">' + dups + " repeated code" + (dups > 1 ? "s" : "") + "</span>" : "");
      $("adTbl").innerHTML = "<tr><th>Student ID</th><th>Name</th><th>Step</th><th>Business</th><th>Last saved</th><th>Final PDF code</th><th>Score</th><th>Budget (MVR)</th><th>Skipped</th><th></th></tr>" +
        list.map(function (x) {
          var s = x.sub || {}, dup = s.code && codes[s.code] > 1, hit = WANT && s.code === WANT;
          return "<tr" + (hit ? ' class="ad-hit" id="adHit"' : "") + "><td>" + esc(x.id.toUpperCase()) + (x.off ? " <small>(not on list)</small>" : "") + "</td><td>" + esc(x.name || "") + "</td><td>" + (x.step != null ? (x.step + 1) + ". " + esc(STEPS[x.step] || "") : "Not started") + "</td><td>" + esc(x.business || "") + "</td><td>" + esc(when(x.updated)) + "</td>" +
            '<td class="' + (dup ? "ad-dup" : "") + '">' + esc(s.code || "") + (dup ? " (same as another student)" : "") + "</td><td>" + (s.overall != null ? s.overall + "/100" : "") + "</td><td>" + (s.budget != null ? Math.round(s.budget).toLocaleString("en-US") : "") + "</td><td>" + (s.skipped != null ? s.skipped : "") + "</td>" +
            "<td>" + (x.off ? "" : '<button type="button" class="ad-x" data-rm="' + esc(x.id) + '">Remove</button>') + "</td></tr>";
        }).join("");
      if (WANT) {
        var hits = list.filter(function (x) { return x.sub && x.sub.code === WANT; });
        $("adCheck").hidden = false;
        $("adCheck").innerHTML = hits.length === 1 ? "<b>Code " + esc(WANT) + " is genuine.</b> It belongs to " + esc(hits[0].id.toUpperCase()) + (hits[0].name ? " (" + esc(hits[0].name) + ")" : "") + (hits[0].sub.business ? ", business: " + esc(hits[0].sub.business) : "") + ". Check that the name on the assignment matches."
          : hits.length > 1 ? "<b>Code " + esc(WANT) + " was downloaded by " + hits.length + " students:</b> " + hits.map(function (x) { return esc(x.id.toUpperCase()); }).join(", ") + ". They handed in the same work."
          : "<b>Code " + esc(WANT) + " was not found.</b> No student downloaded a final PDF with this code. The PDF may have been edited, or the student made a newer PDF since. Ask the student.";
        $("adCheck").className = "ad-check " + (hits.length === 1 ? "ok" : "bad");
        var hr = $("adHit"); if (hr) hr.scrollIntoView({ block: "center" });
      }
    }, function (e) { $("adTbl").innerHTML = "<tr><td>Could not load: " + esc(e.code || e.message) + "</td></tr>"; });
  }
  $("adReload").addEventListener("click", load);
  $("adTbl").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-rm]"); if (!b) return;
    var id = b.dataset.rm; if (!confirm("Remove " + id.toUpperCase() + " from the class list? They will not be able to sign in. Their saved work is kept.")) return;
    db.collection("roster").doc(id).delete().then(load, function (e) { alert("Could not remove: " + (e.code || e.message)); });
  });

  /* Class list: MNU download (.xls is an HTML table with "E-mail Address" and "Status" columns), CSV, or pasted text. */
  function idsFrom(text) {
    var active = {}, dropped = {};
    if (/<table/i.test(text)) {
      var doc = new DOMParser().parseFromString(text, "text/html"), trs = Array.prototype.slice.call(doc.querySelectorAll("tr"));
      var head = trs.length ? Array.prototype.map.call(trs[0].querySelectorAll("td,th"), function (c) { return c.textContent.trim().toLowerCase(); }) : [];
      var mi = head.indexOf("e-mail address"), si = head.indexOf("status");
      if (mi >= 0) {
        trs.slice(1).forEach(function (tr) { var c = tr.querySelectorAll("td,th"); if (c.length <= mi) return; var m = /\b(s0\d{5})@/i.exec(c[mi].textContent); if (!m) return; var id = m[1].toLowerCase(); if (si >= 0 && c[si] && /^drop$/i.test(c[si].textContent.trim())) dropped[id] = 1; else active[id] = 1; });
        Object.keys(active).forEach(function (k) { delete dropped[k]; });
        return { ids: Object.keys(active).sort(), dropped: Object.keys(dropped).length };
      }
      text = doc.body ? doc.body.textContent : text;
    }
    (text.match(/\bs0\d{5}\b/gi) || []).forEach(function (m) { active[m.toLowerCase()] = 1; });
    return { ids: Object.keys(active).sort(), dropped: 0 };
  }
  function preview(r) {
    PENDING = r.ids; $("adAdd").disabled = !PENDING.length;
    msg("adAddMsg", PENDING.length ? "Found " + PENDING.length + " student ID" + (PENDING.length > 1 ? "s" : "") + (r.dropped ? " (" + r.dropped + " marked Drop, left out)" : "") + ": " + PENDING.map(function (x) { return x.toUpperCase(); }).join(", ") + ". Press Add to the class list." : "No student IDs found. IDs look like S083001.", !PENDING.length);
  }
  $("adFile").addEventListener("change", function () { var f = this.files && this.files[0]; if (!f) return; var fr = new FileReader(); fr.onload = function () { preview(idsFrom(String(fr.result))); }; fr.readAsText(f); });
  $("adCheck").addEventListener("click", function () { preview(idsFrom($("adPaste").value)); });
  $("adAdd").addEventListener("click", function () {
    var term = $("adTerm").value.trim() || "T2 2026", b = db.batch();
    PENDING.forEach(function (id) { b.set(db.collection("roster").doc(id), { term: term, added: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); });
    $("adAdd").disabled = true; msg("adAddMsg", "Adding...");
    b.commit().then(function () { msg("adAddMsg", "Added " + PENDING.length + " to the class list. Students can now make their PIN."); PENDING = []; $("adPaste").value = ""; $("adFile").value = ""; load(); }, function (e) { $("adAdd").disabled = false; msg("adAddMsg", "Could not add: " + (e.code || e.message), true); });
  });
})();
