/* Islandeative Student Audit: screens. State stays in this page (text answers are also kept in this browser as a draft). A copy of the PDF and answers goes to the lecturer only when the student downloads. */
(function () {
"use strict";
var SA = window.SA, $ = function (id) { return document.getElementById(id); };
var DRAFT = "ia-student-audit-v2";
var STEPS = ["About the business", "Social media", "Google Business Profile", "Website", "Reviews and prices", "Your audit results", "Target market", "Objectives", "Strategies and budget", "Control and evaluation", "Download"];

function blank() {
  var d = new Date(), m = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { step: 0, biz: { name: "", student: "", sid: "", type: "", onLocation: "", checked: SA.ymd(d), start: m.getFullYear() + "-" + ("0" + (m.getMonth() + 1)).slice(-2), cap: "" },
    social: {}, gbp: { status: "", checks: {} }, site: { has: "", checks: {}, subs: {} }, rep: {}, plan: null, objs: null };
}
var ME = (function () { try { return JSON.parse(localStorage.getItem("ia-student") || sessionStorage.getItem("ia-student") || "null") || {}; } catch (e) { return {}; } })();
function stamp(st) { st.biz.student = ME.name || st.biz.student || ""; st.biz.sid = ME.sid || st.biz.sid || ""; st.biz.email = ME.email || ""; return st; }
var S = stamp(blank()), IMG = {}; // IMG holds screenshots in memory only

function save() { try { var c = JSON.parse(JSON.stringify(S)); localStorage.setItem(DRAFT, JSON.stringify(c)); } catch (e) {} }
function load() { try { var r = localStorage.getItem(DRAFT); if (r) { var o = JSON.parse(r); if (o && o.biz) { S = o; return true; } } } catch (e) {} return false; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function getp(path) { var o = S, k = path.split("."); for (var i = 0; i < k.length; i++) { if (o == null) return undefined; o = o[k[i]]; } return o; }
function setp(path, v) { var o = S, k = path.split("."); for (var i = 0; i < k.length - 1; i++) { if (o[k[i]] == null || typeof o[k[i]] !== "object") o[k[i]] = {}; o = o[k[i]]; } o[k[k.length - 1]] = v; }

/* ---------- field builders ---------- */
function txt(path, label, o) {
  o = o || {}; var v = getp(path);
  return '<div class="f' + (o.wide ? " wide" : "") + '"><label for="f_' + path + '">' + label + (o.opt ? ' <span class="cc-opt">(optional)</span>' : "") + '</label>' +
    '<input id="f_' + path + '" data-p="' + path + '" type="' + (o.type || "text") + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : "") + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + ' value="' + esc(v) + '" autocomplete="off">' +
    (o.hint ? '<span class="sa-hint">' + o.hint + "</span>" : "") + "</div>";
}
function chips(path, label, opts, o) {
  o = o || {}; var v = getp(path);
  return '<fieldset class="sa-fs"><legend>' + label + "</legend>" + (o.tip ? '<p class="sa-tip">' + o.tip + "</p>" : "") + '<div class="sa-opts">' +
    opts.map(function (x) { return '<button type="button" class="sa-chip' + (o.sm ? " sm" : "") + '" data-p="' + path + '" data-v="' + x[0] + '"' + (o.re ? ' data-re="1"' : "") + ' aria-pressed="' + (v != null && String(v) === String(x[0])) + '">' + x[1] + "</button>"; }).join("") + "</div></fieldset>";
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
    '<div class="sa-who"><span>Signed in as <b>' + esc(S.biz.student) + "</b></span><span>" + esc(S.biz.sid) + "</span><span>" + esc(S.biz.email) + '</span><a href="index.html">Not you?</a></div>' +
    '<div class="sa-card"><h3>The business</h3><div class="sa-grid">' + txt("biz.name", "Business name", { wide: true }) + "</div>" +
    chips("biz.group", "What kind of business is it?", G, { re: true }) +
    (grp === "travel" ? chips("biz.type", "Which kind of tourism business?", T, { re: true, tip: "Hotels are judged on the big booking sites. Dive centres are judged on review pages. Tour operators are not scored on reviews." }) : "") +
    chips("biz.onLocation", "Does it serve customers at a place (a shop, guesthouse, cafe, office or dive centre people visit)?", [["yes", "Yes, customers come to a location"], ["no", "No, it works online or delivers"]], { re: true }) +
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
  if (!b.type) e.push(b.group === "travel" ? "Choose which kind of tourism business." : "Choose the kind of business." + "@@" + "biz.group");
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
      h += '<fieldset class="sa-fs"><legend>Rate the 3 newest posts</legend><p class="sa-tip">For each post, type the number of likes and pick how many comments it has.</p>';
      for (var i = 1; i <= 3; i++) {
        var cv = getp(a + ".eng." + i + ".c");
        h += '<div class="sa-post"><b>Post ' + i + '</b><div class="f"><label for="l_' + a + i + '">Likes</label><input id="l_' + a + i + '" data-p="' + a + ".eng." + i + '.l" inputmode="numeric" value="' + esc(getp(a + ".eng." + i + ".l")) + '"></div><div class="sa-opts" role="group" aria-label="Comments on post ' + i + '">' +
          SA.CBANDS.map(function (x) { return '<button type="button" class="sa-chip sm" data-p="' + a + ".eng." + i + '.c" data-v="' + x[0] + '" aria-pressed="' + (cv === x[0]) + '">' + x[1] + " comments</button>"; }).join("") + "</div></div>";
      }
      h += '<label class="sa-sw" style="margin-top:8px"><input type="checkbox" data-p="' + a + '.likesHidden" data-bool="1"' + (getp(a + ".likesHidden") ? " checked" : "") + "> <span>Likes are hidden on this account</span></label>" +
        '<label class="sa-sw" style="margin-top:8px"><input type="checkbox" data-p="' + a + '.fewPosts" data-bool="1"' + (getp(a + ".fewPosts") ? " checked" : "") + "> <span>The account has fewer than 3 posts</span></label></fieldset>";
    }
    if (lb === "never" || lb === "m12" || lb === "y1") {
      var wa = getp(a + ".wasActive"), yr = getp(a + ".lastYear") || "";
      h += '<div class="sa-yn"><label class="sa-sw"><input type="checkbox" data-p="' + a + '.wasActive" data-bool="1" data-re="1"' + (wa ? " checked" : "") + "> <span>The business was active here before</span></label>" +
        '<div class="f" style="max-width:280px;margin-top:8px"><label for="y_' + a + '">Last year it was active</label><select id="y_' + a + '" data-p="' + a + '.lastYear"' + (wa ? "" : " disabled") + '><option value="">Choose a year</option>' +
        ["2025", "2024", "2023", "2022", "2021", "2020", "Older than 2020"].map(function (y) { return '<option' + (yr === y ? " selected" : "") + ">" + y + "</option>"; }).join("") + "</select></div></div>";
    }
    h += yn(a + ".bio", "The bio says what the business is, where it is and how to contact it.", "Read the profile top section.");
    h += yn(a + ".link", "There is a working link or contact button (website, booking page, WhatsApp).", "Tap it to test.");
  }
  return h + "</div>";
}
function viewSocial() {
  return '<h1 class="sa-h">Social media</h1><p class="sa-lede">Open each platform and look at the business\'s public page. Answer for every platform, including the ones where it has nothing.</p>' + SA.PLATS.map(platCard).join("");
}
function vSocial() {
  var e = [];
  SA.PLATS.forEach(function (p) {
    var a = S.social[p.id] || {};
    if (!a.status) { e.push(p.name + ": choose one of the three answers." + "@@" + "social." + p.id + ".status"); return; }
    if (a.status === "none") return;
    if (SA.num(a.followers) == null) e.push(p.name + ": enter the number of followers." + "@@" + "social." + p.id + ".followers");
    if (!a.lastBand) { e.push(p.name + ": choose when the last post was." + "@@" + "social." + p.id + ".lastBand"); }
    else {
      if (a.lastBand !== "never") {
        if (a.status === "active" && !a.freqBand) e.push(p.name + ": choose how far back the third newest post goes." + "@@" + "social." + p.id + ".freqBand");
        var n = SA.engCount(a);
        if (!a.likesHidden && n < (a.fewPosts ? 1 : 2)) e.push(p.name + ": give the likes and the comments band for at least " + (a.fewPosts ? "1 post" : "2 of the 3 newest posts") + ", or tick that likes are hidden." + "@@" + "social." + p.id + ".eng");
      }
      if (a.wasActive && !a.lastYear) e.push(p.name + ": choose the last year the business was active, or untick that box." + "@@" + "social." + p.id + ".lastYear");
    }
    if (!a.bio) e.push(p.name + ": answer the bio question." + "@@" + "social." + p.id + ".bio"); if (!a.link) e.push(p.name + ": answer the link question." + "@@" + "social." + p.id + ".link");
  });
  return e;
}

/* ---------- step 3 GBP ---------- */
function viewGbp() {
  var st = S.gbp.status, loc = S.biz.onLocation === "yes";
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
  if (!g.status) return ["Choose an answer about the Google Business Profile."];
  if (g.status === "yes" || g.status === "unclaimed") SA.GBP_CHECKS.forEach(function (c) { if (c.id === "claimed" && g.status === "unclaimed") return; if (!(g.checks || {})[c.id]) e.push("Answer: " + c.q + "@@" + "gbp.checks." + c.id); });
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
  h += '<div class="sa-grid">' + txt("site.perf", "PageSpeed mobile Performance score", { opt: true, mode: "numeric", hint: "If you ran PageSpeed Insights, type the mobile score (0 to 100). It answers the speed check for you." }) + txt("site.seo", "PageSpeed SEO score", { opt: true, mode: "numeric" }) + "</div></div>";
  SA.SITE_GROUPS.forEach(function (g) {
    h += '<div class="sa-card"><h3>' + g.name + "</h3>";
    if (g.id === "geo") h += '<p class="sa-sub">Google says no special markup is needed for AI search features. These checks cover the normal good practice that helps both search and AI answers.</p>';
    SA.SITE_CHECKS.filter(function (c) { return c.g === g.id; }).forEach(function (c) { if (c.id === "fast" && SA.num(s.perf) != null) return; h += yn("site.checks." + c.id, c.q, c.tip); });
    h += "</div>";
  });
  return h;
}
function vSite() {
  var s = S.site, e = [];
  if (s.has === "no") { [["linkhub", "social bio link"], ["wa", "WhatsApp link"], ["book", "online booking or ordering"], ["found", "contact found by googling"]].forEach(function (x) { if (!(s.subs || {})[x[0]]) e.push("Answer the row about " + x[1] + ", or tap None of these." + "@@" + "site.subs." + x[0]); }); return e; }
  if (!domainOf(s.url)) e.push("Type the website address." + "@@" + "site.url");
  SA.SITE_CHECKS.forEach(function (c) { if (c.id === "fast" && SA.num(s.perf) != null) return; if (!(s.checks || {})[c.id]) e.push("Answer: " + c.q + "@@" + "site.checks." + c.id); });
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
    h += '<h4>Screenshot</h4><p class="sa-tip">Take a screenshot of the listing page showing the rating, review count and the browser address bar. It is shrunk and kept in this page only, then placed in your PDF appendix.</p>' +
      '<div class="sa-shot"><input type="file" accept="image/*" data-shot="' + pl.id + '" aria-label="Screenshot for ' + pl.name + '">' + (IMG[pl.id] ? '<img src="' + IMG[pl.id] + '" alt="Screenshot of the ' + pl.name + ' listing">' : '<span class="sa-hint">No screenshot yet.</span>') + "</div>";
    h += "<h4>5 recent comments</h4><p class=\"sa-tip\">Copy the date and the text of the 5 newest reviews. Do not copy reviewer names. If there are fewer than 5 reviews, enter all of them.</p>";
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
    var a = S.rep[pl.id] || {};
    if (!a.status) { if (!pl.optional) e.push(pl.name + ": choose whether the business is listed." + "@@" + "rep." + pl.id + ".status"); return; }
    if (a.status === "none") return;
    var sc = SA.num(a.rating); if (sc == null || sc <= 0 || sc > pl.scale) e.push(pl.name + ": enter the rating, a number up to " + pl.scale + "." + "@@" + "rep." + pl.id + ".rating");
    if (SA.num(a.count) == null) e.push(pl.name + ": enter the number of reviews." + "@@" + "rep." + pl.id + ".count");
    if (!a.lastDate) e.push(pl.name + ": enter the date of the newest review." + "@@" + "rep." + pl.id + ".lastDate"); else if (SA.daysBetween(a.lastDate, now) < 0) e.push(pl.name + ": the newest review date is in the future." + "@@" + "rep." + pl.id + ".lastDate");
    var r = SA.num(a.replies); if (r == null || r < 0 || r > 5) e.push(pl.name + ": enter how many of the 5 comments have owner replies (0 to 5)." + "@@" + "rep." + pl.id + ".replies");
    if (!IMG[pl.id]) e.push(pl.name + ": upload a screenshot." + "@@" + "shot:" + pl.id);
    var need = Math.min(5, Math.max(1, SA.num(a.count) || 5)), got = 0;
    for (var i = 0; i < 5; i++) { var c = SA.arr(a.comments)[i] || {}; if (c.d && String(c.t || "").trim()) { got++; if (SA.daysBetween(c.d, now) < 0) e.push(pl.name + ": comment " + (i + 1) + " has a future date." + "@@" + "rep." + pl.id + ".comments"); } else if (c.d || String(c.t || "").trim()) e.push(pl.name + ": comment " + (i + 1) + " needs both a date and the text." + "@@" + "rep." + pl.id + ".comments"); }
    if (got < need) e.push(pl.name + ": enter " + need + " recent comments with dates (you have " + got + ")." + "@@" + "rep." + pl.id + ".comments");
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
  else { var v = getp(path); h += opts.map(function (o, i) { var val = byIdx ? String(i) : o; return '<button type="button" class="sa-chip sm" data-p="' + path + '" data-v="' + esc(val) + '" aria-pressed="' + (String(v) === val) + '">' + o + "</button>"; }).join(""); }
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
  var sg = tg.filter(function (g) { return g.id === P.seg; })[0], wants = sg ? SA.chosen((sg.s || {}).benefit) : [];
  if (sg) h += wants.length ? cgroup("tm.pos.need", "2. What do they want?", wants, true, "These come from what you picked for this segment.") : '<p class="sa-tip">2. Go back to this segment and pick what they want most (Behavioural) first.</p>';
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
    BASES.forEach(function (b) { if (!on[b[0]]) return; var qs = allq.filter(function (q) { return q.b === b[0]; }); if (!qs.some(function (q) { return q.m ? q.o.some(function (o) { return (s[q.k] || {})[o]; }) : q.o.indexOf(s[q.k]) >= 0; })) e.push(n + ": pick at least one " + b[1].split(" (")[0].toLowerCase() + " option." + "@@" + "tm.segs." + i + ".s"); });
    if (SA.ATT.some(function (a) { var v = (g.att || {})[a.k]; return v === undefined || v === ""; })) e.push(n + ": rate size, reach online, fit and competition." + "@@" + "tm.segs." + i + ".att");
    if (!any(g.basis)) e.push(n + ": say what your answers are based on." + "@@" + "tm.segs." + i + ".basis");
    if (!g.target) e.push(n + ": choose whether you will target it." + "@@" + "tm.segs." + i + ".target");
    else if (g.target === "yes" && words(g.fact) < 3) e.push(n + ": add one fact that backs up targeting it." + "@@" + "tm.segs." + i + ".fact");
  });
  if (!T.segs.some(function (g) { return g.target === "yes"; })) e.push("Choose at least one target segment." + "@@" + "tm.segs");
  var P = T.pos || {}, cnt = function (m) { return SA.chosen(m).length; };
  if (!P.seg || !T.segs.some(function (g) { return g.id === P.seg && g.target === "yes"; })) e.push("Positioning: choose the target segment." + "@@" + "tm.pos.seg");
  if (!cnt(P.need)) e.push("Positioning: pick what they want." + "@@" + "tm.pos.need");
  if (!String(P.cat || "").trim()) e.push("Positioning: say what kind of business it is." + "@@" + "tm.pos.cat");
  if (!P.ben) e.push("Positioning: pick its main benefit." + "@@" + "tm.pos.ben");
  if (!String(P.comp || "").trim()) e.push("Positioning: name the main competitor." + "@@" + "tm.pos.comp");
  if (!cnt(P.diff)) e.push("Positioning: pick how it is different." + "@@" + "tm.pos.diff");
  if (!cnt(P.proof)) e.push("Positioning: pick what proves it." + "@@" + "tm.pos.proof");
  if (P.ax === P.ay) e.push("Positioning map: choose two different things to compare." + "@@" + "tm.pos.ay");
  if (!P.rx || !P.ry) e.push("Positioning map: say how the business compares with the competitor on both." + "@@" + "tm.pos.rx");
  T.segs.forEach(function (g, i) {
    if (g.target !== "yes") return; var p = g.p || {}, n = "Persona for " + (g.name || "segment " + (i + 1));
    if (!String(p.name || "").trim() || SA.num(p.age) == null) e.push(n + ": add a name and an age." + "@@" + "tm.segs." + i + ".p.name");
    if (!any(p.goal) || !any(p.pain) || !any(p.trig)) e.push(n + ": pick what they want, what frustrates them and what makes them buy." + "@@" + "tm.segs." + i + ".p.goal");
    if (!any(p.ch)) e.push(n + ": pick at least one place they spend time online." + "@@" + "tm.segs." + i + ".p.ch");
    if (!String(p.quote || "").trim()) e.push(n + ": write a line they might say." + "@@" + "tm.segs." + i + ".p.quote");
  });
  T.segs.forEach(function (g) { g.who = SA.segText(g, S.biz.type); });
  return e.filter(function (x, i, a) { return a.indexOf(x) === i; });
}

/* ---------- step 8: objectives ---------- */
function newObj() { return { id: uid("o"), text: "", kpi: "", unit: "%", base: "", target: "", deadline: 12, tool: "", freq: "Monthly", q: ["", "", ""], trig: 10, act: "" }; }
function ensureObjs() {
  if (!S.objs || !Array.isArray(S.objs)) S.objs = [];
  while (S.objs.length < 3) S.objs.push(newObj());
}
function modelStuff() {
  if (!S.model) { var A = SA.audit(S), mo = SA.makeObjectives(A, S), mp = SA.makeStrategies(A, S, mo); S.model = { objs: mo, plan: JSON.parse(JSON.stringify(mp)) }; }
  return S.model;
}
function specific(o) { var w = String(o.text || "").toLowerCase().match(/[a-z]+/g) || [], uniq = {}; w.forEach(function (x) { uniq[x] = 1; }); return w.length >= 8 && Object.keys(uniq).length >= 6 && /\d/.test(o.text || ""); }
function smart(o) {
  var b = SA.num(o.base), t = SA.num(o.target), ok = function (x) { return x ? "ok" : "no"; };
  var chg = b != null && t != null && b !== 0 ? Math.round((t - b) / Math.abs(b) * 100) : null;
  var m = String(o.kpi || "").trim() && b != null && t != null;
  var h = '<span class="sa-sm ' + ok(specific(o)) + '">Specific</span><span class="sa-sm ' + ok(m) + '">Measurable</span><span class="sa-sm ' + ok(b != null && t != null && t !== b) + '">Achievable</span><span class="sa-sm ok">Time-bound: month ' + (+o.deadline || 12) + "</span>";
  var notes = [];
  if (!specific(o) && String(o.text || "").trim()) notes.push("To be specific, the sentence needs the channel, the numbers and the time, for example \"from 200 to 2,000 by month 12\".");
  if (chg == null) notes.push("Enter a baseline and a target to see the change.");
  else {
    notes.push("Change from baseline to target: " + (chg > 0 ? "+" : "") + chg.toLocaleString("en-US") + "%.");
    if (chg > 300) notes.push("A big jump. That can be realistic from a small starting point, for example with paid ads, so explain in your report how the strategies will get there.");
    if (chg < 0) notes.push("The target is lower than the baseline. That is fine when less is better, for example response time or cost per booking.");
  }
  return h + '<p class="sa-ms">' + notes.join(" ") + "</p>";
}
function objGuide() {
  return '<details class="sa-hints"><summary>How to write a SMART objective</summary>' +
    '<p class="sa-ms"><b>Use this pattern:</b> <i>Increase / Grow / Reduce</i> + <i>what you measure</i> + <i>on which channel</i> + <i>from the baseline to the target</i> + <i>by when</i> + <i>through which strategy</i>.</p>' +
    '<ul class="sa-hl"><li><b>Specific:</b> one result, one channel, one segment if you can. Not "grow online presence".</li>' +
    '<li><b>Measurable:</b> a number you can check, with a baseline from your audit or the business\'s own records.</li>' +
    '<li><b>Achievable:</b> possible with the budget and strategies you plan. Big jumps are fine from a small start, but say how.</li>' +
    '<li><b>Relevant:</b> it fixes a gap your audit found and helps the business sell more.</li>' +
    '<li><b>Time-bound:</b> a month in the 12-month plan.</li></ul>' +
    '<p class="sa-ms"><b>Weak:</b> "Grow Instagram followers."<br><b>Strong:</b> "Grow Instagram followers from 200 to 2,000 by month 12 through weekly Reels and a monthly paid ad aimed at local families."</p>' +
    '<p class="sa-ms"><b>Tip:</b> mix objective types. One for awareness (followers, reach), one for engagement (engagement rate, messages) and one for sales (bookings, orders, website enquiries).</p></details>';
}
function objCard(o, i) {
  var cap = "objs." + i;
  return '<div class="sa-obj"><div class="f"><label for="ot' + i + '">Write the objective</label><textarea id="ot' + i + '" data-p="' + cap + '.text" data-sm="' + i + '" placeholder="for example: Increase Instagram engagement from 1.2% to 3% by month 9 by posting Reels three times a week">' + esc(o.text) + "</textarea>" +
    '<span class="sa-hint">What will change, on which channel, by how much and by when. The boxes below hold the numbers.</span></div>' +
    chips(cap + ".type", 'What kind of objective? <span class="sa-pick">Pick one</span>', SA.OBJ_TYPES, { sm: true, re: true }) +
    (o.type ? chips(cap + ".kpi", 'Pick a KPI <span class="sa-pick">Pick one, or write your own below</span>', SA.KPIS[o.type].map(function (k) { return [k[0], k[0]]; }), { sm: true }) : "") +
    '<div class="sa-grid4"><div><label for="ok' + i + '">KPI (what you will measure)</label><input id="ok' + i + '" data-p="' + cap + '.kpi" data-sm="' + i + '" placeholder="for example: engagement rate" value="' + esc(o.kpi) + '"></div>' +
    '<div><label for="ou' + i + '">Unit</label><select id="ou' + i + '" data-p="' + cap + '.unit">' + [["%", "%"], ["", "number"], [" MVR", "MVR"], [" points", "score"]].map(function (u) { return '<option value="' + u[0] + '"' + ((o.unit || "") === u[0] ? " selected" : "") + ">" + u[1] + "</option>"; }).join("") + "</select></div>" +
    '<div><label for="ob' + i + '">Baseline now</label><input id="ob' + i + '" data-p="' + cap + '.base" data-sm="' + i + '" inputmode="decimal" value="' + esc(o.base) + '"></div>' +
    '<div><label for="oT' + i + '">Target</label><input id="oT' + i + '" data-p="' + cap + '.target" data-sm="' + i + '" inputmode="decimal" value="' + esc(o.target) + '"></div></div>' +
    chips(cap + ".deadline", 'Done by month <span class="sa-pick">Pick one</span>', [3, 6, 9, 12].map(function (m) { return [String(m), "Month " + m]; }), { sm: true }) +
    '<div class="sa-smart" data-smo="' + i + '">' + smart(o) + "</div>" +
    (S.objs.length > 3 ? '<div style="margin-top:8px"><button type="button" class="sa-btn-s" data-rm="' + i + '">Remove this objective</button></div>' : "") + "</div>";
}
function hintsHtml() {
  var M = modelStuff(), seen = {}, rows = [];
  M.objs.forEach(function (o) { var b = SA.num(o.base); if (b == null || seen[o.kpi]) return; seen[o.kpi] = 1; rows.push("<li>" + esc(o.kpi) + ": <b>" + esc(o.base) + (o.unit === "%" ? "%" : "") + "</b></li>"); });
  rows.push("<li>Overall digital visibility score: <b>" + SA.audit(S).overall + "/100</b></li>");
  return '<details class="sa-hints"><summary>Baselines your audit measured</summary><p class="sa-ms">Use these as starting points, or the business\'s own figures if you have them. Say where each baseline came from.</p><ul class="sa-hl">' + rows.join("") + "</ul></details>";
}
function viewObj() {
  ensureObjs(); var i = curIdx(7), o = S.objs[i];
  var h = '<h1 class="sa-h">Objective ' + (i + 1) + " of " + S.objs.length + "</h1>";
  if (i === 0) h += '<p class="sa-lede">The assignment needs at least three SMART objectives. Write them yourself, one per page. The tool checks the numbers and shows what is missing.</p>';
  return h + objGuide() + hintsHtml() + '<div id="saObjs">' + objCard(o, i) + "</div>";
}
function vObj() {
  ensureObjs(); var e = [];
  S.objs.forEach(function (o, i) {
    var n = "Objective " + (i + 1);
    if (words(o.text) < 8) e.push(n + ": write it out in at least 8 words.@@objs." + i + ".text");
    else if (!specific(o)) e.push(n + ": make it specific: include the numbers and the time in the sentence.@@objs." + i + ".text");
    if (!o.type) e.push(n + ": pick what kind of objective it is.@@objs." + i + ".type");
    if (!String(o.kpi).trim()) e.push(n + ": name the KPI.@@objs." + i + ".kpi");
    var b = SA.num(o.base), t = SA.num(o.target);
    if (b == null) e.push(n + ": enter a baseline number.@@objs." + i + ".base"); if (t == null) e.push(n + ": enter a target number.@@objs." + i + ".target");
    if (b != null && t != null && t === b) e.push(n + ": the target is the same as the baseline.@@objs." + i + ".target");
  });
  return e;
}

/* ---------- step 9: strategies, Gantt, budget ---------- */
function ensurePlan() {
  if (S.plan && S.plan.cfg) return;
  var M = modelStuff();
  S.plan = { strats: M.plan.strats.map(function (s) { return { id: s.id, name: s.name, theory: s.theory, why: s.why, rec: !!s.on, on: false, links: {}, segl: {}, fits: {}, note: "" }; }), cfg: {}, lines: [], cont: "10" };
}
function deriveLines() {
  if (!S.plan || !S.plan.cfg) return;
  var L = [];
  S.plan.strats.forEach(function (s) { if (!s.on) return; SA.scLines(s.id, S.plan.cfg[s.id] || {}, SA.stratCtx(S, s.id)).forEach(function (l) { l.s = s.id; L.push(l); }); });
  S.plan.lines = L;
}
var GC = { web: "#245582", seo: "#2a82bb", content: "#2fa9a9", smads: "#3f9e74", banner: "#1C3F63", email: "#5FA8D3", infl: "#1F7F7F", viral: "#7cc9a6", affil: "#7A93A8" };
var BASIS_TXT = { "Price list": "Islandeative price list", "At cost": "Paid at cost", "Market 2026": "2026 market estimate", "Own time": "No cash cost" };
function ganttHtml(only) {
  deriveLines();
  var lab = SA.monthLabels(S.biz.start), h = '<div class="sa-mon"><table class="sa-tbl sa-gt"><tr><th>Activity</th>' + lab.map(function (m) { return "<th>" + m.short + "</th>"; }).join("") + "</tr>", any = false;
  S.plan.strats.forEach(function (s) {
    if (!s.on || (only && s.id !== only)) return; var ls = S.plan.lines.filter(function (l) { return l.s === s.id; }); if (!ls.length) return; any = true;
    if (!only) h += '<tr class="gs"><td colspan="13" style="color:' + GC[s.id] + '">' + esc(s.name) + "</td></tr>";
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
  h += '<div class="sa-mon"><table class="sa-tbl"><tr><th>Month</th>' + B.labels.map(function (m) { return "<th>" + m.short + "</th>"; }).join("") + "</tr><tr><td>Total</td>" + B.monthly.map(function (v, i) { return "<td>" + f(v + B.contM[i]) + "</td>"; }).join("") + "</tr></table></div>";
  return { html: h, B: B };
}
function stPages() { ensurePlan(); var P = ["pick"]; S.plan.strats.forEach(function (s, i) { if (s.on) P.push("st:" + i); }); P.push("budget"); return P; }
function viewPick() {
  var h = '<h1 class="sa-h">Choose your strategies</h1><p class="sa-lede">Pick at least two strategies from the course list. Next, you will plan each one on its own page: why it fits, what you will do and how often. The tool costs it and draws the timeline.</p>';
  S.plan.strats.forEach(function (s, i) {
    h += '<button type="button" class="sa-pickcard" data-tg="plan.strats.' + i + '.on" aria-pressed="' + !!s.on + '"><span class="nm">' + esc(s.name) + '</span><span class="ds">' + esc(SA.STRAT_DESC[s.id] || "") + "</span>" + (s.rec ? '<span class="rc">Your audit points here: ' + esc(s.why) + "</span>" : "") + "</button>";
  });
  return h;
}
function flowHtml(id) { return '<ol class="sa-flow">' + SA.SCFG[id].flow.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ol>"; }
function viewStrat(si) {
  var s = S.plan.strats[si], b = "plan.strats." + si, cb = "plan.cfg." + s.id, v = S.plan.cfg[s.id] || (S.plan.cfg[s.id] = {}), lab = SA.monthLabels(S.biz.start), cx = SA.stratCtx(S, s.id);
  var tg = S.tm.segs.filter(function (g) { return g.target === "yes"; });
  var h = '<h1 class="sa-h">' + esc(s.name) + '</h1><p class="sa-lede">' + esc(SA.STRAT_DESC[s.id] || "") + (s.rec ? " <b>Your audit points here:</b> " + esc(s.why) : "") + "</p>";
  h += '<div class="sa-card"><h3>How it works</h3><p class="sa-tip">This is how a business runs it, step by step. Explain each step in your report.</p>' + flowHtml(s.id) + "</div>";
  h += '<div class="sa-card"><h3>Why it fits</h3>' +
    '<fieldset class="sa-fs"><legend>Which objectives does it support? <span class="sa-pick">Pick all that apply</span></legend><div class="sa-opts">' + S.objs.map(function (o, i) { var t = String(o.text || "Objective " + (i + 1)); return mchip(b + ".links", o.id, (i + 1) + ". " + esc(t.length > 60 ? t.slice(0, 58) + "..." : t)); }).join("") + "</div></fieldset>" +
    '<fieldset class="sa-fs"><legend>Which target segments does it reach? <span class="sa-pick">Pick all that apply</span></legend><div class="sa-opts">' + tg.map(function (g) { return mchip(b + ".segl", g.id, esc(g.name || "Segment")); }).join("") + "</div></fieldset>" +
    cgroup(b + ".fits", "Why does it fit?", SA.FITS, true) +
    '<p class="sa-tip"><b>Theory to link it to in your report:</b> ' + esc(s.theory) + ".</p>" +
    '<div class="sa-grid">' + txt(b + ".note", "Anything to add in one line?", { wide: true, opt: true, ph: "for example: families plan trips on Instagram during school holidays" }) + "</div></div>";
  h += '<div class="sa-card"><h3>How you will run it</h3><div class="f sa-start"><label for="st_' + s.id + '">' + (s.id === "web" ? "Start building in" : "Start in") + '</label><select id="st_' + s.id + '" data-p="' + cb + '.st" data-re="1">' + lab.map(function (m) { return '<option value="' + m.i + '"' + ((+v.st || 1) === m.i ? " selected" : "") + ">" + m.label + "</option>"; }).join("") + "</select></div>";
  if (s.id === "web" && cx.contentArticles) h += '<p class="sa-tip">Your content plan already writes blog articles, so articles are not costed again here.</p>';
  if (s.id === "seo" && !cx.hasSite && !cx.webOn) h += '<p class="sa-tip">The business has no website and you have not chosen Blogs and Websites, so SEO here is about Google Maps, the Google profile and directories.</p>';
  SA.scQs(s.id, cx).forEach(function (q) {
    if (q.multi) h += cgroup(cb + "." + q.k, q.q, [], true, q.tip).replace('<div class="sa-opts"></div>', '<div class="sa-opts">' + q.o.map(function (o) { return mchip(cb + "." + q.k, o[0], esc(o[1])); }).join("") + "</div>").replace("Pick all that apply", q.opt ? "Optional, pick any" : "Pick all that apply");
    else h += chips(cb + "." + q.k, esc(q.q) + ' <span class="sa-pick">Pick one</span>', q.o.map(function (o) { return [o[0], esc(o[1])]; }), { sm: true, tip: q.tip });
  });
  deriveLines(); var B = SA.budget(S.plan, S.biz), sub = (B.byS[s.id] || { total: 0 }).total;
  h += '<p class="sa-subtot">' + esc(s.name) + ": <b>MVR " + Math.round(sub).toLocaleString("en-US") + "</b> over 12 months. Whole plan so far: about MVR " + Math.round(B.total / 12).toLocaleString("en-US") + " a month.</p>";
  var ls = S.plan.lines.filter(function (l) { return l.s === s.id; });
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
  if (on.length < 2) e.push("Choose at least 2 strategies.@@plan.strats");
  if (!S.plan.defend) e.push("Say whether the budget is defensible.@@plan.defend");
  else if (S.plan.defend === "trim") e.push("You chose to make the budget smaller. Change a strategy, then come back and pick Yes or Keep it.@@plan.defend");
  else if (!SA.chosen(S.plan.defwhy).length) e.push("Pick how you will defend the budget.@@plan.defwhy");
  S.plan.strats.forEach(function (s, si) {
    if (!s.on) return; var b = "plan.strats." + si, v = S.plan.cfg[s.id] || {}, cx = SA.stratCtx(S, s.id);
    if (!any(s.links)) e.push(s.name + ": pick the objectives it supports.@@" + b + ".links");
    if (!any(s.segl)) e.push(s.name + ": pick the target segments it reaches.@@" + b + ".segl");
    if (!any(s.fits)) e.push(s.name + ": pick why it fits.@@" + b + ".fits");
    SA.scQs(s.id, cx).forEach(function (q) {
      if (q.opt) return; var val = v[q.k], ok = q.multi ? q.o.some(function (o) { return (val || {})[o[0]]; }) : q.o.some(function (o) { return o[0] === String(val); });
      if (!ok) e.push(s.name + ": answer \"" + q.q + "\"@@plan.cfg." + s.id + "." + q.k);
    });
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
  S.objs.forEach(function (o) { if (!o.q || !Array.isArray(o.q)) o.q = ["", "", ""]; var L = linQ(o); for (var k = 0; k < 3; k++) if (o.q[k] === "" || o.q[k] == null) o.q[k] = L[k]; if (o.trig == null) o.trig = 10; if (!o.freq) o.freq = "Monthly"; });
}
var SOURCES = ["Instagram Insights", "TikTok Analytics", "Facebook Insights", "Google Analytics (GA4)", "Google Search Console", "Google Business Profile insights", "Booking or sales records", "Review platform dashboards", "Email or SMS platform reports", "Customer survey"];
function viewCtl() {
  ensureCtl(); var i = curIdx(9), o = S.objs[i], c = "objs." + i;
  var h = '<h1 class="sa-h">Control and evaluation</h1>';
  if (i === 0) h += '<p class="sa-lede">For each objective, say how you will check progress, how often, and what you will do if you fall behind. One objective per page.</p>';
  h += '<div class="sa-card"><h3>Objective ' + (i + 1) + " of " + S.objs.length + '</h3><p class="sa-sub">' + esc(o.text) + '</p><p class="sa-ms"><b>KPI:</b> ' + esc(o.kpi) + ". <b>Baseline:</b> " + esc(o.base) + esc(o.unit || "") + ". <b>Target:</b> " + esc(o.target) + esc(o.unit || "") + " by month " + (+o.deadline || 12) + ".</p>" +
    '<p class="sa-base">Quarterly milestones</p><p class="sa-tip">The tool spreads the target evenly. Change a number if progress will not be even, for example in a peak season.</p>' +
    '<div class="sa-grid4" style="grid-template-columns:repeat(4,1fr)">' + [0, 1, 2].map(function (k) { return '<div class="f"><label for="q' + i + k + '">End of Q' + (k + 1) + '</label><input id="q' + i + k + '" data-p="' + c + ".q." + k + '" inputmode="decimal" value="' + esc(o.q[k]) + '"></div>'; }).join("") + '<div class="f"><label>Q4 (target)</label><input value="' + esc(o.target) + '" disabled></div></div>' +
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
    if (!SA.chosen(o.tools).length) e.push(n + ": pick where you will get the numbers.@@objs." + i + ".tools");
    for (var k = 0; k < 3; k++) if (SA.num(o.q[k]) == null) e.push(n + ": enter the Q" + (k + 1) + " milestone as a number.@@objs." + i + ".q." + k);
    if (!SA.chosen(o.acts).length) e.push(n + ": pick at least one thing you will do if you fall behind.@@objs." + i + ".acts");
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

/* ---------- step 11: download ---------- */
function viewDone() {
  var A = SA.audit(S), B = SA.budget(S.plan, S.biz), nseg = S.tm.segs.filter(function (g) { return g.target === "yes"; }).length;
  var wg = SA.WRITE_GUIDE.filter(function (r) { return r[1]; }).map(function (r) { return "<tr><td><b>" + esc(r[0]) + "</b><br><span class=\"sa-ms\">" + esc(r[2]) + "</span></td><td style=\"text-align:end;white-space:nowrap\">about " + r[1] + "</td></tr>"; }).join("");
  return '<h1 class="sa-h">Download your evidence report</h1><p class="sa-lede">Your PDF holds the audit evidence, your target market, positioning and personas, your objectives, strategies, Gantt chart, budget, and control and evaluation table. The tool structured and costed it. You wrote the thinking.</p>' +
    '<div class="sa-card"><p><b>' + esc(S.biz.name) + "</b>: digital visibility " + A.overall + "/100. " + S.objs.length + " objectives, " + S.plan.strats.filter(function (s) { return s.on; }).length + " strategies, " + nseg + " persona" + (nseg === 1 ? "" : "s") + ", total budget MVR " + Math.round(B.total).toLocaleString("en-US") + '.</p>' +
    '<label class="sa-ck sa-agree"><input type="checkbox" id="saAgree" data-p="agree" data-bool="1"' + (S.agree ? " checked" : "") + "> I will attach this PDF to my assignment document as an appendix before I submit, and keep a copy for myself.</label>" +
    '<div class="sa-actions"><button type="button" class="btn btn-primary" id="saPdf"' + (S.agree ? "" : " disabled") + '>Download PDF</button><button type="button" class="btn btn-ghost" id="saEdit2">Back to the plan</button><button type="button" class="btn btn-ghost" id="saNew">Start another audit</button></div><p class="sa-ms" id="saPdfMsg" role="status"></p></div>' +
    '<div class="sa-note">Use of AI: your report must state honestly how you used AI, including this tool. The PDF is evidence and structure, and the explanations, justifications, theory and references in your report must be your own work.</div>';
}

/* ---------- screens, navigation ---------- */
var VIEW = [viewBiz, viewSocial, viewGbp, viewSite, viewRep, viewResults, viewTm, viewObj, viewPlan, viewCtl, viewDone];
var VALID = [vBiz, vSocial, vGbp, vSite, vRep, function () { return []; }, vTm, vObj, vPlan, vCtl, function () { return []; }];
function stepsSkip(i, dir) { return i; }

function render(keepScroll) {
  var i = S.step; $("saStep").innerHTML = VIEW[i]();
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
function go(n) { S.step = Math.max(0, Math.min(STEPS.length - 1, n)); render(); }
function showErr(e) {
  $("saErr").innerHTML = (e.length > 1 ? '<li class="sa-err-h">Tap an item to jump to it.</li>' : "") + e.slice(0, 10).map(function (x) { var p = String(x).split("@@"); return p[1] ? '<li><button type="button" class="sa-errgo" data-go="' + esc(p[1]) + '">' + esc(p[0]) + "</button></li>" : "<li>" + esc(p[0]) + "</li>"; }).join("") + (e.length > 10 ? "<li>And " + (e.length - 10) + " more.</li>" : "");
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
$("saNext").addEventListener("click", function () {
  var st = S.step, P = pagesFor(st);
  if (P) { var pe = vPage(st); if (pe.length) { showErr(pe); return; } var ci = +(S.sub || {})[st] || 0; if (ci < P.length - 1) { setSub(st, ci + 1); render(); return; } }
  var e = VALID[st](); if (e.length) { showErr(e); return; }
  if (st === 5) { setSub(6, 0); S.plan = null; S.model = null; }
  var nx = st + 1; if (pagesFor(nx)) setSub(nx, 0);
  go(nx);
});
$("saPrev").addEventListener("click", function () {
  var st = S.step, ci = +(S.sub || {})[st] || 0;
  if (pagesFor(st) && ci > 0) { setSub(st, ci - 1); render(); return; }
  var pv = st - 1, PP = pagesFor(pv); if (PP) setSub(pv, PP.length - 1);
  go(pv);
});
$("saAddSegNav").addEventListener("click", function () {
  var st = S.step, pe = vPage(st); if (pe.length) { showErr(pe); return; }
  if (st === 6) { ensureTm(); S.tm.segs.push(newSeg()); setSub(6, tmPages().indexOf("seg:" + (S.tm.segs.length - 1))); }
  if (st === 7) { S.objs.push(newObj()); setSub(7, S.objs.length - 1); }
  render();
});

/* generic input handling */
document.addEventListener("click", function (ev) {
  var t = ev.target.closest("button"); if (!t) return;
  if (t.dataset.go) { jumpTo(t.dataset.go); return; }
  if (t.dataset.gost !== undefined) { setSub(8, stPages().indexOf("st:" + t.dataset.gost)); render(); return; }
  if (t.dataset.sub !== undefined) { setSub(S.step, +t.dataset.sub); render(); return; }
  if (t.dataset.p === "biz.group") { var gv = t.dataset.v; S.biz.group = gv; var tt = SA.TBY[S.biz.type]; if (gv !== "travel") S.biz.type = gv; else if (!tt || tt.group !== "travel") S.biz.type = ""; S.model = null; S.plan = null; render(true); return; }
  if (t.id === "saNone") { S.site.subs = { linkhub: "n", wa: "n", book: "n", found: "n" }; render(true); return; }
  if (t.dataset.p && /^objs\.\d+\.kpi$/.test(t.dataset.p)) { var oi = +t.dataset.p.split(".")[1], ob = S.objs[oi], kk = (SA.KPIS[ob.type] || []).filter(function (k) { return k[0] === t.dataset.v; })[0]; ob.kpi = t.dataset.v; if (kk) ob.unit = kk[1]; render(true); return; }
  if (t.dataset.p && t.dataset.v !== undefined) { setp(t.dataset.p, t.dataset.v); if (t.dataset.p === "biz.type" || t.dataset.p === "biz.onLocation") { S.model = null; S.plan = null; } if (t.dataset.p === "site.has") S.site.has = t.dataset.v; render(true); return; }
  if (t.id === "saEdit") { go(0); return; }
  if (t.dataset.tg) { var tp = t.dataset.tg; if (t.dataset.max && !getp(tp)) { var par = tp.slice(0, tp.lastIndexOf(".")); if (SA.chosen(getp(par)).length >= +t.dataset.max) { showErr(["Pick up to " + t.dataset.max + ". Untick one first."]); return; } } setp(tp, !getp(tp)); render(true); return; }
  if (t.id === "saAddSeg") { ensureTm(); S.tm.segs.push(newSeg()); render(true); return; }
  if (t.dataset.rmseg !== undefined) { S.tm.segs.splice(+t.dataset.rmseg, 1); render(); return; }
  if (t.id === "saEdit2") { setSub(8, stPages().length - 1); go(8); return; }
  if (t.dataset.rm !== undefined) { S.objs.splice(+t.dataset.rm, 1); render(); return; }
  if (t.id === "saPdf") { makeIt(); return; }
  if (t.id === "saNew") { if (confirm("Start another audit? Your current answers will be cleared from this page.")) { S = stamp(blank()); IMG = {}; try { localStorage.removeItem(DRAFT); } catch (e) {} render(); } }
});
function onChange(ev) {
  var t = ev.target;
  if (t.dataset && t.dataset.shot) { shot(t); return; }
  if (!t.dataset || !t.dataset.p || t.tagName === "BUTTON") return;
  var v = t.dataset.bool ? t.checked : t.value;
  if (t.dataset.re) { setp(t.dataset.p, v); render(true); save(); return; }
  if (t.dataset.num) v = +v;
  setp(t.dataset.p, v);
  if (t.dataset.sm !== undefined) { var so = $("saObjs") && document.querySelector('[data-smo="' + t.dataset.sm + '"]'); if (so) so.innerHTML = smart(S.objs[+t.dataset.sm]); }
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

/* screenshots: shrink in the browser, keep in memory only */
function shot(inp) {
  var f = inp.files && inp.files[0]; if (!f) return;
  var id = inp.dataset.shot, fr = new FileReader();
  fr.onload = function () {
    var im = new Image();
    im.onload = function () {
      var w = im.width, h = im.height, m = 1000, k = Math.min(1, m / Math.max(w, h)), c = document.createElement("canvas");
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      var cx = c.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(im, 0, 0, c.width, c.height);
      IMG[id] = c.toDataURL("image/jpeg", 0.72); render(true);
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
/* PDF */
function sha(str) {
  if (!window.crypto || !crypto.subtle) return Promise.resolve("");
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }, function () { return ""; });
}
function makeIt() {
  var msg = $("saPdfMsg"); if (!S.agree) { msg.textContent = "Tick the box first."; return; }
  msg.textContent = "Building your PDF..."; deriveLines();
  sha(JSON.stringify([S.biz, S.objs, S.tm, S.plan && S.plan.strats, S.checked])).then(function (h) {
    var code = (h || String(Date.now())).slice(0, 10).toUpperCase(), S2 = JSON.parse(JSON.stringify(S)); S2.code = code;
    return window.SA_PDF(S2, IMG).then(function (res) {
      msg.textContent = "Done. Your PDF is " + res.pages + " pages. Check your downloads. Attach this PDF to your assignment document as an appendix before you submit. Keep a copy of the downloaded file for yourself. Submission code " + code + ".";
      showModal("Attach this PDF to your assignment document as an appendix before you submit. Keep a copy of the downloaded file for yourself.");
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
window.SA_SET = function (st, img) { S = st; IMG = img || {}; render(); };
if (load()) { if (S.biz.sid && ME.sid && S.biz.sid !== ME.sid) { S = blank(); } stamp(S); if (S.step > 5) S.step = 5; delete S.tsub; if (S.objs && !Array.isArray(S.objs)) S.objs = null; if (S.step === 4 && S.biz.type && (SA.TBY[S.biz.type] || {}).travel) { /* screenshots are not saved: asked again at validation */ } }
render();
})();
