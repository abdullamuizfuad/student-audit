/* Islandeative Student Audit: scoring and plan rules. Pure functions, no DOM, no network.
   Everything here is rule based. Same answers always give the same scores and the same draft plan. */
(function (G) {
"use strict";

var PLATS = [
  { id: "instagram", name: "Instagram", core: true, er: 0.48, posts: 16 },
  { id: "facebook", name: "Facebook", core: true, er: 0.15, posts: 12 },
  { id: "tiktok", name: "TikTok", core: true, er: 3.7, posts: 12 },
  { id: "youtube", name: "YouTube", core: false, er: 1.3, posts: 4 },
  { id: "linkedin", name: "LinkedIn", core: false, er: 1.0, posts: 8 }
];
var PBY = {}; PLATS.forEach(function (p) { PBY[p.id] = p; });

var TYPES = [
  { id: "stay", name: "Hotel, guesthouse or resort", group: "travel", travel: true, season: true },
  { id: "dive", name: "Dive centre", group: "travel", travel: true, season: true },
  { id: "tours", name: "Tour operator or activity provider", group: "travel", travel: true, season: true },
  { id: "food", name: "Restaurant, cafe or food business", group: "food", travel: false, season: false },
  { id: "retail", name: "Shop or online seller", group: "retail", travel: false, season: false },
  { id: "service", name: "Other service business", group: "service", travel: false, season: false }
];
var TBY = {}; TYPES.forEach(function (t) { TBY[t.id] = t; });

/* ---------- small helpers ---------- */
function arr(o) { if (Array.isArray(o)) return o; if (!o) return []; return Object.keys(o).sort(function (a, b) { return a - b; }).map(function (k) { return o[k]; }); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(/,/g, "")); return isFinite(n) ? n : null; }
function cls(x) { return x >= 75 ? "good" : x >= 50 ? "warn" : "bad"; }
function band(r) { return r >= 1 ? 1 : r >= 0.6 ? 0.68 : r >= 0.3 ? 0.36 : r > 0 ? 0.16 : 0; }
function mvr(n) { return "MVR " + Math.round(n).toLocaleString("en-US"); }
function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function daysBetween(iso, nowIso) {
  if (!iso) return null;
  var a = new Date(iso + "T00:00:00"), b = new Date((nowIso || ymd(new Date())) + "T00:00:00");
  if (isNaN(a)) return null;
  return Math.round((b - a) / 864e5);
}
/* tally: items = [{w, v}], v in 0..1 or null (can't tell: left out of the sum). Returns {score, known, total} */
function tally(items) {
  var got = 0, wsum = 0, all = 0;
  items.forEach(function (i) { all += i.w; if (i.v != null) { got += i.w * i.v; wsum += i.w; } });
  return { score: wsum ? Math.round(100 * got / wsum) : null, known: wsum, total: all };
}
/* Students pick a band instead of counting days or posts. The bands carry the same weight as the old numbers. */
var LAST_BANDS = [["d1", "Today or yesterday", 1], ["w1", "This week", 5], ["w2", "1 to 2 weeks ago", 11], ["w4", "3 to 4 weeks ago", 25], ["m3", "1 to 3 months ago", 60], ["m12", "3 to 12 months ago", 200], ["y1", "More than a year ago", 500], ["never", "Never posted", null]];
var FREQ_BANDS = [["w1", "Within a week", 16], ["w2", "Within 2 weeks", 8], ["m1", "Within a month", 4], ["m3", "Within 3 months", 1.5], ["old", "Older than 3 months, or fewer than 3 posts in 2026", 0.3]];
function bandVal(list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i][2]; return undefined; }
var CBANDS = [["c0", "Fewer than 5", 2], ["c1", "5 to 10", 7], ["c2", "11 to 20", 15], ["c3", "More than 20", 25]];
function engCount(a) { var n = 0; [1, 2, 3].forEach(function (i) { var p = (a.eng || {})[i] || {}; if (num(p.l) != null && bandVal(CBANDS, p.c) !== undefined) n++; }); return n; }
function engAvg(a) {
  if (a.likesHidden) return null;
  var v = [];
  [1, 2, 3].forEach(function (i) { var p = (a.eng || {})[i] || {}, l = num(p.l), cb = bandVal(CBANDS, p.c); if (l != null && cb !== undefined) v.push(l + cb); });
  return v.length >= (a.fewPosts ? 1 : 2) ? v.reduce(function (x, y) { return x + y; }, 0) / v.length : null;
}
var YN = { y: 1, p: 0.5, n: 0, u: null };

/* ---------- social ---------- */
function scoreSocial(s, now) {
  var out = { plats: [], score: 0, missing: [], core: 0 };
  var coreSum = 0, extraSum = 0;
  PLATS.forEach(function (p) {
    var a = (s && s[p.id]) || {}, r = { id: p.id, name: p.name, core: p.core, status: a.status || "", score: 0, parts: [], notes: [] };
    if (a.status === "none") {
      r.missing = true; r.score = 0; r.notes.push("The business does not have a " + p.name + " account. Counts as zero."); out.missing.push(p.id);
    } else if (a.status === "active" || a.status === "dormant") {
      var f = num(a.followers) || 0, never = a.lastBand === "never";
      var last = never ? null : bandVal(LAST_BANDS, a.lastBand), posts = never ? 0 : (a.status === "dormant" ? 0 : bandVal(FREQ_BANDS, a.freqBand)), inter = never ? null : engAvg(a);
      if (last === undefined) last = null; if (posts === undefined) posts = null;
      var er = f > 0 && inter != null ? inter / f * 100 : null;
      r.followers = f; r.er = er; r.posts = posts; r.last = last;
      var items = [
        { w: 35, v: er == null ? null : band(er / p.er) },
        { w: 25, v: posts == null ? null : clamp(posts / p.posts, 0, 1) },
        { w: 15, v: never ? 0 : last == null ? null : last <= 7 ? 1 : last <= 14 ? 0.8 : last <= 30 ? 0.53 : last <= 90 ? 0.2 : 0 },
        { w: 15, v: YN[a.bio] === undefined ? null : YN[a.bio] },
        { w: 10, v: YN[a.link] === undefined ? null : YN[a.link] }
      ];
      if (a.status === "dormant") { items[1].v = 0; items[2].v = last == null ? 0 : Math.min(items[2].v, 0.2); }
      var t = tally(items); r.score = t.score == null ? 0 : t.score; r.conf = t.known / t.total;
      if (er != null && er / p.er < 0.6) r.notes.push("Engagement " + er.toFixed(2) + "% of followers per post, benchmark about " + p.er + "%.");
      if (posts != null && posts < p.posts * 0.6) r.notes.push("Posts about " + (posts < 1 ? "less than once" : Math.round(posts) + " times") + " a month, healthy is about " + p.posts + ".");
      if (never) r.notes.push("The account has never posted."); else if (last != null && last > 30) r.notes.push("Last post " + (a.lastBand === "y1" ? "more than a year ago" : last > 150 ? "3 to 12 months ago" : "1 to 3 months ago") + ".");
      if (a.bio === "n" || a.bio === "p") r.notes.push("Profile bio is incomplete.");
      if (a.link === "n") r.notes.push("No working link or contact button.");
      if (a.status === "dormant") r.notes.push("Account exists but is not being used.");
      r.er_ratio = er == null ? null : er / p.er;
    } else {
      r.unanswered = true;
    }
    out.plats.push(r);
    if (p.core) { coreSum += r.score; out.core++; } else if (r.status && r.status !== "none") extraSum += r.score;
  });
  var base = coreSum / 3, bonus = Math.min(8, Math.round(extraSum * 0.1));
  out.score = clamp(Math.round(base + bonus), 0, 100);
  out.bonus = bonus;
  return out;
}

/* ---------- Google Business Profile ---------- */
var GBP_CHECKS = [
  { id: "claimed", w: 3, q: "The profile is claimed and verified by the owner (it shows no 'Claim this business' link).", tip: "Search the business name on Google. If you see 'Claim this business', it is not claimed." },
  { id: "hours", w: 2, q: "Opening hours are shown and look correct.", tip: "Compare with the door sign or the business's own posts." },
  { id: "contact", w: 2, q: "A phone number or WhatsApp contact is shown.", tip: "Look under the name on the profile." },
  { id: "web", w: 2, q: "A website or booking link is shown.", tip: "Click it. Does it work and open the right page?" },
  { id: "cats", w: 1, q: "The main category fits the business, for example 'Guest house' or 'Dive shop'.", tip: "The category is shown under the business name." },
  { id: "photos", w: 2, q: "At least 10 good photos, and not only photos added by customers.", tip: "Open the Photos tab and look at 'By owner'." },
  { id: "fresh", w: 1, q: "The owner added a photo or update in the last 90 days.", tip: "Look at the dates in 'Updates' or the photo dates." },
  { id: "about", w: 1, q: "A written description of the business is shown.", tip: "Scroll to the 'About' section." },
  { id: "book", w: 1, q: "A booking, ordering or message button is available.", tip: "Look for 'Reserve', 'Order' or 'Message'." }
];
function scoreGbp(g) {
  var st = g && g.status;
  if (st === "na") return { score: null, na: true, notes: ["No customer-facing location, so a map listing is not needed."], status: st };
  if (st === "none") return { score: 0, missing: true, status: st, notes: ["No Google Business Profile or map listing for a business that serves customers on location. Counts as zero."] };
  if (st !== "yes" && st !== "unclaimed") return { score: 0, unanswered: true, status: st, notes: [] };
  var items = GBP_CHECKS.map(function (c) {
    var v = (g.checks || {})[c.id];
    if (c.id === "claimed" && st === "unclaimed") v = "n";
    return { w: c.w, v: YN[v] === undefined ? null : YN[v], c: c };
  });
  var t = tally(items), notes = [];
  items.forEach(function (i) { if (i.v === 0) notes.push("Missing: " + i.c.q.replace(/\.$/, "").toLowerCase()); else if (i.v === 0.5) notes.push("Partly: " + i.c.q.replace(/\.$/, "").toLowerCase()); });
  return { score: t.score == null ? 0 : t.score, status: st, notes: notes, items: items, conf: t.known / t.total };
}

/* ---------- website ---------- */
var SITE_GROUPS = [
  { id: "basics", name: "Basics and function", w: 35 },
  { id: "seo", name: "Search engine optimisation (SEO)", w: 25 },
  { id: "geo", name: "Answer engines and AI search (GEO)", w: 20 },
  { id: "simple", name: "Simple to use", w: 20 }
];
var SITE_CHECKS = [
  { g: "basics", id: "https", w: 2, q: "The address starts with https and the browser shows no warning.", tip: "Look at the address bar on a phone." },
  { g: "basics", id: "mobile", w: 3, q: "On a phone the page fits the screen, text is readable and buttons are easy to tap.", tip: "Open it on your own phone. No pinching or sideways scrolling needed." },
  { g: "basics", id: "fast", w: 3, q: "The first screen appears in about 3 seconds on mobile data.", tip: "Or run PageSpeed Insights below and type the mobile performance score in the box." },
  { g: "basics", id: "glance", w: 3, q: "Within 5 seconds you can tell what the business is, where it is and how to contact it.", tip: "Ask a classmate to look for 5 seconds, then ask what they saw." },
  { g: "basics", id: "contact", w: 3, q: "There is a working way to enquire or book (form, WhatsApp link, booking button, phone link).", tip: "Try it. Does the WhatsApp link open a chat? Does the phone number dial on mobile?" },
  { g: "basics", id: "facts", w: 2, q: "Prices or price ranges, opening hours and the location are shown.", tip: "Look on the home page and the contact page." },
  { g: "basics", id: "links", w: 1, q: "No broken pages or links in the main menu.", tip: "Click every menu item once." },
  { g: "seo", id: "title", w: 2, q: "The browser tab title says what the business is and where, not just 'Home'.", tip: "Look at the tab title." },
  { g: "seo", id: "meta", w: 1, q: "A short description appears under the business in Google results.", tip: "Search the business name and look at the snippet." },
  { g: "seo", id: "h1", w: 1, q: "The page has one clear main heading that says what is offered.", tip: "Right-click, Inspect, and search for h1 in the page code, or use a free SEO extension." },
  { g: "seo", id: "indexed", w: 3, q: "Google shows the site's pages. Searching site:theirdomain.com gives results.", tip: "Type site:theirdomain.com into Google." },
  { g: "seo", id: "local", w: 2, q: "Pages mention the place and service words people search for, for example 'guesthouse in Maafushi'.", tip: "Read the headings and first paragraphs." },
  { g: "seo", id: "alt", w: 1, q: "Photos have short descriptions (alt text) or descriptive file names.", tip: "Right-click a photo, Inspect, look for alt=." },
  { g: "seo", id: "nap", w: 2, q: "The name, address and phone are the same on the website, Google and social pages.", tip: "Compare the three side by side." },
  { g: "seo", id: "sitemap", w: 1, q: "theirdomain.com/sitemap.xml opens a list of pages.", tip: "Type it into the browser." },
  { g: "geo", id: "crawl", w: 2, q: "theirdomain.com/robots.txt does not block everything (it does not say Disallow: /).", tip: "Type it into the browser and read it." },
  { g: "geo", id: "text", w: 3, q: "Key facts (rooms, services, prices, location, hours) are written as text, not only inside images or PDFs.", tip: "Try to select and copy the text." },
  { g: "geo", id: "faq", w: 3, q: "The site answers real customer questions in plain sentences (an FAQ or question headings).", tip: "Look for questions guests ask: check-in time, transfers, pets, payment." },
  { g: "geo", id: "schema", w: 2, q: "The page has structured data such as LocalBusiness, Hotel or Product.", tip: "Paste the address into the Rich Results Test below." },
  { g: "geo", id: "fresh", w: 1, q: "The site shows signs of being updated in the last 12 months (dates, news, current offers).", tip: "Look at the footer year, blog dates and offers." },
  { g: "simple", id: "nav", w: 2, q: "The main menu has 7 items or fewer.", tip: "Count the items." },
  { g: "simple", id: "oneaction", w: 3, q: "Each screen has one main action that is easy to spot (for example Book now).", tip: "Squint at the page. What stands out?" },
  { g: "simple", id: "taps", w: 3, q: "From the home page, price, contact and booking can each be reached in 3 taps or fewer.", tip: "Count the taps on your phone." },
  { g: "simple", id: "scan", w: 2, q: "Text is in short blocks with headings, not long walls of text.", tip: "Scroll quickly. Can you scan it?" },
  { g: "simple", id: "popups", w: 1, q: "No pop-ups, autoplay sound or banners cover the content when the page opens.", tip: "Open it fresh in a private window." }
];
function scoreSite(s, g) {
  s = s || {};
  if (s.has === "no") {
    var subs = s.subs || {}, pts = 0, notes = ["The business has no website. The score shows only how well other places do the website's job (max 40, 8 points each)."];
    var gbpWeb = g && g.checks && g.checks.web === "y";
    [[gbpWeb, "Google profile has a working booking or contact link"], [subs.linkhub === "y", "Social bio links to a page where people can see prices or act"], [subs.wa === "y", "A click-to-chat WhatsApp link is used"], [subs.book === "y", "Customers can book or order online (booking site, delivery app or shop page)"], [subs.found === "y", "A phone number or contact can be found by googling the business name"]].forEach(function (x) {
      if (x[0]) pts += 8; else notes.push("Missing: " + x[1].toLowerCase());
    });
    if (pts === 0) notes.push("No website and no online way to enquire or order. Customers can only reach the business by phone or in person.");
    return { score: pts, none: true, notes: notes, groups: [] };
  }
  if (s.has !== "yes") return { score: 0, unanswered: true, notes: [], groups: [] };
  var perf = num(s.perf), seoN = num(s.seo), checks = s.checks || {};
  var groups = SITE_GROUPS.map(function (gr) {
    var items = SITE_CHECKS.filter(function (c) { return c.g === gr.id; }).map(function (c) {
      var v = YN[checks[c.id]]; if (v === undefined) v = null;
      if (c.id === "fast" && perf != null) v = perf >= 90 ? 1 : perf >= 50 ? 0.5 : 0;
      return { w: c.w, v: v, c: c };
    });
    if (gr.id === "seo" && seoN != null) items.push({ w: 3, v: clamp(seoN / 100, 0, 1), c: { q: "PageSpeed Insights SEO score is " + seoN + " out of 100.", id: "psiseo" } });
    var t = tally(items);
    return { id: gr.id, name: gr.name, w: gr.w, score: t.score, items: items, conf: t.known / t.total };
  });
  var num_ = 0, den = 0, notes = [];
  groups.forEach(function (gr) { if (gr.score != null) { num_ += gr.w * gr.score; den += gr.w; } gr.items.forEach(function (i) { if (i.v === 0) notes.push(i.c.q); }); });
  return { score: den ? Math.round(num_ / den) : 0, groups: groups, notes: notes };
}

/* ---------- reviews ---------- */
var THEMES = {
  cleanliness: { pos: ["clean", "spotless", "tidy", "fresh room"], neg: ["dirty", "smell", "smelly", "stain", "mould", "mold", "dusty", "filthy", "cockroach", "bugs", "ants"] },
  staff: { pos: ["friendly", "helpful", "welcoming", "kind", "lovely staff", "polite", "attentive", "great staff", "amazing staff"], neg: ["rude", "unhelpful", "ignored", "unfriendly", "slow service", "arrogant", "disrespect"] },
  location: { pos: ["location", "close to", "walking distance", "beach", "central", "view", "views"], neg: ["far from", "hard to find", "isolated"] },
  value: { pos: ["value", "worth", "affordable", "good price", "reasonable", "cheap"], neg: ["overpriced", "expensive", "rip off", "ripoff", "not worth", "pricey"] },
  food: { pos: ["delicious", "tasty", "breakfast", "great food", "excellent food", "fresh food"], neg: ["bland", "cold food", "poor food", "stale", "tasteless", "bad food"] },
  noise: { pos: ["quiet", "peaceful", "relaxing"], neg: ["noisy", "noise", "loud", "construction", "thin walls"] }
};
function hits(text, words) {
  var t = " " + String(text || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ") + " ", n = 0;
  words.forEach(function (w) { if (t.indexOf(" " + w + " ") >= 0 || (w.indexOf(" ") < 0 && t.indexOf(" " + w + "s ") >= 0)) n++; });
  return n;
}
function tagComments(list) {
  var praise = {}, gripe = {}, negComments = 0, n = 0;
  list.forEach(function (c) {
    if (!c || !String(c.t || "").trim()) return;
    n++; var neg = false;
    Object.keys(THEMES).forEach(function (k) {
      if (hits(c.t, THEMES[k].pos)) praise[k] = (praise[k] || 0) + 1;
      if (hits(c.t, THEMES[k].neg)) { gripe[k] = (gripe[k] || 0) + 1; neg = true; }
    });
    if (neg) negComments++;
  });
  return { praise: praise, gripe: gripe, n: n, neg: negComments };
}
function repPlatforms(type) {
  if (type === "stay") return [
    { id: "google", name: "Google", scale: 5 }, { id: "booking", name: "Booking.com", scale: 10 },
    { id: "tripadvisor", name: "TripAdvisor", scale: 5 }, { id: "agoda", name: "Agoda", scale: 10 }];
  if (type === "dive") return [{ id: "google", name: "Google", scale: 5 }, { id: "tripadvisor", name: "TripAdvisor", scale: 5 }];
  if (type === "tours") return [];
  if (type === "food") return [{ id: "google", name: "Google", scale: 5 }, { id: "tripadvisor", name: "TripAdvisor", scale: 5, optional: true }];
  return [{ id: "google", name: "Google", scale: 5 }];
}
function volV(c) { return c >= 200 ? 1 : c >= 100 ? 0.8 : c >= 50 ? 0.6 : c >= 20 ? 0.4 : c >= 5 ? 0.2 : 0.05; }
function recV(d) { return d == null ? null : d < 0 ? null : d <= 30 ? 1 : d <= 90 ? 0.7 : d <= 180 ? 0.35 : d <= 365 ? 0.1 : 0; }
function scoreRep(rep, type, now, gbpNa) {
  var list = repPlatforms(type), out = { plats: [], score: null, flags: [], na: false };
  var sum = 0, cnt = 0;
  list.forEach(function (pl) {
    var a = (rep && rep[pl.id]) || {}, r = { id: pl.id, name: pl.name, scale: pl.scale, status: a.status || "", score: 0, notes: [], issues: [] };
    if (a.status === "none" && gbpNa && pl.id === "google") {
      r.excluded = true; r.notes.push("No customer-facing location, so a Google listing is not required.");
    } else if (a.status === "none") {
      r.missing = true; r.notes.push("Not listed on " + pl.name + ". Counts as zero.");
    } else if (a.status === "listed") {
      var rating = num(a.rating), count = num(a.count), d = daysBetween(a.lastDate, now), reps = num(a.replies);
      var cm = arr(a.comments).filter(function (c) { return c && (c.d || String(c.t || "").trim()); });
      var tg = tagComments(cm);
      var recent = cm.filter(function (c) { var dd = daysBetween(c.d, now); return dd != null && dd >= 0 && dd <= 90; }).length;
      var cd = cm.map(function (c) { return c.d; }).filter(Boolean).sort();
      r.rating = rating; r.pct = rating != null ? rating / pl.scale : null; r.count = count; r.days = d; r.recent90 = recent; r.n = cm.length; r.tags = tg; r.replies = reps;
      var items = [
        { w: 35, v: r.pct == null ? null : clamp((r.pct - 0.6) / 0.3, 0, 1) },
        { w: 25, v: recV(d) },
        { w: 15, v: count == null ? null : volV(count) },
        { w: 15, v: reps == null || !cm.length ? null : clamp(reps / Math.min(5, cm.length), 0, 1) },
        { w: 10, v: tg.n ? 1 - tg.neg / tg.n : null }
      ];
      var t = tally(items); r.score = t.score == null ? 0 : t.score;
      if (d != null && d < 0) r.issues.push("The latest review date is in the future.");
      cm.forEach(function (c, i) { var dd = daysBetween(c.d, now); if (dd != null && dd < 0) r.issues.push("Comment " + (i + 1) + " has a future date."); });
      if (cd.length && a.lastDate && Math.abs(daysBetween(cd[cd.length - 1], a.lastDate)) > 7) r.warn = "The newest of the 5 comments (" + cd[cd.length - 1] + ") does not match the latest review date you typed (" + a.lastDate + "). Check both.";
      if (d != null && d > 90) r.notes.push("Latest review is " + d + " days old.");
      if (r.pct != null && r.pct < 0.8) r.notes.push("Rating " + rating + "/" + pl.scale + " is below the level guests trust.");
      if (reps != null && cm.length && reps < Math.min(5, cm.length) * 0.6) r.notes.push("Owner replied to " + reps + " of " + Math.min(5, cm.length) + " recent comments.");
      if (cm.length >= 3 && recent < 3) r.notes.push("Only " + recent + " of the 5 recent comments are from the last 90 days: slow review pace.");
      Object.keys(tg.gripe).forEach(function (k) { r.notes.push("Guests complain about " + k + " (" + tg.gripe[k] + " of " + tg.n + ")."); });
    } else {
      r.unanswered = true;
    }
    if (!(pl.optional && !a.status) && !r.excluded) { if (r.status) { sum += r.score; cnt++; } }
    out.plats.push(r);
  });
  out.score = cnt ? Math.round(sum / cnt) : null;
  var lp = out.plats.filter(function (p) { return p.status === "listed" && p.pct != null; });
  if (lp.length > 1) {
    var mx = lp.reduce(function (a, b) { return a.pct > b.pct ? a : b; }), mn = lp.reduce(function (a, b) { return a.pct < b.pct ? a : b; });
    if (mx.pct - mn.pct > 0.08) out.flags.push("Rating gap: " + mx.name + " " + mx.rating + "/" + mx.scale + " but " + mn.name + " " + mn.rating + "/" + mn.scale + ".");
  }
  return out;
}

/* ---------- overall ---------- */
var AREA_W = { social: 30, site: 25, gbp: 20, rep: 25 };
function audit(st) {
  var b = st.biz || {}, now = b.checked || ymd(new Date());
  var social = scoreSocial(st.social, now);
  var gbp = scoreGbp(st.gbp);
  var site = scoreSite(st.site, st.gbp);
  var rep = scoreRep(st.rep, b.type, now, gbp.na);
  var sc = { social: social.score, site: site.score, gbp: gbp.score, rep: rep.score };
  var num_ = 0, den = 0;
  Object.keys(AREA_W).forEach(function (k) { if (sc[k] != null) { num_ += AREA_W[k] * sc[k]; den += AREA_W[k]; } });
  var overall = den ? Math.round(num_ / den) : 0;
  var A = { now: now, social: social, gbp: gbp, site: site, rep: rep, overall: overall, weights: AREA_W };
  A.findings = findings(A, st);
  return A;
}

function findings(A, st) {
  var F = [], W = AREA_W;
  function add(area, text, lost, tag) { F.push({ area: area, text: text, lost: Math.round(lost * 10) / 10, tag: tag || area }); }
  var share = { social: W.social / 100, site: W.site / 100, gbp: W.gbp / 100, rep: W.rep / 100 };
  A.social.plats.forEach(function (p) {
    if (p.core ? true : p.status === "active" || p.status === "dormant") {
      if (p.missing) add("social", p.name + ": the business does not have an account.", 100 / 3 * share.social, "social:missing:" + p.id);
      else if (p.status) {
        var lost = (100 - p.score) / 3 * share.social;
        if (p.score < 75) add("social", p.name + " scores " + p.score + "/100. " + (p.notes[0] || ""), lost, "social:weak:" + p.id);
      }
    }
  });
  if (!A.gbp.na) {
    if (A.gbp.missing) add("gbp", "No Google Business Profile for a business that serves customers on location.", 100 * share.gbp, "gbp:missing");
    else if (A.gbp.score < 80) add("gbp", "Google Business Profile scores " + A.gbp.score + "/100. " + (A.gbp.notes[0] || ""), (100 - A.gbp.score) * share.gbp, "gbp:weak");
  }
  if (A.site.none) add("site", "No website. Customers cannot find prices, products or a booking or ordering route on the business's own page.", (100 - A.site.score) * share.site, "site:none");
  else if (A.site.score < 80) {
    var worst = (A.site.groups || []).filter(function (g) { return g.score != null; }).sort(function (a, b) { return a.score - b.score; })[0];
    add("site", "Website scores " + A.site.score + "/100" + (worst ? ", weakest in " + worst.name + " (" + worst.score + ")" : "") + ".", (100 - A.site.score) * share.site, "site:weak");
  }
  A.rep.plats.forEach(function (p) {
    var n = A.rep.plats.length;
    if (p.missing) add("rep", "Not listed on " + p.name + ".", 100 / n * share.rep, "rep:missing:" + p.id);
    else if (p.status === "listed" && p.score < 75) add("rep", p.name + " reputation scores " + p.score + "/100. " + (p.notes[0] || ""), (100 - p.score) / n * share.rep, "rep:weak:" + p.id);
  });
  A.rep.flags.forEach(function (f) { add("rep", f, 1.5, "rep:flag"); });
  F.sort(function (a, b) { return b.lost - a.lost; });
  return F;
}

/* ---------- plan: objectives ---------- */
function monthLabels(startYM) {
  var p = (startYM || "").split("-"), y = parseInt(p[0], 10), m = parseInt(p[1], 10);
  if (!y || !m) { var d = new Date(); y = d.getFullYear(); m = d.getMonth() + 2; if (m > 12) { m -= 12; y++; } }
  var out = [], names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (var i = 0; i < 12; i++) { var mm = (m - 1 + i) % 12, yy = y + Math.floor((m - 1 + i) / 12); out.push({ i: i + 1, cal: mm + 1, label: names[mm] + " " + String(yy).slice(2), short: names[mm] }); }
  return out;
}
function isPeak(cal) { return cal >= 11 || cal <= 4; }

function pctTxt(x) { return (Math.round(x * 100) / 100) + "%"; }
function milestones(o) {
  var b = num(o.base), t = num(o.target);
  if (b == null || t == null) return ["", "", "", ""];
  var dl = clamp(parseInt(o.deadline, 10) || 12, 3, 12);
  return [3, 6, 9, 12].map(function (m) {
    var f = clamp(m / dl, 0, 1), v = b + (t - b) * f, d = Math.abs(t) >= 10 ? 0 : 2;
    return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString("en-US") + (o.unit === "%" ? "%" : "");
  });
}
function roundTo(x, step) { return Math.round(x / step) * step; }

function makeObjectives(A, st) {
  var b = st.biz || {}, T = TBY[b.type] || TBY.service, O = [], seq = 0;
  function add(o) { o.id = "o" + (++seq); o.deadline = o.deadline || 12; O.push(o); }
  var lostBy = {}; A.findings.forEach(function (f) { lostBy[f.area] = (lostBy[f.area] || 0) + f.lost; });
  var plats = A.social.plats;
  var miss = plats.filter(function (p) { return p.core && p.missing; });
  var act = plats.filter(function (p) { return (p.status === "active" || p.status === "dormant") && p.score < 80; });
  var totalFol = plats.reduce(function (s, p) { return s + (p.followers || 0); }, 0);
  if (miss.length) {
    add({ area: "social", pri: lostBy.social || 0, text: "Launch complete, active " + miss.map(function (p) { return p.name; }).join(" and ") + " accounts by month 2, then reach 500 followers on each by month 12.",
      kpi: "Followers on new accounts", unit: "", base: 0, target: 500 * miss.length, deadline: 12, tool: "Platform insights (Meta Business Suite or TikTok analytics)", freq: "Monthly", why: "The business has no " + miss.map(function (p) { return p.name; }).join(" or ") + " presence, so those audiences cannot find it." });
  }
  if (act.length) {
    var p0 = act.slice().sort(function (a, c) { return a.score - c.score; })[0], pb = PBY[p0.id];
    if (p0.er_ratio != null && p0.er_ratio < 0.8) {
      var bE = Math.round(p0.er * 100) / 100, tE = Math.round(Math.min(pb.er, Math.max(bE * 1.5, bE + 0.15)) * 100) / 100;
      add({ area: "social", pri: lostBy.social || 0, text: "Lift average engagement per post on " + p0.name + " from " + bE + "% to " + tE + "% of followers and post at least " + Math.round(pb.posts * 0.75) + " times a month, all by month 12.",
        kpi: "Engagement rate on " + p0.name + " (likes plus comments per post, divided by followers)", unit: "%", base: bE, target: tE, deadline: 12, tool: "Platform insights, plus a monthly count of posts", freq: "Monthly", why: p0.notes[0] || "Engagement is below the benchmark." });
    } else {
      var pN = Math.round(pb.posts * 0.75), pBase = p0.posts == null ? 0 : Math.round(p0.posts);
      add({ area: "social", pri: lostBy.social || 0, text: "Rebuild a steady posting habit on " + p0.name + ": from about " + pBase + " posts a month to at least " + pN + " a month by month 3, and keep it there to month 12.",
        kpi: "Posts per month on " + p0.name, unit: "", base: pBase, target: pN, deadline: 3, tool: "Platform insights, plus a monthly count of posts", freq: "Monthly", why: p0.notes[0] || "Posting is below the healthy level." });
    }
  }
  if (!miss.length && !act.length) {
    var f0 = Math.max(totalFol, 200);
    add({ area: "social", pri: 1, text: "Grow total followers across the active accounts from " + f0.toLocaleString("en-US") + " to " + roundTo(f0 * 1.3, 10).toLocaleString("en-US") + " (+30%) by month 12.", kpi: "Total followers", unit: "", base: f0, target: roundTo(f0 * 1.3, 10), deadline: 12, tool: "Platform insights", freq: "Monthly", why: "Social accounts are healthy, so the aim is to widen reach." });
  }
  if (!A.gbp.na) {
    var gr = A.rep.plats.filter(function (p) { return p.id === "google"; })[0] || {};
    var known = gr.count != null, cnt0 = known ? gr.count : null, cT = known ? cnt0 + 60 : null;
    if (A.gbp.missing || A.gbp.status === "unclaimed")
      add({ area: "gbp", pri: lostBy.gbp || 0, text: "Create or claim and verify the Google Business Profile in month 1, complete every section by month 2, then collect 5 new Google reviews a month to reach " + (known ? cT + " reviews" : "60 reviews") + " at 4.5 or higher by month 12.",
        kpi: "Google reviews (count)", unit: "", base: cnt0, target: cT, baseNote: known ? "" : "Enter the current number of Google reviews.", deadline: 12, tool: "Google Business Profile, Performance and Reviews tabs", freq: "Monthly", why: A.gbp.notes[0] || "" });
    else
      add({ area: "gbp", pri: lostBy.gbp || 0.5, text: "Complete every Google Business Profile section by month 2, then add 5 Google reviews a month to " + (known ? "move from " + cnt0 + " to " + cT : "add 60 new") + " reviews with an average of 4.5 or higher by month 12.",
        kpi: "Google reviews (count) and average rating", unit: "", base: cnt0, target: cT, baseNote: known ? "" : "Enter the current number of Google reviews.", deadline: 12, tool: "Google Business Profile, Performance and Reviews tabs", freq: "Monthly", why: A.gbp.notes[0] || "The profile is a free route to local customers." });
  }
  var sTarget = Math.max(80, A.site.score + 20); sTarget = Math.min(sTarget, 95);
  if (A.site.none)
    add({ area: "site", pri: lostBy.site || 0, text: "Launch a new mobile-first website with prices, a booking or enquiry route and answers to common questions by month 4, then reach a website score of " + sTarget + " or higher on this audit by month 12.",
      kpi: "Website audit score (0 to 100)", unit: "", base: A.site.score, target: sTarget, deadline: 12, tool: "Re-run this audit, plus Google PageSpeed Insights and Search Console", freq: "Quarterly", why: "The business has no website of its own." });
  else
    add({ area: "site", pri: lostBy.site || 0.5, text: "Redesign the website so it is simpler to use and ready for search and AI answers, raising the website audit score from " + A.site.score + " to " + sTarget + " by month 6 and keeping it there until month 12.",
      kpi: "Website audit score (0 to 100)", unit: "", base: A.site.score, target: sTarget, deadline: 6, tool: "Re-run this audit, plus Google PageSpeed Insights and Search Console", freq: "Quarterly", why: (A.site.notes && A.site.notes[0]) || "Keep the site simple, fast and easy for search and AI tools to read." });
  var rl = A.rep.plats.filter(function (p) { return p.status === "listed"; });
  if (rl.length || A.rep.plats.some(function (p) { return p.missing; })) {
    var worst = rl.slice().sort(function (a, c) { return a.score - c.score; })[0];
    var miss2 = A.rep.plats.filter(function (p) { return p.missing; }).map(function (p) { return p.name; });
    if (worst && worst.score < 85)
      add({ area: "rep", pri: lostBy.rep || 0, text: "Raise the reputation score on " + worst.name + " from " + worst.score + " to 80 or higher by month 9 by replying to every review within 3 days and keeping the newest review under 30 days old" + (miss2.length ? ", and list the business on " + miss2.join(" and ") + " by month 3" : "") + ".",
        kpi: "Reputation score on " + worst.name + " (0 to 100)", unit: "", base: worst.score, target: 80, deadline: 9, tool: "Platform dashboards, then re-run this audit", freq: "Monthly", why: worst.notes[0] || "" });
    else if (miss2.length)
      add({ area: "rep", pri: lostBy.rep || 0, text: "Create and complete the business's review profile on " + miss2.join(" and ") + " by month 3, then collect at least 10 recent reviews on each by month 12.", kpi: "Listings live and review count", unit: "", base: 0, target: 10, deadline: 12, tool: "Platform dashboards", freq: "Monthly", why: "Guests search these sites before they book." });
  }
  var isStay = b.type === "stay", bizKpi = isStay ? "Direct bookings per month (website, WhatsApp, phone)" : T.travel ? "Enquiries or bookings per month from digital channels" : "Enquiries or orders per month from digital channels";
  add({ area: "biz", pri: 0.9, text: isStay ? "Increase direct bookings (website, WhatsApp, phone) by 25% over the baseline by month 12 and reduce the reliance on commission-paying sites." : T.travel ? "Increase enquiries and bookings that come from digital channels by 25% over the baseline by month 12." : "Increase enquiries or orders that come from digital channels by 25% over the baseline by month 12.",
    kpi: bizKpi, unit: "", base: null, target: null, deadline: 12, tool: "Booking or order log, with 'How did you hear about us?' and WhatsApp counts", freq: "Monthly", baseNote: "Enter the current monthly number from the business's own records.", why: "This ties the online work to sales, which the assignment asks the plan to do." });
  O.sort(function (a, c) { return c.pri - a.pri; });
  if (O.length > 5) { var biz = O.filter(function (o) { return o.area === "biz"; }); O = O.filter(function (o) { return o.area !== "biz"; }).slice(0, 4).concat(biz); }
  O.forEach(function (o, i) { o.id = "o" + (i + 1); });
  return O;
}

/* ---------- plan: strategies and cost lines ---------- */
var STRATS = [
  { id: "web", name: "Blogs and Websites", theory: "Customer journey, usability, conversion funnel" },
  { id: "seo", name: "Search Engine Optimization (SEO)", theory: "Search intent, local SEO, E-E-A-T" },
  { id: "content", name: "Content Marketing", theory: "Content pillars, storytelling, 80/20 rule" },
  { id: "smads", name: "Social Media Advertising", theory: "AIDA, targeting and retargeting, frequency" },
  { id: "banner", name: "Internet Banner Advertising", theory: "Display and search ads, click-through rate, retargeting" },
  { id: "email", name: "SMS & Email advertising", theory: "Permission marketing, CRM, lifecycle messages" },
  { id: "infl", name: "Influencer Marketing", theory: "Source credibility, social proof, reach versus trust" },
  { id: "viral", name: "Viral Marketing", theory: "Word of mouth, social currency, user-generated content" },
  { id: "affil", name: "Affiliate Marketing", theory: "Performance-based marketing, commission models" }
];
var SBY = {}; STRATS.forEach(function (s) { SBY[s.id] = s; });

/* line: {id, s, name, basis: 'Price list'|'At cost'|'Estimate', unit, qty, kind: 'monthly'|'oneoff'|'every', every, start, end, season, disc, note} */
function makeStrategies(A, st, objs) {
  var b = st.biz || {}, T = TBY[b.type] || TBY.service, hasSite = (st.site || {}).has === "yes";
  var sc = A.social, missPlats = sc.plats.filter(function (p) { return p.core && p.missing; });
  var S = [], L = [];
  function line(s, o) { o.s = s; L.push(o); }
  var lowEng = sc.plats.some(function (p) { return p.er_ratio != null && p.er_ratio < 0.6; });
  var tot = A.social.plats.reduce(function (n, p) { return n + (p.followers || 0); }, 0);
  var peakLead = 4;
  if (T.season) { var lab = monthLabels(b.start); lab.forEach(function (m) { if (m.cal === 10) peakLead = m.i; }); }
  var peakLead2 = peakLead + 3 > 12 ? Math.max(1, peakLead - 6) : peakLead + 3;

  // website
  var web = A.site.none ? { n: "Build a new mobile-first website", u: 12000, k: "new" } : (A.site.score < 75 ? { n: "Redesign the existing website", u: 7000, k: "redesign" } : { n: "Targeted improvements to the existing website", u: 2500, k: "tune" });
  line("web", { name: web.n + " (design, pages, " + (T.travel ? "booking or enquiry route, " : "enquiry route, ") + "simple menu, FAQ)", basis: "Estimate", unit: web.u, qty: 1, kind: "oneoff", start: 1, end: A.site.none ? 3 : 2, note: "Not on the Islandeative price list. Replace with 2 or 3 written quotes." });
  if (A.site.none) line("web", { name: "Domain, hosting and SSL certificate", basis: "At cost", unit: 200, qty: 1, kind: "monthly", start: 1, end: 12, note: "About MVR 2,400 a year. Confirm with a hosting provider." });
  if (b.type === "stay" && (A.site.none || (st.site.checks || {}).contact !== "y"))
    line("web", { name: "Booking page or enquiry-to-WhatsApp flow", basis: "Price list", unit: 3500, qty: 1, kind: "oneoff", start: 2, end: 3 });
  line("web", { name: "Blog or news articles answering customer questions (2 a month)", basis: "Price list", unit: 250, qty: 2, kind: "monthly", start: A.site.none ? 4 : 3, end: 12, note: "Priced as two static posts a month." });
  // seo
  if (!A.gbp.na) line("seo", { name: "Google Business Profile optimisation", basis: "Price list", unit: 800, qty: 1, kind: "oneoff", start: 1, end: 1 });
  line("seo", { name: "SEO and structured data set-up (titles, descriptions, headings, schema, sitemap)", basis: "Estimate", unit: 1500, qty: 1, kind: "oneoff", start: 2, end: 3, note: "Not on the Islandeative price list. Replace with a quote." });
  line("seo", { name: "Monthly review: ask for Google reviews, reply to all reviews, update profile", basis: "Estimate", unit: 0, qty: 1, kind: "monthly", start: 1, end: 12, note: "Owner's own time. Zero cash cost." });
  // content
  var reels = lowEng || sc.score < 60 ? 3 : 2, posts = 4;
  line("content", { name: "Reels with new filming (" + reels + " a month)", basis: "Price list", unit: 1000, qty: reels, kind: "monthly", start: 2, end: 12, disc: true });
  line("content", { name: "Static or carousel posts (" + posts + " a month)", basis: "Price list", unit: 250, qty: posts, kind: "monthly", start: 2, end: 12, disc: true });
  line("content", { name: "Half-day content shoot (every " + (T.travel ? "quarter" : "6 months") + ")", basis: "Price list", unit: 2500, qty: 1, kind: "every", every: T.travel ? 3 : 6, start: 1, end: 12, note: "Island travel is billed at cost." });
  // social ads
  line("smads", { name: "Facebook, Instagram and TikTok ad spend (paid on the business's own card)", basis: "At cost", unit: 1500, qty: 1, kind: "monthly", start: 2, end: 12, season: T.season, note: "Ad spend is paid straight to the platform with no mark-up." });
  if (missPlats.length) line("smads", { name: "Set up and run " + missPlats.length + " new platform" + (missPlats.length > 1 ? "s" : "") + " (" + missPlats.map(function (p) { return p.name; }).join(", ") + ")", basis: "Price list", unit: 1000, qty: Math.min(2, missPlats.length), kind: "monthly", start: 1, end: 12 });
  // banner
  line("banner", { name: "Google Ads management (search and display banners)", basis: "Price list", unit: 1500, qty: 1, kind: "monthly", start: A.site.none ? 4 : 3, end: 12 });
  line("banner", { name: "Google Ads spend (at cost)", basis: "At cost", unit: 1500, qty: 1, kind: "monthly", start: A.site.none ? 4 : 3, end: 12, season: T.season });
  // email
  line("email", { name: "Broadcast set-up with custom templates (WhatsApp, SMS, email)", basis: "Price list", unit: 2500, qty: 1, kind: "oneoff", start: 2, end: 2 });
  line("email", { name: "Broadcast sends (2 message sets a month)", basis: "Price list", unit: 150, qty: 2, kind: "monthly", start: 3, end: 12 });
  line("email", { name: "Campaign month bundle (3 campaigns a year)", basis: "Price list", unit: 2500, qty: 1, kind: "every", every: 4, start: 3, end: 12, note: "If a campaign runs past the month, even by 3 days, the next month is charged in full." });
  // influencer
  line("infl", { name: "Influencer campaign management (2 campaigns)", basis: "Price list", unit: 2000, qty: 1, kind: "months", months: [peakLead, peakLead2], start: 1, end: 12 });
  line("infl", { name: "Influencer fees or complimentary stays (at cost)", basis: "At cost", unit: 3000, qty: 1, kind: "months", months: [peakLead, peakLead2], start: 1, end: 12, note: "Estimate. Agree the fee with each creator in writing." });
  // viral
  line("viral", { name: "Challenge or giveaway Reel (2 campaigns)", basis: "Price list", unit: 1000, qty: 1, kind: "months", months: [5, 11], start: 1, end: 12 });
  line("viral", { name: "Giveaway prize (at cost)", basis: "At cost", unit: 1000, qty: 1, kind: "months", months: [5, 11], start: 1, end: 12, note: "Estimate." });
  // affiliate
  line("affil", { name: "Partner or affiliate commission (paid only when a sale is made)", basis: "Estimate", unit: 1000, qty: 1, kind: "monthly", start: 4, end: 12, note: "Estimate of about 10% of attributed sales. Replace using the sales forecast." });

  var on = { web: true, seo: true, content: true, smads: true, banner: hasSite || true, email: true,
    infl: !!(T.travel || b.type === "food") && tot < 15000, viral: lowEng, affil: b.type === "stay" && A.rep.plats.filter(function (p) { return p.status === "listed"; }).length >= 2 };
  var why = {
    web: A.site.none ? "The business has no website. A simple, fast site is the base for search, ads and AI answers." : "Website score " + A.site.score + "/100. " + ((A.site.notes && A.site.notes[0]) || ""),
    seo: "Google profile and website are how people find the business when they search.",
    content: "Social score " + A.social.score + "/100. Regular, useful content builds reach and trust.",
    smads: missPlats.length ? "New platforms need paid reach to get started." : "Paid boosts reach people who do not follow the business yet.",
    banner: "Search and display ads capture people who are already looking, and bring visitors to the website.",
    email: "Messages to past guests and enquirers cost little and bring repeat business.",
    infl: "Creators give social proof and reach to new audiences.",
    viral: "Engagement is low. Shareable ideas can lift it without a big budget.",
    affil: "Partner commission shifts cost to results and widens distribution."
  };
  var serve = { web: ["site", "biz"], seo: ["gbp", "site", "biz"], content: ["social", "rep"], smads: ["social", "biz"], banner: ["site", "biz"], email: ["biz", "rep"], infl: ["social", "rep"], viral: ["social"], affil: ["biz"] };
  STRATS.forEach(function (sd) {
    var ls = L.filter(function (l) { return l.s === sd.id; });
    var s0 = Math.min.apply(null, ls.map(function (l) { return l.start; }));
    var e0 = Math.max.apply(null, ls.map(function (l) { return l.end; }));
    var ob = objs.filter(function (o) { return serve[sd.id].indexOf(o.area) >= 0; }).map(function (o) { return o.id; });
    S.push({ id: sd.id, name: sd.name, theory: sd.theory, on: !!on[sd.id], why: why[sd.id], objs: ob, start: s0, end: e0 });
  });
  L.forEach(function (l, i) { l.id = "l" + (i + 1); });
  var plan = { strats: S, lines: L, cont: 10 };
  var cap = num(b.cap) || 8000, order = ["viral", "affil", "infl", "banner", "email"];
  for (var k = 0; k < order.length && budget(plan, b).sub > cap * 12; k++) { SBY_get(S, order[k]).on = false; }
  return plan;
}

function SBY_get(S, id) { return S.filter(function (x) { return x.id === id; })[0]; }
/* ---------- budget ---------- */
function lineCost(l, m, season, cal) {
  if (m < l.start || m > l.end) return 0;
  var q = num(l.qty); if (q == null) q = 1; var u = num(l.unit) || 0, c = 0;
  if (l.kind === "oneoff") c = m === l.start ? u * q : 0;
  else if (l.kind === "every") c = ((m - l.start) % (num(l.every) || 3) === 0) ? u * q : 0;
  else if (l.kind === "months") c = (l.months || []).indexOf(m) >= 0 ? u * q : 0;
  else c = u * q;
  if (c && l.disc && q >= 4 && l.basis === "Price list" && (l.kind === "monthly" || l.kind === "every")) c *= 0.85;
  if (c && l.season && season) c *= isPeak(cal) ? 1.4 : 0.6;
  return Math.round(c);
}
function budget(plan, biz) {
  var T = TBY[biz.type] || TBY.service, lab = monthLabels(biz.start), on = {};
  plan.strats.forEach(function (s) { on[s.id] = s.on; });
  var rows = [], byS = {}, monthly = [0,0,0,0,0,0,0,0,0,0,0,0];
  plan.lines.forEach(function (l) {
    if (!on[l.s]) return;
    var ms = lab.map(function (m) { return lineCost(l, m.i, T.season, m.cal); }), tot = ms.reduce(function (a, b) { return a + b; }, 0);
    rows.push({ line: l, months: ms, total: tot });
    byS[l.s] = byS[l.s] || { months: [0,0,0,0,0,0,0,0,0,0,0,0], total: 0 };
    ms.forEach(function (v, i) { byS[l.s].months[i] += v; monthly[i] += v; }); byS[l.s].total += tot;
  });
  var sub = monthly.reduce(function (a, b) { return a + b; }, 0), cp = clamp(num(plan.cont) == null ? 10 : num(plan.cont), 0, 25);
  var cont = Math.round(sub * cp / 100);
  var contM = monthly.map(function (v) { return Math.round(v * cp / 100); });
  return { rows: rows, byS: byS, monthly: monthly, sub: sub, cp: cp, cont: cont, contM: contM, total: sub + cont, labels: lab };
}

/* ---------- plan helpers for control and evaluation ---------- */
function evalRows(objs) {
  return objs.map(function (o) {
    return { id: o.id, kpi: o.kpi, base: o.base, target: o.target, tool: o.tool, freq: o.freq, ms: milestones(o),
      rule: "If the KPI is below the milestone for two checks in a row, review the content mix, the ad targeting and the budget split, and record what changed." };
  });
}

G.SA = { PLATS: PLATS, PBY: PBY, TYPES: TYPES, TBY: TBY, GBP_CHECKS: GBP_CHECKS, SITE_GROUPS: SITE_GROUPS, SITE_CHECKS: SITE_CHECKS, STRATS: STRATS, SBY: SBY, THEMES: THEMES,
  repPlatforms: repPlatforms, LAST_BANDS: LAST_BANDS, CBANDS: CBANDS, engAvg: engAvg, engCount: engCount, FREQ_BANDS: FREQ_BANDS, audit: audit, makeObjectives: makeObjectives, makeStrategies: makeStrategies, budget: budget, evalRows: evalRows, milestones: milestones,
  monthLabels: monthLabels, arr: arr, isPeak: isPeak, cls: cls, num: num, mvr: mvr, ymd: ymd, daysBetween: daysBetween, clamp: clamp, lineCost: lineCost };
})(typeof window !== "undefined" ? window : globalThis);
