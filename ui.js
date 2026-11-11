/* Islandeative Student Audit: screens. Answers are kept in this browser per student ID and saved to the student's Firebase account (cloud.js), which only the student and the lecturer can read. */
(function () {
"use strict";
var SA = window.SA, $ = function (id) { return document.getElementById(id); };
var DRAFT_OLD = "ia-student-audit-v2", DRAFT = DRAFT_OLD;
var STEPS = ["About the business", "Social media", "Google Business Profile", "Website", "Reviews", "Your audit results", "Target market", "Objectives", "Strategies and budget", "Control and evaluation", "Download"];

function blank() {
  var d = new Date(), m = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { step: 0, biz: { name: "", student: "", sid: "", type: "", onLocation: "", checked: SA.ymd(d), start: m.getFullYear() + "-" + ("0" + (m.getMonth() + 1)).slice(-2), cap: "" },
    social: {}, gbp: { status: "", checks: {} }, site: { has: "", checks: {}, subs: {} }, rep: {}, plan: null, objs: null, v: SA.PLAN_V };
}
var ME = (function () { try { return JSON.parse(localStorage.getItem("ia-student") || sessionStorage.getItem("ia-student") || "null") || {}; } catch (e) { return {}; } })();
DRAFT = DRAFT_OLD + ":" + (ME.sid || "anon");
var DEMO = /[?&]demo=1/.test(location.search) && !!window.SA_DEMO;
if (DEMO) ME = { name: "Guest reviewer", sid: "DEMO", email: "Preview mode" };
function stamp(st) { st.biz.student = ME.name || st.biz.student || ""; st.biz.sid = ME.sid || st.biz.sid || ""; st.biz.email = ME.email || ""; return st; }
var S = stamp(blank()), IMG = {}, RESUMED = false; // IMG holds screenshots; also kept in this browser (IndexedDB) so they survive a reload
/* small IndexedDB store for screenshots */
function idb() { return new Promise(function (res, rej) { if (!window.indexedDB) { rej(); return; } var r = indexedDB.open("ia-student-audit", 1); r.onupgradeneeded = function () { r.result.createObjectStore("kv"); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(); }; }); }
function idbSet(k, v) { return idb().then(function (db) { return new Promise(function (res) { var t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = res; t.onerror = res; }); }).catch(function () {}); }
function idbGet(k) { return idb().then(function (db) { return new Promise(function (res) { var q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(null); }; }); }).catch(function () { return null; }); }
function imgKey() { return "img-" + (ME.sid || "anon"); }
var CLOUD = !DEMO && !!(window.SAC && SAC.ok && ME.cloud && ME.sid), CT = null, SENT = {};
function cloudMsg(t, bad) { var el = $("saCloud"); if (el) { el.textContent = t; el.classList.toggle("bad", !!bad); } }
function cloudSave() {
  if (!CLOUD) return; clearTimeout(CT); cloudMsg("Saving...");
  CT = setTimeout(function () {
    SAC.saveState(ME.sid, S, ME.name).then(function () { cloudMsg("Saved to your account"); }, function (e) { cloudMsg("Not saved yet: " + SAC.say(e) + " Your answers are kept on this device.", true); });
  }, 1200);
}
function cloudImgs() {
  if (!CLOUD) return;
  Object.keys(IMG).forEach(function (k) { if (SENT[k] !== IMG[k].length) { SENT[k] = IMG[k].length; SAC.saveImg(ME.sid, k, IMG[k]).catch(function () { delete SENT[k]; }); } });
  Object.keys(SENT).forEach(function (k) { if (!IMG[k]) { delete SENT[k]; SAC.saveImg(ME.sid, k, null).catch(function () {}); } });
}
function saveImgs() { if (DEMO) return; idbSet(imgKey(), IMG); cloudImgs(); }

var LOADED = false;
function save() { if (!LOADED || DEMO) return; S.savedAt = Date.now(); try { localStorage.setItem(DRAFT, JSON.stringify(S)); } catch (e) {} cloudSave(); }
function load() { try { var r = localStorage.getItem(DRAFT);
  if (!r) { var old = localStorage.getItem(DRAFT_OLD), oo = old ? JSON.parse(old) : null; if (oo && oo.biz && oo.biz.sid && oo.biz.sid === ME.sid) { r = old; localStorage.setItem(DRAFT, old); localStorage.removeItem(DRAFT_OLD); } } if (r) { var o = JSON.parse(r); if (o && o.biz) { S = o; SA.migrate(S); return true; } } } catch (e) {} return false; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function getp(path) { var o = S, k = path.split("."); for (var i = 0; i < k.length; i++) { if (o == null) return undefined; o = o[k[i]]; } return o; }
function setp(path, v) { var o = S, k = path.split("."); for (var i = 0; i < k.length - 1; i++) { if (o[k[i]] == null || typeof o[k[i]] !== "object") o[k[i]] = {}; o = o[k[i]]; } o[k[k.length - 1]] = v; }

/* ---------- field builders ---------- */
function txt(path, label, o) {
  o = o || {}; var v = getp(path);
  path = esc(path);
  return '<div class="f' + (o.wide ? " wide" : "") + '"><label for="f_' + path + '">' + label + (o.opt ? ' <span class="cc-opt">(optional)</span>' : "") + '</label>' +
    '<input id="f_' + path + '" data-p="' + path + '" type="' + (o.type || "text") + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : "") + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + ' value="' + esc(v) + '" autocomplete="off">' +
    (o.hint ? '<span class="sa-hint">' + o.hint + "</span>" : "") + "</div>";
}
function chips(path, label, opts, o) {
  o = o || {}; var v = getp(path);
  return '<fieldset class="sa-fs"><legend>' + label + "</legend>" + (o.tip ? '<p class="sa-tip">' + o.tip + "</p>" : "") + '<div class="sa-opts">' +
    opts.map(function (x) { return '<button type="button" class="sa-chip' + (o.sm ? " sm" : "") + '" data-p="' + esc(path) + '" data-v="' + esc(x[0]) + '"' + (o.re ? ' data-re="1"' : "") + ' aria-pressed="' + (v != null && String(v) === String(x[0])) + '">' + x[1] + "</button>"; }).join("") + "</div></fieldset>";
}
function yn(path, q, tip, noPartly) {
  var v = getp(path), opts = noPartly ? [["y", "Yes"], ["n", "No"], ["u", "Can't tell"]] : [["y", "Yes"], ["p", "Partly"], ["n", "No"], ["u", "Can't tell"]];
  return '<div class="sa-yn"><p class="sa-q">' + esc(q) + "</p>" + (tip ? '<p class="sa-tip">' + esc(tip) + "</p>" : "") + '<div class="sa-opts">' +
    opts.map(function (x) { return '<button type="button" class="sa-chip sm" data-p="' + path + '" data-v="' + x[0] + '" aria-pressed="' + (v === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div></div>";
}

/* ---------- step 1 ---------- */
function monthOpts() {
  var d = new Date(), out = [], names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  for (var i = 1; i <= 12; i++) { var m = new Date(d.getFullYear(), d.getMonth() + i, 1), v = m.getFullYear() + "-" + ("0" + (m.getMonth() + 1)).slice(-2); out.push('<option value="' + v + '"' + (S.biz.start === v ? " selected" : "") + ">" + names[m.getMonth()] + " " + m.getFullYear() + "</option>"); }
  return out.join("");
}
function viewBiz() {
  var cur = SA.TBY[S.biz.type], grp = S.biz.group || (cur ? cur.group : "");
  var G = [["travel", "Tourism business"], ["food", "Food and drink"], ["retail", "Shop or online seller"], ["service", "Service business (for example HR, accounting, cleaning)"]];
  var T = SA.TYPES.filter(function (t) { return t.group === "travel"; }).map(function (t) { return [t.id, t.name]; });
  return '<h1 class="sa-h">Audit a business\'s digital presence</h1>' +
    '<p class="sa-lede">You will check the business\'s social media, Google profile, website and reviews, using only what anyone can see in public. The tool scores each part by fixed rules. Then you build your own 12-month plan: target market, objectives, strategies and evaluation. The tool structures and costs it, and gives you one PDF as evidence.</p>' +
    '<div class="sa-note">Look at the real accounts while you answer, on a phone if you can. Pick "the business does not have it" when something is missing. That counts as a zero and shows up as a gap. Do not guess: choose "Can\'t tell" and the question is left out of the score.</div>' +
    '<div class="sa-who"><span>Signed in as <b>' + esc(S.biz.student) + "</b></span><span>" + esc(S.biz.sid) + "</span><span>" + esc(S.biz.email) + '</span><a href="index.html?out=1" id="saOut">Not you? Sign out</a></div>' +
    '<div class="sa-card"><h3>The business</h3><div class="sa-grid">' + txt("biz.name", "Business name", { wide: true }) + "</div>" +
    chips("biz.group", "What kind of business is it?", G, { re: true }) +
    (grp === "travel" ? chips("biz.type", "Which kind of tourism business?", T, { re: true, tip: "Hotels are judged on the big booking sites. Dive centres are judged on review pages. Tour operators are not scored on reviews." }) : "") +
    chips("biz.onLocation", "Does it serve customers at a place (a shop, guesthouse, cafe, office or dive centre people visit)?", [["yes", "Yes, customers come to a location"], ["both", "Both: a location, and delivery or online orders"], ["no", "No, it only works online or delivers"]], { re: true }) +
    chips("site.has", "Does the business have its own website?", [["yes", "Yes"], ["no", "No"]], { re: true }) +
    '<p class="sa-tip">Date checked: <b>' + esc(S.biz.checked) + "</b>. Every answer is stamped with this date.</p></div>" +
    '<div class="sa-card"><h3>Plan settings</h3><div class="sa-grid"><div class="f"><label for="f_start">First month of the 12-month plan</label><select id="f_start" data-p="biz.start">' + monthOpts() + "</select></div>" +
    "</div></div>";
}
function vBiz() {
  var e = [], b = S.biz;
  if (!b.student.trim()) e.push("Add your name.");
  if (!String(b.sid || "").trim()) e.push("Add your student ID.");
  if (!b.name.trim()) e.push("Add the business name." + "@@" + "biz.name");
  if (!b.type) e.push((b.group === "travel" ? "Choose which kind of tourism business.@@biz.type" : "Choose the kind of business.@@biz.group"));
  if (!b.onLocation) e.push("Say whether customers come to a location." + "@@" + "biz.onLocation");
  if (!S.site.has) e.push("Say whether the business has a website." + "@@" + "site.has");
  return e;
}

/* ---------- step 2 social ---------- */
function platCard(p) {
  var a = "social." + p.id, st = getp(a + ".status"), h = '<div class="sa-card"><h3>' + p.name + (p.core ? "" : ' <span class="cc-opt">(extra)</span>') + "</h3>";
  h += chips(a + ".status", "Does the business have a " + p.name + " account?", [["active", "Yes, and it is used"], ["dormant", "Yes, but it is not really used"], ["none", "The business does not have it"]], { re: true });
  if (st === "active" || st === "dormant") {
    var lb = getp(a + ".lastBand");
    h += '<div class="sa-grid">' + txt(a + ".handle", "Account name or link", { opt: true }) + txt(a + ".followers", "Followers", { mode: "numeric" }) + "</div>";
    h += chips(a + ".lastBand", "When was the last post?", SA.LAST_BANDS.map(function (x) { return [x[0], x[1]]; }), { re: true, sm: true, tip: "Read it the way the app shows it, for example 3w or 2 months ago." });
    if (lb && lb !== "never") {
      if (st === "active") h += chips(a + ".freqBand", "Look at the 3 newest posts. How far back does the third one go?", SA.FREQ_BANDS.map(function (x) { return [x[0], x[1]]; }), { sm: true });
      h += '<fieldset class="sa-fs"><legend>Rate the 3 newest posts</legend><p class="sa-tip">For each post, type the number of likes and pick how many comments it has. A post with nothing: tap <b>No likes or comments</b>.</p>';
      for (var i = 1; i <= 3; i++) {
        var cv = getp(a + ".eng." + i + ".c");
        h += '<div class="sa-post"><b>Post ' + i + '</b><div class="f"><label for="l_' + a + i + '">Likes</label><input id="l_' + a + i + '" data-p="' + a + ".eng." + i + '.l" inputmode="numeric" value="' + esc(getp(a + ".eng." + i + ".l")) + '"></div><div class="sa-opts" role="group" aria-label="Comments on post ' + i + '">' +
          SA.CBANDS.map(function (x) { return '<button type="button" class="sa-chip sm" data-p="' + a + ".eng." + i + '.c" data-v="' + x[0] + '" aria-pressed="' + (cv === x[0]) + '">' + (x[0] === "cn" ? x[1] : x[1] + " comments") + "</button>"; }).join("") +
          '<button type="button" class="sa-chip sm sa-zero" data-zero="' + a + ".eng." + i + '" aria-pressed="' + (cv === "cn" && String(getp(a + ".eng." + i + ".l")) === "0") + '">No likes or comments</button></div></div>';
      }
      h += '<label class="sa-sw" style="margin-top:8px"><input type="checkbox" data-p="' + a + '.likesHidden" data-bool="1"' + (getp(a + ".likesHidden") ? " checked" : "") + "> <span>Likes are hidden on this account</span></label>" +
        '<label class="sa-sw" style="margin-top:8px"><input type="checkbox" data-p="' + a + '.fewPosts" data-bool="1"' + (getp(a + ".fewPosts") ? " checked" : "") + "> <span>The account has fewer than 3 posts</span></label></fieldset>";
    }
    if (lb === "never" || lb === "m12" || lb === "y1") {
      var wa = getp(a + ".wasActive"), yr = getp(a + ".lastYear") || "";
      h += '<div class="sa-yn"><label class="sa-sw"><input type="checkbox" data-p="' + a + '.wasActive" data-bool="1" data-re="1"' + (wa ? " checked" : "") + "> <span>The business was active here before</span></label>" +
        '<div class="f" style="max-width:280px;margin-top:8px"><label for="y_' + a + '">Last year it was active</label><select id="y_' + a + '" data-p="' + a + '.lastYear"' + (wa ? "" : " disabled") + '><option value="">Choose a year</option>' +
        yearList().map(function (y) { return '<option' + (yr === y ? " selected" : "") + ">" + y + "</option>"; }).join("") + "</select></div></div>";
    }
    h += yn(a + ".bio", "The bio says what the business is, where it is and how to contact it.", "Read the profile top section.");
    h += yn(a + ".link", "There is a working link or contact button (website, booking page, WhatsApp).", "Tap it to test.");
  }
  return h + "</div>";
}
function yearList() { var y = new Date().getFullYear(), o = []; for (var k = 0; k < 6; k++) o.push(String(y - k)); o.push("Older than " + (y - 5)); return o; }
function viewSocial() {
  return '<h1 class="sa-h">Social media</h1><p class="sa-lede">Open each platform and look at the business\'s public page. Answer for every platform, including the ones where it has nothing.</p>' + SA.PLATS.map(platCard).join("");
}
function vSocial() {
  var e = [];
  SA.PLATS.forEach(function (p) {
    var a = S.social[p.id] || {};
    if (!a.status) { e.push(p.name + ": choose one of the three answers." + "@@" + "social." + p.id + ".status"); return; }
    if (a.status === "none") return;
    if (SA.num(a.followers) == null) e.push("~" + p.name + ": enter the number of followers." + "@@" + "social." + p.id + ".followers");
    if (!a.lastBand) { e.push("~" + p.name + ": choose when the last post was." + "@@" + "social." + p.id + ".lastBand"); }
    else {
      if (a.lastBand !== "never") {
        if (a.status === "active" && !a.freqBand) e.push("~" + p.name + ": choose how far back the third newest post goes." + "@@" + "social." + p.id + ".freqBand");
        var n = SA.engCount(a);
        if (!a.likesHidden && n < (a.fewPosts ? 1 : 2)) e.push("~" + p.name + ": give the likes and the comments band for at least " + (a.fewPosts ? "1 post" : "2 of the 3 newest posts") + ", or tick that likes are hidden." + "@@" + "social." + p.id + ".eng");
      }
      if (a.wasActive && !a.lastYear) e.push("~" + p.name + ": choose the last year the business was active, or untick that box." + "@@" + "social." + p.id + ".lastYear");
    }
    if (!a.bio) e.push("~" + p.name + ": answer the bio question." + "@@" + "social." + p.id + ".bio"); if (!a.link) e.push("~" + p.name + ": answer the link question." + "@@" + "social." + p.id + ".link");
  });
  return e;
}

/* ---------- step 3 GBP ---------- */
function viewGbp() {
  var loc = SA.hasLoc(S.biz); if (loc && S.gbp.status === "na") S.gbp.status = ""; var st = S.gbp.status;
  var opts = [["yes", "Yes, it is claimed by the owner"], ["unclaimed", "Yes, but it is not claimed"], ["none", "The business does not have one"]];
  if (!loc) opts.push(["na", "Not needed, no customer location"]);
  var h = '<h1 class="sa-h">Google Business Profile</h1><p class="sa-lede">Search the business name in Google or Google Maps on your phone. The profile is the box with photos, hours and reviews.</p>' +
    '<div class="sa-card">' + chips("gbp.status", "Does the business have a Google Business Profile?", opts, { re: true });
  if (loc && st === "") h += '<p class="sa-tip">This business serves customers on location, so a missing map listing counts against it.</p>';
  if (st === "yes" || st === "unclaimed") {
    h += '<div class="sa-links"><a href="https://www.google.com/maps/search/' + encodeURIComponent(S.biz.name) + '" target="_blank" rel="noopener">Open in Google Maps</a></div>';
    SA.GBP_CHECKS.forEach(function (c) { if (c.id === "claimed" && st === "unclaimed") return; h += yn("gbp.checks." + c.id, c.q, c.tip); });
  }
  return h + "</div>";
}
function vGbp() {
  var e = [], g = S.gbp;
  if (!g.status) return ["Choose an answer about the Google Business Profile.@@gbp.status"];
  if (g.status === "yes" || g.status === "unclaimed") SA.GBP_CHECKS.forEach(function (c) { if (c.id === "claimed" && g.status === "unclaimed") return; if (!(g.checks || {})[c.id]) e.push("~Answer: " + c.q + "@@" + "gbp.checks." + c.id); });
  return e;
}

/* ---------- step 4 website ---------- */
function domainOf(u) { u = String(u || "").trim(); if (!u) return ""; if (!/^https?:\/\//i.test(u)) u = "https://" + u; try { return new URL(u).hostname; } catch (e) { return ""; } }
function viewSite() {
  var s = S.site, h = '<h1 class="sa-h">Website</h1>';
  if (s.has === "no") {
    h += '<p class="sa-lede">The business has no website, so the tool checks how well other places do a website\'s job. This score can reach 40 at most, and the plan will recommend building a website. Answer every row. If the business does none of these, tap "None of these".</p><div class="sa-card"><h3>What does the business use instead?</h3>';
    h += '<p class="sa-tip">Google profile link: ' + (S.gbp.checks && S.gbp.checks.web === "y" ? "the Google profile has a working link (counted)." : "no working link on the Google profile.") + "</p>";
    h += yn("site.subs.linkhub", "The social bio links to a page where people can see prices or take action (a link-in-bio page, menu or shop page).", "", true);
    h += yn("site.subs.wa", "A click-to-chat WhatsApp link or button is used.", "", true);
    h += yn("site.subs.book", "Customers can book or order online somewhere (booking site, delivery app, online shop).", "", true);
    h += yn("site.subs.found", "Googling the business name shows a phone number or contact, even if the business did not add it (for example from tags, a directory or a Google-made listing).", "Search the exact business name and look at the results.", true);
    h += '<div class="sa-actions"><button type="button" class="sa-btn-s" id="saNone">None of these</button></div>';
    return h + "</div>";
  }
  var dom = domainOf(s.url), u = dom ? "https://" + dom : "";
  h += '<p class="sa-lede">Open the website on your phone and on a computer. Answer each check from what you see. Use the free tools if you are unsure.</p>' +
    '<div class="sa-card"><div class="sa-grid">' + txt("site.url", "Website address", { wide: true, ph: "example.com" }) + "</div>";
  if (dom) h += '<div class="sa-links"><a href="https://pagespeed.web.dev/analysis?url=' + encodeURIComponent(u) + '" target="_blank" rel="noopener">PageSpeed Insights</a><a href="https://search.google.com/test/rich-results?url=' + encodeURIComponent(u) + '" target="_blank" rel="noopener">Rich Results Test</a><a href="' + u + '/robots.txt" target="_blank" rel="noopener">robots.txt</a><a href="' + u + '/sitemap.xml" target="_blank" rel="noopener">sitemap.xml</a><a href="https://www.google.com/search?q=site%3A' + encodeURIComponent(dom) + '" target="_blank" rel="noopener">site: search</a></div>';
  if (dom) h += autoCard(dom);
  h += '<div class="sa-grid">' + txt("site.perf", "PageSpeed mobile Performance score", { opt: true, mode: "numeric", hint: "If you ran PageSpeed Insights, type the mobile score (0 to 100). It answers the speed check for you." }) + txt("site.seo", "PageSpeed SEO score", { opt: true, mode: "numeric" }) + "</div></div>";
  SA.SITE_GROUPS.forEach(function (g) {
    h += '<div class="sa-card"><h3>' + g.name + "</h3>";
    if (g.id === "geo") h += '<p class="sa-sub">Google says no special markup is needed for AI search features. These checks cover the normal good practice that helps both search and AI answers.</p>';
    SA.SITE_CHECKS.filter(function (c) { return c.g === g.id; }).forEach(function (c) { if (c.id === "fast" && SA.num(s.perf) != null) return; h += yn("site.checks." + c.id, c.q, c.tip + peekTip(c.id, dom)); });
    h += "</div>";
  });
  return h;
}
/* automatic website tests (apis.js): evidence for the student, who still answers each check */
var AUTO_BUSY = false;
function freshFor(x, dom) { return x && x.dom === dom; }
function peekTip(id, dom) {
  var p = freshFor(S.site.peek, dom) ? S.site.peek : null; if (!p) return "";
  if (id === "title") return p.title ? " The tool read the tab title: \u201c" + p.title + "\u201d. Does it say what the business is and where?" : " The tool found no tab title.";
  if (id === "meta") return p.desc ? " The tool read this description: \u201c" + p.desc.slice(0, 220) + "\u201d. Search the name on Google to see if it shows." : " The tool found no description on the home page.";
  return "";
}
function autoCard(dom) {
  var a = freshFor(S.site.auto, dom) ? S.site.auto : null, p = freshFor(S.site.peek, dom) ? S.site.peek : null, h = '<div class="sa-auto"><h3>Let the tool test it</h3>';
  h += '<p class="sa-sub">Runs Google PageSpeed Insights on mobile and reads the home page title, description and a screenshot. It takes up to a minute. You still answer every check yourself.</p>';
  if (a) h += '<p class="sa-auto-r"><b>PageSpeed, mobile (' + esc(a.at) + "):</b> Performance " + (a.perf == null ? "-" : a.perf) + "/100, SEO " + (a.seo == null ? "-" : a.seo) + "/100" + (a.lcp ? ", main content shows after " + a.lcp + " seconds" : "") + ". The scores are filled in below.</p>";
  if (p) h += '<p class="sa-auto-r"><b>Home page (' + esc(p.at) + "):</b> title \u201c" + esc(p.title || "none") + "\u201d" + (p.desc ? ", description \u201c" + esc(p.desc.slice(0, 160)) + (p.desc.length > 160 ? "..." : "") + "\u201d" : ", no description") + ".</p>";
  if (IMG.site && p) h += '<img class="sa-auto-shot" src="' + IMG.site + '" alt="Screenshot of the website home page taken by the tool">';
  h += '<div class="sa-actions"><button type="button" class="btn btn-ghost" id="saAuto"' + (AUTO_BUSY ? " disabled" : "") + ">" + (AUTO_BUSY ? "Testing..." : a || p ? "Run the tests again" : "Run the website tests") + '</button></div><p class="sa-ms" id="saAutoMsg" role="status"></p></div>';
  return h;
}
function runAuto() {
  var dom = domainOf(S.site.url); if (!dom || !window.SAX || AUTO_BUSY) return;
  AUTO_BUSY = true; render(true); var m = function (t) { var el = $("saAutoMsg"); if (el) el.textContent = t; };
  m("Testing " + dom + ". This can take up to a minute. You can keep answering below.");
  var notes = [];
  var p1 = SAX.psi("https://" + dom).then(function (r) { r.dom = dom; S.site.auto = r; if (r.perf != null) S.site.perf = String(r.perf); if (r.seo != null) S.site.seo = String(r.seo); }, function (e) { notes.push("PageSpeed did not run: " + SAX.say(e) + ". Use the PageSpeed Insights link above and type the scores."); });
  var p2 = SAX.peek("https://" + dom).then(function (r) {
    var shot = r.shotUrl; delete r.shotUrl; r.dom = dom; S.site.peek = r;
    if (shot) return SAX.shrink(shot, 1000).then(function (d) { IMG.site = d; saveImgs(); }, function () { notes.push("The screenshot could not be saved. Take your own screenshot of the home page for your report."); });
  }, function (e) { notes.push("The home page could not be read: " + SAX.say(e) + "."); });
  Promise.all([p1, p2]).then(function () {
    AUTO_BUSY = false; save(); if (S.step === 3) render(true);
    m(notes.length ? notes.join(" ") : "Done. The results are above, and the PageSpeed scores are filled in.");
  });
}
function vSite() {
  var s = S.site, e = [];
  if (s.has === "no") { [["linkhub", "social bio link"], ["wa", "WhatsApp link"], ["book", "online booking or ordering"], ["found", "contact found by googling"]].forEach(function (x) { if (!(s.subs || {})[x[0]]) e.push("~Answer the row about " + x[1] + ", or tap None of these." + "@@" + "site.subs." + x[0]); }); return e; }
  if (!domainOf(s.url)) e.push("~Type the website address." + "@@" + "site.url");
  SA.SITE_CHECKS.forEach(function (c) { if (c.id === "fast" && SA.num(s.perf) != null) return; if (!(s.checks || {})[c.id]) e.push("~Answer: " + c.q + "@@" + "site.checks." + c.id); });
  return e;
}

/* ---------- step 5 reviews ---------- */
function repCard(pl, travel) {
  var a = "rep." + pl.id, st = getp(a + ".status"), r = S.rep[pl.id] || {};
  var h = '<div class="sa-card"><h3>' + pl.name + (pl.optional ? ' <span class="cc-opt">(optional)</span>' : "") + "</h3>";
  h += chips(a + ".status", "Is the business listed on " + pl.name + "?", [["listed", "Yes, listed"], ["none", "The business does not have a listing"]], { re: true });
  if (st === "listed") {
    h += '<div class="sa-grid">' + txt(a + ".rating", "Rating shown (out of " + pl.scale + ")", { mode: "decimal" }) + txt(a + ".count", "Number of reviews", { mode: "numeric" }) +
      txt(a + ".lastDate", "Date of the newest review", { type: "date" }) + txt(a + ".replies", "How many of the 5 recent comments have an owner reply? (0 to 5)", { mode: "numeric" });
    h += "</div>";
    h += '<h4>Screenshot <span class="cc-opt">(recommended)</span></h4><p class="sa-tip">Take a screenshot of the listing page showing the rating, review count and the browser address bar. It is shrunk, saved to your account, and placed in your PDF appendix.</p>' +
      '<div class="sa-shot"><input type="file" accept="image/*" data-shot="' + pl.id + '" aria-label="Screenshot for ' + pl.name + '">' + (IMG[pl.id] ? '<img src="' + IMG[pl.id] + '" alt="Screenshot of the ' + pl.name + ' listing">' : '<span class="sa-hint">No screenshot yet.</span>') + "</div>";
    h += "<h4>Recent comments <span class=\"cc-opt\">(recommended)</span></h4><p class=\"sa-tip\">Copy the date and the text of up to 5 newest reviews. Do not copy reviewer names. Type in English: Dhivehi letters do not show in the PDF, so your screenshot keeps the original. No reviews yet? Type 0 as the number of reviews and leave this empty.</p>";
    for (var i = 0; i < 5; i++) {
      h += '<div class="sa-cm"><input type="date" data-p="' + a + ".comments." + i + '.d" value="' + esc(getp(a + ".comments." + i + ".d")) + '" aria-label="Date of comment ' + (i + 1) + '"><input type="text" data-p="' + a + ".comments." + i + '.t" value="' + esc(getp(a + ".comments." + i + ".t")) + '" placeholder="Comment ' + (i + 1) + '" aria-label="Comment ' + (i + 1) + '"></div>';
    }
  }
  return h + "</div>";
}
function viewRep() {
  var T = SA.TBY[S.biz.type] || SA.TBY.service, list = SA.repPlatforms(S.biz.type), h = '<h1 class="sa-h">Reviews</h1>';
  if (!list.length) return h + '<p class="sa-lede">Tour operators are not scored on review pages, so this part is not counted for this business. Go on to the next step.</p>';
  var intro = { stay: "Hotels and guesthouses are judged on the big booking sites. Check Google, Booking.com, TripAdvisor and Agoda (at least three major sites).", dive: "Dive centres are judged on their review pages. A dive centre with no review page fails this part and scores zero, and the plan will suggest building one. Check Google and TripAdvisor.", food: "Check Google. TripAdvisor is optional.", retail: "Check Google if the business has a shop or location people visit.", service: "Check Google." }[S.biz.type] || "Check the reviews on the platforms below.";
  h += '<p class="sa-lede">' + intro + " Answer for each one, even where the business has no listing.</p>";
  list.forEach(function (p) { h += repCard(p, false); });
  return h;
}
function vRep() {
  var e = [], now = S.biz.checked, list = SA.repPlatforms(S.biz.type);
  list.forEach(function (pl) {
    var a = S.rep[pl.id] || {}, P = "@@rep." + pl.id;
    if (!a.status) { if (!pl.optional) e.push(pl.name + ": choose whether the business is listed." + P + ".status"); return; }
    if (a.status === "none") return;
    var cnt = SA.num(a.count);
    if (cnt == null || cnt < 0) { e.push("~" + pl.name + ": enter the number of reviews (type 0 if there are none)." + P + ".count"); }
    if (cnt === 0) return;
    var sc = SA.num(a.rating); if (sc == null || sc <= 0 || sc > pl.scale) e.push("~" + pl.name + ": enter the rating, a number up to " + pl.scale + "." + P + ".rating");
    if (!a.lastDate) e.push("~" + pl.name + ": enter the date of the newest review." + P + ".lastDate"); else if (SA.daysBetween(a.lastDate, now) < 0) e.push(pl.name + ": the newest review date is in the future." + P + ".lastDate");
    var r = SA.num(a.replies); if (r == null || r < 0 || r > 5) e.push("~" + pl.name + ": enter how many of the recent comments have owner replies (0 to 5)." + P + ".replies");
    if (!IMG[pl.id]) e.push("~" + pl.name + ": upload a screenshot.@@shot:" + pl.id);
    var need = Math.min(5, cnt == null ? 5 : cnt), got = 0;
    for (var i = 0; i < 5; i++) { var c = SA.arr(a.comments)[i] || {}; if (c.d && String(c.t || "").trim()) { got++; if (SA.daysBetween(c.d, now) < 0) e.push(pl.name + ": comment " + (i + 1) + " has a future date." + P + ".comments"); } else if (c.d || String(c.t || "").trim()) e.push("~" + pl.name + ": comment " + (i + 1) + " needs both a date and the text." + P + ".comments"); }
    if (got < need) e.push("~" + pl.name + ": add " + need + " recent comments with dates (you have " + got + ")." + P + ".comments");
  });
  return e;
}

/* ---------- step 6 results ---------- */
function bar(label, v, extra) {
  if (v == null) return '<li><span>' + label + '</span><span>Not counted</span><i><em style="width:0"></em></i></li>';
  return '<li class="' + SA.cls(v) + '"><span>' + label + (extra ? " <small>" + extra + "</small>" : "") + "</span><span>" + v + '/100</span><i><em style="width:' + v + '%"></em></i></li>';
}
function pill(v) { return '<span class="sa-pill ' + SA.cls(v) + '">' + v + "</span>"; }
function viewResults() {
  var A = SA.audit(S), h = '<h1 class="sa-h">Your audit results</h1><p class="sa-lede">' + esc(S.biz.name) + ", checked on " + esc(S.biz.checked) + ". Each score comes from fixed rules. Missing items count as zero.</p>";
  h += '<div class="sa-card sa-score"><div class="sa-ring ' + SA.cls(A.overall) + '" style="--v:' + A.overall + '"><b>' + A.overall + "</b><span>out of 100</span></div><ul class=\"sa-bars\">" +
    bar("Social media", A.social.score, "30%") + bar("Google Business Profile", A.gbp.score, "20%") + bar("Website", A.site.score, "25%") + bar("Reviews and reputation", A.rep.score, "25%") + "</ul></div>";
  h += '<div class="sa-card"><h3>Where the business is failing</h3><ol class="sa-find">' + (A.findings.slice(0, 10).map(function (f) { return "<li>" + esc(f.text) + "</li>"; }).join("") || "<li>No major gaps found.</li>") + "</ol></div>";
  h += '<div class="sa-card"><h3>Social media</h3><table class="sa-tbl"><tr><th>Platform</th><th>Status</th><th>Score</th></tr>' + A.social.plats.map(function (p) {
    return "<tr><td>" + p.name + "</td><td>" + (p.missing ? "Business does not have it" : p.status === "dormant" ? "Not really used" : "Active") + "</td><td>" + pill(p.score) + "</td></tr>"; }).join("") + "</table></div>";
  if (A.site.groups && A.site.groups.length) h += '<div class="sa-card"><h3>Website</h3><table class="sa-tbl"><tr><th>Area</th><th>Score</th></tr>' + A.site.groups.map(function (g) { return "<tr><td>" + g.name + "</td><td>" + (g.score == null ? "Not counted" : pill(g.score)) + "</td></tr>"; }).join("") + "</table></div>";
  h += '<div class="sa-actions"><button type="button" class="btn btn-ghost" id="saEdit">Change my answers</button></div>';
  return h;
}

/* ---------- plan helpers ---------- */
function words(s) { return String(s || "").trim().split(/\s+/).filter(Boolean).length; }
function ta(path, label, pointer, o) {
  o = o || {};
  return '<div class="f wide"><label for="f_' + path + '">' + label + '</label><textarea id="f_' + path + '" data-p="' + path + '" rows="' + (o.rows || 3) + '">' + esc(getp(path)) + "</textarea>" + (pointer ? '<span class="sa-hint">' + pointer + "</span>" : "") + "</div>";
}
function slider(path, label, min, max, lo, hi, o) {
  o = o || {}; var v = getp(path); if (v == null || v === "") v = o.def != null ? o.def : Math.round((min + max) / 2);
  var id = "r_" + path;
  return '<div class="f sa-rg"><label for="' + id + '">' + label + ' <b id="o_' + id + '">' + v + '</b></label><input id="' + id + '" type="range" min="' + min + '" max="' + max + '" step="' + (o.step || 1) + '" value="' + v + '" data-p="' + path + '" data-num="1" data-out="o_' + id + '"' + (o.re ? ' data-re="1"' : "") + ' data-tm="1"><span class="sa-rl"><span>' + lo + "</span><span>" + hi + "</span></span></div>";
}
function mchip(path, key, label) {
  var on = !!getp(path + "." + key);
  return '<button type="button" class="sa-chip sm" data-tg="' + esc(path + "." + key) + '" aria-pressed="' + on + '">' + label + "</button>";
}
function uid(prefix) { S.seq = (S.seq || 0) + 1; return prefix + S.seq; }

/* ---------- step 7: target market ---------- */
var BASES = [["demo", "Demographic (age, income, family, job)"], ["geo", "Geographic (country, island, city)"], ["psy", "Psychographic (values, lifestyle, interests)"], ["beh", "Behavioural (how, when and why they buy)"]];
var AXES = [["price", "Price", "Lower price", "Higher price"], ["range", "Offer", "Basic", "Full service"], ["style", "Style", "Traditional", "Modern"], ["local", "Reach", "Local", "International"], ["speed", "Booking", "Slow and manual", "Instant and online"]];
var AXBY = {}; AXES.forEach(function (a) { AXBY[a[0]] = a; });
var CHANNELS = ["Instagram", "Facebook", "TikTok", "YouTube", "WhatsApp", "Viber", "Telegram", "Google search", "Booking sites", "Email", "Blogs and forums", "LinkedIn"];
function ensureTm() {
  if (!S.tm) S.tm = { bases: {}, segs: [], pos: {} };
  S.tm.segs.forEach(function (g) { if (!g.s) g.s = {}; if (!g.att) g.att = {}; if (!g.basis) g.basis = {}; if (!g.p) g.p = {}; });
  while (S.tm.segs.length < 2) S.tm.segs.push(newSeg());
}
function newSeg() { return { id: uid("g"), name: "", s: {}, att: {}, basis: {}, target: "", why: "", extra: "", p: { ch: {}, goal: {}, pain: {}, trig: {} } }; }
function segScore(g) { return SA.segScore(g); }
/* chip group: single (one answer) or multiple (pick all that apply) */
function cgroup(path, q, opts, multi, tip, byIdx) {
  var h = '<fieldset class="sa-fs"><legend>' + q + ' <span class="sa-pick">' + (multi ? "Pick all that apply" : "Pick one") + "</span></legend>" + (tip ? '<p class="sa-tip">' + tip + "</p>" : "") + '<div class="sa-opts">';
  if (multi) h += opts.map(function (o) { return mchip(path, o, o); }).join("");
  else { var v = getp(path); h += opts.map(function (o, i) { var val = byIdx ? String(i) : o; return '<button type="button" class="sa-chip sm" data-p="' + esc(path) + '" data-v="' + esc(val) + '" aria-pressed="' + (String(v) === val) + '">' + o + "</button>"; }).join(""); }
  return h + "</div></fieldset>";
}
function placeTa(path, label, ph, tip, rows) {
  return '<div class="f wide"><label for="f_' + path + '">' + label + '</label><textarea id="f_' + path + '" data-p="' + path + '" rows="' + (rows || 3) + '" placeholder="' + esc(ph) + '">' + esc(getp(path)) + "</textarea>" + (tip ? '<span class="sa-hint">' + tip + "</span>" : "") + "</div>";
}
function tmPages() {
  ensureTm(); var T = S.tm, on = T.bases || {}, nb = BASES.filter(function (b) { return on[b[0]]; }).length, P = ["bases"];
  if (nb >= 2) { T.segs.forEach(function (g, i) { P.push("seg:" + i); }); P.push("pos"); T.segs.forEach(function (g, i) { if (g.target === "yes") P.push("per:" + i); }); }
  return P;
}
function tmCur() { return curPage(6); }
function tmLabel(pg) {
  var T = S.tm, k = pg.split(":"), i = +k[1];
  if (k[0] === "bases") return "Bases of segmentation";
  if (k[0] === "seg") return "Segment " + (i + 1) + " of " + T.segs.length;
  if (k[0] === "pos") return "Positioning";
  var tg = T.segs.filter(function (g) { return g.target === "yes"; }); return "Persona " + (tg.indexOf(T.segs[i]) + 1) + " of " + tg.length;
}
function tmNav(pg) {
  var P = tmPages(), cur = P.indexOf(pg), sec = [["bases", "Bases"], ["seg", "Segments"], ["pos", "Positioning"], ["per", "Personas"]];
  return '<div class="sa-subnav">' + sec.map(function (s) {
    var first = -1; P.forEach(function (p, i) { if (first < 0 && p.split(":")[0] === s[0]) first = i; });
    var here = pg.split(":")[0] === s[0], done = first >= 0 && first < cur && !here;
    return '<button type="button" class="sa-subn' + (here ? " on" : done ? " done" : "") + '"' + (first >= 0 && first <= cur ? ' data-sub="' + first + '"' : " disabled") + ">" + s[1] + "</button>";
  }).join("") + "</div>";
}
function viewTm() {
  ensureTm(); var T = S.tm, pg = tmCur(), k = pg.split(":"), i = +k[1], on = T.bases || {};
  var h = '<h1 class="sa-h">Your target market</h1>' + tmNav(pg);
  if (k[0] === "bases") {
    h += '<p class="sa-lede">Build the segments by tapping the options that describe each group. Rate how attractive each one is, choose your targets, then do the positioning and one persona for each target. One part at a time: press Next when each part is done.</p>';
    h += '<div class="sa-card"><h3>Bases of segmentation</h3><p class="sa-tip">Which ways will you use to split the market? <b>Pick at least two.</b> The questions for each segment follow what you pick here.</p><div class="sa-opts">' + BASES.map(function (b) { return mchip("tm.bases", b[0], b[1]); }).join("") + "</div></div>";
    return h;
  }
  if (k[0] === "seg") {
    var g = T.segs[i];
    if (i === 0) h += '<p class="sa-sub">Describe 2 to 4 groups of customers, one at a time. Base them on what you can see about the business: its posts, its reviews and who it seems to serve.</p>';
    var b = "tm.segs." + i, sc = segScore(g), bb = SA.isB2B(S.biz.type, g), qs = SA.segQs(S.biz.type, g).filter(function (q) { return q.b === "all" || on[q.b]; });
    h += '<div class="sa-card sa-seg"><h3>Segment ' + (i + 1) + ' of ' + T.segs.length + (g.name ? ": " + esc(g.name) : "") + "</h3>" + '<div class="sa-grid">' + txt(b + ".name", "Give the segment a short name", { wide: true, ph: "for example: weekend families from Malé" }) + "</div>";
    var cur = "";
    qs.forEach(function (q) { var lab = { all: "", geo: "Geographic", demo: bb ? "Firmographic (company profile)" : "Demographic", psy: "Psychographic", beh: "Behavioural" }[q.b]; if (q.k === "who") { h += cgroup(b + ".s.who", q.q, q.o, false, bb ? "Business customer: the next questions are about the companies, not people." : "Choosing a business customer switches the questions to company ones."); return; } if (lab && lab !== cur) { h += '<p class="sa-base">' + lab + "</p>"; cur = lab; } h += cgroup(b + ".s." + q.k, q.q, q.o, q.m); });
    h += '<div class="sa-built"><small>Your segment, from your picks</small><p>' + esc(SA.segText(g, S.biz.type)) + "</p></div>";
    h += '<div class="sa-grid">' + txt(b + ".extra", "Anything to add in your own words?", { wide: true, opt: true, ph: "for example: often travel with grandparents" }) + "</div>";
    h += '<p class="sa-base">How attractive is this segment?</p>';
    SA.ATT.forEach(function (a) { h += cgroup(b + ".att." + a.k, a.q, a.o, false, a.t, true); });
    h += '<p class="sa-ms">Attractiveness score: <b>' + sc + " out of 12</b>. A higher score usually means a better target. You decide.</p>";
    h += cgroup(b + ".basis", "What are your answers based on?", SA.BASIS, true, "Be honest. An assumption is fine if you say so in your report.");
    h += chips(b + ".target", "Will you target this segment?", [["yes", "Yes, target it"], ["no", "No"]], { re: true, sm: true });
    if (g.target) h += '<div class="sa-built"><small>Your decision, from your ratings</small><p>' + esc(SA.segReason(g)) + "</p></div>" + '<div class="sa-grid">' + txt(b + ".fact", "One fact that backs this up", { wide: true, opt: g.target !== "yes", ph: "for example: Audit: 4 of 5 recent Google reviews mention families", hint: "A finding, a statistic or something you saw. The full argument goes in your report." }) + "</div>";
    if (T.segs.length > 2) h += '<div style="margin-top:8px"><button type="button" class="sa-btn-s" data-rmseg="' + i + '">Remove this segment</button></div>';
    h += "</div>";
    return h;
  }
  if (k[0] === "pos") return h + viewPos();
  var g = T.segs[i];
  h += '<p class="sa-sub">A persona is a made-up person who stands for the whole segment. Keep it consistent with the segment you built. Your PDF will include a ready-made prompt to turn this persona into a full persona card with Google Gemini.</p>';
      var b = "tm.segs." + i + ".p", s = g.s || {}, ages = SA.chosen(s.age), from = SA.chosen(s.from), bb = SA.isB2B(S.biz.type, g), PL = SA.plists(S.biz.type, g);
      h += '<div class="sa-card"><h3>Persona for: ' + esc(g.name || "Segment " + (i + 1)) + '</h3><p class="sa-sub">' + (bb ? "Business customers: make the persona the person who decides to buy, for example the HR or finance manager. " : "") + esc(SA.segText(g, S.biz.type)) + '</p><div class="sa-grid">' +
        txt(b + ".name", "Give them a name", { ph: "a typical name for this group" }) + txt(b + ".age", "Age", { mode: "numeric", ph: ages.length ? "within " + ages.join(" or ") : "for example 34" }) +
        txt(b + ".loc", "Where they live", { ph: from.length ? from[0] : "city or island" }) + txt(b + ".job", "Job or role", { ph: bb ? "for example: HR manager at a resort" : "for example: bank officer" }) + "</div>" +
        cgroup(b + ".goal", "What do they want?", PL.goal, true) + cgroup(b + ".pain", "What frustrates them or makes them hesitate?", PL.pain, true) + cgroup(b + ".trig", "What makes them buy?", PL.trig, true) +
        '<fieldset class="sa-fs"><legend>Where do they spend time online? <span class="sa-pick">Pick all that apply</span></legend><div class="sa-opts">' + CHANNELS.map(function (c) { return mchip(b + ".ch", c.replace(/ /g, "_"), c); }).join("") + "</div></fieldset>" +
        '<div class="sa-grid">' + txt(b + ".quote", "A line they might say", { wide: true, ph: "for example: Just tell me the full price and I will book", hint: "Write it in their voice, as one real sentence." }) + "</div></div>";
  return h;
}
function tmErrPage(path) {
  var P = tmPages(), m = /^tm\.segs\.(\d+)\.(p\b)?/.exec(path || "");
  if (/^tm\.bases/.test(path)) return 0;
  if (/^tm\.pos/.test(path)) return P.indexOf("pos");
  if (m) return P.indexOf((m[2] ? "per:" : "seg:") + m[1]);
  if (path === "tm.segs") { var last = -1; P.forEach(function (p, j) { if (p.indexOf("seg:") === 0) last = j; }); return last; }
  return -1;
}
function viewPos() {
  var T = S.tm, P = T.pos || (T.pos = {}), PS = SA.posSet(S.biz.type), tg = T.segs.filter(function (g) { return g.target === "yes"; });
  if (!P.cat) P.cat = PS.cat[S.biz.type] || PS.cat[Object.keys(PS.cat)[0]];
  if (!P.ax) { P.ax = PS.ax[0][0]; P.ay = PS.ax[1][0]; }
  var h = '<p class="sa-sub">Tap to build the positioning statement. It decides how the business wants the target segment to see it compared with a competitor.</p><div class="sa-card">';
  if (!tg.length) return h + '<p class="sa-sub">Choose at least one target segment above first.</p></div>';
  h += chips("tm.pos.seg", '1. For which target segment? <span class="sa-pick">Pick one</span>', tg.map(function (g) { return [g.id, esc(g.name || "Unnamed segment")]; }), { sm: true });
  var sg = tg.filter(function (g) { return g.id === P.seg; })[0];
  if (sg) { var bq = SA.segQs(S.biz.type, sg).filter(function (q) { return q.k === "benefit"; })[0], all = bq ? bq.o : [], mine = SA.picks((sg.s || {}).benefit, all);
    h += cgroup("tm.pos.need", "2. What do they want?", mine.concat(all.filter(function (x) { return mine.indexOf(x) < 0; })), true, mine.length ? "The first ones are what you picked for this segment." : "Pick what this segment wants most."); }
  else h += '<p class="sa-tip">2. What do they want? Pick the segment in 1 first.</p>';
  h += '<div class="sa-grid">' + txt("tm.pos.cat", "3. The business is a", { ph: "for example: guesthouse", hint: "Edit it if a more exact word fits." }) + "</div>";
  h += cgroup("tm.pos.ben", "4. Its main benefit", PS.ben, false);
  h += '<div class="sa-grid">' + txt("tm.pos.comp", "5. Its main competitor", { ph: "name a real competitor", hint: "A business your target segment would also consider." }) + "</div>";
  h += cgroup("tm.pos.diff", "6. How it is different from that competitor", SA.POS_DIFF, true).replace(/data-tg=/g, 'data-max="2" data-tg=').replace("Pick all that apply", "Pick up to two");
  h += cgroup("tm.pos.proof", "7. What proves it?", SA.POS_PROOF, true) + '<div class="sa-grid">' + txt("tm.pos.fact", "The fact itself", { opt: true, ph: "for example: 4.8 on Google from 120 reviews" }) + "</div>";
  h += '<div class="sa-built"><small>Your positioning statement</small><p>' + esc(SA.posText(S)) + "</p></div></div>";
  var comp = P.comp || "the competitor", ax = SA.posAx(S.biz.type, P.ax) || PS.ax[0], ay = SA.posAx(S.biz.type, P.ay) || PS.ax[1];
  h += '<div class="sa-card"><h3>Positioning map</h3><p class="sa-sub">Choose two things customers compare, then say how the business compares with ' + esc(comp) + '. The competitor sits in the middle.</p>' +
    chips("tm.pos.ax", 'Compare on (across) <span class="sa-pick">Pick one</span>', PS.ax.map(function (a) { return [a[0], a[1]]; }), { sm: true }) +
    chips("tm.pos.ay", 'Compare on (up and down) <span class="sa-pick">Pick one</span>', PS.ax.map(function (a) { return [a[0], a[1]]; }), { sm: true });
  h += chips("tm.pos.rx", "Compared with " + esc(comp) + ", its " + ax[1].toLowerCase() + ' is <span class="sa-pick">Pick one</span>', [["lo", ax[2]], ["same", "About the same"], ["hi", ax[3]]], { sm: true });
  h += chips("tm.pos.ry", "Compared with " + esc(comp) + ", its " + ay[1].toLowerCase() + ' is <span class="sa-pick">Pick one</span>', [["lo", ay[2]], ["same", "About the same"], ["hi", ay[3]]], { sm: true });
  var ux = SA.posXY(P.rx), uy = SA.posXY(P.ry), same = ux === 50 && uy === 50;
  h += '<div class="sa-map" aria-hidden="true"><span class="sa-mx">' + ax[2] + '</span><span class="sa-mx r">' + ax[3] + '</span><span class="sa-my t">' + ay[3] + '</span><span class="sa-my b">' + ay[2] + '</span><i class="sa-dot co" style="left:50%;bottom:50%">' + esc(P.comp || "Competitor") + '</i>' +
    (P.rx && P.ry ? '<i class="sa-dot us" style="left:' + ux + "%;bottom:" + (same ? 62 : uy) + '%">' + esc(S.biz.name || "You") + "</i>" : "") + "</div></div>";
  return h;
}
function vTm() {
  ensureTm(); var e = [], T = S.tm, on = T.bases || {}, nb = BASES.filter(function (b) { return on[b[0]]; }).length;
  var any = function (m) { return Object.keys(m || {}).some(function (k) { return m[k]; }); };
  if (nb < 2) { e.push("Pick at least two bases of segmentation." + "@@" + "tm.bases"); return e; }
  T.segs.forEach(function (g, i) {
    var n = "Segment " + (i + 1), s = g.s || {};
    if (String(g.name || "").trim().length < 3) e.push(n + ": give it a short name (at least 3 letters)." + "@@" + "tm.segs." + i + ".name");
    if (s.who === undefined || s.who === "") e.push(n + ": choose who they are." + "@@" + "tm.segs." + i + ".s.who");
    var allq = SA.segQs(S.biz.type, g);
    BASES.forEach(function (b) { if (!on[b[0]]) return; var qs = allq.filter(function (q) { return q.b === b[0]; }); if (!qs.some(function (q) { return q.m ? q.o.some(function (o) { return (s[q.k] || {})[o]; }) : q.o.indexOf(s[q.k]) >= 0; })) e.push("~" + n + ": pick at least one " + b[1].split(" (")[0].toLowerCase() + " option." + "@@" + "tm.segs." + i + ".s"); });
    if (SA.ATT.some(function (a) { var v = (g.att || {})[a.k]; return v === undefined || v === ""; })) e.push("~" + n + ": rate size, reach online, fit and competition." + "@@" + "tm.segs." + i + ".att");
    if (!any(g.basis)) e.push("~" + n + ": say what your answers are based on." + "@@" + "tm.segs." + i + ".basis");
    if (!g.target) e.push(n + ": choose whether you will target it." + "@@" + "tm.segs." + i + ".target");
    else if (g.target === "yes" && words(g.fact) < 3) e.push("~" + n + ": add one fact that backs up targeting it." + "@@" + "tm.segs." + i + ".fact");
  });
  if (!T.segs.some(function (g) { return g.target === "yes"; })) e.push("Choose at least one target segment." + "@@" + "tm.segs");
  var P = T.pos || {}, cnt = function (m) { return SA.chosen(m).length; };
  if (!P.seg || !T.segs.some(function (g) { return g.id === P.seg && g.target === "yes"; })) e.push("Positioning: choose the target segment." + "@@" + "tm.pos.seg");
  if (!cnt(P.need)) e.push("~Positioning: pick what they want." + "@@" + "tm.pos.need");
  if (!String(P.cat || "").trim()) e.push("~Positioning: say what kind of business it is." + "@@" + "tm.pos.cat");
  if (!P.ben) e.push("~Positioning: pick its main benefit." + "@@" + "tm.pos.ben");
  if (!String(P.comp || "").trim()) e.push("~Positioning: name the main competitor." + "@@" + "tm.pos.comp");
  if (!cnt(P.diff)) e.push("~Positioning: pick how it is different." + "@@" + "tm.pos.diff");
  if (!cnt(P.proof)) e.push("~Positioning: pick what proves it." + "@@" + "tm.pos.proof");
  if (P.ax === P.ay) e.push("~Positioning map: choose two different things to compare." + "@@" + "tm.pos.ay");
  if (!P.rx || !P.ry) e.push("~Positioning map: say how the business compares with the competitor on both." + "@@" + "tm.pos.rx");
  T.segs.forEach(function (g, i) {
    if (g.target !== "yes") return; var p = g.p || {}, n = "Persona for " + (g.name || "segment " + (i + 1));
    if (!String(p.name || "").trim() || SA.num(p.age) == null) e.push("~" + n + ": add a name and an age." + "@@" + "tm.segs." + i + ".p.name");
    if (!any(p.goal) || !any(p.pain) || !any(p.trig)) e.push("~" + n + ": pick what they want, what frustrates them and what makes them buy." + "@@" + "tm.segs." + i + ".p.goal");
    if (!any(p.ch)) e.push("~" + n + ": pick at least one place they spend time online." + "@@" + "tm.segs." + i + ".p.ch");
    if (!String(p.quote || "").trim()) e.push("~" + n + ": write a line they might say." + "@@" + "tm.segs." + i + ".p.quote");
  });
  T.segs.forEach(function (g) { g.who = SA.segText(g, S.biz.type); });
  return e.filter(function (x, i, a) { return a.indexOf(x) === i; });
}

/* ---------- step 8: objectives (SMART builder) ---------- */
function newObj() { return { id: uid("o"), text: "", textEdited: false, verb: "", kpi: "", unit: "", chan: "", seg: "", base: "", baseSrc: "", target: "", deadline: "12", how: {}, why: {}, gap: "", tool: "", freq: "Monthly", q: ["", "", ""], trig: 10, act: "" }; }
function ensureObjs() {
  if (!S.objs || !Array.isArray(S.objs)) S.objs = [];
  while (S.objs.length < 3) S.objs.push(newObj());
  S.objs.forEach(function (o) { if (!o.how) o.how = {}; if (!o.why) o.why = {}; if (!o.textEdited) o.text = SA.objSentence(o, S); });
}
function modelStuff() {
  if (!S.model) { var A = SA.audit(S), mo = SA.makeObjectives(A, S); S.model = { objs: mo }; }
  return S.model;
}
function recs() { return SA.makeStrategies(SA.audit(S), S, S.objs || []); }
function tName(t) { return { aware: "Awareness", engage: "Engagement", sales: "Sales", loyal: "Loyalty" }[t] || ""; }
var STCOL = { aware: "#245582", consider: "#2a82bb", convert: "#1e7850", loyal: "#1f7f7f" };
var LOYAL_TXT = "Loyalty is the fourth, optional kind. It is about the customers the business already has: getting them to come back, buy again and recommend it to friends. You measure it with repeat customers, referrals and reviews. Choose it when the business already has customers but few return, or it has few reviews.";
/* The funnel: a drawn funnel on the left, and for each stage the objectives and strategies that sit there. where = "obj" (objectives page) or "plan" (strategies page). */
function funnelViz(where) {
  var on = S.plan && S.plan.strats ? S.plan.strats.filter(function (s) { return s.on; }) : [], objs = S.objs || [], W = [100, 82, 64, 46, 30], empty = 0;
  var rows = SA.FUNNEL.map(function (f, k) {
    var st = on.filter(function (s) { return stagesOf(s).indexOf(f[0]) >= 0; }), ob = [];
    objs.forEach(function (o, i) { if (SA.TYPE_STAGE[o.type] === f[0]) ob.push(i); });
    var opt = f[0] === "loyal", n = where === "obj" ? ob.length : st.length, gap = !n && !opt;
    if (gap) empty++;
    var h = '<li class="sa-fz-row' + (gap ? " gap" : "") + '" style="--c:' + STCOL[f[0]] + '"><div class="sa-fz-band" style="--t:' + W[k] + "%;--b:" + W[k + 1] + '%" aria-hidden="true"><span>' + n + "</span></div><div class=\"sa-fz-txt\">" +
      "<p><b>" + (k + 1) + ". " + f[1] + (opt ? " (optional)" : "") + "</b> " + esc(f[2]) + ".</p>";
    h += '<p class="sa-fz-line"><span>Objectives:</span> ' + (ob.length ? ob.map(function (i) { return '<button type="button" class="sa-fz-tag" data-gostep="7" data-objpage="' + i + '">Objective ' + (i + 1) + "</button>"; }).join("") : '<em>' + (opt ? "None. That is fine." : "None yet") + "</em>") + "</p>";
    if (where === "plan") {
      h += '<p class="sa-fz-line"><span>Strategies:</span> ' + (st.length ? st.map(function (s) { return '<i class="sa-fz-s">' + esc(s.name.split(" (")[0]) + "</i>"; }).join("") : "<em>None yet</em>") + "</p>";
      if (!st.length) {
        var sug = S.plan.strats.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { return !x.s.on && ((SA.SBY[x.s.id] || {}).stages || []).indexOf(f[0]) >= 0; }).sort(function (a, b) { return (b.s.rec ? 1 : 0) - (a.s.rec ? 1 : 0); }).slice(0, 2);
        if (sug.length) h += '<p class="sa-fz-line sa-fz-fix"><span>Quick fix:</span> ' + sug.map(function (x) { return '<button type="button" class="sa-chip sm" data-tg="plan.strats.' + x.i + '.on">+ ' + esc(x.s.name.split(" (")[0]) + "</button>"; }).join("") + "</p>";
      }
    } else if (opt) h += '<p class="sa-ms">' + esc(LOYAL_TXT) + "</p>";
    return h + "</div></li>";
  }).join("");
  var head = where === "obj" ? "Your objectives across the funnel" : "Your plan across the funnel";
  var sub = where === "obj" ? "A sound plan moves people through the funnel. We strongly encourage one objective each at Awareness, Engagement and Sales. The number in the funnel is how many objectives sit at that stage."
    : "Each stage needs at least one strategy, so customers do not stop halfway. The number in the funnel is how many strategies work at that stage.";
  var sum = empty ? '<p class="sa-fz-sum no">' + empty + " of the first three stages " + (empty === 1 ? "has" : "have") + " nothing yet.</p>" : '<p class="sa-fz-sum ok">Every main stage is covered.</p>';
  return '<div class="sa-card sa-fz"><h3>' + head + '</h3><p class="sa-sub">' + sub + "</p>" + sum + '<ol class="sa-fz-list">' + rows + "</ol></div>";
}
function objGuide() {
  return '<details class="sa-hints"><summary>What makes an objective SMART?</summary><ul class="sa-hl">' +
    ["S", "M", "A", "R", "T"].map(function (k) { return "<li><b>" + k + " = " + SA.SMART_HELP[k][0] + ":</b> " + esc(SA.SMART_HELP[k][1]) + "</li>"; }).join("") + "</ul>" +
    '<p class="sa-ms"><b>Weak:</b> "Grow Instagram followers."<br><b>Strong:</b> "Increase Instagram followers among weekend families from 1,200 to 2,000 by month 12 through weekly Reels and paid social ads aimed at the segment."</p>' +
    '<p class="sa-ms">You build it part by part below. The tool writes the sentence for you, and you can edit it.</p></details>';
}
var LEVEL_TXT = { ok: "Realistic", high: "Ambitious", veryhigh: "Very ambitious", low: "Very small", na: "Not checked yet" };
function realBox(o, i) {
  var rz = SA.realism(o);
  return '<div class="sa-real lv-' + rz.level + '"><b>Realistic check: ' + LEVEL_TXT[rz.level] + ".</b> " + esc(rz.msg) + (rz.suggest != null && rz.level !== "ok" && rz.level !== "na" ? ' <button type="button" class="sa-chip sm" data-settarget="' + i + '" data-v="' + rz.suggest + '">Use a realistic target: ' + esc(SA.fmtNum(rz.suggest, o.unit)) + "</button>" : "") + "</div>";
}
/* the parts that change as the student types: sentence preview, realistic check, SMART tiles, help chips */
function objLive(o, i) {
  var P = SA.smartParts(o, S), rz = SA.realism(o), c = "objs." + i, h = "";
  h += '<div class="sa-tiles">' + ["S", "M", "A", "R", "T"].map(function (k) { var p = P[k]; return '<div class="sa-tile ' + (p.ok ? "ok" : "no") + '"><b>' + k + '</b><small>' + SA.SMART_HELP[k][0] + "</small><span>" + esc(p.ok ? p.text : (p.miss || "Not complete yet")) + "</span></div>"; }).join("") + "</div>";
  var help = [];
  if (!o.chan) help.push(['<button type="button" class="sa-chip sm sa-help" data-go="' + c + '.chan">Add the channel</button>']);
  if (!o.seg) help.push(['<button type="button" class="sa-chip sm sa-help" data-go="' + c + '.seg">Add who it is for (target segment)</button>']);
  if (!o.baseSrc) help.push(['<button type="button" class="sa-chip sm sa-help" data-go="' + c + '.baseSrc">Say where the baseline comes from</button>']);
  if (!SA.chosen(o.how).length) help.push(['<button type="button" class="sa-chip sm sa-help" data-go="' + c + '.how">Add what will drive it</button>']);
  if (rz.level !== "ok" && !SA.chosen(o.why).length) help.push(['<button type="button" class="sa-chip sm sa-help" data-go="' + c + '.why">Add why it is realistic</button>']);
  if (!o.gap) help.push(['<button type="button" class="sa-chip sm sa-help" data-go="' + c + '.gap">Link it to an audit gap</button>']);
  if (+o.deadline === 12 && rz.level === "ok") help.push(['<button type="button" class="sa-chip sm sa-help" data-go="' + c + '.deadline">Could it be done sooner?</button>']);
  if (help.length) h += '<div class="sa-strong"><b>Make it stronger:</b> ' + help.join("") + "</div>";
  return h;
}
function objCard(o, i) {
  var c = "objs." + i, A = SA.audit(S), tg = (S.tm && S.tm.segs || []).filter(function (g) { return g.target === "yes"; }), L = (function () { var x = linQ(o); return x; })();
  var stage = SA.FBY[SA.TYPE_STAGE[o.type]];
  var h = '<div class="sa-obj">';
  h += '<div class="sa-card"><h3>1. Kind of objective</h3>' + chips(c + ".type", 'Which funnel stage does it move? <span class="sa-pick">Pick one</span>', SA.OBJ_TYPES, { sm: true, re: true }) + (stage ? '<p class="sa-tip">Funnel stage: <b>' + stage[1] + "</b>. " + esc(stage[2]) + ".</p>" : "") + '<details class="sa-hints"' + (o.type === "loyal" ? " open" : "") + '><summary>What is a Loyalty objective?</summary><p class="sa-ms">' + esc(LOYAL_TXT) + '</p><p class="sa-ms"><b>Example:</b> "Increase repeat bookings from returning guests from 10 to 25 a month by month 12 through a thank-you WhatsApp message with a repeat offer and a monthly email newsletter."</p></details></div>';
  h += '<div class="sa-card"><h3>2. Specific: what changes, where, for whom</h3>' +
    chips(c + ".verb", 'Action <span class="sa-pick">Pick one</span>', SA.VERBS.map(function (v) { return [v, v]; }), { sm: true, re: true }) +
    (o.type ? chips(c + ".kpi", 'KPI <span class="sa-pick">Pick one, or type your own below</span>', SA.KPIS[o.type].map(function (k) { return [k[0], k[0]]; }), { sm: true }) : '<p class="sa-tip">Pick the kind of objective first to see KPI ideas.</p>') +
    '<div class="sa-grid4"><div><label for="ok' + i + '">KPI (what you will measure)</label><input id="ok' + i + '" data-p="' + c + '.kpi" data-sm="' + i + '" placeholder="for example: engagement rate" value="' + esc(o.kpi) + '"></div>' +
    '<div><label for="ou' + i + '">Unit</label><select id="ou' + i + '" data-p="' + c + '.unit" data-re="1">' + [["", "number"], ["%", "%"], [" MVR", "MVR"], [" points", "rating"]].map(function (u) { return '<option value="' + u[0] + '"' + ((o.unit || "") === u[0] ? " selected" : "") + ">" + u[1] + "</option>"; }).join("") + "</select></div></div>" +
    chips(c + ".chan", 'Channel <span class="sa-pick">Pick one</span>', SA.OBJ_CHANS.map(function (x) { return [x, x.charAt(0).toUpperCase() + x.slice(1)]; }), { sm: true, re: true }) +
    (tg.length ? chips(c + ".seg", 'For which target segment? <span class="sa-pick">Pick one</span>', tg.map(function (g) { return [g.id, esc(g.name || "Segment")]; }), { sm: true, re: true }) : '<p class="sa-tip">Choose your target segments in step 7 first.</p>') + "</div>";
  h += '<div class="sa-card"><h3>3. Measurable: the numbers</h3>' + hintsHtml() +
    '<div class="sa-grid4"><div><label for="ob' + i + '">Baseline now</label><input id="ob' + i + '" data-p="' + c + '.base" data-sm="' + i + '" inputmode="decimal" value="' + esc(o.base) + '"></div>' +
    '<div><label for="oT' + i + '">Target</label><input id="oT' + i + '" data-p="' + c + '.target" data-sm="' + i + '" inputmode="decimal" value="' + esc(o.target) + '"></div></div>' +
    chips(c + ".baseSrc", 'Where does the baseline come from? <span class="sa-pick">Pick one</span>', SA.BASE_SRC, { sm: true, re: true }) + "</div>";
  h += '<div class="sa-card"><h3>4. Achievable: is it realistic in 12 months?</h3><div data-smr="' + i + '">' + realBox(o, i) + "</div>" +
    cgroup(c + ".how", "What will drive it?", SA.HOW, true, "These become the \"through...\" part of your sentence. Your strategies in step 9 should do these things.") +
    cgroup(c + ".why", "Why it can work", SA.REAL, true, "Pick at least one, especially if the check says the target is ambitious.") + "</div>";
  h += '<div class="sa-card"><h3>5. Relevant: why this objective matters</h3>' + chips(c + ".gap", 'Which audit gap does it fix? <span class="sa-pick">Pick one</span>', SA.gapList(A).map(function (g) { return [g, esc(g)]; }), { sm: true, re: true }) + "</div>";
  h += '<div class="sa-card"><h3>6. Time-bound: by when</h3>' + chips(c + ".deadline", 'Done by month <span class="sa-pick">Pick one</span>', [3, 6, 9, 12].map(function (m) { return [String(m), "Month " + m]; }), { sm: true, re: true }) +
    (L[0] !== "" ? '<p class="sa-tip">Quarterly milestones (you can change them in step 10): ' + L.map(function (v, k) { return "Q" + (k + 1) + " " + esc(SA.fmtNum(v, o.unit)); }).join(", ") + ", Q4 " + esc(SA.fmtNum(o.target, o.unit)) + ".</p>" : "") + "</div>";
  h += '<div class="sa-card sa-objout"><h3>Your objective</h3><div class="f wide"><label for="ot' + i + '">The tool writes it from your choices. You can edit it.</label><textarea id="ot' + i + '" data-p="' + c + '.text" data-edit="' + i + '" rows="3">' + esc(o.text) + "</textarea>" +
    (o.textEdited ? '<span class="sa-hint" id="oh' + i + '">You edited this sentence. <button type="button" class="sa-btn-s" data-rebuild="' + i + '">Rebuild it from my choices</button></span>' : '<span class="sa-hint" id="oh' + i + '">It updates as you choose. Edit it to make it your own.</span>') + "</div>" +
    '<div data-smo="' + i + '">' + objLive(o, i) + "</div></div>";
  h += (S.objs.length > 3 ? '<div style="margin-top:8px"><button type="button" class="sa-btn-s" data-rm="' + i + '">Remove this objective</button></div>' : "") + "</div>";
  return h;
}
function hintsHtml() {
  var M = modelStuff(), seen = {}, rows = [];
  M.objs.forEach(function (o) { var b = SA.num(o.base); if (b == null || seen[o.kpi]) return; seen[o.kpi] = 1; rows.push("<li>" + esc(o.kpi) + ": <b>" + esc(o.base) + (o.unit === "%" ? "%" : "") + "</b></li>"); });
  rows.push("<li>Overall digital visibility score: <b>" + SA.audit(S).overall + "/100</b></li>");
  return '<details class="sa-hints"><summary>Baselines your audit measured</summary><p class="sa-ms">Use these as starting points, or the business\'s own figures if you have them.</p><ul class="sa-hl">' + rows.join("") + "</ul></details>";
}
function viewObj() {
  ensureObjs(); var i = curIdx(7), o = S.objs[i];
  var h = '<h1 class="sa-h">Objective ' + (i + 1) + " of " + S.objs.length + "</h1>";
  if (i === 0) h += '<p class="sa-lede">The assignment needs at least three SMART objectives. Build each one part by part. The tool writes the sentence, checks if the target is realistic, and shows which SMART parts are still missing.</p>';
  return h + funnelViz("obj") + objGuide() + '<div id="saObjs">' + objCard(o, i) + "</div>";
}
function vObj() {
  ensureObjs(); var e = [];
  S.objs.forEach(function (o, i) {
    var n = "Objective " + (i + 1), P = "@@objs." + i + ".";
    if (!o.type) e.push("~" + n + ": pick the kind of objective (funnel stage)." + P + "type");
    if (!String(o.kpi || "").trim()) e.push(n + ": name the KPI." + P + "kpi");
    var b = SA.num(o.base), t = SA.num(o.target);
    if (b == null) e.push(n + ": enter a baseline number." + P + "base"); if (t == null) e.push(n + ": enter a target number." + P + "target");
    if (b != null && t != null && t === b) e.push(n + ": the target is the same as the baseline." + P + "target");
    if (!o.chan) e.push("~" + n + ": pick the channel (Specific)." + P + "chan");
    if (!o.seg) e.push("~" + n + ": pick the target segment (Specific)." + P + "seg");
    if (!o.baseSrc) e.push("~" + n + ": say where the baseline comes from (Measurable)." + P + "baseSrc");
    if (!SA.chosen(o.how).length) e.push("~" + n + ": pick what will drive it (Achievable)." + P + "how");
    var rz = SA.realism(o); if (rz.level !== "ok" && rz.level !== "na" && !SA.chosen(o.why).length) e.push("~" + n + ": the target is " + LEVEL_TXT[rz.level].toLowerCase() + ". Pick why it can work, or change the target (Achievable)." + P + "why");
    if (!o.gap) e.push("~" + n + ": pick the audit gap it fixes (Relevant)." + P + "gap");
    if (o.textEdited && words(o.text) < 8) e.push("~" + n + ": the sentence is very short. Rebuild it or write it out." + P + "text");
  });
  return e;
}

/* ---------- step 9: strategies across the funnel, Gantt, budget ---------- */
function refreshPlanRec() {
  if (!S.plan || !S.plan.strats) return; var M = recs();
  S.plan.strats.forEach(function (s) { var m = M.strats.filter(function (x) { return x.id === s.id; })[0]; if (m) { s.why = m.why; s.rec = !!m.on; } });
}
function ensurePlan() {
  if (!S.plan || !S.plan.cfg) S.plan = { strats: [], cfg: {}, lines: [], cont: "10" };
  var have = {}; S.plan.strats.forEach(function (s) { have[s.id] = s; });
  var M = recs();
  S.plan.strats = SA.STRATS.map(function (sd) {
    var s = have[sd.id] || { id: sd.id, on: false, links: {}, segl: {}, fits: {}, note: "" }, m = M.strats.filter(function (x) { return x.id === sd.id; })[0] || {};
    s.name = sd.name; s.theory = sd.theory; s.why = m.why || ""; s.rec = !!m.on;
    if (sd.core) s.on = true;
    if (!s.stages) { s.stages = {}; sd.stages.forEach(function (x) { s.stages[x] = true; }); }
    return s;
  });
}
function deriveLines() {
  if (!S.plan || !S.plan.cfg) return;
  var L = [];
  S.plan.strats.forEach(function (s) { if (!s.on) return; SA.scLines(s.id, S.plan.cfg[s.id] || {}, SA.stratCtx(S, s.id)).forEach(function (l) { l.s = s.id; L.push(l); }); });
  S.plan.lines = L;
}
var GC = { social: "#2fa9a9", web: "#245582", seo: "#2a82bb", blog: "#5FA8D3", newsletter: "#5b6fb5", video: "#3f9e74", direct: "#1e7850", banner: "#1C3F63", infl: "#1F7F7F", viral: "#7cc9a6", affil: "#7A93A8" };
var BASIS_TXT = { "Price list": "Islandeative price list", "At cost": "Paid at cost", "Market 2026": "2026 market estimate", "Own time": "No cash cost" };
function ganttHtml(only) {
  deriveLines();
  var lab = SA.monthLabels(S.biz.start), h = '<p class="sa-swipe">Swipe sideways to see all 12 months.</p><div class="sa-mon" tabindex="0" role="region" aria-label="Gantt chart"><table class="sa-tbl sa-gt"><tr><th>Activity</th>' + lab.map(function (m) { return "<th>" + m.short + "</th>"; }).join("") + "</tr>", any = false;
  S.plan.strats.forEach(function (s) {
    if (!s.on || (only && s.id !== only)) return; var ls = S.plan.lines.filter(function (l) { return l.s === s.id; }); if (!ls.length) return; any = true;
    if (!only) h += '<tr class="gs"><td colspan="13" style="border-left:4px solid ' + GC[s.id] + '">' + esc(s.name) + "</td></tr>";
    ls.forEach(function (l) { h += "<tr><td>" + esc(l.name) + "</td>" + lab.map(function (m) { var on = SA.lineActive(l, m.i); return '<td class="' + (on ? "on" : "") + '"' + (on ? ' style="background:' + GC[s.id] + '"' : "") + "></td>"; }).join("") + "</tr>"; });
  });
  return any ? h + "</table></div>" : '<p class="sa-ms">Pick activities to see them on the timeline.</p>';
}
function budgetHtml() {
  deriveLines();
  var B = SA.budget(S.plan, S.biz), f = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var h = '<table class="sa-tbl"><tr><th>Strategy</th><th style="text-align:end">12 months (MVR)</th></tr>';
  S.plan.strats.forEach(function (s) { if (s.on && B.byS[s.id]) h += "<tr><td>" + esc(s.name) + '</td><td style="text-align:end">' + f(B.byS[s.id].total) + "</td></tr>"; });
  h += "<tr><td>Contingency (" + B.cp + '%)</td><td style="text-align:end">' + f(B.cont) + '</td></tr><tr><th>Total</th><th style="text-align:end">' + f(B.total) + "</th></tr></table>";
  h += '<p class="sa-ms">About <b>MVR ' + f(B.total / 12) + "</b> a month on average.</p>";
  h += '<p class="sa-swipe">Swipe sideways to see all 12 months.</p><div class="sa-mon" tabindex="0" role="region" aria-label="Budget by month"><table class="sa-tbl"><tr><th>Month</th>' + B.labels.map(function (m) { return "<th>" + m.short + "</th>"; }).join("") + "</tr><tr><td>Total</td>" + B.monthly.map(function (v, i) { return "<td>" + f(v + B.contM[i]) + "</td>"; }).join("") + "</tr></table></div>";
  return { html: h, B: B };
}
function stPages() { ensurePlan(); var P = ["pick"]; S.plan.strats.forEach(function (s, i) { if (s.on) P.push("st:" + i); }); P.push("budget"); return P; }
function stagesOf(s) { var st = SA.chosen(s.stages); return st.length ? st : (SA.SBY[s.id] || {}).stages || []; }
function stageTags(s) { return '<span class="sa-stages">' + stagesOf(s).map(function (x) { return '<i class="st-' + x + '">' + SA.FBY[x][1] + "</i>"; }).join("") + "</span>"; }
function funnelCard() { return funnelViz("plan"); }
function pickCard(s, i, M, extra) {
  var sd = SA.SBY[s.id], m = M.strats.filter(function (x) { return x.id === s.id; })[0] || {}, objs = (m.objs || []).map(function (k) { return "Objective " + (k + 1); });
  return '<button type="button" class="sa-pickcard' + (sd.core ? " core" : "") + '" data-tg="plan.strats.' + i + '.on" aria-pressed="' + !!s.on + '"><span class="nm">' + esc(s.name) + (sd.core ? ' <small class="req">Required</small>' : "") + "</span>" + stageTags(s) + '<span class="ds">' + esc(SA.STRAT_DESC[s.id] || "") + "</span>" +
    (objs.length ? '<span class="rc">Suggested for ' + SA.andJoin(objs) + "</span>" : s.rec && !sd.core ? '<span class="rc">Your audit points here: ' + esc(s.why) + "</span>" : "") + (extra || "") + "</button>";
}
function viewPick() {
  var M = recs(), on = S.plan.strats.filter(function (s) { return s.on; }).length, sig = SA.directSignals(S), idx = function (id) { var k = -1; S.plan.strats.forEach(function (s, j) { if (s.id === id) k = j; }); return k; };
  var h = '<h1 class="sa-h">Choose your strategies</h1><p class="sa-lede">Social media marketing (content and paid ads) is required. Add at least two more, so you have <b>at least ' + SA.MIN_STRATS + "</b>. Pick strategies that move your objectives and cover the funnel. You have <b>" + on + "</b> now.</p>";
  h += funnelCard();
  var si = idx("social"), di = idx("direct");
  h += '<h3 class="sa-grp">Required</h3>' + pickCard(S.plan.strats[si], si, M);
  var sugg = S.plan.strats.filter(function (s) { var m = M.strats.filter(function (x) { return x.id === s.id; })[0] || {}; return !SA.SBY[s.id].core && s.id !== "direct" && (m.objs || []).length; });
  if (sugg.length) h += '<h3 class="sa-grp">Suggested for your objectives</h3>' + sugg.map(function (s) { return pickCard(s, idx(s.id), M); }).join("");
  h += '<h3 class="sa-grp">Conversion: the direct route (recommended)</h3><p class="sa-tip">How the business talks to one customer at a time and turns their interest into a booking or sale. It is the Conversion stage of your funnel.</p>' +
    pickCard(S.plan.strats[di], di, M, sig.length ? '<span class="rc">Your audit and plan point here: ' + esc(sig.slice(0, 2).join(" ")) + "</span>" : "");
  var rest = S.plan.strats.filter(function (s) { return !SA.SBY[s.id].core && s.id !== "direct" && sugg.indexOf(s) < 0; });
  h += '<h3 class="sa-grp">More strategies</h3>' + rest.map(function (s) { return pickCard(s, idx(s.id), M); }).join("");
  return h;
}
function flowHtml(id) { return '<ol class="sa-flow">' + SA.SCFG[id].flow.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ol>"; }
function viewStrat(si) {
  var s = S.plan.strats[si], sd = SA.SBY[s.id], b = "plan.strats." + si, cb = "plan.cfg." + s.id, v = S.plan.cfg[s.id] || (S.plan.cfg[s.id] = {}), lab = SA.monthLabels(S.biz.start), cx = SA.stratCtx(S, s.id);
  var tg = S.tm.segs.filter(function (g) { return g.target === "yes"; });
  var h = '<h1 class="sa-h">' + esc(s.name) + '</h1><p class="sa-lede">' + esc(SA.STRAT_DESC[s.id] || "") + (s.rec && !sd.core ? " <b>Your audit points here:</b> " + esc(s.why) : "") + "</p>";
  h += '<p class="sa-tip"><b>Course topic:</b> ' + esc(sd.course) + ". <b>Theory to link it to in your report:</b> " + esc(s.theory) + ".</p>";
  if (s.id === "direct") { var sig = SA.directSignals(S); if (sig.length) h += '<div class="sa-note"><b>Why a direct route fits this business:</b><ul class="sa-hl">' + sig.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>"; }
  h += '<div class="sa-card"><h3>How it works</h3><p class="sa-tip">This is how a business runs it, step by step. Explain each step in your report.</p>' + flowHtml(s.id) + "</div>";
  h += '<div class="sa-card"><h3>Where it fits</h3>' +
    '<fieldset class="sa-fs"><legend>Funnel stages it works at <span class="sa-pick">Pick all that apply</span></legend><div class="sa-opts">' + SA.FUNNEL.map(function (f) { return mchip(b + ".stages", f[0], f[1]); }).join("") + "</div></fieldset>" +
    '<fieldset class="sa-fs"><legend>Which objectives does it support? <span class="sa-pick">Pick all that apply</span></legend><p class="sa-tip">Marked (suggested) when it moves that objective\'s KPI.</p><div class="sa-opts">' + S.objs.map(function (o, i) { var t = (o.kpi || "Objective " + (i + 1)) + (SA.kpiStrats(o).indexOf(s.id) >= 0 ? " (suggested)" : ""); return mchip(b + ".links", o.id, (i + 1) + ". " + esc(t)); }).join("") + "</div></fieldset>" +
    '<fieldset class="sa-fs"><legend>Which target segments does it reach? <span class="sa-pick">Pick all that apply</span></legend><div class="sa-opts">' + tg.map(function (g) { return mchip(b + ".segl", g.id, esc(g.name || "Segment")); }).join("") + "</div></fieldset>" +
    cgroup(b + ".fits", "Why does it fit?", SA.FITS, true) +
    '<div class="sa-grid">' + txt(b + ".note", "Anything to add in one line?", { wide: true, opt: true, ph: "for example: families plan trips on Instagram during school holidays" }) + "</div></div>";
  h += '<div class="sa-card"><h3>How you will run it</h3><div class="f sa-start"><label for="st_' + s.id + '">' + (s.id === "web" ? "Start building in" : "Start in") + '</label><select id="st_' + s.id + '" data-p="' + cb + '.st" data-re="1">' + lab.map(function (m) { return '<option value="' + m.i + '"' + ((+v.st || 1) === m.i ? " selected" : "") + ">" + m.label + "</option>"; }).join("") + "</select></div>";
  if (s.id === "web" && cx.contentArticles) h += '<p class="sa-tip">Articles are planned in Blog and Article Content, so they are not costed here.</p>';
  if (s.id === "seo" && !cx.hasSite && !cx.webOn) h += '<p class="sa-tip">The business has no website and you have not chosen Website, so SEO here is about Google Maps, the Google profile and directories.</p>';
  if (s.id === "blog" && !cx.hasSite && !cx.webOn) h += '<p class="sa-warn">The business has no website. Choose Website too, or the articles have nowhere to live.</p>';
  SA.scQs(s.id, cx).forEach(function (q) {
    if (q.multi) h += cgroup(cb + "." + q.k, q.q, [], true, q.tip).replace('<div class="sa-opts"></div>', '<div class="sa-opts">' + q.o.map(function (o) { return mchip(cb + "." + q.k, o[0], esc(o[1])); }).join("") + "</div>").replace("Pick all that apply", q.opt ? "Optional, pick any" : "Pick all that apply");
    else h += chips(cb + "." + q.k, esc(q.q) + ' <span class="sa-pick">Pick one</span>', q.o.map(function (o) { return [o[0], esc(o[1])]; }), { sm: true, tip: q.tip, re: true });
  });
  deriveLines(); var B = SA.budget(S.plan, S.biz), sub = (B.byS[s.id] || { total: 0 }).total;
  h += '<p class="sa-subtot">' + esc(s.name) + ": <b>MVR " + Math.round(sub).toLocaleString("en-US") + "</b> over 12 months. Whole plan so far: about MVR " + Math.round(B.total / 12).toLocaleString("en-US") + " a month.</p>";
  var ls = S.plan.lines.filter(function (l) { return l.s === s.id; });
  if ((s.id === "infl" || s.id === "viral") && +v.n && ls[0] && ls[0].months.length < +v.n) h += '<p class="sa-warn">Only ' + ls[0].months.length + " of the " + v.n + " campaigns fit between your start month and month 12. Start earlier to fit them all.</p>";
  if (ls.length) h += '<table class="sa-tbl sa-costs">' + ls.map(function (l) { var t = 0; for (var m = 1; m <= 12; m++) t += SA.lineCost(l, m, SA.stratCtx(S, s.id).season, lab[m - 1].cal); return "<tr><td>" + esc(l.name) + ' <i class="bs">' + BASIS_TXT[l.basis] + '</i></td><td style="text-align:end;white-space:nowrap">' + (l.basis === "Own time" ? "no cost" : "MVR " + t.toLocaleString("en-US")) + "</td></tr>"; }).join("") + "</table>";
  h += ganttHtml(s.id) + "</div>";
  return h;
}
var DEFEND = ["The extra sales it should bring cover the cost", "Big costs are one-off set-up, not every month", "Spend is heavier in the busy season only", "It replaces marketing the business already pays for", "It is phased: cut back if early results are weak", "A competitor spends a similar amount"];
function viewBudget() {
  deriveLines(); var B = SA.budget(S.plan, S.biz), mo = Math.round(B.total / 12), f = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var h = '<h1 class="sa-h">Gantt chart and budget</h1><p class="sa-lede">Built from your choices. Go back to any strategy to change what you do, how often or when.</p>';
  h += '<div class="sa-card"><h3>Gantt chart</h3><div id="saGantt">' + ganttHtml() + "</div></div>";
  h += '<div class="sa-card"><h3>Budget</h3>' + chips("plan.cont", 'Contingency <span class="sa-pick">Pick one</span>', [["5", "5%"], ["10", "10%"], ["15", "15%"]], { sm: true, tip: "A safety margin for price changes and surprises." }) + '<div id="saBud">' + budgetHtml().html + "</div></div>";
  var big = S.plan.strats.filter(function (s) { return s.on && B.byS[s.id]; }).sort(function (a, b) { return B.byS[b.id].total - B.byS[a.id].total; });
  h += '<div class="sa-card"><h3>Can the business defend this budget?</h3>' +
    '<p class="sa-sub">Your plan costs about <b>MVR ' + f(mo) + "</b> a month. A common rule of thumb: small businesses spend about 5% to 10% of their sales on marketing. At this budget the business would need sales of about <b>MVR " + f(mo * 10) + " to " + f(mo * 20) + "</b> a month. Think about whether " + esc(S.biz.name || "the business") + " sells that much, or could with this plan.</p>" +
    chips("plan.defend", 'Is this budget defensible? <span class="sa-pick">Pick one</span>', [["yes", "Yes, I can defend it"], ["trim", "No, I will make it smaller"], ["anyway", "Keep it, though it will be harder to defend"]], { sm: true, re: true });
  if (S.plan.defend === "trim") {
    h += '<p class="sa-tip">The biggest costs first. Open a strategy to change its rhythm, timing, budget or who does the work, or go back to remove a strategy.</p><div class="sa-opts">' +
      big.map(function (s) { return '<button type="button" class="sa-chip sm" data-gost="' + S.plan.strats.indexOf(s) + '">' + esc(s.name) + ": MVR " + f(B.byS[s.id].total) + "</button>"; }).join("") + '<button type="button" class="sa-chip sm" data-sub="0">Add or remove strategies</button></div>';
  } else if (S.plan.defend) {
    h += cgroup("plan.defwhy", S.plan.defend === "yes" ? "How will you defend it in your report?" : "What will you say to defend it?", DEFEND, true);
    if (S.plan.defend === "anyway") h += '<p class="sa-warn">Your report will need strong evidence that the extra spend pays off. The PDF notes that you chose to keep the higher budget.</p>';
  }
  return h + "</div>";
}
function viewPlan() {
  ensurePlan(); var pg = curPage(8);
  if (pg === "pick") return viewPick();
  if (pg === "budget") return viewBudget();
  return viewStrat(+pg.split(":")[1]);
}
function refreshBudget() {
  if (!S.plan) return; deriveLines();
  var el = $("saBud"); if (el) el.innerHTML = budgetHtml().html;
  var g = $("saGantt"); if (g) g.innerHTML = ganttHtml();
}
function vPlan() {
  ensurePlan(); var e = [], on = S.plan.strats.filter(function (s) { return s.on; }), any = function (m) { return SA.chosen(m).length > 0; };
  if (on.length < SA.MIN_STRATS) e.push("Choose at least " + SA.MIN_STRATS + " strategies: Social media plus at least two more.@@plan.strats");
  if (!S.plan.defend) e.push("~Say whether the budget is defensible.@@plan.defend");
  else if (S.plan.defend === "trim") e.push("~You chose to make the budget smaller. Change a strategy, then come back and pick Yes or Keep it.@@plan.defend");
  else if (!SA.chosen(S.plan.defwhy).length) e.push("~Pick how you will defend the budget.@@plan.defwhy");
  S.plan.strats.forEach(function (s, si) {
    if (!s.on) return; var b = "plan.strats." + si, v = S.plan.cfg[s.id] || {}, cx = SA.stratCtx(S, s.id);
    if (!any(s.links)) e.push("~" + s.name + ": pick the objectives it supports.@@" + b + ".links");
    if (!any(s.segl)) e.push("~" + s.name + ": pick the target segments it reaches.@@" + b + ".segl");
    if (!any(s.fits)) e.push("~" + s.name + ": pick why it fits.@@" + b + ".fits");
    SA.scQs(s.id, cx).forEach(function (q) {
      if (q.opt) return; var val = v[q.k], ok = q.multi ? q.o.some(function (o) { return (val || {})[o[0]]; }) : q.o.some(function (o) { return o[0] === String(val); });
      if (!ok) e.push("~" + s.name + ": answer \"" + q.q + "\"@@plan.cfg." + s.id + "." + q.k);
    });
  });
  /* every objective needs at least one strategy behind it */
  (S.objs || []).forEach(function (o, k) {
    if (on.some(function (s) { return (s.links || {})[o.id]; })) return;
    var sug = SA.kpiStrats(o), tgt = -1; S.plan.strats.forEach(function (s, j) { if (tgt < 0 && s.on && sug.indexOf(s.id) >= 0) tgt = j; });
    e.push("~Objective " + (k + 1) + " has no strategy linked to it. Open a strategy that moves it and tick the objective.@@" + (tgt >= 0 ? "plan.strats." + tgt + ".links" : "plan.strats"));
  });
  return e;
}

/* ---------- step 10: control and evaluation ---------- */
function linQ(o) {
  var b = SA.num(o.base), t = SA.num(o.target); if (b == null || t == null) return ["", "", ""];
  var dl = SA.clamp(parseInt(o.deadline, 10) || 12, 3, 12), d = Math.abs(t) >= 10 ? 0 : 2;
  return [3, 6, 9].map(function (m) { var v = b + (t - b) * SA.clamp(m / dl, 0, 1); return Math.round(v * Math.pow(10, d)) / Math.pow(10, d); });
}
function ensureCtl() {
  S.objs.forEach(function (o) { if (!o.q || !Array.isArray(o.q)) o.q = ["", "", ""]; var L = linQ(o); if (o.qAuto !== false) o.q = L.slice(); else for (var k = 0; k < 3; k++) if (o.q[k] === "" || o.q[k] == null) o.q[k] = L[k]; if (o.trig == null) o.trig = 10; if (!o.freq) o.freq = "Monthly"; });
}
var SOURCES = ["Instagram Insights", "TikTok Analytics", "Facebook Insights", "Google Analytics (GA4)", "Google Search Console", "Google Business Profile insights", "Booking or sales records", "Review platform dashboards", "Email or SMS platform reports", "Customer survey"];
function viewCtl() {
  ensureCtl(); var i = curIdx(9), o = S.objs[i], c = "objs." + i;
  var h = '<h1 class="sa-h">Control and evaluation</h1>';
  if (i === 0) h += '<p class="sa-lede">For each objective, say how you will check progress, how often, and what you will do if you fall behind. One objective per page.</p>';
  h += '<div class="sa-card"><h3>Objective ' + (i + 1) + " of " + S.objs.length + '</h3><p class="sa-sub">' + esc(o.text) + '</p><p class="sa-ms"><b>KPI:</b> ' + esc(o.kpi) + ". <b>Baseline:</b> " + esc(o.base) + esc(o.unit || "") + ". <b>Target:</b> " + esc(o.target) + esc(o.unit || "") + " by month " + (+o.deadline || 12) + ".</p>" +
    '<p class="sa-base">Quarterly milestones</p><p class="sa-tip">The tool spreads the target evenly. Change a number if progress will not be even, for example in a peak season.</p>' +
    '<div class="sa-grid4" style="grid-template-columns:repeat(4,1fr)">' + [0, 1, 2].map(function (k) { return '<div class="f"><label for="q' + i + k + '">End of Q' + (k + 1) + '</label><input id="q' + i + k + '" data-p="' + c + ".q." + k + '" inputmode="decimal" value="' + esc(o.q[k]) + '"></div>'; }).join("") + '<div class="f"><label for="q' + i + '4">Q4 (target)</label><input id="q' + i + '4" value="' + esc(o.target) + '" disabled></div></div>' +
    cgroup(c + ".tools", "Where will you get the numbers?", SOURCES, true) +
    chips(c + ".freq", 'How often will you check? <span class="sa-pick">Pick one</span>', ["Weekly", "Fortnightly", "Monthly", "Quarterly"].map(function (x) { return [x, x]; }), { sm: true }) +
    chips(c + ".trig", 'Take action when the result is behind the milestone by <span class="sa-pick">Pick one</span>', [["5", "5%"], ["10", "10%"], ["20", "20%"], ["30", "30%"]], { sm: true }) +
    cgroup(c + ".acts", "What will you do if you fall behind?", SA.ACTS, true) +
    '<div class="sa-grid">' + txt(c + ".act", "Anything else, in one line?", { wide: true, opt: true, ph: "for example: switch the ad budget to TikTok for one month" }) + "</div></div>";
  return h;
}
function vCtl() {
  ensureCtl(); var e = [];
  S.objs.forEach(function (o, i) {
    var n = "Objective " + (i + 1);
    if (!SA.chosen(o.tools).length) e.push("~" + n + ": pick where you will get the numbers.@@objs." + i + ".tools");
    for (var k = 0; k < 3; k++) if (SA.num(o.q[k]) == null) e.push(n + ": enter the Q" + (k + 1) + " milestone as a number.@@objs." + i + ".q." + k);
    if (!SA.chosen(o.acts).length) e.push("~" + n + ": pick at least one thing you will do if you fall behind.@@objs." + i + ".acts");
    o.tool = SA.chosen(o.tools).join(", ");
  });
  return e;
}

/* ---------- paging inside steps ---------- */
function pagesFor(step) {
  if (step === 6) return tmPages();
  if (step === 7 || step === 9) { ensureObjs(); return S.objs.map(function (o, i) { return (step === 7 ? "obj:" : "ctl:") + i; }); }
  if (step === 8) return stPages();
  return null;
}
function curPage(step) { var P = pagesFor(step); if (!P) return ""; S.sub = S.sub || {}; S.sub[step] = Math.max(0, Math.min(P.length - 1, +S.sub[step] || 0)); return P[S.sub[step]]; }
function curIdx(step) { return +String(curPage(step)).split(":")[1] || 0; }
function setSub(step, i) { S.sub = S.sub || {}; S.sub[step] = i; }
function pageLabel(step) {
  var pg = curPage(step); if (!pg) return "";
  if (step === 6) return tmLabel(pg);
  var k = pg.split(":"), i = +k[1];
  if (step === 7) return "Objective " + (i + 1) + " of " + S.objs.length;
  if (step === 9) return "Objective " + (i + 1) + " of " + S.objs.length;
  if (pg === "pick") return "Choose strategies";
  if (pg === "budget") return "Gantt chart and budget";
  var on = S.plan.strats.filter(function (s) { return s.on; }); return "Strategy " + (on.indexOf(S.plan.strats[i]) + 1) + " of " + on.length;
}
function errPage(step, path) {
  path = path || ""; var P = pagesFor(step) || [], m;
  if (step === 6) return tmErrPage(path);
  if (step === 7 || step === 9) { m = /^objs\.(\d+)/.exec(path); return m ? P.indexOf((step === 7 ? "obj:" : "ctl:") + m[1]) : -1; }
  if (step === 8) {
    if (path === "plan.strats") return 0;
    if (/^plan\.(cont|defend|defwhy)/.test(path)) return P.indexOf("budget");
    m = /^plan\.strats\.(\d+)/.exec(path); if (m) return P.indexOf("st:" + m[1]);
    m = /^plan\.cfg\.([a-z]+)/.exec(path); if (m) { var si = -1; S.plan.strats.forEach(function (s, j) { if (s.id === m[1]) si = j; }); return P.indexOf("st:" + si); }
  }
  return -1;
}
function vPage(step) { var cur = +(S.sub || {})[step] || 0; return VALID[step]().filter(function (x) { return errPage(step, String(x).split("@@")[1]) === cur; }); }

function gaps() {
  var out = []; for (var s2 = 0; s2 < 10; s2++) { var e; try { e = VALID[s2](); } catch (x) { e = []; } e.filter(soft).forEach(function (x) { var p = String(x).slice(1).split("@@"); out.push({ step: (s2 + 1) + ". " + STEPS[s2], text: p[0], s: s2, path: p[1] || "" }); }); }
  return out;
}
function missingShots() { var A = SA.audit(S); return A.rep.plats.filter(function (p) { return p.status === "listed" && !IMG[p.id]; }).map(function (p) { return p.name; }); }
/* ---------- step 11: download ---------- */
function viewDone() {
  var A = SA.audit(S), B = SA.budget(S.plan, S.biz), nseg = S.tm.segs.filter(function (g) { return g.target === "yes"; }).length;
  var wg = SA.WRITE_GUIDE.filter(function (r) { return r[1]; }).map(function (r) { return "<tr><td><b>" + esc(r[0]) + "</b><br><span class=\"sa-ms\">" + esc(r[2]) + "</span></td><td style=\"text-align:end;white-space:nowrap\">about " + r[1] + "</td></tr>"; }).join("");
  return '<h1 class="sa-h">Download your evidence report</h1><p class="sa-lede">Your PDF holds the audit evidence, your target market, positioning and personas, your objectives, strategies, Gantt chart, budget, and control and evaluation table. The tool structured and costed it. You wrote the thinking.</p>' +
    '<div class="sa-card"><p><b>' + esc(S.biz.name) + "</b>: digital visibility " + A.overall + "/100. " + S.objs.length + " objectives, " + S.plan.strats.filter(function (s) { return s.on; }).length + " strategies, " + nseg + " persona" + (nseg === 1 ? "" : "s") + ", total budget MVR " + Math.round(B.total).toLocaleString("en-US") + '.</p>' +
    '<label class="sa-ck sa-agree"><input type="checkbox" id="saAgree" data-p="agree" data-bool="1"' + (S.agree ? " checked" : "") + "> I will attach this PDF to my assignment document as an appendix before I submit, and keep a copy for myself.</label>" +
    '<div class="sa-actions"><button type="button" class="btn btn-primary" id="saPdf"' + (S.agree ? "" : " disabled") + '>Download PDF</button><button type="button" class="btn btn-ghost" id="saEdit2">Back to the plan</button><button type="button" class="btn btn-ghost" id="saNew">Start another audit</button></div><p class="sa-ms" id="saPdfMsg" role="status"></p>' +
    '<p class="sa-ms">On a shared or lab computer? <button type="button" class="sa-btn-s" id="saWipe">Sign out of this computer</button> Your work stays in your account.</p></div>' +
    (function () { var G = gaps(); return G.length ? '<div class="sa-note"><b>You skipped ' + G.length + " answer" + (G.length > 1 ? "s" : "") + '.</b> Your PDF lists them. Your report is stronger if you fill them in. Tap one to go there.<ul class="sa-gaps">' + G.slice(0, 12).map(function (g) { return '<li><button type="button" class="sa-errgo" data-gostep="' + g.s + '" data-go="' + esc(g.path) + '">' + esc(g.step + ": " + g.text) + "</button></li>"; }).join("") + (G.length > 12 ? "<li>And " + (G.length - 12) + " more.</li>" : "") + "</ul></div>" : ""; })() +
    '<div class="sa-note">Use of AI: your report must state honestly how you used AI, including this tool. The PDF is evidence and structure, and the explanations, justifications, theory and references in your report must be your own work.</div>';
}

/* ---------- screens, navigation ---------- */
var VIEW = [viewBiz, viewSocial, viewGbp, viewSite, viewRep, viewResults, viewTm, viewObj, viewPlan, viewCtl, viewDone];
var VALID = [vBiz, vSocial, vGbp, vSite, vRep, function () { return []; }, vTm, vObj, vPlan, vCtl, function () { return []; }];
function stepsSkip(i, dir) { return i; }

var NOTICE = "";
function render(keepScroll) {
  var i = S.step; S.maxStep = Math.max(+S.maxStep || 0, i);
  $("saStep").innerHTML = (NOTICE ? '<div class="sa-note sa-welcome">' + esc(NOTICE) + "</div>" : "") + (i >= 8 ? '<p class="sa-backobj"><button type="button" class="sa-btn-s" data-gostep="7">Back to my objectives</button></p>' : "") + VIEW[i]();
  jumpList();
  $("saBar").style.transform = "scaleX(" + ((i + 1) / STEPS.length) + ")";
  var pl = pagesFor(i) ? pageLabel(i) : "";
  $("saStepNo").textContent = "Step " + (i + 1) + " of " + STEPS.length + ": " + STEPS[i] + (pl ? " (" + pl + ")" : "");
  var P = pagesFor(i), cp = P ? curPage(i) : "", last = P ? cp === P[P.length - 1] : true, addTxt = "";
  if (i === 6 && S.tm && cp === "seg:" + (S.tm.segs.length - 1) && S.tm.segs.length < 4) addTxt = "Add segment";
  if (i === 7 && cp === "obj:" + (S.objs.length - 1) && S.objs.length < 6) addTxt = "Add objective";
  $("saAddSegNav").hidden = !addTxt; $("saAddSegNav").textContent = addTxt;
  $("saPrev").style.visibility = i === 0 ? "hidden" : "visible";
  $("saNext").textContent = i === 5 ? "Start building my plan" : i === 9 && last ? "Continue to download" : "Next";
  $("saNav").hidden = i === 10;
  var dl = $("saDoneLogo"), wasHidden = dl.hidden; dl.hidden = i !== 10; if (i === 10 && wasHidden && window.ilLogoReplay) setTimeout(window.ilLogoReplay, 50);
  $("saErr").innerHTML = "";
  if (!keepScroll) { window.scrollTo({ top: 0, behavior: "instant" }); $("saStep").focus({ preventScroll: true }); }
  save();
}
/* "Go to step" list: any step the student has already reached */
function jumpList() {
  var j = $("saJump"); if (!j) return; var mx = +S.maxStep || S.step;
  j.innerHTML = STEPS.map(function (n, k) { return '<option value="' + k + '"' + (k === S.step ? " selected" : "") + (k > mx ? " disabled" : "") + ">" + (k + 1) + ". " + esc(n) + (k > mx ? " (not reached yet)" : "") + "</option>"; }).join("");
}
function jump(n, page) {
  var from = S.step; if (n === from && page == null) return;
  if (n > 5 && from <= 5) { if (!S.tm) setSub(6, 0); S.model = null; refreshPlanRec(); }
  NOTICE = ""; S.step = n; if (pagesFor(n)) setSub(n, page == null ? 0 : page); render();
}
function go(n) { NOTICE = ""; S.step = Math.max(0, Math.min(STEPS.length - 1, n)); render(); }
function soft(x) { return String(x).charAt(0) === "~"; }
function hardOnly(e) { return e.filter(function (x) { return !soft(x); }); }
function showErr(e, canSkip) {
  var hard = hardOnly(e), list = hard.length ? hard.concat(e.filter(soft)) : e;
  $("saErr").innerHTML = (hard.length ? '<li class="sa-err-h">' + (list.length > 1 ? "Please answer these to go on. Tap an item to jump to it." : "Please answer this to go on.") + "</li>" : '<li class="sa-err-h">Some answers are missing. Fill them in now, or skip and come back later. Skipped answers are listed in your PDF.</li>') +
    list.slice(0, 10).map(function (x) { var p = String(x).replace(/^~/, "").split("@@"); return p[1] ? '<li><button type="button" class="sa-errgo" data-go="' + esc(p[1]) + '">' + esc(p[0]) + "</button></li>" : "<li>" + esc(p[0]) + "</li>"; }).join("") + (list.length > 10 ? "<li>And " + (list.length - 10) + " more.</li>" : "") +
    (!hard.length && canSkip !== false ? '<li class="sa-err-skip"><button type="button" class="btn btn-ghost" id="saSkip">Skip for now</button></li>' : "");
}
function jumpTo(path) {
  if (pagesFor(S.step)) { var pi = errPage(S.step, path); if (pi >= 0 && pi !== (+(S.sub || {})[S.step] || 0)) { var keep = $("saErr").innerHTML; setSub(S.step, pi); render(); $("saErr").innerHTML = keep; setTimeout(function () { jumpTo(path); }, 60); return; } }
  var el = path.indexOf("shot:") === 0 ? document.querySelector('[data-shot="' + path.slice(5) + '"]') : null, cs = function (s) { return s.replace(/"/g, '\\"'); };
  if (!el) el = document.querySelector('[data-p="' + cs(path) + '"],[data-tg="' + cs(path) + '"]') || document.querySelector('[data-p^="' + cs(path) + '."],[data-tg^="' + cs(path) + '."]');
  if (!el) return;
  var box = el.closest(".sa-post,.sa-ln,.sa-yn,fieldset,.f,.sa-obj,.sa-st,.sa-card") || el;
  var det = el.closest("details"); if (det && !det.open) det.open = true;
  box.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  box.classList.remove("sa-flash"); void box.offsetWidth; box.classList.add("sa-flash");
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) setTimeout(function () { try { el.focus({ preventScroll: true }); } catch (x) {} }, 350);
}
function next(force) {
  var st = S.step, P = pagesFor(st);
  if (P) { var pe = vPage(st); if (pe.length && (!force || hardOnly(pe).length)) { showErr(pe); return; } var ci = +(S.sub || {})[st] || 0; if (ci < P.length - 1) { setSub(st, ci + 1); render(); return; } }
  var e = VALID[st](); if (P) e = hardOnly(e); if (e.length && (!force || hardOnly(e).length)) { showErr(e); return; }
  if (st === 5) { if (!S.tm) setSub(6, 0); S.model = null; refreshPlanRec(); }
  var nx = st + 1; if (pagesFor(nx)) setSub(nx, 0);
  go(nx);
}
$("saNext").addEventListener("click", function () { next(false); });
$("saPrev").addEventListener("click", function () {
  var st = S.step, ci = +(S.sub || {})[st] || 0;
  if (pagesFor(st) && ci > 0) { setSub(st, ci - 1); render(); return; }
  var pv = st - 1, PP = pagesFor(pv); if (PP) setSub(pv, PP.length - 1);
  go(pv);
});
$("saAddSegNav").addEventListener("click", function () {
  var st = S.step, pe = hardOnly(vPage(st)); if (pe.length) { showErr(pe); return; }
  if (st === 6) { ensureTm(); S.tm.segs.push(newSeg()); setSub(6, tmPages().indexOf("seg:" + (S.tm.segs.length - 1))); }
  if (st === 7) { S.objs.push(newObj()); setSub(7, S.objs.length - 1); }
  render();
});

/* generic input handling */
document.addEventListener("click", function (ev) {
  if (ev.target.closest && ev.target.closest("#saOut")) { try { localStorage.removeItem("ia-student"); sessionStorage.removeItem("ia-student"); } catch (x) {} return; }
  var t = ev.target.closest("button"); if (!t) return;
  if (t.id === "saSkip") { next(true); return; }
  if (t.dataset.gostep !== undefined) { var gs = +t.dataset.gostep, gp = t.dataset.go; jump(gs, t.dataset.objpage != null ? +t.dataset.objpage : 0); if (gp) setTimeout(function () { jumpTo(gp); }, 60); return; }
  if (t.dataset.zero) { setp(t.dataset.zero + ".l", "0"); setp(t.dataset.zero + ".c", "cn"); render(true); return; }
  if (t.id === "saWipe") { if (confirm("Sign out of this computer? Your work stays in your account. Sign in with your ID and PIN to continue.")) { try { localStorage.removeItem(DRAFT); localStorage.removeItem("ia-student"); sessionStorage.removeItem("ia-student"); } catch (x) {} IMG = {}; idbSet(imgKey(), {}).then(function () { location.href = "index.html?out=1"; }); } return; }
  if (t.dataset.go) { jumpTo(t.dataset.go); return; }
  if (t.dataset.gost !== undefined) { setSub(8, stPages().indexOf("st:" + t.dataset.gost)); render(); return; }
  if (t.dataset.sub !== undefined) { setSub(S.step, +t.dataset.sub); render(); return; }
  if (t.dataset.p === "biz.group") { var gv = t.dataset.v; S.biz.group = gv; var tt = SA.TBY[S.biz.type]; if (gv !== "travel") S.biz.type = gv; else if (!tt || tt.group !== "travel") S.biz.type = ""; S.model = null; render(true); return; }
  if (t.id === "saNone") { S.site.subs = { linkhub: "n", wa: "n", book: "n", found: "n" }; render(true); return; }
  if (t.dataset.p && /^objs\.\d+\.kpi$/.test(t.dataset.p)) { var oi = +t.dataset.p.split(".")[1], ob = S.objs[oi], kk = (SA.KPIS[ob.type] || []).filter(function (k) { return k[0] === t.dataset.v; })[0]; ob.kpi = t.dataset.v; if (kk) ob.unit = kk[1]; render(true); return; }
  if (t.dataset.p && t.dataset.v !== undefined) { setp(t.dataset.p, t.dataset.v); if (t.dataset.p === "biz.type" || t.dataset.p === "biz.onLocation") { S.model = null; } if (t.dataset.p === "site.has") S.site.has = t.dataset.v; render(true); return; }
  if (t.id === "saEdit") { go(0); return; }
  if (t.dataset.settarget !== undefined) { var so2 = S.objs[+t.dataset.settarget]; so2.target = t.dataset.v; render(true); return; }
  if (t.dataset.rebuild !== undefined) { var ro = S.objs[+t.dataset.rebuild]; ro.textEdited = false; ro.text = SA.objSentence(ro, S); render(true); return; }
  if (t.dataset.tg && /^plan\.strats\.\d+\.on$/.test(t.dataset.tg)) {
    var ps = S.plan.strats[+t.dataset.tg.split(".")[2]];
    if (SA.SBY[ps.id].core) { showErr(["Social media marketing is required for every business, so it stays in your plan."], false); return; }
    ps.on = !ps.on;
    if (ps.on && !SA.chosen(ps.links).length) { ps.links = {}; (S.objs || []).forEach(function (o) { if (SA.kpiStrats(o).indexOf(ps.id) >= 0) ps.links[o.id] = true; }); }
    render(true); return;
  }
  if (t.dataset.tg) { var tp = t.dataset.tg; if (t.dataset.max && !getp(tp)) { var par = tp.slice(0, tp.lastIndexOf(".")); if (SA.chosen(getp(par)).length >= +t.dataset.max) { showErr(["Pick up to " + t.dataset.max + ". Untick one first."]); return; } } setp(tp, !getp(tp)); render(true); return; }
  if (t.id === "saAddSeg") { ensureTm(); S.tm.segs.push(newSeg()); render(true); return; }
  if (t.dataset.rmseg !== undefined) { S.tm.segs.splice(+t.dataset.rmseg, 1); render(); return; }
  if (t.id === "saEdit2") { setSub(8, stPages().length - 1); go(8); return; }
  if (t.dataset.rm !== undefined) { S.objs.splice(+t.dataset.rm, 1); render(); return; }
  if (t.id === "saPdf") { makeIt(); return; }
  if (t.id === "saAuto") { runAuto(); return; }
  if (t.id === "saGoRev") { go(4); return; }
  if (t.id === "saNew" || t.id === "saReset") { resetAsk(); return; }
});
function onChange(ev) {
  var t = ev.target;
  if (t.dataset && t.dataset.shot) { shot(t); return; }
  if (!t.dataset || !t.dataset.p || t.tagName === "BUTTON") return;
  var v = t.dataset.bool ? t.checked : t.value;
  if (t.dataset.re) { setp(t.dataset.p, v); render(true); save(); return; }
  if (t.dataset.num) v = +v;
  setp(t.dataset.p, v);
  var qm = /^objs\.(\d+)\.q\.\d$/.exec(t.dataset.p); if (qm && S.objs[+qm[1]]) S.objs[+qm[1]].qAuto = false;
  if (t.dataset.edit !== undefined) { var eo = S.objs[+t.dataset.edit], oh = $("oh" + t.dataset.edit); if (eo && !eo.textEdited) { eo.textEdited = true; if (oh) oh.innerHTML = 'You edited this sentence. <button type="button" class="sa-btn-s" data-rebuild="' + t.dataset.edit + '">Rebuild it from my choices</button>'; } }
  if (t.dataset.sm !== undefined && ev.type === "input") { var oi2 = +t.dataset.sm, oo = S.objs[oi2]; if (oo && !oo.textEdited) { oo.text = SA.objSentence(oo, S); var ta = $("ot" + oi2); if (ta) ta.value = oo.text; }
    var so = document.querySelector('[data-smo="' + oi2 + '"]'); if (so) so.innerHTML = objLive(oo, oi2); var sr = document.querySelector('[data-smr="' + oi2 + '"]'); if (sr) sr.innerHTML = realBox(oo, oi2); }
  if (t.id === "saAgree") { var pb = $("saPdf"); if (pb) pb.disabled = !t.checked; }
  if (t.dataset.bud) {
    refreshBudget();
  }
  if (t.dataset.p === "site.url" || t.dataset.p === "biz.name") { /* links update on next render */ }
  save();
}
document.addEventListener("input", function (ev) {
  var t = ev.target; if (!t.dataset) return;
  if (t.dataset.out) { var oe = $(t.dataset.out); if (oe) oe.textContent = t.value; }
  if (t.dataset.p && t.tagName !== "SELECT" && t.type !== "checkbox" && !t.dataset.re) onChange(ev);
});
document.addEventListener("change", onChange);

/* screenshots: shrink in the browser, keep in this browser (IndexedDB, per student ID) */
function shot(inp) {
  var f = inp.files && inp.files[0]; if (!f) return;
  var id = inp.dataset.shot, fr = new FileReader();
  fr.onload = function () {
    var im = new Image();
    im.onload = function () {
      var w = im.width, h = im.height, m = 1000, k = Math.min(1, m / Math.max(w, h)), c = document.createElement("canvas");
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      var cx = c.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(im, 0, 0, c.width, c.height);
      IMG[id] = c.toDataURL("image/jpeg", 0.72); saveImgs(); render(true);
    };
    im.onerror = function () { showErr(["That file could not be read as an image. Try a PNG or JPG screenshot."]); };
    im.src = fr.result;
  };
  fr.readAsDataURL(f);
}

function showModal(mailMsg) { var m = $("saModal"); $("saModalMail").textContent = mailMsg; m.hidden = false; setTimeout(function () { $("saModalClose").focus(); }, 30); }
$("saModalClose").addEventListener("click", function () { $("saModal").hidden = true; var b = $("saPdf"); if (b) b.focus(); });
$("saModal").addEventListener("click", function (ev) { if (ev.target.id === "saModal") $("saModal").hidden = true; });
document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !$("saModal").hidden) $("saModal").hidden = true; });
/* save progress and open a saved report */
function toB64(str) { var b = new TextEncoder().encode(str), s = ""; for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
function fromB64(b64) { var s = atob(b64), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return new TextDecoder().decode(b); }
function payload() { return toB64(JSON.stringify({ v: 1, sid: S.biz.sid, saved: new Date().toISOString(), state: S, img: IMG })); }
function stepList() { return STEPS.map(function (n, i) { return { name: (i + 1) + ". " + n, state: i < S.step ? "done" : i === S.step ? "now" : "todo" }; }); }
function saveProgress() {
  var b = $("saSaveP"), rb = $("saResetSave"); if (!window.jspdf) { toast("The PDF maker did not load. Check your internet connection and refresh the page."); return; } b.disabled = true; var S2 = JSON.parse(JSON.stringify(S)); try { if (S.step >= 5) S2._score = SA.audit(S).overall; } catch (e) {}
  if (rb) rb.disabled = true;
  window.SA_PROGRESS_PDF(S2, stepList(), payload()).then(function () { b.disabled = false; if (rb) { rb.disabled = false; rb.textContent = "Saved. Save again"; } toast("Progress saved as a PDF in your downloads. To continue later, sign in and press Open saved."); }, function (e) { b.disabled = false; if (rb) rb.disabled = false; toast("Could not save: " + (e && e.message ? e.message : e)); });
}
function openSaved(file) {
  var fr = new FileReader();
  fr.onload = function () {
    var txt = new TextDecoder("latin1").decode(new Uint8Array(fr.result)), a = txt.lastIndexOf("%IASA-DATA:"), b = txt.indexOf("%IASA-END", a);
    if (a < 0 || b < 0) { toast("This file has no saved answers. Choose a progress report or final report downloaded from this tool, without editing it."); return; }
    var d; try { d = JSON.parse(fromB64(txt.slice(a + 11, b).trim())); } catch (e) { toast("This file could not be read. It may have been changed by another program."); return; }
    if (!d || !d.state || !d.state.biz) { toast("This file could not be read."); return; }
    if (String(d.sid || "").toUpperCase() !== String(ME.sid || "").toUpperCase()) { toast("This report was saved under another student ID, so it cannot be opened here."); return; }
    if (!confirm("Open this saved report? It replaces the answers in the tool now.")) return;
    var sn2 = S.seen2; S = stamp(d.state); SA.migrate(S); S.seen2 = S.seen2 || sn2; IMG = d.img || {}; saveImgs(); delete S.tsub; NOTICE = "Saved report opened. You are back on step " + (S.step + 1) + ": " + STEPS[S.step] + "."; render(); toast("Saved report opened.");
  };
  fr.readAsArrayBuffer(file);
}
/* Clear all and start over: says what will be lost, offers a saved copy first, then wipes this device and the account copy */
function resetAsk() {
  var old = $("saResetM"); if (old) old.remove();
  var m = document.createElement("div"); m.className = "sa-modal"; m.id = "saResetM"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "saResetH");
  m.innerHTML = '<div class="sa-modal-box"><h2 id="saResetH">Clear everything and start over?</h2><p>You will lose:</p><ul>' +
    "<li><b>All your answers in all 11 steps:</b> the business details, the audit checks and scores, your target market and personas, objectives, strategies, Gantt chart, budget, and control and evaluation.</li>" +
    "<li><b>Your screenshots.</b></li>" +
    "<li><b>The copy saved in your account and on this device.</b> You start from a blank tool with nothing to go back to.</li></ul>" +
    "<p><b>This cannot be undone.</b> Your lecturer keeps the record of any report you already submitted.</p>" +
    '<div class="sa-note"><b>Want a copy first?</b> Save your progress as a file. If the new start does not work out, press <b>Open saved</b> at the top and choose that file to get everything back.</div>' +
    '<div class="sa-actions"><button type="button" class="btn btn-primary" id="saResetSave">Save my progress first</button><button type="button" class="btn sa-danger-btn" id="saResetGo">Clear everything</button><button type="button" class="btn btn-ghost" id="saResetNo">Cancel</button></div></div>';
  document.body.appendChild(m);
  var close = function () { m.remove(); document.removeEventListener("keydown", esc2); var b = $("saReset"); if (b) b.focus(); };
  var esc2 = function (ev) { if (ev.key === "Escape") close(); };
  document.addEventListener("keydown", esc2);
  m.addEventListener("click", function (ev) { if (ev.target === m) close(); });
  $("saResetNo").addEventListener("click", close);
  $("saResetSave").addEventListener("click", function () { saveProgress(); });
  $("saResetGo").addEventListener("click", function () { m.remove(); document.removeEventListener("keydown", esc2); resetAll(); });
  setTimeout(function () { $("saResetSave").focus(); }, 30);
}
function resetAll() {
  var sn = S.seen2; S = stamp(blank()); S.maxStep = 0; S.seen2 = sn; IMG = {}; saveImgs(); try { localStorage.removeItem(DRAFT); } catch (e) {}
  NOTICE = "Everything was cleared. You are starting a fresh audit."; render();
  if (CLOUD) { clearTimeout(CT); SAC.saveState(ME.sid, S, ME.name).then(function () { cloudMsg("Saved to your account"); }, function (e) { cloudMsg("Not saved yet: " + SAC.say(e) + " Your answers are kept on this device.", true); }); }
  toast("Everything was cleared. You are on step 1.");
}
var TOASTT = null;
function toast(m) { var t = $("saToast"); t.textContent = m; t.hidden = false; clearTimeout(TOASTT); TOASTT = setTimeout(function () { t.hidden = true; }, 6000); }
$("saSaveP").addEventListener("click", saveProgress);
$("saJump").addEventListener("change", function () { var n = +this.value; if (n <= (+S.maxStep || S.step)) jump(n); });
$("saOpenP").addEventListener("click", function () { $("saFile").value = ""; $("saFile").click(); });
$("saFile").addEventListener("change", function () { if (this.files && this.files[0]) openSaved(this.files[0]); });
/* PDF */
function sha(str) {
  if (!window.crypto || !crypto.subtle) return Promise.resolve("");
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }, function () { return ""; });
}
function makeIt() {
  var msg = $("saPdfMsg"); if (!S.agree) { msg.textContent = "Tick the box first."; return; }
  msg.textContent = "Building your PDF..."; deriveLines();
  if (!window.jspdf) { msg.textContent = "The PDF maker did not load. Check your internet connection, refresh the page, and try again. Your answers are kept."; return; }
  var W = JSON.parse(JSON.stringify(S)); delete W.biz.student; delete W.biz.sid; delete W.biz.email; ["step", "sub", "agree", "model", "seq", "code", "gaps", "savedAt"].forEach(function (k) { delete W[k]; });
  sha(JSON.stringify(W)).then(function (h) {
    var code = (h || String(Date.now())).slice(0, 10).toUpperCase(), S2 = JSON.parse(JSON.stringify(S)); S2.code = code; S2.gaps = gaps().map(function (g) { return { step: g.step, text: g.text }; });
    return window.SA_PDF(S2, IMG, { embed: payload() }).then(function (res) {
      msg.textContent = "Done. Your PDF is " + res.pages + " pages. Check your downloads. Attach this PDF to your assignment document as an appendix before you submit. Keep a copy of the downloaded file for yourself. Submission code " + code + ".";
      showModal("Attach this PDF to your assignment document as an appendix before you submit. Keep a copy of the downloaded file for yourself.");
      if (CLOUD) { var A = SA.audit(S); SAC.submit(ME.sid, { name: ME.name || "", sid: ME.sid, business: S.biz.name || "", code: code, overall: A.overall, budget: Math.round(SA.budget(S.plan, S.biz).total), skipped: S2.gaps.length, pages: res.pages }).catch(function () {}); }
    });
  }).catch(function (e) { msg.textContent = "The PDF could not be made: " + (e && e.message ? e.message : e); if (window.console) console.warn(e); });
}

$("saTheme").addEventListener("click", function () {
  var d = document.documentElement, dark = d.dataset.theme !== "dark";
  if (dark) d.dataset.theme = "dark"; else delete d.dataset.theme;
  try { localStorage.setItem("ia-theme", dark ? "dark" : "light"); } catch (e) {}
});
$("saYr").textContent = new Date().getFullYear();
window.SA_STATE = function () { return S; };
window.SA_SET = function (st, img) { S = st; SA.migrate(S); if (img !== undefined) IMG = img || {}; render(); };
if (!DEMO && load()) { if (S.biz.sid && ME.sid && S.biz.sid !== ME.sid) { S = blank(); } stamp(S); RESUMED = S.step > 0; delete S.tsub; if (S.objs && !Array.isArray(S.objs)) S.objs = null; if (S.step === 4 && S.biz.type && (SA.TBY[S.biz.type] || {}).travel) { /* screenshots are not saved: asked again at validation */ } }
/* Digital Presence Audit 2.0: a short tour shown once to every student (remembered in their account as S.seen2) */
var V2 = [
  ["Digital Presence Audit 2.0", "<p>The tool has been updated. The next few pages show what is new and what has changed.</p><h3>Your work is safe</h3><p>Your answers were kept and moved to the new layout. Check your objectives and strategies, and fill in any new boxes. Anything missing is listed when you press Next.</p>"],
  ["Getting around", "<ul><li><b>Go to step:</b> a list at the top of every page takes you to any step you have already reached. No more pressing Back many times.</li><li><b>Back to my objectives:</b> a button on steps 9, 10 and 11 takes you straight back to your objectives.</li></ul>"],
  ["Website tests (step 4)", "<ul><li>Type the website address, then press <b>Run the website tests</b>.</li><li>The tool runs Google PageSpeed Insights on mobile and fills in the Performance and SEO scores.</li><li>It also reads the home page title and description, and takes a screenshot that goes into your PDF as evidence.</li><li>You still answer every check yourself. If the test service is busy, use the links and type the scores in.</li></ul>"],
  ["SMART objectives", "<ul><li>Build each objective part by part: kind, action, KPI, channel, segment, numbers, what will drive it, the audit gap and the deadline.</li><li>The tool writes the sentence, and you can edit it.</li><li>A realistic check tells you if your target is realistic, ambitious or very ambitious for 12 months.</li><li>Green and red S, M, A, R, T tiles show which parts are still missing.</li><li><b>Loyalty</b> is an optional fourth kind of objective: getting existing customers to come back, buy again and recommend the business.</li></ul>"],
  ["The marketing funnel", "<ul><li>A funnel picture shows your objectives and strategies at each stage: Awareness, Consideration, Conversion and Loyalty.</li><li>An empty stage is marked, with a quick button to add a strategy that fits.</li><li>Aim for one objective each at Awareness, Engagement and Sales.</li></ul>"],
  ["Strategies", "<ul><li>Social media marketing (content and paid ads) is now required, and every plan needs at least 3 strategies.</li><li>Content is split into Social media, Blog articles, Email newsletter and Video.</li><li>New: <b>Direct route to customers</b> (DMs, WhatsApp, Viber, SMS, email) for turning interest into bookings and sales.</li></ul>"],
  ["Saving your work and opening it later", "<ul><li>Your work saves to your account as you go, so you can continue on any device.</li><li><b>Save progress</b> (top of the page) also downloads a PDF copy of your work.</li><li>To get it back, press <b>Open saved</b> and choose that PDF. Every answer, screenshot and step comes back, and you continue exactly where you left off. Your final report PDF opens the same way.</li><li>Use the PDF exactly as downloaded. Re-saving it through Print to PDF, Word or another app removes the saved answers.</li><li>Only your own student ID can open your saved PDF.</li></ul>"],
  ["Clear all and start over", "<ul><li>The red button at the bottom of each page wipes everything and gives you a fresh start, for example if you want to audit a different business.</li><li>It asks first, and lets you save a copy before anything is deleted.</li></ul>"],
  ["QR code on your final PDF", "<ul><li>Page 1 of your final report has a QR code. Your lecturer scans it to check your submission code is genuine.</li><li>Attach the PDF to your assignment as downloaded, without editing it.</li></ul>"]
];
function showV2() {
  var old = $("saV2"); if (old) old.remove();
  var k = 0, m = document.createElement("div"); m.className = "sa-modal"; m.id = "saV2"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "saV2H");
  document.body.appendChild(m);
  var done = function (toObj) { m.remove(); document.removeEventListener("keydown", keys); S.seen2 = true; S.newsPending = false; save(); if (toObj && S.step >= 7) { S.step = 7; setSub(7, 0); render(); } };
  var keys = function (ev) { if (ev.key === "Escape") done(false); else if (ev.key === "ArrowRight" && k < V2.length - 1) { k++; draw(); } else if (ev.key === "ArrowLeft" && k > 0) { k--; draw(); } };
  function draw() {
    var last = k === V2.length - 1;
    m.innerHTML = '<div class="sa-modal-box sa-v2"><button type="button" class="sa-v2-skip" id="saV2Skip">Skip</button>' +
      (k ? '<p class="sa-v2-kick">Version 2.0 \u00b7 ' + (k + 1) + " of " + V2.length + "</p>" : '<p class="sa-v2-kick">What is new</p>') +
      '<h2 id="saV2H">' + V2[k][0] + '</h2><div class="sa-v2-body">' + V2[k][1] + '</div>' +
      '<div class="sa-v2-dots" aria-hidden="true">' + V2.map(function (x, i) { return '<i class="' + (i === k ? "on" : "") + '"></i>'; }).join("") + "</div>" +
      '<div class="sa-actions sa-v2-nav">' + (k ? '<button type="button" class="btn btn-ghost" id="saV2Back">Back</button>' : "<span></span>") +
      (last ? '<span class="sa-v2-end">' + (S.step >= 7 ? '<button type="button" class="btn btn-ghost" id="saV2Obj">Check my objectives</button>' : "") + '<button type="button" class="btn btn-primary" id="saV2Go">Got it</button></span>'
        : '<button type="button" class="btn btn-primary" id="saV2Next">Next</button>') + "</div></div>";
    $("saV2Skip").addEventListener("click", function () { done(false); });
    if ($("saV2Back")) $("saV2Back").addEventListener("click", function () { k--; draw(); });
    if ($("saV2Next")) $("saV2Next").addEventListener("click", function () { k++; draw(); });
    if ($("saV2Go")) $("saV2Go").addEventListener("click", function () { done(false); });
    if ($("saV2Obj")) $("saV2Obj").addEventListener("click", function () { done(true); });
    var f = $("saV2Next") || $("saV2Go"); if (f) setTimeout(function () { f.focus(); }, 20);
  }
  document.addEventListener("keydown", keys);
  draw();
}
function start(note) {
  if (note) NOTICE = note; else if (RESUMED) NOTICE = "Welcome back. You are on step " + (S.step + 1) + ": " + STEPS[S.step] + ".";
  LOADED = true; render(); if (!S.seen2) showV2();
  idbGet(imgKey()).then(function (m) { if (m && typeof m === "object" && !Object.keys(IMG).length) { IMG = m; if (S.step === 4 || S.step === 10) render(true); } });
}
if (DEMO) window.SA_DEMO.start({ get S() { return S; }, set S(v) { S = v; }, stamp: stamp, render: render, pagesFor: pagesFor, setSub: setSub, VALID: VALID, STEPS: STEPS, gaps: gaps, deriveLines: deriveLines, sha: sha, setLoaded: function () { LOADED = true; }, setImg: function (m) { IMG = m; }, getImg: function () { return IMG; } });
else if (!CLOUD) start();
else {
  $("saStep").innerHTML = '<p class="sa-lede">Loading your work...</p>';
  SAC.ready().then(function (u) {
    if (SAC.sidOf(u) !== ME.sid) { try { localStorage.removeItem("ia-student"); sessionStorage.removeItem("ia-student"); } catch (e) {} location.replace("index.html"); return; }
    return SAC.profile(ME.sid).then(function (p) {
      var localAt = +S.savedAt || 0, cs = null; try { cs = p && p.state ? JSON.parse(p.state) : null; } catch (e) {}
      if (cs && cs.biz && (+cs.savedAt || 0) > localAt) { S = stamp(cs); SA.migrate(S); delete S.tsub; RESUMED = S.step > 0; }
      if (p && p.name && !ME.name) { ME.name = p.name; stamp(S); }
      return SAC.loadImgs(ME.sid).then(function (im) { Object.keys(im).forEach(function (k) { SENT[k] = im[k].length; if (!IMG[k]) IMG[k] = im[k]; }); if (Object.keys(im).length) idbSet(imgKey(), IMG); }, function () {});
    }).then(function () { start(); cloudImgs(); cloudMsg("Saved to your account"); }, function (e) { start(); cloudMsg("Could not load from your account: " + SAC.say(e) + " Using this device's copy.", true); });
  });
}
})();
