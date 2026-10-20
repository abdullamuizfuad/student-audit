/* Islandeative Student Audit: screens. Nothing is sent anywhere. State stays in this page (text answers are also kept in this browser as a draft). */
(function () {
"use strict";
var SA = window.SA, $ = function (id) { return document.getElementById(id); };
var DRAFT = "ia-student-audit-v2";
var STEPS = ["About the business", "Social media", "Google Business Profile", "Website", "Reviews and prices", "Your audit results", "Your 12-month plan", "Download"];

function blank() {
  var d = new Date(), m = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { step: 0, biz: { name: "", student: "", sid: "", type: "", onLocation: "", checked: SA.ymd(d), start: m.getFullYear() + "-" + ("0" + (m.getMonth() + 1)).slice(-2), cap: "" },
    social: {}, gbp: { status: "", checks: {} }, site: { has: "", checks: {}, subs: {} }, rep: {}, plan: null, objs: null };
}
var S = blank(), IMG = {}; // IMG holds screenshots in memory only

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
    '<p class="sa-lede">You will check the business\'s social media, Google profile, website and reviews, using only what anyone can see in public. The tool scores each part by fixed rules, then drafts a 12-month plan that you edit before you download the PDF.</p>' +
    '<div class="sa-note">Look at the real accounts while you answer, on a phone if you can. Pick "the business does not have it" when something is missing. That counts as a zero and shows up as a gap. Do not guess: choose "Can\'t tell" and the question is left out of the score.</div>' +
    '<div class="sa-card"><h3>You</h3><div class="sa-grid">' + txt("biz.student", "Your name") + txt("biz.sid", "Student ID", { opt: true }) + "</div></div>" +
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

/* ---------- step 7 plan ---------- */
function ensurePlan() {
  if (S.objs && S.plan) return;
  var A = SA.audit(S); S.objs = SA.makeObjectives(A, S); S.plan = SA.makeStrategies(A, S, S.objs);
}
function objCard(o, i) {
  var h = '<div class="sa-obj" data-o="' + i + '"><div class="f"><label for="ot' + i + '">Objective ' + (i + 1) + " (SMART: specific, measurable, achievable, realistic, with a deadline)</label><textarea id=\"ot" + i + '" data-p="objs.' + i + '.text">' + esc(o.text) + "</textarea></div>" +
    '<div class="sa-grid4"><div><label for="ok' + i + '">KPI (what you will measure)</label><input id="ok' + i + '" data-p="objs.' + i + '.kpi" value="' + esc(o.kpi) + '"></div>' +
    '<div><label for="ob' + i + '">Baseline now</label><input id="ob' + i + '" data-p="objs.' + i + '.base" inputmode="decimal" value="' + esc(o.base == null ? "" : o.base) + '"' + (o.base == null ? ' placeholder="enter"' : "") + "></div>" +
    '<div><label for="oT' + i + '">Target</label><input id="oT' + i + '" data-p="objs.' + i + '.target" inputmode="decimal" value="' + esc(o.target == null ? "" : o.target) + '"' + (o.target == null ? ' placeholder="enter"' : "") + "></div>" +
    '<div><label for="od' + i + '">Done by month</label><select id="od' + i + '" data-p="objs.' + i + '.deadline" data-num="1">' + [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) { return '<option value="' + m + '"' + (+o.deadline === m ? " selected" : "") + ">" + m + "</option>"; }).join("") + "</select></div></div>" +
    (o.baseNote ? '<p class="sa-ms">' + esc(o.baseNote) + "</p>" : "") + '<p class="sa-ms" data-ms="' + i + '">Quarterly milestones: ' + SA.milestones(o).join("  |  ") + '</p><div style="margin-top:8px"><button type="button" class="sa-btn-s" data-rm="' + i + '">Remove this objective</button></div></div>';
  return h;
}
function monthSel(path, v, lab) { return '<select data-p="' + path + '" data-num="1">' + lab.map(function (m) { return '<option value="' + m.i + '"' + (+v === m.i ? " selected" : "") + ">" + m.label + "</option>"; }).join("") + "</select>"; }
function stratCard(s, si) {
  var lab = SA.monthLabels(S.biz.start), lines = S.plan.lines.filter(function (l) { return l.s === s.id; });
  var h = '<details class="sa-st" data-s="' + s.id + '"' + (s.on ? " open" : "") + '><summary><label class="sa-sw" onclick="event.stopPropagation()"><input type="checkbox" data-p="plan.strats.' + si + '.on" data-bool="1" data-bud="1"' + (s.on ? " checked" : "") + ' aria-label="Include ' + esc(s.name) + '"></label><span class="nm">' + esc(s.name) + '</span><span class="amt" data-samt="' + s.id + '"></span></summary><div class="sa-st-b">' +
    '<p class="sa-sub">' + esc(s.why) + (s.theory ? " Theory to read and cite: " + esc(s.theory) + "." : "") + "</p>";
  lines.forEach(function (l) {
    var li = S.plan.lines.indexOf(l);
    h += '<div class="sa-ln"><div class="nm">' + esc(l.name) + ' <span class="bs">' + l.basis + "</span></div>" +
      '<div><label>Cost each (MVR)</label><input data-p="plan.lines.' + li + '.unit" data-bud="1" inputmode="decimal" value="' + esc(l.unit) + '"></div>' +
      '<div><label>Number</label><input data-p="plan.lines.' + li + '.qty" data-bud="1" inputmode="decimal" value="' + esc(l.qty) + '"></div>' +
      '<div><label>Start</label>' + monthSel("plan.lines." + li + ".start", l.start, lab).replace("<select", "<select data-bud=\"1\"") + "</div>" +
      '<div><label>End</label>' + monthSel("plan.lines." + li + ".end", l.end, lab).replace("<select", "<select data-bud=\"1\"") + "</div>" +
      (l.note ? '<div class="nt">' + esc(l.note) + "</div>" : "") + "</div>";
  });
  return h + "</div></details>";
}
function budgetHtml() {
  var B = SA.budget(S.plan, S.biz), cap = SA.num(S.biz.cap) || 8000, f = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var h = '<table class="sa-tbl"><tr><th>Strategy</th><th style="text-align:end">12 months (MVR)</th></tr>';
  S.plan.strats.forEach(function (s) { if (s.on && B.byS[s.id]) h += "<tr><td>" + esc(s.name) + '</td><td style="text-align:end">' + f(B.byS[s.id].total) + "</td></tr>"; });
  h += "<tr><td>Contingency (" + B.cp + '%)</td><td style="text-align:end">' + f(B.cont) + '</td></tr><tr><th>Total</th><th style="text-align:end">' + f(B.total) + "</th></tr></table>";
  h += '<p class="sa-ms">About ' + f(B.total / 12) + " MVR a month on average. " + (B.total / 12 > cap ? '<span class="sa-warn">This is above the MVR ' + f(cap) + ' a month you said the business could spend. Remove something, or explain in your report why the extra spend pays off.</span>' : "It is within the monthly amount you gave.") + "</p>";
  h += '<div class="sa-mon"><table class="sa-tbl"><tr><th>Month</th>' + B.labels.map(function (m) { return "<th>" + m.short + "</th>"; }).join("") + "</tr><tr><td>Total</td>" + B.monthly.map(function (v, i) { return "<td>" + f(v + B.contM[i]) + "</td>"; }).join("") + "</tr></table></div>";
  return { html: h, B: B };
}
function viewPlan() {
  ensurePlan();
  var h = '<h1 class="sa-h">Your 12-month plan</h1><p class="sa-lede">This is a model-generated draft based on the audit. It suggests objectives, strategies and costs. Your marks come from what you decide: change the targets, remove what does not fit, and justify your choices in your report.</p>';
  h += '<div class="sa-note">The assignment asks for at least 3 SMART objectives, at least 2 strategies from the course list, a Gantt chart, a budget with contingency and a control and evaluation plan. The PDF includes a starting point for each. The situational analysis (SWOT, PESTEL, competitors, target market) stays your own work.</div>';
  h += "<h2 style=\"font-size:1.5rem;margin:0 0 10px\">Objectives</h2><div id=\"saObjs\">" + S.objs.map(objCard).join("") + '</div><div class="sa-actions" style="margin:0 0 24px"><button type="button" class="sa-btn-s" id="saAddObj">Add my own objective</button></div>';
  h += "<h2 style=\"font-size:1.5rem;margin:0 0 10px\">Strategies and costs</h2><p class=\"sa-sub\">Tick the strategies you will use. Costs use the Islandeative price list where one exists, ad spend at cost, and clearly marked estimates where you should get quotes. Peak season (November to April) carries heavier ad spend for tourism businesses.</p>";
  h += S.plan.strats.map(stratCard).join("");
  h += '<div class="sa-card"><h3>Budget</h3><div class="f" style="max-width:260px"><label for="cont">Contingency (% of the total)</label><input id="cont" data-p="plan.cont" data-bud="1" inputmode="numeric" value="' + esc(S.plan.cont) + '"></div><div id="saBud"></div></div>';
  return h;
}
function refreshBudget() {
  if (!S.plan) return;
  var r = budgetHtml(), el = $("saBud"); if (el) el.innerHTML = r.html;
  S.plan.strats.forEach(function (s) { var e = document.querySelector('[data-samt="' + s.id + '"]'); if (e) e.textContent = s.on && r.B.byS[s.id] ? "MVR " + Math.round(r.B.byS[s.id].total).toLocaleString("en-US") : "off"; });
}
function vPlan() {
  var e = [], on = S.plan.strats.filter(function (s) { return s.on; });
  if (S.objs.length < 3) e.push("The assignment needs at least 3 objectives. Add one.");
  S.objs.forEach(function (o, i) { if (!String(o.text).trim()) e.push("Objective " + (i + 1) + " is empty."); });
  if (on.length < 2) e.push("Choose at least 2 strategies.");
  return e;
}

/* ---------- step 8 ---------- */
function viewDone() {
  var A = SA.audit(S), B = SA.budget(S.plan, S.biz);
  return '<h1 class="sa-h">Download your report</h1><p class="sa-lede">Your PDF has the audit, your edited objectives, strategies, a Gantt chart, the budget, a control and evaluation table, and an evidence appendix with your screenshots and comments.</p>' +
    '<div class="sa-card"><p><b>' + esc(S.biz.name) + "</b>: digital visibility " + A.overall + "/100. " + S.objs.length + " objectives, " + S.plan.strats.filter(function (s) { return s.on; }).length + " strategies, total budget MVR " + Math.round(B.total).toLocaleString("en-US") + '.</p><div class="sa-actions"><button type="button" class="btn btn-primary" id="saPdf">Download PDF</button><button type="button" class="btn btn-ghost" id="saEdit2">Back to the plan</button><button type="button" class="btn btn-ghost" id="saNew">Start another audit</button></div><p class="sa-ms" id="saPdfMsg" role="status"></p></div>' +
    '<div class="sa-note">The PDF is labelled a model-generated draft based on the audit. Use it as evidence of your audit and as a starting point. Write your own analysis, justify every choice with theory and references, and replace estimates with real quotes.</div>';
}

/* ---------- screens, navigation ---------- */
var VIEW = [viewBiz, viewSocial, viewGbp, viewSite, viewRep, viewResults, viewPlan, viewDone];
var VALID = [vBiz, vSocial, vGbp, vSite, vRep, function () { return []; }, vPlan, function () { return []; }];
function stepsSkip(i, dir) { return i; }

function render(keepScroll) {
  var i = S.step; $("saStep").innerHTML = VIEW[i]();
  $("saBar").style.transform = "scaleX(" + ((i + 1) / STEPS.length) + ")";
  $("saStepNo").textContent = "Step " + (i + 1) + " of " + STEPS.length + ": " + STEPS[i];
  $("saPrev").style.visibility = i === 0 ? "hidden" : "visible";
  $("saNext").textContent = i === 5 ? "Build my draft plan" : i === 6 ? "Continue to download" : "Next";
  $("saNav").hidden = i === 7;
  $("saErr").innerHTML = "";
  if (i === 6) refreshBudget();
  if (!keepScroll) { window.scrollTo({ top: 0 }); $("saStep").focus({ preventScroll: true }); }
  save();
}
function go(n) { S.step = Math.max(0, Math.min(STEPS.length - 1, n)); render(); }
function showErr(e) { $("saErr").innerHTML = e.slice(0, 8).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + (e.length > 8 ? "<li>And " + (e.length - 8) + " more.</li>" : ""); }
$("saNext").addEventListener("click", function () {
  var e = VALID[S.step](); if (e.length) { showErr(e); return; }
  if (S.step === 5) { S.objs = null; S.plan = null; }
  go(S.step + 1);
});
$("saPrev").addEventListener("click", function () { go(S.step - 1); });

/* generic input handling */
document.addEventListener("click", function (ev) {
  var t = ev.target.closest("button"); if (!t) return;
  if (t.dataset.p === "biz.group") { var gv = t.dataset.v; S.biz.group = gv; var tt = SA.TBY[S.biz.type]; if (gv !== "travel") S.biz.type = gv; else if (!tt || tt.group !== "travel") S.biz.type = ""; S.objs = null; S.plan = null; render(true); return; }
  if (t.id === "saNone") { S.site.subs = { linkhub: "n", wa: "n", book: "n", found: "n" }; render(true); return; }
  if (t.dataset.p && t.dataset.v !== undefined) { setp(t.dataset.p, t.dataset.v); if (t.dataset.p === "biz.type" || t.dataset.p === "biz.onLocation") { S.objs = null; S.plan = null; } if (t.dataset.p === "site.has") S.site.has = t.dataset.v; render(true); return; }
  if (t.id === "saEdit") { go(0); return; }
  if (t.id === "saEdit2") { go(6); return; }
  if (t.id === "saAddObj") { S.objs.push({ id: "o" + (S.objs.length + 1), area: "own", text: "", kpi: "", unit: "", base: null, target: null, deadline: 12, tool: "Your own records", freq: "Monthly", why: "" }); render(true); return; }
  if (t.dataset.rm !== undefined) { S.objs.splice(+t.dataset.rm, 1); render(true); return; }
  if (t.id === "saPdf") { makeIt(); return; }
  if (t.id === "saNew") { if (confirm("Start another audit? Your current answers will be cleared from this page.")) { S = blank(); IMG = {}; try { localStorage.removeItem(DRAFT); } catch (e) {} render(); } }
});
function onChange(ev) {
  var t = ev.target;
  if (t.dataset && t.dataset.shot) { shot(t); return; }
  if (!t.dataset || !t.dataset.p || t.tagName === "BUTTON") return;
  var v = t.dataset.bool ? t.checked : t.value;
  if (t.dataset.re) { setp(t.dataset.p, v); render(true); save(); return; }
  if (t.dataset.num) v = +v;
  setp(t.dataset.p, v);
  if (t.dataset.p.indexOf("objs.") === 0) {
    if (t.dataset.p.split(".")[2] === "base" || t.dataset.p.split(".")[2] === "target") { var i = +t.dataset.p.split(".")[1], o = S.objs[i]; o.base = o.base === "" ? null : o.base; o.target = o.target === "" ? null : o.target; }
    var m = document.querySelector('[data-ms="' + t.dataset.p.split(".")[1] + '"]'); if (m) m.textContent = "Quarterly milestones: " + SA.milestones(S.objs[+t.dataset.p.split(".")[1]]).join("  |  ");
  }
  if (t.dataset.bud) {
    if (t.dataset.p.indexOf("plan.strats") === 0) { var det = t.closest("details"); if (det) det.open = t.checked; }
    refreshBudget();
  }
  if (t.dataset.p === "site.url" || t.dataset.p === "biz.name") { /* links update on next render */ }
  save();
}
document.addEventListener("input", function (ev) { if (ev.target.dataset && ev.target.dataset.p && ev.target.tagName !== "SELECT" && ev.target.type !== "checkbox") onChange(ev); });
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

/* PDF */
function makeIt() {
  var msg = $("saPdfMsg"); msg.textContent = "Building your PDF...";
  window.SA_PDF(S, IMG).then(function (res) { msg.textContent = "Done. Your PDF is " + res.pages + " pages. Check your downloads."; }).catch(function (e) { msg.textContent = "The PDF could not be made: " + (e && e.message ? e.message : e); if (window.console) console.warn(e); });
}

$("saTheme").addEventListener("click", function () {
  var d = document.documentElement, dark = d.dataset.theme !== "dark";
  if (dark) d.dataset.theme = "dark"; else delete d.dataset.theme;
  try { localStorage.setItem("ia-theme", dark ? "dark" : "light"); } catch (e) {}
});
$("saYr").textContent = new Date().getFullYear();
window.SA_STATE = function () { return S; };
window.SA_SET = function (st, img) { S = st; IMG = img || {}; render(); };
if (load()) { if (S.step > 5) S.step = 5; if (S.step === 4 && S.biz.type && (SA.TBY[S.biz.type] || {}).travel) { /* screenshots are not saved: asked again at validation */ } }
render();
})();
