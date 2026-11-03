/* Student Audit cloud: sign-in with student ID + 6-digit PIN, and saving work to Firebase (project mkt303-audit).
   A student's login is the Firebase email/password account s0xxxxx@student.mnu.edu.mv with the PIN as password.
   No email is ever sent. Document IDs use the small-letter ID (s000001). See firestore.rules. */
(function () {
  "use strict";
  var CFG = { apiKey: "AIzaSyCCt5K4xpbpleP4Qe5d4_WYH-qCIaWmzXM", authDomain: "mkt303-audit.firebaseapp.com", projectId: "mkt303-audit", storageBucket: "mkt303-audit.firebasestorage.app", messagingSenderId: "507366722398", appId: "1:507366722398:web:5d547cb45b4e27873e1dcf" };
  var ok = typeof firebase !== "undefined";
  if (ok && !firebase.apps.length) firebase.initializeApp(CFG);
  var auth = ok ? firebase.auth() : null, db = ok ? firebase.firestore() : null;
  var DOMAIN = "@student.mnu.edu.mv";
  function mail(sid) { return String(sid).toLowerCase() + DOMAIN; }
  function low(sid) { return String(sid).toLowerCase(); }
  function sidOf(user) { return user && user.email && user.email.slice(-DOMAIN.length) === DOMAIN ? user.email.slice(0, -DOMAIN.length).toUpperCase() : ""; }
  function code(e) { return (e && e.code) || ""; }

  /* Plain-English messages for students */
  function say(e) {
    var c = code(e);
    if (c === "auth/invalid-login-credentials" || c === "auth/invalid-credential" || c === "auth/wrong-password" || c === "auth/user-not-found") return "The student ID or PIN is not right. First time here? Tap Create a PIN.";
    if (c === "auth/email-already-in-use") return "This student ID already has a PIN. Tap Sign in. Forgot your PIN? Ask your lecturer to reset it.";
    if (c === "auth/too-many-requests") return "Too many tries. Wait a few minutes, then try again.";
    if (c === "auth/network-request-failed" || c === "unavailable") return "No internet connection. Check your connection and try again.";
    if (c === "auth/weak-password") return "The PIN must be 6 numbers.";
    if (c === "not-on-list") return "This ID is not on the MKT303 class list. Check the number, or ask your lecturer to add you.";
    return "Something went wrong (" + (c || (e && e.message) || "unknown") + "). Try again.";
  }

  /* Is this signed-in student on the class list? Rules only let them read their own entry. */
  function onList(sid) { return db.collection("roster").doc(low(sid)).get().then(function (d) { return d.exists; }, function () { return false; }); }

  function signIn(sid, pin) {
    return auth.signInWithEmailAndPassword(mail(sid), pin).then(function (cr) {
      return onList(sid).then(function (yes) { if (!yes) return auth.signOut().then(function () { throw { code: "not-on-list" }; }); return cr.user; });
    });
  }
  function create(sid, pin, name) {
    return auth.createUserWithEmailAndPassword(mail(sid), pin).then(function (cr) {
      return onList(sid).then(function (yes) {
        if (!yes) return cr.user.delete().catch(function () {}).then(function () { return auth.signOut(); }).then(function () { throw { code: "not-on-list" }; });
        return db.collection("progress").doc(low(sid)).set({ name: name, sid: sid, created: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }).then(function () { return cr.user; });
      });
    });
  }
  function profile(sid) { return db.collection("progress").doc(low(sid)).get().then(function (d) { return d.exists ? d.data() : null; }); }
  function saveState(sid, S, name) {
    return db.collection("progress").doc(low(sid)).set({ name: name || "", sid: sid, state: JSON.stringify(S), step: S.step || 0, business: (S.biz && S.biz.name) || "", savedAt: S.savedAt || Date.now(), updated: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  function saveImg(sid, id, data) { var r = db.collection("progress").doc(low(sid)).collection("img").doc(id); return data ? r.set({ d: data, at: Date.now() }) : r.delete(); }
  function loadImgs(sid) { return db.collection("progress").doc(low(sid)).collection("img").get().then(function (q) { var o = {}; q.forEach(function (d) { if (d.data().d) o[d.id] = d.data().d; }); return o; }); }
  function submit(sid, info) { info.at = firebase.firestore.FieldValue.serverTimestamp(); return db.collection("submissions").doc(low(sid)).set(info, { merge: true }); }
  /* Wait for Firebase to tell us who is signed in (it remembers the login on this device). */
  function ready() { return new Promise(function (res) { if (!auth) { res(null); return; } var off = auth.onAuthStateChanged(function (u) { off(); res(u); }); }); }

  window.SAC = { ok: ok, auth: auth, db: db, mail: mail, low: low, sidOf: sidOf, say: say, signIn: signIn, create: create, profile: profile, saveState: saveState, saveImg: saveImg, loadImgs: loadImgs, submit: submit, ready: ready, signOut: function () { return auth ? auth.signOut() : Promise.resolve(); } };
})();
