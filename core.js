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
  if (c && l.disc && q >= 4 && l.basis === "Price list" && (l.kind === "monthly" || l.kind === "every" || l.kind === "months")) c *= 0.85;
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


/* ---------- target market chips (shared by the screens and the PDF) ---------- */
/* Segment questions change with the business type. Answers are stored by label. A segment whose "Who" is a business customer gets the business (B2B) questions. */
var DEMO = function (stage) { return [
  { b: "demo", k: "age", q: "Age", m: true, o: ["Under 18", "18 to 24", "25 to 34", "35 to 44", "45 to 54", "55 and over"] },
  { b: "demo", k: "stage", q: "Life stage", m: true, o: stage },
  { b: "demo", k: "gender", q: "Gender", m: false, o: ["Any", "Mostly women", "Mostly men"] },
  { b: "demo", k: "spend", q: "Spending level", m: false, o: ["Budget", "Mid-range", "Premium"] }]; };
var SEGSETS = {
  travel: { who: ["Foreign tourists", "Locals", "Expats living in the Maldives", "Travel agents and tour operators"], biz: ["Travel agents and tour operators"], q: [
    { b: "geo", k: "from", q: "Where are they from?", m: true, o: ["Europe", "UK", "Russia", "China", "India", "Middle East", "Other Asia", "USA and others", "Malé and Hulhumalé", "Other islands"] }]
    .concat(DEMO(["Solo travellers", "Couples", "Honeymooners", "Families with children", "Groups of friends", "Retirees", "Business travellers"])).concat([
    { b: "psy", k: "values", q: "What they value", m: true, o: ["Adventure", "Rest and relaxation", "Nature and eco-friendly travel", "Local culture", "Luxury and status", "Value for money", "Wellness", "Sharing their travels online"] },
    { b: "psy", k: "interest", q: "Interests", m: true, o: ["Diving and snorkelling", "Surfing", "Fishing", "Island hopping", "Sandbank and picnic trips", "Food", "Photography", "Spa and wellness"] },
    { b: "beh", k: "benefit", q: "What they want most", m: true, o: ["Low price", "Easy planning", "A memorable experience", "Comfort", "Safety", "Privacy", "Flexibility"] },
    { b: "beh", k: "buy", q: "How they book", m: true, o: ["Booking sites like Booking and Agoda", "Direct on the website", "WhatsApp or DM", "Through a travel agent", "Walk in on arrival"] },
    { b: "beh", k: "when", q: "When they travel", m: true, o: ["Peak season (November to April)", "Low season deals (May to October)", "School holidays", "Ramadan and Eid holidays", "Public holidays", "Special occasions"] },
    { b: "beh", k: "loyal", q: "Visit pattern", m: false, o: ["First-time visitors", "Returning guests", "Referred by friends"] }]) },
  food: { who: ["Locals", "Expats", "Office workers", "Students", "Tourists", "Offices and events (catering)"], biz: ["Offices and events (catering)"], q: [
    { b: "geo", k: "from", q: "Where do they live or work?", m: true, o: ["Malé", "Hulhumalé", "Villimalé", "Other islands", "Visitors and tourists"] }]
    .concat(DEMO(["Students", "Young singles", "Couples", "Families with children", "Groups of friends", "Office workers", "Retirees"])).concat([
    { b: "psy", k: "values", q: "What they value", m: true, o: ["Healthy eating", "Trying new food", "Value for money", "Halal and trusted ingredients", "Familiar comfort food", "Nice places to be seen", "Sharing food online", "Speed and convenience"] },
    { b: "psy", k: "interest", q: "Interests", m: true, o: ["Coffee culture", "Desserts", "Local Maldivian food", "International cuisines", "Fitness and diet", "Socialising", "Food photography"] },
    { b: "beh", k: "benefit", q: "What they want most", m: true, o: ["Low price", "Taste", "Speed", "Convenience", "Healthy options", "A nice place to sit", "Big portions"] },
    { b: "beh", k: "buy", q: "How they order", m: true, o: ["Dine in", "Takeaway", "Delivery app", "WhatsApp or phone order", "Pre-order for events"] },
    { b: "beh", k: "when", q: "When they buy", m: true, o: ["Breakfast", "Lunch break", "Evenings", "Weekends", "Ramadan iftar and suhoor", "Eid and celebrations", "Payday"] },
    { b: "beh", k: "loyal", q: "How often they come", m: false, o: ["First-time customers", "Occasional customers", "Regulars"] }]) },
  retail: { who: ["Locals", "Expats", "Students", "Tourists", "Other shops and resellers", "Resorts and businesses buying in bulk"], biz: ["Other shops and resellers", "Resorts and businesses buying in bulk"], q: [
    { b: "geo", k: "from", q: "Where are they?", m: true, o: ["Malé", "Hulhumalé", "Villimalé", "Other islands (delivery)", "Anywhere online"] }]
    .concat(DEMO(["Students", "Young singles", "Couples", "Parents with children", "Working professionals", "Retirees"])).concat([
    { b: "psy", k: "values", q: "What they value", m: true, o: ["Latest trends", "Value for money", "Quality and brands", "Convenience", "Local and handmade", "Eco-friendly products", "Modest fashion", "Showing it online"] },
    { b: "psy", k: "interest", q: "Interests", m: true, o: ["Fashion", "Beauty and skincare", "Home and decor", "Tech and gadgets", "Sports and fitness", "Kids and baby", "Gifts"] },
    { b: "beh", k: "benefit", q: "What they want most", m: true, o: ["Low price", "Choice", "Quality", "Fast delivery", "Easy returns", "Original, trusted products", "Good service"] },
    { b: "beh", k: "buy", q: "How they buy", m: true, o: ["In store", "Instagram or TikTok DM", "WhatsApp order", "Online shop", "Delivery app"] },
    { b: "beh", k: "when", q: "When they buy", m: true, o: ["Payday", "Ramadan and Eid", "Back to school", "Sales and promotions", "Weekends", "Gifts and special occasions"] },
    { b: "beh", k: "loyal", q: "How often they buy", m: false, o: ["First-time buyers", "Occasional buyers", "Loyal repeat buyers"] }]) },
  service: { who: ["Households", "Individuals", "Expats", "Students", "Small businesses", "Companies and organisations", "Government offices and NGOs"], biz: ["Small businesses", "Companies and organisations", "Government offices and NGOs"], q: [
    { b: "geo", k: "from", q: "Where are they?", m: true, o: ["Malé", "Hulhumalé", "Villimalé", "Other islands"] }]
    .concat(DEMO(["Students", "Young professionals", "Couples", "Families with children", "Busy working parents", "Retirees", "Landlords and property owners"])).concat([
    { b: "psy", k: "values", q: "What they value", m: true, o: ["Saving time", "Value for money", "Trust and safety", "Quality work", "Convenience", "Eco-friendly products", "Status"] },
    { b: "psy", k: "interest", q: "Interests", m: true, o: ["Home and living", "Health and wellbeing", "Career and learning", "Personal care", "Cars and transport"] },
    { b: "beh", k: "benefit", q: "What they want most", m: true, o: ["Low price", "Saving time", "Reliability", "Trusted staff", "Quality results", "Flexible times", "Fast response"] },
    { b: "beh", k: "buy", q: "How they book", m: true, o: ["WhatsApp or call", "Online booking", "Walk in", "Referral from friends", "Facebook or Instagram message"] },
    { b: "beh", k: "when", q: "When they buy", m: true, o: ["Weekends", "Before Ramadan and Eid", "When moving house", "When something breaks", "A regular monthly service", "Any day"] },
    { b: "beh", k: "loyal", q: "How often they buy", m: false, o: ["One-off customers", "Occasional customers", "Regular contract customers"] }]) },
  b2b: { q: [
    { b: "geo", k: "from", q: "Where are the companies?", m: true, o: ["Malé", "Hulhumalé", "Resort islands", "Other islands", "Abroad"] },
    { b: "demo", k: "industry", q: "Industry", m: true, o: ["Tourism and resorts", "Retail and trading", "Food and drink", "Construction and real estate", "Health and education", "Government and NGOs", "Professional services", "Fisheries and agriculture"] },
    { b: "demo", k: "size", q: "Company size", m: false, o: ["1 to 9 staff", "10 to 49 staff", "50 to 249 staff", "250 or more staff"] },
    { b: "demo", k: "owner", q: "Type of organisation", m: true, o: ["Family business", "Local company", "International company", "Government or state-owned", "NGO"] },
    { b: "psy", k: "values", q: "What the company values", m: true, o: ["Cutting costs", "Staying within the law", "Growth and expansion", "Saving staff time", "Expert advice", "Reliability", "Local support they can call", "Reputation"] },
    { b: "psy", k: "culture", q: "How the company works", m: true, o: ["Traditional and careful", "Modern and fast-moving", "Price-driven", "Quality-driven"] },
    { b: "beh", k: "benefit", q: "What they want most", m: true, o: ["Lower cost", "Compliance and peace of mind", "Speed", "Expertise", "Reliability", "One supplier for everything"] },
    { b: "beh", k: "buy", q: "How they buy", m: true, o: ["Quotation or tender", "Monthly retainer or contract", "One-off project", "Through referrals", "Online search"] },
    { b: "beh", k: "when", q: "When they buy", m: true, o: ["Start of the financial year", "Year-end and audit season", "When hiring or expanding", "When a law changes", "Before peak tourist season", "Any time"] },
    { b: "beh", k: "decider", q: "Who decides", m: true, o: ["Owner or director", "HR manager", "Finance manager", "Operations manager", "Procurement team"] },
    { b: "beh", k: "loyal", q: "Relationship", m: false, o: ["New clients", "Occasional clients", "Long-term clients"] }] }
};
function segCtx(type) { var t = TBY[type]; return t ? (t.group === "travel" ? "travel" : t.group) : "service"; }
function segWho(type) { var s = SEGSETS[segCtx(type)]; return { b: "all", k: "who", q: "Who are they?", m: false, o: s.who }; }
function isB2B(type, g) { var s = SEGSETS[segCtx(type)], w = g && g.s ? g.s.who : ""; return s.biz.indexOf(w) >= 0; }
function segQs(type, g) { return [segWho(type)].concat(isB2B(type, g) ? SEGSETS.b2b.q : SEGSETS[segCtx(type)].q); }
var ATT = [
  { k: "size", q: "Size", t: "Think about how many people like this there are, from tourism or census figures, and how often they buy.", o: ["A small niche", "A steady group", "A large market"] },
  { k: "reach", q: "Reach online", t: "Are they on the platforms where the business already has accounts? Check your audit results.", o: ["Hard to find online", "On one or two platforms", "Easy to reach where the business posts"] },
  { k: "fit", q: "Fit with the business", t: "Does the business already sell what this group wants, at a price they would pay?", o: ["Would need big changes", "Partly fits", "Already offers what they want"] },
  { k: "comp", q: "Competition", t: "How to check: search Google Maps and booking sites for the same kind of business in the same area, and see how many of them speak to this group in their posts, photos and offers. Online sellers: search Instagram and TikTok for the product and see who already targets this group.", o: ["Crowded: many competitors", "Some competitors", "Under-served: few competitors"] }
];
var BASIS = ["The business's posts and reviews", "My audit findings", "Tourism or census statistics", "News or industry reports", "Talking to people I know", "My own assumption"];
var PGOAL = ["Save money", "Save time", "Relax", "Try something new", "Spend time with family", "Impress others", "Stay healthy", "Get good quality", "Feel safe"];
var PPAIN = ["Prices are not clear", "Hard to book or order", "Slow replies", "Few reviews or photos", "Not sure it can be trusted", "Hard to get to", "Language barrier", "Limited choice"];
var PTRIG = ["Good reviews", "A discount or deal", "A friend's recommendation", "An influencer post", "A holiday or occasion", "A fast reply on WhatsApp", "Great photos or video", "Easy online booking"];
var PGOAL_B = ["Cut costs", "Save staff time", "Stay within the law", "Grow the business", "Reduce risk", "Look good to the boss", "Get expert help"];
var PPAIN_B = ["Slow suppliers", "Hidden costs", "Errors and rework", "Changing laws", "Hard to find skilled people", "No local support", "Too much paperwork"];
var PTRIG_B = ["A referral from another company", "A clear quotation", "Case studies and results", "A free consultation", "A deadline or audit", "A new law", "Cheaper than doing it in-house"];
function plists(type, g) { var b = isB2B(type, g); return { goal: b ? PGOAL_B : PGOAL, pain: b ? PPAIN_B : PPAIN, trig: b ? PTRIG_B : PTRIG }; }
var ACTS = ["Change the content mix", "Change posting times or frequency", "Adjust ad targeting", "Move budget between channels", "Fix the website or booking path", "Run a promotion", "Work with an influencer", "Ask customers for reviews", "Reply faster to messages"];
function picks(map, list) { map = map || {}; return list.filter(function (x) { return map[x]; }); }
function chosen(map) { map = map || {}; return Object.keys(map).filter(function (k) { return map[k]; }); }
function andJoin(a) { return a.length < 2 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
function segText(g, type) {
  var s = (g && g.s) || {}, qs = segQs(type, g), Q = {}; qs.forEach(function (q) { Q[q.k] = q; });
  var one = function (k) { return Q[k] && s[k] && Q[k].o.indexOf(s[k]) >= 0 ? s[k] : ""; }, many = function (k) { return Q[k] ? picks(s[k], Q[k].o) : []; };
  var who = one("who"), lead, rest = [];
  if (isB2B(type, g)) {
    lead = who || "Business customers";
    var d = [one("size"), andJoin(many("owner")).toLowerCase()].filter(Boolean); if (d.length) lead += ": " + d.join(", ");
    if (many("industry").length) lead += ", in " + andJoin(many("industry")).toLowerCase();
    [["from", "Location"], ["values", "Values"], ["culture", "Way of working"], ["benefit", "Want"], ["buy", "Buy through"], ["when", "Buy at"], ["decider", "Decided by"]].forEach(function (x) { if (many(x[0]).length) rest.push(x[1] + ": " + many(x[0]).join(", ")); });
    if (one("loyal")) rest.push(one("loyal"));
  } else {
    var st = many("stage"); lead = st.length ? andJoin(st) + (who ? " (" + who.toLowerCase() + ")" : "") : who || "Customers";
    if (many("age").length) lead += ", aged " + andJoin(many("age"));
    if (many("from").length) lead += ", from " + andJoin(many("from"));
    if (one("gender") && one("gender") !== "Any") lead += ", " + one("gender").toLowerCase();
    if (one("spend")) lead += ", " + one("spend").toLowerCase() + " spenders";
    [["values", "Value"], ["interest", "Interests"], ["benefit", "Want"], ["buy", { travel: "Book through", food: "Order by" }[segCtx(type)] || "Buy through"], ["when", "When"]].forEach(function (x) { if (many(x[0]).length) rest.push(x[1] + ": " + many(x[0]).join(", ")); });
    if (one("loyal")) rest.push(one("loyal"));
  }
  var t = lead + "." + (rest.length ? " " + rest.join(". ") + "." : "");
  return t + (g && g.extra ? " " + g.extra : "");
}
function segReason(g) {
  var a = (g && g.att) || {}, parts = ATT.map(function (x) { var v = a[x.k]; return v === undefined || v === "" ? "" : x.o[+v].replace(/:.*$/, "").toLowerCase(); }).filter(Boolean);
  if (!g || !g.target) return "";
  return (g.target === "yes" ? "Target: " : "Not targeted: ") + (parts.join(", ") || "not rated") + " (" + segScore(g) + "/12).";
}
function segScore(g) { var a = (g && g.att) || {}, n = 0; ATT.forEach(function (x) { if (a[x.k] !== undefined && a[x.k] !== "") n += (+a[x.k]) + 1; }); return n; }

/* ---------- positioning (taps, by business type) ---------- */
var POS = {
  travel: { ben: ["Easy planning", "Value for money", "A real local experience", "Comfort and rest", "Adventure and activities", "Safety for families", "Privacy"], cat: { stay: "guesthouse", dive: "dive centre", tours: "tour operator" },
    ax: [["price", "Price", "Lower price", "Higher price"], ["exp", "Experience", "A simple stay", "A full experience"], ["style", "Style", "More traditional", "More modern"], ["service", "Service", "More self-service", "More personal"], ["feel", "Feel", "More local", "More international"]] },
  food: { ben: ["Great taste", "Value for money", "Fast service", "Healthy choices", "A cosy place to meet", "Halal and trusted ingredients", "Easy delivery"], cat: { food: "cafe or restaurant" },
    ax: [["price", "Price", "Lower price", "Higher price"], ["quality", "Quality", "Simpler", "More premium"], ["speed", "Speed", "Slower", "Faster"], ["range", "Menu", "Smaller menu", "Bigger menu"], ["mood", "Atmosphere", "More casual", "More upscale"]] },
  retail: { ben: ["Low prices", "The latest trends", "Original, trusted products", "Wide choice", "Fast delivery", "Easy returns", "Friendly service"], cat: { retail: "shop" },
    ax: [["price", "Price", "Lower price", "Higher price"], ["range", "Range", "Fewer products", "More products"], ["quality", "Quality", "Basic", "More premium"], ["delivery", "Delivery", "Slower", "Faster"], ["style", "Style", "More classic", "More trendy"]] },
  service: { ben: ["Saves time", "Peace of mind", "Expert results", "Reliable and on time", "Costs less than doing it in-house", "Flexible times", "Local support"], cat: { service: "service provider" },
    ax: [["price", "Price", "Lower price", "Higher price"], ["speed", "Response", "Slower response", "Faster response"], ["expert", "Expertise", "More general", "More specialist"], ["service", "Service", "More standard", "More personal"], ["scope", "Scope", "One service", "A full package"]] }
};
var POS_DIFF = ["Lower price", "Better location", "Faster service", "More personal service", "Higher quality", "More choice", "Easier online booking or ordering", "Better reviews", "Local knowledge", "Eco-friendly"];
var POS_PROOF = ["Review score", "Years in business", "Awards or certifications", "Customer photos and stories", "A guarantee", "Well-known clients or partners", "My audit results"];
function posSet(type) { return POS[segCtx(type)]; }
function posAx(type, id) { var a = posSet(type).ax; for (var i = 0; i < a.length; i++) if (a[i][0] === id) return a[i]; return null; }
function posFields(st) {
  var P = (st.tm || {}).pos || {}, segs = (st.tm || {}).segs || [], g = segs.filter(function (x) { return x.id === P.seg; })[0];
  var lo = function (a) { return a.map(function (x) { return /^WhatsApp/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1); }); };
  return { "for": g ? g.name : "", need: chosen(P.need).length ? "want " + andJoin(lo(chosen(P.need))) : "", cat: P.cat || "", benefit: P.ben ? "gives them " + lo([P.ben])[0] : "",
    comp: P.comp || "", diff: chosen(P.diff).length ? "stand out for " + andJoin(lo(chosen(P.diff))) : "", proof: chosen(P.proof).length ? "of our " + andJoin(lo(chosen(P.proof))) + (P.fact ? " (" + P.fact + ")" : "") : "" };
}
function posText(st) {
  var f = posFields(st), d = function (x) { return x || "..."; };
  return "For " + d(f["for"]) + " who " + d(f.need) + ", " + (st.biz.name || "the business") + " is the " + d(f.cat) + " that " + d(f.benefit) + ". Unlike " + d(f.comp) + ", we " + d(f.diff) + ", because " + d(f.proof) + ".";
}
function posXY(r) { return r === "lo" ? 22 : r === "hi" ? 78 : 50; }

/* ---------- strategy activities (plain language). basis: Price list = Islandeative price list, At cost = paid straight to the platform or person, Market 2026 = a rough 2026 market estimate, Own time = no cash cost ---------- */
var STRAT_DESC = {
  web: "Your own website or blog: the place people check, book or order.",
  seo: "Being found on Google and Google Maps when people search.",
  content: "Regular posts, Reels and stories that keep people interested.",
  smads: "Paid ads on Facebook, Instagram or TikTok aimed at your segment.",
  banner: "Paid Google search and display ads.",
  email: "Messages to people who already know the business: email, SMS, WhatsApp, Viber.",
  infl: "Working with creators your segment already follows.",
  viral: "Giveaways, challenges and shareable posts that spread by word of mouth.",
  affil: "Partners who send you customers for a commission."
};
var FITS = ["My segment looks online before buying", "The audit found a gap here", "Low cost for a small business", "Builds trust and reviews", "Reaches new customers", "Brings past customers back", "Strong in the peak season", "Shows the product or place well"];
var FREQ = { once: "Once", month: "Every month", quarter: "Every 3 months", peak: "Peak season only (Nov to Apr)" };
var ACTS_BY = {
  web: [
    { id: "build", n: "Build a new mobile-friendly website", basis: "Market 2026", unit: 12000, f: ["once"], only: "nosite" },
    { id: "redo", n: "Redesign the existing website", basis: "Market 2026", unit: 8000, f: ["once"], only: "site" },
    { id: "host", n: "Domain and hosting", basis: "Market 2026", unit: 200, f: ["month"] },
    { id: "bookpage", n: "Booking or enquiry page", basis: "Price list", unit: 3500, f: ["once"] },
    { id: "blog", n: "Blog posts", basis: "Market 2026", unit: 400, f: ["month", "quarter"], count: [1, 2, 4] },
    { id: "otakit", n: "Booking platform kit (Booking.com and Agoda listings)", basis: "Price list", unit: 2500, f: ["once"], only: "travel" },
    { id: "menu", n: "Menu design", basis: "Price list", unit: 1500, f: ["once"], only: "food" }],
  seo: [
    { id: "onpage", n: "Fix page titles, descriptions and headings", basis: "Market 2026", unit: 3000, f: ["once"] },
    { id: "gbp", n: "Optimise the Google Business Profile", basis: "Price list", unit: 800, f: ["once"] },
    { id: "dirs", n: "List the business on local directories and maps", basis: "Market 2026", unit: 500, f: ["once"] },
    { id: "reviews", n: "Ask customers for Google reviews and reply to every review", basis: "Own time", unit: 0, f: ["month"] },
    { id: "tool", n: "SEO tool subscription", basis: "At cost", unit: 250, f: ["month"] }],
  content: [
    { id: "reelnew", n: "Reels with new filming", basis: "Price list", unit: 1000, f: ["month", "quarter", "peak"], count: [1, 2, 4, 8], disc: true },
    { id: "reelold", n: "Reels from existing footage", basis: "Price list", unit: 500, f: ["month", "quarter", "peak"], count: [1, 2, 4, 8], disc: true },
    { id: "post", n: "Static or carousel posts", basis: "Price list", unit: 250, f: ["month", "quarter", "peak"], count: [2, 4, 8, 12], disc: true },
    { id: "story", n: "Story sets", basis: "Price list", unit: 150, f: ["month", "quarter", "peak"], count: [2, 4, 8], disc: true },
    { id: "shoot", n: "Half-day photo and video shoot", basis: "Price list", unit: 2500, f: ["once", "quarter"] },
    { id: "canva", n: "Design tool (Canva Pro)", basis: "At cost", unit: 230, f: ["month"] }],
  smads: [
    { id: "meta", n: "Ad spend on Facebook and Instagram", basis: "At cost", unit: 2000, f: ["month", "peak"], amt: [1000, 2000, 3000, 5000], season: true },
    { id: "tiktok", n: "Ad spend on TikTok", basis: "At cost", unit: 1000, f: ["month", "peak"], amt: [500, 1000, 2000, 3000], season: true },
    { id: "plat", n: "Set up and run one extra platform", basis: "Price list", unit: 1000, f: ["month"] }],
  banner: [
    { id: "gmgmt", n: "Google Ads management", basis: "Price list", unit: 1500, f: ["month", "peak"] },
    { id: "gspend", n: "Google search and display ad spend", basis: "At cost", unit: 2000, f: ["month", "peak"], amt: [1000, 2000, 3000, 5000], season: true }],
  email: [
    { id: "setup", n: "Broadcast set-up with custom templates", basis: "Price list", unit: 2500, f: ["once"] },
    { id: "send", n: "Broadcast sends (email, SMS, WhatsApp, Viber)", basis: "Price list", unit: 150, f: ["month", "quarter", "peak"], count: [1, 2, 4] },
    { id: "bundle", n: "Campaign month bundle (all content and sends for one campaign)", basis: "Price list", unit: 2500, f: ["quarter", "peak"] },
    { id: "platform", n: "Email or SMS platform subscription", basis: "Market 2026", unit: 300, f: ["month"] }],
  infl: [
    { id: "camp", n: "Influencer campaign management", basis: "Price list", unit: 2000, f: ["once", "quarter"] },
    { id: "fee", n: "Influencer fee (micro-influencer)", basis: "Market 2026", unit: 3000, f: ["once", "quarter"] },
    { id: "pr", n: "PR submission to media", basis: "Price list", unit: 600, f: ["once", "quarter"] }],
  viral: [
    { id: "prize", n: "Giveaway or challenge prizes", basis: "Market 2026", unit: 1500, f: ["once", "quarter", "peak"] },
    { id: "reel", n: "Reel made for the campaign", basis: "Price list", unit: 1000, f: ["once", "quarter", "peak"], count: [1, 2, 4] },
    { id: "ugc", n: "Repost customer photos and videos", basis: "Own time", unit: 0, f: ["month"] }],
  affil: [
    { id: "links", n: "Partner tracking links and set-up", basis: "Market 2026", unit: 1500, f: ["once"] },
    { id: "comm", n: "Commission paid to partners", basis: "Market 2026", unit: 1000, f: ["month", "peak"] }]
};
function actsFor(sid, st) {
  var T = TBY[(st.biz || {}).type] || TBY.service, has = (st.site || {}).has === "yes";
  return (ACTS_BY[sid] || []).filter(function (a) {
    if (a.only === "nosite") return !has; if (a.only === "site") return has;
    if (a.only === "travel") return !!T.travel; if (a.only === "food") return T.group === "food"; return true;
  }).map(function (a) { var b = JSON.parse(JSON.stringify(a)); if (!T.season) b.f = b.f.filter(function (x) { return x !== "peak"; }); if (!b.f.length) b.f = ["month"]; return b; });
}
function lineActive(l, m) {
  if (m < l.start || m > l.end) return false;
  if (l.kind === "oneoff") return m === l.start;
  if (l.kind === "every") return (m - l.start) % (num(l.every) || 3) === 0;
  if (l.kind === "months") return (l.months || []).indexOf(m) >= 0;
  return true;
}

/* ---------- strategy programmes: how a business actually runs each one ----------
   Each strategy: flow (how it works), qs (choices; single unless multi), build(cfg, ctx) -> lines.
   Line: {name, basis, unit, qty, kind: oneoff|monthly|months|every, start, end, months, every, season, disc}
   basis: Price list (Islandeative), At cost (paid straight to the platform or person), Market 2026 (rough 2026 Maldives market estimate), Own time (no cash cost). */
function pMonths(pat, st, lab, season) {
  var out = [], i;
  if (pat === "always") for (i = st; i <= 12; i++) out.push(i);
  else if (pat === "peak") lab.forEach(function (m) { if (m.i >= st && isPeak(m.cal)) out.push(m.i); });
  else if (pat === "launch") for (i = st; i <= Math.min(12, st + 2); i++) out.push(i);
  else if (pat === "bursts") for (i = st; i <= 12; i += 3) out.push(i);
  if (!out.length) out.push(st);
  return out;
}
function spaced(n, st) { var out = [], gap = Math.max(1, Math.round((13 - st) / n)); for (var k = 0; k < n; k++) { var m = st + k * gap; if (m <= 12) out.push(m); } return out.length ? out : [st]; }
var MOMENTS = [["ramadan", "Ramadan and Eid", [2, 3]], ["school", "School holidays", [6, 12]], ["peak", "Start of peak season", [11]], ["year", "New Year", [1]], ["eidh", "Eid al-Adha", [5]]];
function momentMonths(keys, lab) { var out = []; MOMENTS.forEach(function (x) { if ((keys || {})[x[1]]) lab.forEach(function (m) { if (x[2].indexOf(m.cal) >= 0 && out.indexOf(m.i) < 0) out.push(m.i); }); }); return out.sort(function (a, b) { return a - b; }); }
function ML(name, basis, unit, qty, months, o) { o = o || {}; if (!months.length) return null; return { name: name, basis: basis, unit: unit, qty: qty, kind: "months", months: months.slice(), start: months[0], end: months[months.length - 1], disc: !!o.disc, season: !!o.season, f: o.f || "" }; }
function rng(a, b) { var o = []; for (var i = a; i <= Math.min(12, b); i++) o.push(i); return o; }
var PAT_ALL = [["always", "Always on (every month)"], ["launch", "Launch burst (first 3 months)"], ["bursts", "Campaign bursts (one month each quarter)"], ["peak", "Peak season push (November to April)"]];
var SCFG = {
  web: {
    flow: ["Plan the pages and the path to book or buy", "Build or redesign, mobile first", "Test on phones, then launch", "Keep it fresh with updates and articles"],
    qs: [
      { k: "bt", q: "How long will the build take?", o: [["1", "1 month"], ["2", "2 months"], ["3", "3 months"]], tip: "The cost is paid across the build months: a deposit, then stage payments." },
      { k: "extras", q: "What will the website include?", multi: true, opt: true, o: function (c) { var o = [["book", "Booking or enquiry page (MVR 3,500)"]]; if (c.travel) o.push(["ota", "Booking.com and Agoda listings set-up (MVR 2,500)"]); if (c.food) o.push(["menu", "Menu design (MVR 1,500)"]); return o; } },
      { k: "blog", q: "Articles on the website after launch", o: [["0", "None, updates only"], ["1", "1 article a month"], ["2", "2 articles a month"]], hide: function (c) { return c.contentArticles; }, tip: "Articles help people find the business on Google." }
    ],
    build: function (v, c) {
      var st = c.st, bt = +v.bt || 1, L = [], b = rng(st, st + bt - 1), price = c.hasSite ? 8000 : 12000, live = Math.min(12, st + bt);
      L.push(ML((c.hasSite ? "Redesign the website" : "Build a new website") + (b.length > 1 ? " (paid over " + b.length + " months)" : ""), "Market 2026", Math.round(price / b.length), 1, b));
      if (!c.hasSite) L.push(ML("Domain and hosting", "Market 2026", 200, 1, rng(st, 12)));
      var ex = v.extras || {};
      if (ex.book) L.push(ML("Booking or enquiry page", "Price list", 3500, 1, [b[b.length - 1]]));
      if (ex.ota) L.push(ML("Booking.com and Agoda listings set-up", "Price list", 2500, 1, [st]));
      if (ex.menu) L.push(ML("Menu design", "Price list", 1500, 1, [st]));
      if (+v.blog && !c.contentArticles) L.push(ML("Website articles (" + v.blog + " a month)", "Market 2026", 400, +v.blog, rng(live, 12)));
      return L;
    }
  },
  seo: {
    flow: ["Fix the website basics: titles, descriptions, speed", "Claim and complete the Google Business Profile", "Get listed on maps and local directories", "Earn reviews and reply to every one", "Check rankings and profile views every month"],
    qs: [
      { k: "setup", q: "Set-up tasks", multi: true, o: function (c) { var o = []; if (c.hasSite || c.webOn) o.push(["onpage", "Fix website titles, descriptions and speed (about MVR 3,000)"]); o.push(["gbp", "Optimise the Google Business Profile (MVR 800)"]); o.push(["dirs", "List on maps and local directories (about MVR 500)"]); return o; } },
      { k: "reviews", q: "Reviews routine", o: [["team", "Business team asks every customer and replies to all reviews (no cost)"], ["none", "No routine"]] },
      { k: "tool", q: "Track rankings with an SEO tool?", o: [["yes", "Yes, about MVR 250 a month"], ["no", "No, use free Google tools"]] }
    ],
    build: function (v, c) {
      var st = c.st, L = [], s = v.setup || {};
      if (s.onpage) L.push(ML("Fix website titles, descriptions and speed", "Market 2026", 3000, 1, [Math.min(12, c.webLive || st)]));
      if (s.gbp) L.push(ML("Optimise the Google Business Profile", "Price list", 800, 1, [st]));
      if (s.dirs) L.push(ML("List on maps and local directories", "Market 2026", 500, 1, [st]));
      if (v.reviews === "team") L.push(ML("Ask for reviews and reply to all", "Own time", 0, 1, rng(st, 12)));
      if (v.tool === "yes") L.push(ML("SEO tool subscription", "At cost", 250, 1, rng(st, 12)));
      return L;
    }
  },
  content: {
    flow: ["One idea becomes a pillar piece (article, video or photo set)", "Cut it into carousels with the key points", "Cut the video into short Reels", "Post stories every day: behind the scenes, polls, reposts", "Check what worked and plan next week's idea"],
    qs: [
      { k: "pillar", q: "What is the pillar piece?", o: [["article", "A blog article on the website"], ["video", "A short video shoot"], ["photos", "A photo set"]], tip: "One main piece that everything else is cut from." },
      { k: "rhythm", q: "Posting rhythm", o: [["starter", "Starter: 1 carousel and 1 Reel a week, stories 3 days a week"], ["steady", "Steady: 2 carousels and 2 Reels a week, stories every day"], ["strong", "Strong: 3 carousels and 3 Reels a week, stories every day"]] },
      { k: "film", q: "Who films?", o: [["phone", "The business films on phones, the agency edits (Reel MVR 500)"], ["agency", "The agency films and edits (Reel MVR 1,000)"]] },
      { k: "stories", q: "Who makes the daily stories?", o: [["team", "The business team (no cost)"], ["agency", "The agency (MVR 150 a set)"]] },
      { k: "shoot", q: "Professional shoot every 3 months?", o: [["yes", "Yes (MVR 2,500 each)"], ["no", "No"]] }
    ],
    build: function (v, c) {
      var st = c.st, ms = rng(st, 12), R = { starter: [2, 4, 4, 13], steady: [4, 9, 9, 30], strong: [4, 13, 13, 30] }[v.rhythm || "steady"], L = [];
      var pil = { article: ["Pillar: blog article", "Market 2026", 400], video: ["Pillar: video", "Price list", v.film === "agency" ? 1000 : 500], photos: ["Pillar: photo set", "Own time", 0] }[v.pillar || "article"];
      if (v.pillar === "photos" && v.film === "agency") L.push(ML("Pillar: monthly photo shoot", "Price list", 2500, 1, ms));
      else L.push(ML(pil[0] + " (" + R[0] + " a month)", pil[1], pil[2], R[0], ms));
      L.push(ML("Carousels (" + R[1] + " a month)", "Price list", 250, R[1], ms, { disc: true }));
      L.push(ML("Reels (" + R[2] + " a month)", "Price list", v.film === "agency" ? 1000 : 500, R[2], ms, { disc: true }));
      L.push(v.stories === "agency" ? ML("Story sets (" + R[3] + " a month)", "Price list", 150, R[3], ms, { disc: true }) : ML("Daily stories by the business team", "Own time", 0, 1, ms));
      if (v.shoot === "yes") L.push(ML("Professional half-day shoot", "Price list", 2500, 1, [st, st + 3, st + 6, st + 9].filter(function (m) { return m <= 12; })));
      return L;
    }
  },
  smads: {
    flow: ["Pick the target segment and one clear offer", "Make 2 or 3 ad versions to test", "Run for 2 weeks, keep the winner", "Retarget people who watched or messaged", "Report the cost per message or booking"],
    qs: [
      { k: "plat", q: "Where will the ads run?", multi: true, o: [["meta", "Facebook and Instagram"], ["tiktok", "TikTok"]] },
      { k: "pat", q: "When will the ads run?", o: function (c) { return PAT_ALL.filter(function (p) { return p[0] !== "peak" || c.season; }); } },
      { k: "amt", q: "Ad budget in each month it runs (all platforms)", o: [["1000", "MVR 1,000"], ["2000", "MVR 2,000"], ["3000", "MVR 3,000"], ["5000", "MVR 5,000"]], tip: "Paid straight to Meta or TikTok on the business's card." },
      { k: "creative", q: "Ad videos", o: [["engine", "Use videos from the content plan (no extra cost)"], ["new", "Make 2 new ad videos for each run (MVR 1,000 each)"]] },
      { k: "who", q: "Who runs the ads?", o: [["team", "The business team (no cost)"], ["agency", "An agency (about MVR 1,500 a month)"]] }
    ],
    build: function (v, c) {
      var ms = pMonths(v.pat || "always", c.st, c.lab), pl = Object.keys(v.plat || {}).filter(function (k) { return v.plat[k]; }), L = [], amt = +v.amt || 0;
      pl.forEach(function (p) { L.push(ML("Ad spend on " + (p === "meta" ? "Facebook and Instagram" : "TikTok"), "At cost", Math.round(amt / pl.length), 1, ms, { season: v.pat === "always" })); });
      if (v.creative === "new") { var firsts = ms.filter(function (m, i) { return i === 0 || ms[i - 1] !== m - 1; }); L.push(ML("New ad videos (2 for each run)", "Price list", 1000, 2, firsts)); }
      if (v.who === "agency") L.push(ML("Ad management", "Market 2026", 1500, 1, ms));
      return L;
    }
  },
  banner: {
    flow: ["Choose the words people search for", "Write ads that match those words", "Send clicks to a page where they can book or buy", "Show banner ads to people who visited (retargeting)", "Track the cost per enquiry and cut what does not work"],
    qs: [
      { k: "type", q: "Which Google ads?", multi: true, o: [["search", "Search ads (when people search)"], ["display", "Display banners and retargeting"]] },
      { k: "pat", q: "When will the ads run?", o: function (c) { return PAT_ALL.filter(function (p) { return p[0] !== "peak" || c.season; }); } },
      { k: "amt", q: "Ad budget in each month it runs", o: [["1000", "MVR 1,000"], ["2000", "MVR 2,000"], ["3000", "MVR 3,000"], ["5000", "MVR 5,000"]], tip: "Paid straight to Google." },
      { k: "who", q: "Who manages the ads?", o: [["agency", "Islandeative Google Ads management (MVR 1,500 a month)"], ["team", "The business team (no cost)"]] }
    ],
    build: function (v, c) {
      var ms = pMonths(v.pat || "always", c.st, c.lab), ty = Object.keys(v.type || {}).filter(function (k) { return v.type[k]; }), L = [], amt = +v.amt || 0;
      ty.forEach(function (t) { L.push(ML("Google " + (t === "search" ? "search" : "display") + " ad spend", "At cost", Math.round(amt / ty.length), 1, ms, { season: v.pat === "always" })); });
      if (v.who === "agency") L.push(ML("Google Ads management", "Price list", 1500, 1, ms));
      return L;
    }
  },
  email: {
    flow: ["Collect contacts with permission: bookings, WhatsApp, forms", "Set up templates and contact lists once", "Send useful messages to each segment", "Run a campaign at key moments", "Check opens, clicks and replies"],
    qs: [
      { k: "ch", q: "Which channels?", multi: true, o: [["email", "Email"], ["sms", "SMS"], ["wa", "WhatsApp"], ["viber", "Viber"]] },
      { k: "rh", q: "Regular messages", o: [["1", "1 a month"], ["2", "2 a month"], ["4", "Every week"]], tip: "Each message set is sent across every channel you picked (MVR 150 a set)." },
      { k: "mom", q: "Campaigns for key moments", multi: true, opt: true, o: function (c) { return MOMENTS.filter(function (x) { return x[0] !== "peak" || c.season; }).map(function (x) { return [x[1], x[1]]; }); }, tip: "Each campaign month costs MVR 2,500 for all its messages and designs. Months are approximate." },
      { k: "plat", q: "Sending platform", o: [["free", "Free tools (WhatsApp Business, free email plan)"], ["paid", "Paid platform (about MVR 300 a month)"]] }
    ],
    build: function (v, c) {
      var st = c.st, L = [];
      L.push(ML("Broadcast set-up with templates", "Price list", 2500, 1, [st]));
      L.push(ML("Regular messages (" + (+v.rh || 1) + " a month)", "Price list", 150, +v.rh || 1, rng(Math.min(12, st + 1), 12)));
      var mm = momentMonths(v.mom, c.lab).filter(function (m) { return m >= st; });
      if (mm.length) L.push(ML("Key-moment campaigns", "Price list", 2500, 1, mm));
      if (v.plat === "paid") L.push(ML("Sending platform subscription", "Market 2026", 300, 1, rng(st, 12)));
      return L;
    }
  },
  infl: {
    flow: ["Shortlist creators the segment already follows", "Agree a brief, the posts and the content rights", "Host them or send the product", "They post; the business reposts and tracks a code or link", "Compare the cost per new follower or booking"],
    qs: [
      { k: "size", q: "Size of creator", o: [["nano", "Nano: under 10k followers (about MVR 1,000)"], ["micro", "Micro: 10k to 50k (about MVR 3,000)"], ["mid", "Mid: 50k to 200k (about MVR 8,000)"]], tip: "Smaller creators often get more engagement and trust for less money." },
      { k: "n", q: "Campaigns in the year", o: [["1", "1"], ["2", "2"], ["4", "4 (one a quarter)"]] },
      { k: "pr", q: "Send a press release with each campaign?", o: [["yes", "Yes (MVR 600 each)"], ["no", "No"]] }
    ],
    build: function (v, c) {
      var ms = spaced(+v.n || 1, c.st), fee = { nano: 1000, micro: 3000, mid: 8000 }[v.size || "micro"], L = [];
      L.push(ML("Influencer fee (" + (v.size || "micro") + " creator)", "Market 2026", fee, 1, ms));
      L.push(ML("Influencer campaign management", "Price list", 2000, 1, ms));
      if (v.pr === "yes") L.push(ML("Press release to media", "Price list", 600, 1, ms));
      return L;
    }
  },
  viral: {
    flow: ["Pick an idea people want to share: a challenge, giveaway or trend", "Set simple rules and a prize", "Launch with a Reel and stories", "Push it with a small ad or a creator", "Repost entries and thank the winners in public"],
    qs: [
      { k: "idea", q: "Type of idea", o: [["give", "Giveaway"], ["chal", "Challenge or trend"], ["ugc", "Customer photo or video contest"]] },
      { k: "n", q: "Campaigns in the year", o: [["1", "1"], ["2", "2"], ["4", "4 (one a quarter)"]] },
      { k: "prize", q: "Prize value for each campaign", o: [["500", "MVR 500"], ["1500", "MVR 1,500"], ["3000", "MVR 3,000"]] },
      { k: "boost", q: "Boost each launch with an ad?", o: [["1000", "Yes, MVR 1,000"], ["0", "No"]] }
    ],
    build: function (v, c) {
      var ms = spaced(+v.n || 1, c.st), L = [];
      L.push(ML("Prizes", "Market 2026", +v.prize || 1500, 1, ms));
      L.push(ML("Launch Reel", "Price list", 1000, 1, ms));
      if (+v.boost) L.push(ML("Launch ad boost", "At cost", +v.boost, 1, ms));
      L.push(ML("Repost entries and reply", "Own time", 0, 1, rng(c.st, 12)));
      return L;
    }
  },
  affil: {
    flow: ["Choose partners who already reach the segment", "Give each partner a link or code", "Pay a commission only when a sale comes in", "Check the sales and pay partners every month"],
    qs: [
      { k: "who", q: "Who are the partners?", multi: true, o: [["hotels", "Hotels and guesthouses"], ["agents", "Travel agents"], ["creators", "Bloggers and creators"], ["local", "Other local businesses"], ["refer", "Customers who refer friends"]] },
      { k: "rate", q: "Commission", o: [["5", "5% of each sale"], ["10", "10%"], ["15", "15%"]] },
      { k: "sales", q: "Expected partner sales a month", o: [["5000", "MVR 5,000"], ["10000", "MVR 10,000"], ["20000", "MVR 20,000"]], tip: "A guess you will explain in your report. Commission is only paid on real sales." }
    ],
    build: function (v, c) {
      var st = c.st, L = [];
      L.push(ML("Partner links and tracking set-up", "Market 2026", 1500, 1, [st]));
      L.push(ML("Commission to partners (" + (v.rate || 10) + "% of MVR " + (+v.sales || 5000).toLocaleString("en-US") + ")", "At cost", Math.round((+v.rate || 10) / 100 * (+v.sales || 5000)), 1, rng(Math.min(12, st + 1), 12)));
      return L;
    }
  }
};
function scQs(id, c) { return SCFG[id].qs.filter(function (q) { return !(q.hide && q.hide(c)); }).map(function (q) { return { k: q.k, q: q.q, multi: !!q.multi, opt: !!q.opt, tip: q.tip, o: typeof q.o === "function" ? q.o(c) : q.o }; }); }
function scLines(id, v, c) { return SCFG[id].build(v || {}, c).filter(Boolean); }
var OBJ_TYPES = [["aware", "Awareness: more people know the business"], ["engage", "Engagement: people interact and trust it"], ["sales", "Leads and sales: people enquire, book or buy"]];
var KPIS = {
  aware: [["Instagram followers", ""], ["TikTok followers", ""], ["Monthly reach", ""], ["Google profile views a month", ""], ["Website visitors a month", ""]],
  engage: [["Engagement rate", "%"], ["Saves and shares per post", ""], ["Messages a month", ""], ["Reviews a month", ""], ["Average review rating", " points"]],
  sales: [["Bookings or orders a month", ""], ["Share of bookings made direct", "%"], ["Website enquiries a month", ""], ["Conversion rate", "%"], ["Monthly online sales", " MVR"]]
};

function stratCtx(st, sid) {
  var T = TBY[(st.biz || {}).type] || TBY.service, P = st.plan || {}, cfg = P.cfg || {}, on = {}; (P.strats || []).forEach(function (x) { on[x.id] = x.on; });
  var w = cfg.web || {}, ct = cfg.content || {};
  return { st: clamp(+((cfg[sid] || {}).st) || 1, 1, 12), lab: monthLabels((st.biz || {}).start), season: !!T.season, travel: !!T.travel, food: T.group === "food", hasSite: (st.site || {}).has === "yes",
    webOn: !!on.web, webLive: on.web ? Math.min(12, (+w.st || 1) + (+w.bt || 1)) : 0, contentArticles: !!on.content && (ct.pillar || "") === "article" };
}
function scChoices(id, v, c) {
  return scQs(id, c).map(function (q) {
    var val = (v || {})[q.k]; if (val == null || val === "") return "";
    var lab = q.multi ? q.o.filter(function (x) { return val[x[0]]; }).map(function (x) { return x[1]; }).join(", ") : (q.o.filter(function (x) { return x[0] === String(val); })[0] || [])[1];
    return lab ? q.q.replace(/\?$/, "") + ": " + lab : "";
  }).filter(Boolean);
}

var WRITE_GUIDE = [
  ["Executive summary and introduction", 500, "Write last. Say the business, the period, the three objectives, the strategies and the total budget."],
  ["Situational analysis", 2200, "Company, SWOT, PESTEL, competitors and market. Use the audit results and screenshots as your evidence for the website, social media and past promotions."],
  ["Target markets", 900, "Explain why you chose these bases of segmentation, why these segments, and what each persona tells you to do. Cite research behind your persona."],
  ["Objectives", 400, "Defend each target with your baseline and a reason it is achievable."],
  ["Strategies", 2400, "For each strategy: theory, how it works step by step, what content or tools, who it reaches, and how it supports an objective."],
  ["Website redesign or new website", 600, "Sitemap, key pages, features and why each one helps the target segment."],
  ["Implementation (Gantt chart)", 400, "Explain the phases, the order and the overlaps."],
  ["Budget", 400, "Justify the big lines and attach the quotes. Explain the contingency."],
  ["Control and evaluation", 400, "Explain how and when you will check, and what you will do if a target is missed."],
  ["Conclusion, AI use statement, references", 300, "Keep the AI use statement honest and list every source you cite."]
];
G.SA = { SCFG: SCFG, scQs: scQs, scLines: scLines, stratCtx: stratCtx, scChoices: scChoices, OBJ_TYPES: OBJ_TYPES, KPIS: KPIS, STRAT_DESC: STRAT_DESC, FITS: FITS, FREQ: FREQ, ACTS_BY: ACTS_BY, actsFor: actsFor, lineActive: lineActive, segReason: segReason, POS: POS, POS_DIFF: POS_DIFF, POS_PROOF: POS_PROOF, posSet: posSet, posAx: posAx, posFields: posFields, posText: posText, posXY: posXY, SEGSETS: SEGSETS, segQs: segQs, segWho: segWho, isB2B: isB2B, plists: plists, chosen: chosen, ATT: ATT, BASIS: BASIS, PGOAL: PGOAL, PPAIN: PPAIN, PTRIG: PTRIG, ACTS: ACTS, picks: picks, andJoin: andJoin, segText: segText, segScore: segScore, WRITE_GUIDE: WRITE_GUIDE, PLATS: PLATS, PBY: PBY, TYPES: TYPES, TBY: TBY, GBP_CHECKS: GBP_CHECKS, SITE_GROUPS: SITE_GROUPS, SITE_CHECKS: SITE_CHECKS, STRATS: STRATS, SBY: SBY, THEMES: THEMES,
  repPlatforms: repPlatforms, LAST_BANDS: LAST_BANDS, CBANDS: CBANDS, engAvg: engAvg, engCount: engCount, FREQ_BANDS: FREQ_BANDS, audit: audit, makeObjectives: makeObjectives, makeStrategies: makeStrategies, budget: budget, evalRows: evalRows, milestones: milestones,
  monthLabels: monthLabels, arr: arr, isPeak: isPeak, cls: cls, num: num, mvr: mvr, ymd: ymd, daysBetween: daysBetween, clamp: clamp, lineCost: lineCost };
})(typeof window !== "undefined" ? window : globalThis);
