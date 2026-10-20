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
    opts.map(function (x) { return '<button type="button" class="sa-chip' + (o.sm ? " sm" : "") + '" data-p="' + path + '" data-v="' + x[0] + '"' + (o.re ? ' data-re="1"' : "") + ' aria-pressed="' + (v === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div></fieldset>";
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
  var G = [["travel", "Tourism business"], ["food", "Food and drink"], ["retail", "Shop or online seller"], ["service", "Other service"]];
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
    txt("biz.cap", "About how much could the business spend on marketing each month? (MVR)", { opt: true, mode: "numeric", ph: "for example 8000", hint: "Used to keep the draft budget realistic. Leave blank for the default of MVR 8,000." }) + "</div></div>";
}
function vBiz() {
  var e = [], b = S.biz;
  if (!b.student.trim()) e.push("Add your name.");
  if (!String(b.sid || "").trim()) e.push("Add your student ID.");
  if (!b.name.trim()) e.push("Add the business name.");
  if (!b.type) e.push(b.group === "travel" ? "Choose which kind of tourism business." : "Choose the kind of business.");
  if (!b.onLocation) e.push("Say whether customers come to a location.");
  if (!S.site.has) e.push("Say whether the business has a website.");
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
    if (!a.status) { e.push(p.name + ": choose one of the three answers."); return; }
    if (a.status === "none") return;
    if (SA.num(a.followers) == null) e.push(p.name + ": enter the number of followers.");
    if (!a.lastBand) { e.push(p.name + ": choose when the last post was."); }
    else {
      if (a.lastBand !== "never") {
        if (a.status === "active" && !a.freqBand) e.push(p.name + ": choose how far back the third newest post goes.");
        var n = SA.engCount(a);
        if (!a.likesHidden && n < (a.fewPosts ? 1 : 2)) e.push(p.name + ": give the likes and the comments band for at least " + (a.fewPosts ? "1 post" : "2 of the 3 newest posts") + ", or tick that likes are hidden.");
      }
      if (a.wasActive && !a.lastYear) e.push(p.name + ": choose the last year the business was active, or untick that box.");
    }
    if (!a.bio) e.push(p.name + ": answer the bio question."); if (!a.link) e.push(p.name + ": answer the link question.");
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
  if (g.status === "yes" || g.status === "unclaimed") SA.GBP_CHECKS.forEach(function (c) { if (c.id === "claimed" && g.status === "unclaimed") return; if (!(g.checks || {})[c.id]) e.push("Answer: " + c.q); });
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
  if (s.has === "no") { [["linkhub", "social bio link"], ["wa", "WhatsApp link"], ["book", "online booking or ordering"], ["found", "contact found by googling"]].forEach(function (x) { if (!(s.subs || {})[x[0]]) e.push("Answer the row about " + x[1] + ", or tap None of these."); }); return e; }
  if (!domainOf(s.url)) e.push("Type the website address.");
  SA.SITE_CHECKS.forEach(function (c) { if (c.id === "fast" && SA.num(s.perf) != null) return; if (!(s.checks || {})[c.id]) e.push("Answer: " + c.q); });
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
    if (!a.status) { if (!pl.optional) e.push(pl.name + ": choose whether the business is listed."); return; }
    if (a.status === "none") return;
    var sc = SA.num(a.rating); if (sc == null || sc <= 0 || sc > pl.scale) e.push(pl.name + ": enter the rating, a number up to " + pl.scale + ".");
    if (SA.num(a.count) == null) e.push(pl.name + ": enter the number of reviews.");
    if (!a.lastDate) e.push(pl.name + ": enter the date of the newest review."); else if (SA.daysBetween(a.lastDate, now) < 0) e.push(pl.name + ": the newest review date is in the future.");
    var r = SA.num(a.replies); if (r == null || r < 0 || r > 5) e.push(pl.name + ": enter how many of the 5 comments have owner replies (0 to 5).");
    if (!IMG[pl.id]) e.push(pl.name + ": upload a screenshot.");
    var need = Math.min(5, Math.max(1, SA.num(a.count) || 5)), got = 0;
    for (var i = 0; i < 5; i++) { var c = SA.arr(a.comments)[i] || {}; if (c.d && String(c.t || "").trim()) { got++; if (SA.daysBetween(c.d, now) < 0) e.push(pl.name + ": comment " + (i + 1) + " has a future date."); } else if (c.d || String(c.t || "").trim()) e.push(pl.name + ": comment " + (i + 1) + " needs both a date and the text."); }
    if (got < need) e.push(pl.name + ": enter " + need + " recent comments with dates (you have " + got + ").");
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
  return '<button type="button" class="sa-chip sm" data-tg="' + path + "." + key + '" aria-pressed="' + on + '">' + label + "</button>";
}
function uid(prefix) { S.seq = (S.seq || 0) + 1; return prefix + S.seq; }

/* ---------- step 7: target market ---------- */
var BASES = [["demo", "Demographic (age, income, family, job)"], ["geo", "Geographic (country, island, city)"], ["psy", "Psychographic (values, lifestyle, interests)"], ["beh", "Behavioural (how, when and why they buy)"]];
var AXES = [["price", "Price", "Lower price", "Higher price"], ["range", "Offer", "Basic", "Full service"], ["style", "Style", "Traditional", "Modern"], ["local", "Reach", "Local", "International"], ["speed", "Booking", "Slow and manual", "Instant and online"]];
var AXBY = {}; AXES.forEach(function (a) { AXBY[a[0]] = a; });
var CHANNELS = ["Instagram", "Facebook", "TikTok", "YouTube", "WhatsApp", "Viber", "Telegram", "Google search", "Booking sites", "Email", "Blogs and forums", "LinkedIn"];
function ensureTm() {
  if (!S.tm) S.tm = { bases: {}, segs: [], pos: { ax: "price", ay: "range", ux: 50, uy: 50, cx: 50, cy: 50 } };
  while (S.tm.segs.length < 2) S.tm.segs.push({ id: uid("g"), name: "", who: "", size: 3, reach: 3, fit: 3, target: "", why: "", p: { ch: {} } });
}
function segScore(g) { return (+g.size || 0) + (+g.reach || 0) + (+g.fit || 0); }
function viewTm() {
  ensureTm(); var T = S.tm, h = '<h1 class="sa-h">Your target market</h1>' +
    '<p class="sa-lede">Tell the tool who the business should aim at. You describe the segments, rate them, choose your targets and write the positioning. The tool lays your answers out in the report and builds one persona card for each target segment. It does not write them for you, so each box has a pointer on what to think about.</p>';
  h += '<div class="sa-card"><h3>1. Bases of segmentation</h3><p class="sa-tip">Tick the bases you used to split the market into segments. Use at least two.</p><div class="sa-opts">' + BASES.map(function (b) { return mchip("tm.bases", b[0], b[1]); }).join("") + "</div></div>";
  h += '<h2 class="sa-h2">2. Segments</h2><p class="sa-sub">Describe 2 to 4 segments. Rate each one from 1 to 5 on size, how easily you can reach it online and how well the business fits what it wants. Then choose your target segments.</p>';
  T.segs.forEach(function (g, i) {
    var b = "tm.segs." + i, tot = segScore(g);
    h += '<div class="sa-card sa-seg"><h3>Segment ' + (i + 1) + (g.name ? ": " + esc(g.name) : "") + '</h3><div class="sa-grid">' + txt(b + ".name", "Name the segment", { wide: true, ph: "for example families on short domestic trips" }) +
      ta(b + ".who", "Who exactly are they?", "Use the bases you ticked. Give numbers where you can: age range, country or island, income level, what they value, how they book.") +
      "</div><div class=\"sa-sliders\">" + slider(b + ".size", "Size", 1, 5, "Small", "Large", { re: true }) + slider(b + ".reach", "Easy to reach online", 1, 5, "Hard", "Easy", { re: true }) + slider(b + ".fit", "Fit with the business", 1, 5, "Weak", "Strong", { re: true }) + "</div>" +
      '<p class="sa-ms">Score: <b>' + tot + " out of 15</b>. A higher score usually means a better target. You decide.</p>" +
      chips(b + ".target", "Will you target this segment?", [["yes", "Yes, target"], ["no", "No"]], { re: true, sm: true }) +
      (g.target ? '<div class="sa-grid">' + ta(b + ".why", g.target === "yes" ? "Why target it?" : "Why leave it out?", "Point to your scores and to evidence: a statistic, an audit finding, an interview. Cite it in your report.") + "</div>" : "") +
      (T.segs.length > 2 ? '<div style="margin-top:8px"><button type="button" class="sa-btn-s" data-rmseg="' + i + '">Remove this segment</button></div>' : "") + "</div>";
  });
  if (T.segs.length < 4) h += '<div class="sa-actions" style="margin:0 0 24px"><button type="button" class="sa-btn-s" id="saAddSeg">Add another segment</button></div>';
  var P = T.pos, ax = AXBY[P.ax], ay = AXBY[P.ay];
  h += '<h2 class="sa-h2">3. Positioning</h2><p class="sa-sub">Complete the frame in your own words, then place the business and one main competitor on the map.</p><div class="sa-card"><div class="sa-grid">' +
    txt("tm.pos.for", "For (which target segment)", { ph: "your main segment" }) + txt("tm.pos.need", "who need or want", { ph: "the need or problem" }) + txt("tm.pos.cat", "the business is the (category)", { ph: "what kind of offer it is" }) +
    txt("tm.pos.benefit", "that (main benefit)", { ph: "the one benefit that matters most" }) + txt("tm.pos.comp", "Unlike (main competitor)", { ph: "a real competitor" }) + txt("tm.pos.diff", "we (how it is different)", { ph: "the difference" }) +
    txt("tm.pos.proof", "because (the reason to believe it)", { wide: true, ph: "proof: a feature, a result, a review, a credential" }) + "</div>" +
    '<div class="sa-grid"><div class="f"><label for="f_ax">Horizontal axis</label><select id="f_ax" data-p="tm.pos.ax" data-re="1">' + AXES.map(function (a) { return '<option value="' + a[0] + '"' + (P.ax === a[0] ? " selected" : "") + ">" + a[1] + ": " + a[2] + " to " + a[3] + "</option>"; }).join("") + "</select></div>" +
    '<div class="f"><label for="f_ay">Vertical axis</label><select id="f_ay" data-p="tm.pos.ay" data-re="1">' + AXES.map(function (a) { return '<option value="' + a[0] + '"' + (P.ay === a[0] ? " selected" : "") + ">" + a[1] + ": " + a[2] + " to " + a[3] + "</option>"; }).join("") + "</select></div></div>" +
    '<div class="sa-map" aria-hidden="true"><span class="sa-mx">' + ax[2] + '</span><span class="sa-mx r">' + ax[3] + '</span><span class="sa-my t">' + ay[3] + '</span><span class="sa-my b">' + ay[2] + '</span><i class="sa-dot us" style="left:' + P.ux + "%;bottom:" + P.uy + '%">You</i><i class="sa-dot co" style="left:' + P.cx + "%;bottom:" + P.cy + '%">' + esc(P.comp || "Competitor") + "</i></div>" +
    '<div class="sa-sliders">' + slider("tm.pos.ux", "Your business: " + ax[1], 0, 100, ax[2], ax[3], { step: 5, re: true }) + slider("tm.pos.uy", "Your business: " + ay[1], 0, 100, ay[2], ay[3], { step: 5, re: true }) +
    slider("tm.pos.cx", "Competitor: " + ax[1], 0, 100, ax[2], ax[3], { step: 5, re: true }) + slider("tm.pos.cy", "Competitor: " + ay[1], 0, 100, ay[2], ay[3], { step: 5, re: true }) + "</div></div>";
  var tg = T.segs.filter(function (g) { return g.target === "yes"; });
  h += '<h2 class="sa-h2">4. Ideal customer personas</h2>';
  if (!tg.length) h += '<p class="sa-sub">Choose at least one target segment above. You will get one persona card for each.</p>';
  else {
    h += '<p class="sa-sub">One persona for each target segment: a made-up person who stands for the segment. Base every box on evidence you found (interviews, surveys, the audit, published statistics) and say which in the source box.</p>';
    T.segs.forEach(function (g, i) {
      if (g.target !== "yes") return; var b = "tm.segs." + i + ".p";
      if (!g.p) g.p = { ch: {} };
      h += '<div class="sa-card"><h3>Persona for: ' + esc(g.name || "Segment " + (i + 1)) + '</h3><div class="sa-grid">' + txt(b + ".name", "Name") + txt(b + ".age", "Age", { mode: "numeric" }) + txt(b + ".loc", "Where they live") + txt(b + ".job", "Job or role") + "</div><div class=\"sa-grid\">" +
        ta(b + ".goals", "Goals", "What do they want from the business? Think about the outcome, not the product.") + ta(b + ".pain", "Frustrations and fears", "What goes wrong when they look for or buy this today? What makes them hesitate?") +
        ta(b + ".trig", "What makes them buy", "A trigger, a time of year, a price, a review, a recommendation.") + txt(b + ".quote", "A line they might say", { wide: true, hint: "Write it in their voice. It should sound like one real sentence." }) + "</div>" +
        '<fieldset class="sa-fs"><legend>Where do they spend time online?</legend><div class="sa-opts">' + CHANNELS.map(function (c) { return mchip(b + ".ch", c.replace(/ /g, "_"), c); }).join("") + "</div></fieldset>" +
        chips(b + ".src", "Where did you get this from?", [["own", "My own interviews or observation"], ["survey", "A survey I ran"], ["second", "Published data or reports"], ["est", "An informed estimate"]], { sm: true, re: true }) + "</div>";
    });
  }
  return h;
}
function vTm() {
  ensureTm(); var e = [], T = S.tm, nb = Object.keys(T.bases).filter(function (k) { return T.bases[k]; }).length;
  if (nb < 2) e.push("Tick at least two bases of segmentation.");
  T.segs.forEach(function (g, i) {
    var n = "Segment " + (i + 1);
    if (!String(g.name).trim()) e.push(n + ": give it a name.");
    if (words(g.who) < 8) e.push(n + ": describe who they are (at least 8 words).");
    if (!g.target) e.push(n + ": choose whether you will target it.");
    else if (words(g.why) < 8) e.push(n + ": explain the choice (at least 8 words).");
  });
  var tg = T.segs.filter(function (g) { return g.target === "yes"; });
  if (!tg.length) e.push("Choose at least one target segment.");
  var P = T.pos; ["for", "need", "cat", "benefit", "comp", "diff", "proof"].forEach(function (k) { if (!String(P[k] || "").trim()) e.push("Positioning: fill in every box of the frame."); });
  if (P.ax === P.ay) e.push("Positioning: choose two different axes for the map.");
  T.segs.forEach(function (g, i) {
    if (g.target !== "yes") return; var p = g.p || {}, n = "Persona for " + (g.name || "segment " + (i + 1));
    if (!String(p.name || "").trim() || SA.num(p.age) == null) e.push(n + ": add a name and an age.");
    if (words(p.goals) < 4 || words(p.pain) < 4 || words(p.trig) < 4) e.push(n + ": fill in goals, frustrations and what makes them buy.");
    if (!Object.keys(p.ch || {}).some(function (k) { return p.ch[k]; })) e.push(n + ": pick at least one place they spend time online.");
    if (!p.src) e.push(n + ": say where the persona comes from.");
  });
  return e.filter(function (x, i, a) { return a.indexOf(x) === i; });
}

/* ---------- step 8: objectives ---------- */
function ensureObjs() {
  if (!S.objs || !Array.isArray(S.objs)) S.objs = [];
  while (S.objs.length < 3) S.objs.push({ id: uid("o"), text: "", kpi: "", unit: "%", base: "", target: "", deadline: 12, tool: "", freq: "Monthly", q: ["", "", ""], trig: 10, act: "" });
}
function modelStuff() {
  if (!S.model) { var A = SA.audit(S), mo = SA.makeObjectives(A, S), mp = SA.makeStrategies(A, S, mo); S.model = { objs: mo, plan: JSON.parse(JSON.stringify(mp)) }; }
  return S.model;
}
function smart(o) {
  var b = SA.num(o.base), t = SA.num(o.target), ok = function (x) { return x ? "ok" : "no"; };
  var chg = b != null && t != null && b !== 0 ? Math.round((t - b) / Math.abs(b) * 100) : null;
  var m = String(o.kpi || "").trim() && b != null && t != null, a = chg == null ? false : chg > 0 && chg <= 300;
  var h = '<span class="sa-sm ' + ok(words(o.text) >= 8) + '">Specific</span><span class="sa-sm ' + ok(m) + '">Measurable</span><span class="sa-sm ' + ok(a) + '">Achievable</span><span class="sa-sm ' + ok(!!String(o.text || "").trim() && S.plan && S.plan.strats.some(function (s) { return s.on && s.links && s.links[o.id]; })) + '">Realistic (a strategy supports it)</span><span class="sa-sm ok">Time-bound: month ' + (+o.deadline || 12) + "</span>";
  var note = chg == null ? "Enter a baseline and a target to see the change." : "Change from baseline to target: " + (chg > 0 ? "+" : "") + chg + "%." + (chg > 300 ? " That is a very big jump. Be ready to defend it with evidence." : chg <= 0 ? " The target should be better than the baseline." : "");
  return h + '<p class="sa-ms">' + note + "</p>";
}
function objCard(o, i) {
  var cap = "objs." + i;
  return '<div class="sa-obj"><div class="f"><label for="ot' + i + '">Objective ' + (i + 1) + '</label><textarea id="ot' + i + '" data-p="' + cap + '.text" data-sm="' + i + '" placeholder="Write the objective in one or two sentences">' + esc(o.text) + "</textarea>" +
    '<span class="sa-hint">Say what will change, for which platform or channel, by how much and by when. The boxes below hold the numbers.</span></div>' +
    '<div class="sa-grid4"><div><label for="ok' + i + '">KPI (what you will measure)</label><input id="ok' + i + '" data-p="' + cap + '.kpi" data-sm="' + i + '" value="' + esc(o.kpi) + '"></div>' +
    '<div><label for="ou' + i + '">Unit</label><select id="ou' + i + '" data-p="' + cap + '.unit">' + [["%", "%"], ["", "number"], [" MVR", "MVR"], [" points", "score"]].map(function (u) { return '<option value="' + u[0] + '"' + ((o.unit || "") === u[0] ? " selected" : "") + ">" + u[1] + "</option>"; }).join("") + "</select></div>" +
    '<div><label for="ob' + i + '">Baseline now</label><input id="ob' + i + '" data-p="' + cap + '.base" data-sm="' + i + '" inputmode="decimal" value="' + esc(o.base) + '"></div>' +
    '<div><label for="oT' + i + '">Target</label><input id="oT' + i + '" data-p="' + cap + '.target" data-sm="' + i + '" inputmode="decimal" value="' + esc(o.target) + '"></div></div>' +
    '<div class="sa-grid4" style="grid-template-columns:1fr 3fr;margin-top:10px"><div><label for="od' + i + '">Done by month</label><select id="od' + i + '" data-p="' + cap + '.deadline" data-num="1" data-sm="' + i + '">' + [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) { return '<option value="' + m + '"' + (+o.deadline === m ? " selected" : "") + ">" + m + "</option>"; }).join("") + "</select></div><div></div></div>" +
    '<div class="sa-smart" data-smo="' + i + '">' + smart(o) + '</div>' +
    '<div style="margin-top:8px"><button type="button" class="sa-btn-s" data-rm="' + i + '">Remove this objective</button></div></div>';
}
function hintsHtml() {
  var M = modelStuff(), seen = {}, rows = [];
  M.objs.forEach(function (o) { var b = SA.num(o.base); if (b == null || seen[o.kpi]) return; seen[o.kpi] = 1; rows.push("<li>" + esc(o.kpi) + ": <b>" + esc(o.base) + (o.unit === "%" ? "%" : "") + "</b></li>"); });
  var A = SA.audit(S);
  rows.push("<li>Overall digital visibility score: <b>" + A.overall + "/100</b></li>");
  return '<div class="sa-note"><b>Baselines the audit measured.</b> You can use these as starting points, or use the business\'s own figures if you have them (sales, bookings, followers). Say where each baseline came from.<ul class="sa-hl">' + rows.join("") + "</ul></div>";
}
function viewObj() {
  ensureObjs();
  var h = '<h1 class="sa-h">Your objectives</h1><p class="sa-lede">The assignment needs at least three SMART objectives. Write them yourself. The tool checks the numbers and tells you what is missing, but it does not decide your targets.</p>' + hintsHtml();
  h += '<div id="saObjs">' + S.objs.map(objCard).join("") + '</div><div class="sa-actions" style="margin:0 0 24px"><button type="button" class="sa-btn-s" id="saAddObj">Add an objective</button></div>';
  return h;
}
function vObj() {
  ensureObjs(); var e = [];
  if (S.objs.length < 3) e.push("The assignment needs at least 3 objectives.");
  S.objs.forEach(function (o, i) {
    var n = "Objective " + (i + 1);
    if (words(o.text) < 8) e.push(n + ": write it out in at least 8 words.");
    if (!String(o.kpi).trim()) e.push(n + ": name the KPI.");
    var b = SA.num(o.base), t = SA.num(o.target);
    if (b == null) e.push(n + ": enter a baseline number."); if (t == null) e.push(n + ": enter a target number.");
    if (b != null && t != null && t === b) e.push(n + ": the target is the same as the baseline.");
  });
  return e;
}

/* ---------- step 9: strategies, Gantt, budget ---------- */
function ensurePlan() {
  if (S.plan) return;
  var M = modelStuff(), A = SA.audit(S), p = SA.makeStrategies(A, S, M.objs);
  p.strats.forEach(function (s) { s.on = false; s.mine = ""; s.links = {}; s.segl = {}; });
  S.plan = p;
}
function monthSel(path, v, lab) { return '<select data-p="' + path + '" data-num="1" data-bud="1">' + lab.map(function (m) { return '<option value="' + m.i + '"' + (+v === m.i ? " selected" : "") + ">" + m.label + "</option>"; }).join("") + "</select>"; }
function stratCard(s, si) {
  var lab = SA.monthLabels(S.biz.start), lines = S.plan.lines.filter(function (l) { return l.s === s.id; }), b = "plan.strats." + si;
  var h = '<details class="sa-st" data-s="' + s.id + '"' + (s.on ? " open" : "") + '><summary><label class="sa-sw" onclick="event.stopPropagation()"><input type="checkbox" data-p="' + b + '.on" data-bool="1" data-re="1"' + (s.on ? " checked" : "") + ' aria-label="Use ' + esc(s.name) + '"></label><span class="nm">' + esc(s.name) + '</span><span class="amt" data-samt="' + s.id + '"></span></summary><div class="sa-st-b">' +
    '<p class="sa-sub"><b>Audit pointer:</b> ' + esc(s.why) + " <b>Theory to read and cite:</b> " + esc(s.theory) + ".</p>";
  if (s.on) {
    h += '<div class="sa-grid">' + ta(b + ".mine", "Why this strategy, and how will you run it?", "Which segment does it reach? What will you do each month, with which tools and content? Which theory backs it? This is the core of your strategy section.", { rows: 5 }) + "</div>";
    h += '<fieldset class="sa-fs"><legend>Which objectives does it support?</legend><div class="sa-opts">' + S.objs.map(function (o, i) { return '<label class="sa-ck"><input type="checkbox" data-p="' + b + ".links." + o.id + '" data-bool="1" data-sm2="1"' + (s.links && s.links[o.id] ? " checked" : "") + "> Objective " + (i + 1) + "</label>"; }).join("") + "</div></fieldset>";
    h += '<fieldset class="sa-fs"><legend>Which target segments does it reach?</legend><div class="sa-opts">' + S.tm.segs.filter(function (g) { return g.target === "yes"; }).map(function (g) { return '<label class="sa-ck"><input type="checkbox" data-p="' + b + ".segl." + g.id + '" data-bool="1"' + (s.segl && s.segl[g.id] ? " checked" : "") + "> " + esc(g.name || "Segment") + "</label>"; }).join("") + "</div></fieldset>";
    h += '<p class="sa-sub" style="margin-top:12px"><b>Costs.</b> Prices come from the Islandeative price list where there is one, at cost for ad spend, and marked estimates where you need to get quotes. Change the amounts, numbers and months to match your plan.</p>';
    lines.forEach(function (l) {
      var li = S.plan.lines.indexOf(l);
      h += '<div class="sa-ln"><div class="nm">' + esc(l.name) + ' <span class="bs">' + l.basis + "</span></div>" +
        '<div><label>Cost each (MVR)</label><input data-p="plan.lines.' + li + '.unit" data-bud="1" inputmode="decimal" value="' + esc(l.unit) + '"></div>' +
        '<div><label>Number</label><input data-p="plan.lines.' + li + '.qty" data-bud="1" inputmode="decimal" value="' + esc(l.qty) + '"></div>' +
        "<div><label>Start</label>" + monthSel("plan.lines." + li + ".start", l.start, lab) + "</div>" +
        "<div><label>End</label>" + monthSel("plan.lines." + li + ".end", l.end, lab) + "</div>" +
        (l.note ? '<div class="nt">' + esc(l.note) + "</div>" : "") + "</div>";
    });
  }
  return h + "</div></details>";
}
var GC = { web: "#245582", seo: "#2a82bb", content: "#2fa9a9", smads: "#3f9e74", banner: "#1C3F63", email: "#5FA8D3", infl: "#1F7F7F", viral: "#7cc9a6", affil: "#7A93A8" };
function ganttHtml() {
  var lab = SA.monthLabels(S.biz.start), T = SA.TBY[S.biz.type] || SA.TBY.service, h = '<div class="sa-mon"><table class="sa-tbl sa-gt"><tr><th>Activity</th>' + lab.map(function (m) { return "<th>" + m.short + "</th>"; }).join("") + "</tr>", any = false;
  S.plan.strats.forEach(function (s) {
    if (!s.on) return; any = true; h += '<tr class="gs"><td colspan="13" style="color:' + GC[s.id] + '">' + esc(s.name) + "</td></tr>";
    S.plan.lines.filter(function (l) { return l.s === s.id; }).forEach(function (l) {
      var s0 = SA.num(l.start) || 1, e0 = SA.num(l.end) || 12;
      h += "<tr><td>" + esc(l.name.length > 52 ? l.name.slice(0, 50) + "..." : l.name) + "</td>" + lab.map(function (m) { var on = m.i >= s0 && m.i <= e0 && (SA.lineCost(l, m.i, T.season, m.cal) > 0 || l.kind === "monthly"); return '<td class="' + (on ? "on" : "") + '"' + (on ? ' style="background:' + GC[s.id] + '"' : "") + "></td>"; }).join("") + "</tr>";
    });
  });
  return any ? h + "</table></div>" : "<p class=\"sa-ms\">Switch on a strategy to see its activities here.</p>";
}
function budgetHtml() {
  var B = SA.budget(S.plan, S.biz), cap = SA.num(S.biz.cap) || 8000, f = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var h = '<table class="sa-tbl"><tr><th>Strategy</th><th style="text-align:end">12 months (MVR)</th></tr>';
  S.plan.strats.forEach(function (s) { if (s.on && B.byS[s.id]) h += "<tr><td>" + esc(s.name) + '</td><td style="text-align:end">' + f(B.byS[s.id].total) + "</td></tr>"; });
  h += "<tr><td>Contingency (" + B.cp + '%)</td><td style="text-align:end">' + f(B.cont) + '</td></tr><tr><th>Total</th><th style="text-align:end">' + f(B.total) + "</th></tr></table>";
  h += '<p class="sa-ms">About ' + f(B.total / 12) + " MVR a month on average. " + (B.total / 12 > cap ? '<span class="sa-warn">This is above the MVR ' + f(cap) + " a month you said the business could spend. Remove something, or explain in your report why the extra spend pays off.</span>" : "It is within the monthly amount you gave.") + "</p>";
  h += '<div class="sa-mon"><table class="sa-tbl"><tr><th>Month</th>' + B.labels.map(function (m) { return "<th>" + m.short + "</th>"; }).join("") + "</tr><tr><td>Total</td>" + B.monthly.map(function (v, i) { return "<td>" + f(v + B.contM[i]) + "</td>"; }).join("") + "</tr></table></div>";
  return { html: h, B: B };
}
function viewPlan() {
  ensurePlan();
  var h = '<h1 class="sa-h">Strategies, Gantt chart and budget</h1><p class="sa-lede">Choose at least two strategies from the course list. For each one you write why it fits and how you will run it. The tool then costs it, draws the Gantt chart from the months you set and totals the budget.</p>';
  h += '<div class="sa-note">Each strategy shows a pointer from your audit and the theory to read. The tool suggests the cost lines to save you time. Change them to fit your plan and replace the estimates with real quotes.</div>';
  h += S.plan.strats.map(stratCard).join("");
  h += '<div class="sa-card"><h3>Gantt chart</h3><div id="saGantt"></div></div>';
  h += '<div class="sa-card"><h3>Budget</h3><div class="f" style="max-width:260px"><label for="cont">Contingency (% of the total)</label><input id="cont" data-p="plan.cont" data-bud="1" inputmode="numeric" value="' + esc(S.plan.cont) + '"></div><div id="saBud"></div></div>';
  return h;
}
function refreshBudget() {
  if (!S.plan) return;
  var r = budgetHtml(), el = $("saBud"); if (el) el.innerHTML = r.html;
  var g = $("saGantt"); if (g) g.innerHTML = ganttHtml();
  S.plan.strats.forEach(function (s) { var e = document.querySelector('[data-samt="' + s.id + '"]'); if (e) e.textContent = s.on && r.B.byS[s.id] ? "MVR " + Math.round(r.B.byS[s.id].total).toLocaleString("en-US") : "off"; });
}
function vPlan() {
  var e = [], on = S.plan.strats.filter(function (s) { return s.on; });
  if (on.length < 2) e.push("Choose at least 2 strategies.");
  on.forEach(function (s) {
    if (words(s.mine) < 20) e.push(s.name + ": explain why and how in at least 20 words.");
    if (!Object.keys(s.links || {}).some(function (k) { return s.links[k]; })) e.push(s.name + ": tick the objectives it supports.");
    if (!Object.keys(s.segl || {}).some(function (k) { return s.segl[k]; })) e.push(s.name + ": tick the target segments it reaches.");
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
  ensureCtl();
  var h = '<h1 class="sa-h">Control and evaluation</h1><p class="sa-lede">For each objective, say how you will check progress, how often, and what you will do if you fall behind. The tool fills in even quarterly steps between your baseline and target. Change them if progress will not be even (for example, a peak season).</p><datalist id="saSrc">' + SOURCES.map(function (s) { return '<option value="' + s + '">'; }).join("") + "</datalist>";
  S.objs.forEach(function (o, i) {
    var c = "objs." + i;
    h += '<div class="sa-card"><h3>Objective ' + (i + 1) + '</h3><p class="sa-sub">' + esc(o.text) + '</p><p class="sa-ms"><b>KPI:</b> ' + esc(o.kpi) + ". <b>Baseline:</b> " + esc(o.base) + esc(o.unit || "") + ". <b>Target:</b> " + esc(o.target) + esc(o.unit || "") + " by month " + (+o.deadline || 12) + ".</p>" +
      '<div class="sa-grid4" style="grid-template-columns:repeat(4,1fr)">' + [0, 1, 2].map(function (k) { return '<div class="f"><label for="q' + i + k + '">End of Q' + (k + 1) + "</label><input id=\"q" + i + k + '" data-p="' + c + ".q." + k + '" inputmode="decimal" value="' + esc(o.q[k]) + '"></div>'; }).join("") + '<div class="f"><label>Q4 (final target)</label><input value="' + esc(o.target) + '" disabled></div></div>' +
      '<div class="sa-grid"><div class="f"><label for="s' + i + '">Where will you get the numbers?</label><input id="s' + i + '" list="saSrc" data-p="' + c + '.tool" value="' + esc(o.tool) + '"><span class="sa-hint">The tool, report or record that gives you the KPI.</span></div>' +
      '<div class="f"><label for="fq' + i + '">How often will you check?</label><select id="fq' + i + '" data-p="' + c + '.freq">' + ["Weekly", "Fortnightly", "Monthly", "Quarterly"].map(function (x) { return "<option" + (o.freq === x ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select></div></div>" +
      slider(c + ".trig", "Take action if the result is this many % behind the milestone", 5, 30, "5%", "30%", { step: 5 }) +
      '<div class="sa-grid">' + ta(c + ".act", "What will you do if you fall behind?", "Name the first things you would check and change: content, targeting, budget, website, timing. Say who decides and when.") + "</div></div>";
  });
  return h;
}
function vCtl() {
  ensureCtl(); var e = [];
  S.objs.forEach(function (o, i) {
    var n = "Objective " + (i + 1);
    if (!String(o.tool).trim()) e.push(n + ": say where you will get the numbers.");
    for (var k = 0; k < 3; k++) if (SA.num(o.q[k]) == null) e.push(n + ": enter the Q" + (k + 1) + " step as a number.");
    if (words(o.act) < 8) e.push(n + ": say what you will do if you fall behind (at least 8 words).");
  });
  return e.filter(function (x, i, a) { return a.indexOf(x) === i; });
}

/* ---------- step 11: download ---------- */
function viewDone() {
  var A = SA.audit(S), B = SA.budget(S.plan, S.biz), nseg = S.tm.segs.filter(function (g) { return g.target === "yes"; }).length;
  var wg = SA.WRITE_GUIDE.map(function (r) { return "<tr><td><b>" + esc(r[0]) + "</b><br><span class=\"sa-ms\">" + esc(r[2]) + "</span></td><td style=\"text-align:end;white-space:nowrap\">about " + r[1] + "</td></tr>"; }).join("");
  return '<h1 class="sa-h">Download your evidence report</h1><p class="sa-lede">Your PDF holds the audit evidence, your target market, positioning and personas, your objectives, strategies, Gantt chart, budget, and control and evaluation table. The tool structured and costed it. You wrote the thinking.</p>' +
    '<div class="sa-card"><p><b>' + esc(S.biz.name) + "</b>: digital visibility " + A.overall + "/100. " + S.objs.length + " objectives, " + S.plan.strats.filter(function (s) { return s.on; }).length + " strategies, " + nseg + " persona" + (nseg === 1 ? "" : "s") + ", total budget MVR " + Math.round(B.total).toLocaleString("en-US") + '.</p>' +
    '<label class="sa-ck sa-agree"><input type="checkbox" id="saAgree" data-p="agree" data-bool="1"' + (S.agree ? " checked" : "") + "> I understand that when I download, a copy of this PDF and my answers is sent to my lecturer (Muiz Fuad) so the work can be checked for authorship. Nothing else about me is collected.</label>" +
    '<div class="sa-actions"><button type="button" class="btn btn-primary" id="saPdf"' + (S.agree ? "" : " disabled") + '>Download PDF</button><button type="button" class="btn btn-ghost" id="saEdit2">Back to the plan</button><button type="button" class="btn btn-ghost" id="saNew">Start another audit</button></div><p class="sa-ms" id="saPdfMsg" role="status"></p></div>' +
    '<div class="sa-card"><h3>What you still write</h3><p class="sa-sub">The assignment is about 8,000 words. The tool saves you the structuring, costing and charts. These are the parts that need your own writing, with suggested word counts. Use them as a guide, not a rule.</p><table class="sa-tbl"><tr><th>Section</th><th style="text-align:end">Words</th></tr>' + wg + "</table></div>" +
    '<div class="sa-note">Use of AI: your report must state honestly how you used AI, including this tool. The PDF is evidence and structure, and the explanations, justifications, theory and references in your report must be your own work.</div>';
}

/* ---------- screens, navigation ---------- */
var VIEW = [viewBiz, viewSocial, viewGbp, viewSite, viewRep, viewResults, viewTm, viewObj, viewPlan, viewCtl, viewDone];
var VALID = [vBiz, vSocial, vGbp, vSite, vRep, function () { return []; }, vTm, vObj, vPlan, vCtl, function () { return []; }];
function stepsSkip(i, dir) { return i; }

function render(keepScroll) {
  var i = S.step; $("saStep").innerHTML = VIEW[i]();
  $("saBar").style.transform = "scaleX(" + ((i + 1) / STEPS.length) + ")";
  $("saStepNo").textContent = "Step " + (i + 1) + " of " + STEPS.length + ": " + STEPS[i];
  $("saPrev").style.visibility = i === 0 ? "hidden" : "visible";
  $("saNext").textContent = i === 5 ? "Start building my plan" : i === 9 ? "Continue to download" : "Next";
  $("saNav").hidden = i === 10;
  $("saErr").innerHTML = "";
  if (i === 8) refreshBudget();
  if (!keepScroll) { window.scrollTo({ top: 0 }); $("saStep").focus({ preventScroll: true }); }
  save();
}
function go(n) { S.step = Math.max(0, Math.min(STEPS.length - 1, n)); render(); }
function showErr(e) { $("saErr").innerHTML = e.slice(0, 8).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + (e.length > 8 ? "<li>And " + (e.length - 8) + " more.</li>" : ""); }
$("saNext").addEventListener("click", function () {
  var e = VALID[S.step](); if (e.length) { showErr(e); return; }
  if (S.step === 5) { S.plan = null; S.model = null; }
  go(S.step + 1);
});
$("saPrev").addEventListener("click", function () { go(S.step - 1); });

/* generic input handling */
document.addEventListener("click", function (ev) {
  var t = ev.target.closest("button"); if (!t) return;
  if (t.dataset.p === "biz.group") { var gv = t.dataset.v; S.biz.group = gv; var tt = SA.TBY[S.biz.type]; if (gv !== "travel") S.biz.type = gv; else if (!tt || tt.group !== "travel") S.biz.type = ""; S.model = null; S.plan = null; render(true); return; }
  if (t.id === "saNone") { S.site.subs = { linkhub: "n", wa: "n", book: "n", found: "n" }; render(true); return; }
  if (t.dataset.p && t.dataset.v !== undefined) { setp(t.dataset.p, t.dataset.v); if (t.dataset.p === "biz.type" || t.dataset.p === "biz.onLocation") { S.model = null; S.plan = null; } if (t.dataset.p === "site.has") S.site.has = t.dataset.v; render(true); return; }
  if (t.id === "saEdit") { go(0); return; }
  if (t.dataset.tg) { var tp = t.dataset.tg; setp(tp, !getp(tp)); render(true); return; }
  if (t.id === "saAddSeg") { ensureTm(); S.tm.segs.push({ id: uid("g"), name: "", who: "", size: 3, reach: 3, fit: 3, target: "", why: "", p: { ch: {} } }); render(true); return; }
  if (t.dataset.rmseg !== undefined) { S.tm.segs.splice(+t.dataset.rmseg, 1); render(true); return; }
  if (t.id === "saEdit2") { go(8); return; }
  if (t.id === "saAddObj") { S.objs.push({ id: uid("o"), text: "", kpi: "", unit: "%", base: "", target: "", deadline: 12, tool: "", freq: "Monthly", q: ["", "", ""], trig: 10, act: "" }); render(true); return; }
  if (t.dataset.rm !== undefined) { if (S.objs.length <= 3 && !confirm("The assignment needs at least 3 objectives. Remove this one anyway?")) return; S.objs.splice(+t.dataset.rm, 1); render(true); return; }
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

/* PDF and the copy for the lecturer */
var COPY_URL = window.SA_COPY_URL || "https://script.google.com/macros/s/AKfycbzpXGVOhzHwtc9kz0xs4XgmtL-ZMFoI0oJwjf0a5Gv8GdDmCTe8xqatUFhcKrQOyMkaYQ/exec";
function sha(str) {
  if (!window.crypto || !crypto.subtle) return Promise.resolve("");
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }, function () { return ""; });
}
function planText(objs, plan, biz) {
  var B = SA.budget(plan, biz), L = [];
  objs.forEach(function (o, i) { L.push("Objective " + (i + 1) + ": " + o.text + " | KPI " + o.kpi + " | baseline " + o.base + " | target " + o.target + " | month " + o.deadline); });
  plan.strats.filter(function (s) { return s.on; }).forEach(function (s) { L.push("Strategy: " + s.name + " (MVR " + Math.round((B.byS[s.id] || { total: 0 }).total).toLocaleString("en-US") + ")" + (s.mine ? " | student's reasoning: " + s.mine : " | " + s.why)); });
  L.push("Total budget MVR " + Math.round(B.total).toLocaleString("en-US"));
  return L.join("\n");
}
function sendCopy(res, code, A) {
  if (!COPY_URL) return Promise.resolve("not-set");
  var M = modelStuff(), uri = res.doc.output("datauristring"), b64 = uri.slice(uri.indexOf("base64,") + 7);
  var tm = S.tm.segs.map(function (g) { return g.name + " [" + (g.target === "yes" ? "target" : "not target") + "]: " + g.who; }).join("\n");
  var body = { student: S.biz.student, sid: S.biz.sid, email: S.biz.email, business: S.biz.name, type: S.biz.type, checked: S.biz.checked, score: A.overall, code: code, pdfName: res.name, pages: res.pages,
    studentPlan: planText(S.objs, S.plan, S.biz), modelPlan: planText(M.objs, M.plan, S.biz), segments: tm, positioning: S.tm.pos, answers: JSON.stringify(S), pdf: b64 };
  return fetch(COPY_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).then(function () { return "sent"; }, function () { return "failed"; });
}
function makeIt() {
  var msg = $("saPdfMsg"); if (!S.agree) { msg.textContent = "Tick the box first."; return; }
  msg.textContent = "Building your PDF...";
  var A = SA.audit(S);
  sha(JSON.stringify([S.biz, S.objs, S.tm, S.plan && S.plan.strats, S.checked])).then(function (h) {
    var code = (h || String(Date.now())).slice(0, 10).toUpperCase(), S2 = JSON.parse(JSON.stringify(S)); S2.code = code;
    return window.SA_PDF(S2, IMG).then(function (res) {
      msg.textContent = "Done. Your PDF is " + res.pages + " pages. Check your downloads. Sending the copy to your lecturer...";
      return sendCopy(res, code, A).then(function (st) {
        msg.textContent = "Done. Your PDF is " + res.pages + " pages. Check your downloads. " + (st === "sent" ? "A copy was sent to your lecturer. Submission code " + code + "." : "The copy to your lecturer could not be sent. Email the PDF to your lecturer yourself. Submission code " + code + ".");
      });
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
if (load()) { if (S.biz.sid && ME.sid && S.biz.sid !== ME.sid) { S = blank(); } stamp(S); if (S.step > 5) S.step = 5; if (S.objs && !Array.isArray(S.objs)) S.objs = null; if (S.step === 4 && S.biz.type && (SA.TBY[S.biz.type] || {}).travel) { /* screenshots are not saved: asked again at validation */ } }
render();
})();
