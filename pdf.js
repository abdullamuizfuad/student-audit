/* Islandeative Student Audit: PDF report. Made in the browser with jsPDF. Nothing is uploaded. */
(function () {
"use strict";
var SA = window.SA;
var FONT_FILES = { ax: "pdf/archivo-xbi.ttf", fr: "pdf/figtree-400.ttf", fb: "pdf/figtree-700.ttf" };
var FONTS = null, LOGO = null;
function b64(buf) { var u = new Uint8Array(buf), bin = ""; for (var i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(bin); }
function loadFonts() {
  if (FONTS) return Promise.resolve(FONTS);
  var out = {}, keys = Object.keys(FONT_FILES);
  return Promise.all(keys.map(function (k) { return fetch(FONT_FILES[k]).then(function (r) { return r.arrayBuffer(); }).then(function (b) { out[k] = b64(b); }); })).then(function () { FONTS = out; return out; }, function () { FONTS = {}; return FONTS; });
}
function loadLogo() {
  if (LOGO !== null) return Promise.resolve(LOGO);
  return fetch("assets/logo.png").then(function (r) { return r.arrayBuffer(); }).then(function (b) { LOGO = "data:image/png;base64," + b64(b); return LOGO; }, function () { LOGO = ""; return LOGO; });
}
function imgSize(src) { return new Promise(function (res) { var i = new Image(); i.onload = function () { res({ w: i.width, h: i.height }); }; i.onerror = function () { res(null); }; i.src = src; }); }
function safe(s) { return String(s == null ? "" : s).replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...").replace(/[^\n -~ -ÿ]/g, ""); }

window.SA_PDF = function (S, IMG) {
  return Promise.all([loadFonts(), loadLogo(), Promise.all(Object.keys(IMG || {}).map(function (k) { return imgSize(IMG[k]).then(function (d) { return [k, d]; }); }))]).then(function (r) {
    var dims = {}; r[2].forEach(function (x) { dims[x[0]] = x[1]; });
    return build(S, IMG || {}, r[0], r[1], dims);
  });
};

function build(S, IMG, fonts, logo, dims) {
  var J = window.jspdf.jsPDF, doc = new J({ unit: "mm", format: "a4", compress: true }), W = 210, M = 18, CW = W - 2 * M, y = 24, TOP = 24, BOT = 277;
  var fontsOk = false;
  try {
    doc.addFileToVFS("ax.ttf", fonts.ax); doc.addFont("ax.ttf", "Archivo", "bolditalic");
    doc.addFileToVFS("fr.ttf", fonts.fr); doc.addFont("fr.ttf", "Figtree", "normal");
    doc.addFileToVFS("fb.ttf", fonts.fb); doc.addFont("fb.ttf", "Figtree", "bold");
    fontsOk = !!(fonts.ax && fonts.fr && fonts.fb);
  } catch (e) { fontsOk = false; }
  var LF = 1.3; doc.setLineHeightFactor(LF);
  function lh(sz) { return sz * 0.35278 * LF; }
  function F(k, size, col) {
    if (fontsOk) doc.setFont(k === "ax" ? "Archivo" : "Figtree", k === "ax" ? "bolditalic" : k === "fb" ? "bold" : "normal");
    else doc.setFont("helvetica", k === "fr" ? "normal" : k === "ax" ? "bolditalic" : "bold");
    doc.setFontSize(size); if (col) doc.setTextColor(col[0], col[1], col[2]);
  }
  function fill(c) { doc.setFillColor(c[0], c[1], c[2]); }
  function stroke(c) { doc.setDrawColor(c[0], c[1], c[2]); }
  function tint(c, t) { return [Math.round(c[0] + (255 - c[0]) * t), Math.round(c[1] + (255 - c[1]) * t), Math.round(c[2] + (255 - c[2]) * t)]; }
  var ACC = [36, 85, 130], INK = [29, 43, 52], MUT = [99, 113, 124], WHITE = [255, 255, 255], LINE = [214, 222, 228];
  var COL = { good: [46, 139, 87], warn: [201, 138, 27], bad: [209, 80, 63] };
  var SCOL = { web: [36, 85, 130], seo: [42, 130, 187], content: [47, 169, 169], smads: [63, 158, 116], banner: [28, 63, 99], email: [95, 168, 211], infl: [31, 127, 127], viral: [124, 201, 166], affil: [122, 147, 168] };
  var A = SA.audit(S), B = SA.budget(S.plan, S.biz), lab = B.labels, T = SA.TBY[S.biz.type] || SA.TBY.service;
  var f0 = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var tx = function (s, x, yy, o) { doc.text(safe(s), x, yy, o); };
  var split = function (s, w) { return doc.splitTextToSize(safe(s), w); };

  doc.setProperties({ title: "Digital presence audit: " + safe(S.biz.name), author: safe(S.biz.student) || "Student", subject: "Student audit evidence and 12-month plan (student-authored, structured by the tool)", creator: "Islandeative Student Audit" });

  function room(h) { if (y + h > BOT) { doc.addPage(); y = TOP; } }
  function head(t, sub) { room(30); fill(ACC); doc.roundedRect(M, y - 5.4, 1.5, 7.4, 0.75, 0.75, "F"); F("ax", 15, INK); tx(t, M + 5, y); y += 8; if (sub) { F("fr", 9.5, MUT); var l = split(sub, CW); tx(l.join("\n"), M, y); y += l.length * lh(9.5) + 2; } y += 1; }
  function h3(t, col) { room(14); F("fb", 10.5, col || ACC); tx(t, M, y); y += 5.6; }
  function para(t, o) {
    o = o || {}; var sz = o.size || 9.5, w = CW - (o.ind || 0); F(o.bold ? "fb" : "fr", sz, o.col || INK);
    var ln = split(t, w); room(ln.length * lh(sz) + 2); F(o.bold ? "fb" : "fr", sz, o.col || INK);
    if (o.bullet) { fill(ACC); doc.circle(M + 1.2, y - 1.1, 0.75, "F"); }
    tx(ln.join("\n"), M + (o.ind || 0) + (o.bullet ? 4.5 : 0) - (o.bullet ? 0 : 0), y); y += ln.length * lh(sz) + (o.gap == null ? 2.6 : o.gap);
  }
  function bullets(list, o) { o = o || {}; list.forEach(function (t) { para(t, { bullet: true, size: o.size, gap: 1.8, col: o.col }); }); y += 1; }
  function pill(x, yy, t, c, w) { fill(c); doc.roundedRect(x, yy, w, 5.2, 2.6, 2.6, "F"); F("fb", 7, WHITE); tx(t, x + w / 2, yy + 3.7, { align: "center" }); }
  function poly(pts, style) { var d = []; for (var k = 1; k < pts.length; k++) d.push([pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]]); doc.lines(d, pts[0][0], pts[0][1], [1, 1], style, true); }
  function ring(cx, cy, r1, r0, v, col, track) {
    function arc(a0, a1) { var p = [], k, N = 40; for (k = 0; k <= N; k++) { var a = a0 + (a1 - a0) * k / N; p.push([cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)]); } for (k = N; k >= 0; k--) { var b = a0 + (a1 - a0) * k / N; p.push([cx + r0 * Math.cos(b), cy + r0 * Math.sin(b)]); } return p; }
    fill(track); poly(arc(-Math.PI / 2, Math.PI * 1.5 - 0.001), "F");
    if (v > 0) { fill(col); poly(arc(-Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * Math.min(v, 99.6) / 100), "F"); }
  }

  /* generic table. cols: [{w, al, h}], rows: arrays of strings or {t, b, c} */
  function table(cols, rows, o) {
    o = o || {}; var sz = o.size || 8.5, pad = 1.7, tw = cols.reduce(function (s, c) { return s + c.w; }, 0);
    function header() {
      room(12); fill(tint(ACC, 0.9)); doc.rect(M, y - 3.8, tw, 6.2, "F"); F("fb", 7.5, ACC); var x = M;
      cols.forEach(function (c) { tx(c.h || "", c.al === "r" ? x + c.w - pad : x + pad, y, c.al === "r" ? { align: "right" } : undefined); x += c.w; }); y += 4.6;
    }
    header();
    rows.forEach(function (row) {
      var cells = row.map(function (c, i) { var o2 = typeof c === "object" && c ? c : { t: c }; F(o2.b ? "fb" : "fr", sz); return { ln: split(o2.t == null ? "" : o2.t, cols[i].w - 2 * pad), o: o2 }; });
      var n = Math.max.apply(null, cells.map(function (c) { return c.ln.length; })), rh = n * lh(sz) + 2 * pad - 0.6;
      if (y - 3.2 + rh > BOT) { doc.addPage(); y = TOP; header(); }
      var x = M; if (o.zebra && rows.indexOf(row) % 2) { fill([246, 249, 251]); doc.rect(M, y - 3.4, tw, rh, "F"); }
      cells.forEach(function (c, i) {
        F(c.o.b ? "fb" : "fr", sz, c.o.c || INK);
        tx(c.ln.join("\n"), cols[i].al === "r" ? x + cols[i].w - pad : x + pad, y, cols[i].al === "r" ? { align: "right" } : undefined); x += cols[i].w;
      });
      stroke(LINE); doc.setLineWidth(0.15); doc.line(M, y - 3.4 + rh, M + tw, y - 3.4 + rh); y += rh;
    });
    y += 3;
  }

  /* ---------- page 1: title and scores ---------- */
  var tier = A.overall >= 75 ? "good" : A.overall >= 50 ? "warn" : "bad";
  fill(ACC); doc.rect(0, 22, W, 46, "F");
  F("fb", 7.5, [200, 225, 240]); tx("STUDENT AUDIT  |  CHECKED " + S.biz.checked, M, 31);
  F("ax", 22, WHITE); var tl = split(S.biz.name, 120); tx(tl.slice(0, 2).join("\n"), M, 40);
  F("fr", 10, WHITE); tx("Digital presence audit and 12-month plan", M, tl.length > 1 ? 56 : 48);
  F("fr", 9, [210, 230, 242]); tx("Prepared by " + (S.biz.student || "student") + (S.biz.sid ? "  |  " + S.biz.sid : "") + (S.biz.email ? "  |  " + S.biz.email : ""), M, tl.length > 1 ? 62 : 55);
  fill(WHITE); doc.circle(W - M - 20, 45, 17, "F"); ring(W - M - 20, 45, 16, 12.5, A.overall, COL[tier], [232, 238, 242]);
  F("ax", 26, INK); tx(String(A.overall), W - M - 20, 48.5, { align: "center" }); F("fb", 6.5, MUT); tx("OUT OF 100", W - M - 20, 53.5, { align: "center" });
  y = 78;
  fill(tint([201, 138, 27], 0.82)); doc.roundedRect(M, y - 5, CW, 13, 3, 3, "F");
  F("fb", 8.5, [90, 62, 4]); tx("STUDENT-AUTHORED PLAN, STRUCTURED AND COSTED BY THE TOOL", M + 4, y);
  F("fr", 8.5, [90, 62, 4]); var nl = split("The audit scores come from fixed rules applied to what the student observed. The target market, personas, objectives, strategy reasoning and evaluation plan were written by the student. The tool laid them out and calculated the Gantt chart and the budget." + (S.code ? " Submission code " + S.code + "." : ""), CW - 8); tx(nl.join("\n"), M + 4, y + 4); y += 20;

  head("Digital visibility score", "Weights: social media 30, Google profile 20, website 25, reviews 25. A part that does not apply is left out and the rest are re-weighted. Anything missing counts as zero.");
  var areas = [["Social media", A.social.score, 30], ["Google Business Profile", A.gbp.score, 20], ["Website", A.site.score, 25], ["Reviews and reputation", A.rep.score, 25]];
  areas.forEach(function (a) {
    room(11); F("fb", 9.5, INK); tx(a[0], M, y); F("fr", 8, MUT); tx("weight " + a[2] + "%", M + 52, y);
    if (a[1] == null) { F("fr", 9, MUT); tx("Not counted for this business", M + 85, y); }
    else { fill([232, 238, 242]); doc.roundedRect(M + 85, y - 3, 64, 3.6, 1.8, 1.8, "F"); fill(COL[SA.cls(a[1])]); doc.roundedRect(M + 85, y - 3, Math.max(2, 64 * a[1] / 100), 3.6, 1.8, 1.8, "F"); F("fb", 9.5, INK); tx(a[1] + "/100", M + CW, y, { align: "right" }); }
    y += 8.2;
  });
  y += 2;
  head("Where the business is failing", "The biggest gaps first, ranked by how many points of the overall score they cost.");
  A.findings.slice(0, 12).forEach(function (f, i) { para((i + 1) + ". " + f.text, { gap: 2 }); });
  if (!A.findings.length) para("No major gaps found.");

  /* ---------- audit detail ---------- */
  doc.addPage(); y = TOP;
  head("Audit detail: social media");
  table([{ w: 30, h: "Platform" }, { w: 30, h: "Status" }, { w: 20, h: "Followers", al: "r" }, { w: 18, h: "Posts/30d", al: "r" }, { w: 20, h: "Engagement", al: "r" }, { w: 14, h: "Score", al: "r" }, { w: 42, h: "Main issue" }],
    A.social.plats.map(function (p) {
      return [{ t: p.name, b: true }, p.missing ? "Business does not have it" : p.status === "dormant" ? "Not really used" : "Active", p.missing ? "-" : f0(p.followers || 0), p.posts == null ? "-" : String(p.posts), p.er == null ? "-" : p.er.toFixed(2) + "%", { t: String(p.score), b: true, c: COL[SA.cls(p.score)] }, (p.notes[0] || "").slice(0, 80)];
    }), { zebra: true });
  para("Engagement is average likes plus comments per post divided by followers. Benchmarks per platform are the typical engagement and healthy posts per month in the scoring rules in Appendix C.", { size: 8, col: MUT });

  head("Audit detail: Google Business Profile");
  if (A.gbp.na) para("Not counted. The business has no customer-facing location.");
  else if (A.gbp.missing) para("The business has no Google Business Profile. For a business that serves customers on location this counts as a zero.", { col: COL.bad, bold: true });
  else {
    para("Score " + A.gbp.score + "/100. Status: " + (A.gbp.status === "yes" ? "claimed" : "not claimed") + ".", { bold: true });
    table([{ w: 120, h: "Check" }, { w: 54, h: "Answer" }], A.gbp.items.map(function (i) { var ans = i.v === 1 ? "Yes" : i.v === 0.5 ? "Partly" : i.v === 0 ? "No" : "Can't tell"; return [i.c.q, { t: ans, b: true, c: i.v === 1 ? COL.good : i.v === 0 ? COL.bad : i.v === 0.5 ? COL.warn : MUT }]; }), { zebra: true, size: 7.8 });
  }

  head("Audit detail: website");
  if (A.site.none) {
    para("The business has no website. The tool scored how well other places do a website's job (maximum 40): " + A.site.score + "/100.", { bold: true });
    bullets(A.site.notes.slice(1).map(function (n) { return n; }));
    para("Because there is no website, the plan below recommends building a new one.", { col: ACC, bold: true });
  } else {
    para("Address: " + (S.site.url || "-") + ".  Overall website score " + A.site.score + "/100." + (SA.num(S.site.perf) != null ? "  PageSpeed mobile performance " + S.site.perf + "." : "") + (SA.num(S.site.seo) != null ? "  PageSpeed SEO " + S.site.seo + "." : ""), { bold: true });
    table([{ w: 94, h: "Area" }, { w: 22, h: "Weight", al: "r" }, { w: 22, h: "Score", al: "r" }, { w: 36, h: "Rating" }], A.site.groups.map(function (g) { return [{ t: g.name, b: true }, g.w + "%", g.score == null ? "-" : String(g.score), g.score == null ? "Not counted" : g.score >= 75 ? "Good" : g.score >= 50 ? "Needs work" : "Weak"]; }), { zebra: true });
    h3("Checks that failed or only partly passed");
    var fails = [];
    A.site.groups.forEach(function (g) { g.items.forEach(function (i) { if (i.v === 0 || i.v === 0.5) fails.push([(i.v === 0 ? "No: " : "Partly: ") + i.c.q, g.name]); }); });
    if (fails.length) table([{ w: 124, h: "Check" }, { w: 50, h: "Area" }], fails, { zebra: true, size: 7.5 }); else para("Every counted check passed.");
  }

  head("Audit detail: reviews");
  if (A.rep.score == null) para(T.id === "tours" ? "Not counted. Tour operators are not scored on review pages." : "Not counted for this business.");
  else {
    table([{ w: 28, h: "Platform" }, { w: 24, h: "Rating" }, { w: 20, h: "Reviews", al: "r" }, { w: 28, h: "Newest review" }, { w: 22, h: "Owner replies" }, { w: 14, h: "Score", al: "r" }, { w: 38, h: "Main issue" }],
      A.rep.plats.map(function (p) {
        if (p.excluded) return [{ t: p.name, b: true }, "Not required", "-", "-", "-", "-", "No customer location"];
        if (p.missing) return [{ t: p.name, b: true }, "Not listed", "-", "-", "-", { t: "0", b: true, c: COL.bad }, "Counts as zero"];
        if (p.unanswered) return [{ t: p.name, b: true }, "Not answered", "-", "-", "-", "-", ""];
        return [{ t: p.name, b: true }, p.rating + "/" + p.scale, f0(p.count || 0), p.days == null ? "-" : p.days + " days ago", (p.replies == null ? "-" : p.replies) + " of " + Math.min(5, p.n || 5), { t: String(p.score), b: true, c: COL[SA.cls(p.score)] }, (p.notes[0] || "").slice(0, 70)];
      }), { zebra: true });
    A.rep.flags.forEach(function (f) { para(f, { bullet: true, col: COL.bad, gap: 1.8 }); });
    A.rep.plats.forEach(function (p) { if (p.status === "listed" && p.tags) {
      var pr = Object.keys(p.tags.praise).map(function (k) { return k + " (" + p.tags.praise[k] + ")"; }), gr = Object.keys(p.tags.gripe).map(function (k) { return k + " (" + p.tags.gripe[k] + ")"; });
      para(p.name + ": guests praise " + (pr.join(", ") || "nothing specific") + ". Complaints: " + (gr.join(", ") || "none found") + ". " + p.recent90 + " of " + p.n + " recent comments are from the last 90 days." + (p.warn ? " Check: " + p.warn : ""), { size: 8.5, gap: 1.8 });
    } });
  }

  /* ---------- target market ---------- */
  var BL = { demo: "Demographic", geo: "Geographic", psy: "Psychographic", beh: "Behavioural" };
  var AXL = { price: ["Price", "Lower price", "Higher price"], range: ["Offer", "Basic", "Full service"], style: ["Style", "Traditional", "Modern"], local: ["Reach", "Local", "International"], speed: ["Booking", "Slow and manual", "Instant and online"] };
  var TM = S.tm || { bases: {}, segs: [], pos: {} }, PO = TM.pos || {}, uk = function (o) { return Object.keys(o || {}).filter(function (k) { return o[k]; }); };
  doc.addPage(); y = TOP;
  fill(tint(ACC, 0.9)); doc.roundedRect(M, y - 5, CW, 11, 3, 3, "F"); F("fb", 8.5, ACC); tx("TARGET MARKET (written by the student, laid out by the tool)", M + 4, y + 1.5); y += 12;
  head("1. Target market", "Bases of segmentation used: " + (uk(TM.bases).map(function (k) { return BL[k]; }).join(", ") || "none") + ". Each segment is rated on size, reach online, fit with the business and competition (1 to 3 points each, 12 in total).");
  table([{ w: 32, h: "Segment" }, { w: 66, h: "Profile (from the student's picks)" }, { w: 50, h: "Size, reach, fit, competition" }, { w: 26, h: "Score / decision" }],
    TM.segs.map(function (g) { var at = g.att || {}; return [{ t: g.name, b: true }, SA.segText(g), SA.ATT.map(function (x) { return at[x.k] !== undefined && at[x.k] !== "" ? x.o[+at[x.k]] : "-"; }).join("; "), { t: SA.segScore(g) + "/12\n" + (g.target === "yes" ? "Target" : "Not a target"), b: true, c: g.target === "yes" ? COL.good : MUT }]; }), { zebra: true, size: 7.8 });
  TM.segs.forEach(function (g) { para((g.target === "yes" ? "Why " : "Why not ") + g.name + ": " + String(g.why || "").trim().replace(/([^.!?])$/, "$1.") + " Based on: " + (SA.picks(g.basis, SA.BASIS).join(", ") || "-") + ".", { size: 8.8, gap: 1.8 }); });
  y += 2;
  head("2. Positioning");
  var stmt = "For " + (PO["for"] || "...") + " who " + (PO.need || "...") + ", " + S.biz.name + " is the " + (PO.cat || "...") + " that " + (PO.benefit || "...") + ". Unlike " + (PO.comp || "...") + ", we " + (PO.diff || "...") + " because " + (PO.proof || "...") + ".";
  fill([246, 249, 251]); F("fb", 10, INK); var sl = split(stmt, CW - 10); room(sl.length * lh(10) + 10); doc.roundedRect(M, y - 4.5, CW, sl.length * lh(10) + 7, 3, 3, "F"); F("fb", 10, INK); tx(sl.join("\n"), M + 5, y + 0.5); y += sl.length * lh(10) + 9;
  var ax = AXL[PO.ax] || AXL.price, ay = AXL[PO.ay] || AXL.range, MS = 62; room(MS + 16);
  var mx = M + 16, my = y + 4;
  fill([246, 249, 251]); doc.rect(mx, my, MS, MS, "F"); stroke(LINE); doc.setLineWidth(0.2); doc.rect(mx, my, MS, MS); doc.line(mx + MS / 2, my, mx + MS / 2, my + MS); doc.line(mx, my + MS / 2, mx + MS, my + MS / 2);
  F("fr", 7, MUT); tx(ax[1], mx, my + MS + 4); tx(ax[2], mx + MS, my + MS + 4, { align: "right" }); tx(ay[1], mx - 2, my + MS, { align: "right" }); tx(ay[2], mx - 2, my + 3, { align: "right" });
  function dot(px, py, col, lbl, below) { var dx = mx + MS * (+px || 0) / 100, dy = my + MS - MS * (+py || 0) / 100; fill(col); doc.circle(dx, dy, 2, "F"); F("fb", 7.5, INK); var ly = below ? dy + 5.6 : dy - 3; tx(lbl, Math.max(mx + 1, Math.min(mx + MS - 1, dx)), ly, { align: dx < mx + 14 ? "left" : dx > mx + MS - 14 ? "right" : "center" }); }
  dot(PO.cx, PO.cy, COL.bad, PO.comp || "Competitor", true); dot(PO.ux, PO.uy, ACC, S.biz.name);
  F("fr", 8.5, MUT); tx(split("Perceptual map. Horizontal: " + ax[0] + ". Vertical: " + ay[0] + ". Placed by the student, based on the evidence in the report.", CW - MS - 22).join("\n"), mx + MS + 8, my + 6);
  y = my + MS + 12;
  room(110);
  head("3. Ideal customer personas", "One persona for each target segment. Each is a made-up person who stands for the segment, written by the student from the source shown.");
  var SRC = { own: "Student's own interviews or observation", survey: "A survey the student ran", second: "Published data or reports", est: "An informed estimate" };
  TM.segs.filter(function (g) { return g.target === "yes"; }).forEach(function (g) {
    var p = g.p || {}, chs = uk(p.ch).map(function (k) { return k.replace(/_/g, " "); }); room(95); var top = y;
    fill(ACC); doc.circle(M + 7, y + 3, 6, "F"); F("ax", 13, WHITE); tx(String(p.name || "?").charAt(0).toUpperCase(), M + 7, y + 6.6, { align: "center" });
    F("ax", 13, INK); tx(p.name || "Persona", M + 17, y + 2.6); F("fr", 9, MUT); tx(split("Age " + (p.age || "?") + "  |  " + (p.loc || "") + "  |  " + (p.job || ""), CW - 18)[0], M + 17, y + 7.6); y += 15;
    F("fb", 8, ACC); tx("PERSONA FOR SEGMENT: " + safe(g.name).toUpperCase(), M + 2, y); y += 5.2;
    para("Segment: " + SA.segText(g), { size: 8.5, col: MUT, ind: 2, gap: 2 });
    [["Wants", SA.picks(p.goal, SA.PGOAL)], ["Frustrations and hesitations", SA.picks(p.pain, SA.PPAIN)], ["What makes them buy", SA.picks(p.trig, SA.PTRIG)]].forEach(function (r) { F("fb", 8.5, INK); tx(r[0], M + 2, y); y += 4.4; para(r[1].join(", ") || "-", { size: 9, ind: 2, gap: 2 }); });
    if (p.quote) { F("fr", 9.5, ACC); var ql = split('"' + p.quote + '"', CW - 8); room(ql.length * lh(9.5) + 3); F("fr", 9.5, ACC); tx(ql.join("\n"), M + 4, y); y += ql.length * lh(9.5) + 3; }
    para("Online: " + (chs.join(", ") || "-") + ".  Based on: " + (SA.picks(g.basis, SA.BASIS).join(", ") || "-") + ".", { size: 8.5, col: MUT, ind: 2, gap: 2 });
    para("Student to write in the report: what this persona means for the content, channels, offer and website.", { size: 8, col: MUT, ind: 2, gap: 2 });
    fill(ACC); doc.roundedRect(M, top - 1, 1.2, Math.max(8, y - top), 0.6, 0.6, "F"); y += 5;
  });

  /* ---------- plan ---------- */
  doc.addPage(); y = TOP;
  fill(tint(ACC, 0.9)); doc.roundedRect(M, y - 5, CW, 11, 3, 3, "F"); F("fb", 8.5, ACC); tx("12-MONTH PLAN (written by the student, structured and costed by the tool)", M + 4, y + 1.5); y += 12;
  head("4. Marketing objectives", "Written by the student. The tool checked that each has a KPI, a baseline, a target and a deadline.");
  S.objs.forEach(function (o, i) {
    var ms = (o.q || []).concat([o.target]).map(function (v) { return v === "" || v == null ? "" : String(v) + (o.unit || ""); }), ln = split(o.text, CW - 8);
    room(ln.length * lh(9.5) + 36);
    fill([246, 249, 251]); doc.roundedRect(M, y - 4.2, CW, ln.length * lh(9.5) + 29, 3, 3, "F");
    F("ax", 11, ACC); tx("Objective " + (i + 1), M + 4, y); y += 5;
    F("fr", 9.5, INK); tx(ln.join("\n"), M + 4, y); y += ln.length * lh(9.5) + 1.5;
    F("fb", 7.5, MUT); tx("KPI", M + 4, y); F("fr", 8.5, INK); tx(split(o.kpi, CW - 24)[0] || "", M + 20, y); y += 4.4;
    F("fb", 7.5, MUT); tx("BASELINE", M + 4, y); F("fr", 8.5, INK); tx(o.base == null || o.base === "" ? "to be entered" : String(o.base) + (o.unit || ""), M + 20, y);
    F("fb", 7.5, MUT); tx("TARGET", M + 60, y); F("fr", 8.5, INK); tx(o.target == null || o.target === "" ? "to be entered" : String(o.target) + (o.unit || ""), M + 75, y);
    F("fb", 7.5, MUT); tx("DONE BY", M + 110, y); F("fr", 8.5, INK); tx("month " + o.deadline + " (" + lab[Math.min(11, (+o.deadline || 12) - 1)].label + ")", M + 125, y); y += 4.4;
    F("fb", 7.5, MUT); tx("MILESTONES", M + 4, y); F("fr", 8.5, INK); tx("Month 3: " + (ms[0] || "-") + "   Month 6: " + (ms[1] || "-") + "   Month 9: " + (ms[2] || "-") + "   Month 12: " + (ms[3] || "-"), M + 28, y); y += 4.4;
    F("fb", 7.5, MUT); tx("MEASURED WITH", M + 4, y); F("fr", 8.5, INK); tx(split(o.tool || "", CW - 38)[0] || "", M + 32, y); y += 9;
  });

  doc.addPage(); y = TOP;
  head("5. Strategies", "Chosen by the student from the course list of electronic marketing strategies. The reasoning is the student's. The tool added the cost lines.");
  S.plan.strats.filter(function (s) { return s.on; }).forEach(function (s) {
    var ls = S.plan.lines.filter(function (l) { return l.s === s.id; }), col = SCOL[s.id] || ACC, st = B.byS[s.id];
    room(40); fill(col); doc.roundedRect(M, y - 4.6, CW, 7.4, 2, 2, "F"); F("ax", 11, WHITE); tx(s.name, M + 4, y + 0.3); F("fb", 8.5, WHITE); tx("MVR " + f0(st ? st.total : 0) + " over 12 months", M + CW - 4, y + 0.3, { align: "right" }); y += 8;
    para(s.mine || "", { size: 9, gap: 1.5 });
    var serves = []; S.objs.forEach(function (o, i) { if ((s.links || {})[o.id]) serves.push("Objective " + (i + 1)); }); if (serves.length) para("Supports: " + serves.join(", ") + ".", { size: 9, gap: 1.5, col: MUT });
    var reach = []; (TM.segs || []).forEach(function (g) { if ((s.segl || {})[g.id]) reach.push(g.name); }); if (reach.length) para("Reaches: " + reach.join(", ") + ".", { size: 9, gap: 1.5, col: MUT });
    ls.forEach(function (l) {
      var when = l.kind === "oneoff" ? "once, " + lab[l.start - 1].label : l.kind === "every" ? "every " + l.every + " months from " + lab[l.start - 1].label : l.kind === "months" ? "in " + (l.months || []).map(function (m) { return lab[m - 1].short; }).join(" and ") : "monthly, " + lab[l.start - 1].short + " to " + lab[l.end - 1].short;
      para(l.name + " (" + when + ")", { bullet: true, size: 8.8, gap: 1.2 });
    });
    if (s.theory) para("Theory to read and cite: " + s.theory + ".", { size: 8.3, col: MUT, gap: 4 });
  });

  /* gantt */
  doc.addPage(); y = TOP;
  head("6. Gantt chart", "Bars show when each activity runs. Darker cells show the months with action or spend. Overlaps show where the workload stacks up.");
  var LW = 62, CWm = (CW - LW) / 12, rowH = 5.4;
  function ganttHead() {
    fill(tint(ACC, 0.9)); doc.rect(M, y - 4, CW, 6.6, "F"); F("fb", 7, ACC); tx("Activity", M + 1.5, y);
    lab.forEach(function (m, i) { tx(m.short, M + LW + CWm * i + CWm / 2, y - 0.2, { align: "center" }); F("fr", 5.5, MUT); tx(m.label.slice(-2), M + LW + CWm * i + CWm / 2, y + 2, { align: "center" }); F("fb", 7, ACC); });
    y += 5.2;
  }
  ganttHead();
  S.plan.strats.filter(function (s) { return s.on; }).forEach(function (s) {
    var col = SCOL[s.id] || ACC;
    if (y + rowH * 2 > BOT) { doc.addPage(); y = TOP; ganttHead(); }
    F("fb", 7.8, col); tx(s.name, M + 1.5, y); y += rowH - 0.4;
    S.plan.lines.filter(function (l) { return l.s === s.id; }).forEach(function (l) {
      if (y + rowH > BOT) { doc.addPage(); y = TOP; ganttHead(); }
      F("fr", 7.2, INK); var nm = split(l.name, LW - 3)[0]; tx(nm + (split(l.name, LW - 3).length > 1 ? "..." : ""), M + 3, y);
      stroke(LINE); doc.setLineWidth(0.1); doc.line(M, y + 1.6, M + CW, y + 1.6);
      fill(tint(col, 0.82)); doc.roundedRect(M + LW + CWm * (l.start - 1) + 0.3, y - 2.7, CWm * (l.end - l.start + 1) - 0.6, 3.6, 1, 1, "F");
      lab.forEach(function (m, i) { if (SA.lineCost(l, i + 1, T.season, m.cal) > 0 || (l.kind === "monthly" && i + 1 >= l.start && i + 1 <= l.end) || (l.kind === "months" && (l.months || []).indexOf(i + 1) >= 0) || (l.kind === "oneoff" && i + 1 === l.start)) { if (i + 1 >= l.start && i + 1 <= l.end) { fill(col); doc.roundedRect(M + LW + CWm * i + 0.6, y - 2.4, CWm - 1.2, 3, 0.8, 0.8, "F"); } } });
      y += rowH;
    });
    y += 1;
  });
  F("fr", 7.5, MUT); y += 2; tx("Peak season for tourism is November to April, so ad spend is heavier in those months.", M, y); y += 6;

  /* budget */
  doc.addPage(); y = TOP;
  head("7. Budget", "Costs in Maldivian rufiyaa (MVR) for the 12 months from " + lab[0].label + " to " + lab[11].label + ".");
  var basisTxt = { "Price list": "Islandeative price list", "At cost": "Paid at cost, no mark-up", "Estimate": "Estimate: get quotes" };
  S.plan.strats.filter(function (s) { return s.on; }).forEach(function (s) {
    var rs = B.rows.filter(function (r) { return r.line.s === s.id; }); if (!rs.length) return;
    h3(s.name, SCOL[s.id] || ACC);
    table([{ w: 74, h: "Activity" }, { w: 34, h: "Cost basis" }, { w: 28, h: "Each x number", al: "r" }, { w: 38, h: "12-month total", al: "r" }],
      rs.map(function (r) { var l = r.line; return [l.name, basisTxt[l.basis] || l.basis, f0(SA.num(l.unit) || 0) + " x " + (SA.num(l.qty) == null ? 1 : SA.num(l.qty)), { t: f0(r.total), b: true }]; })
        .concat([[{ t: "Subtotal", b: true }, "", "", { t: f0(B.byS[s.id].total), b: true }]]), { size: 8 });
  });
  room(36); h3("Total");
  table([{ w: 136, h: "" }, { w: 38, h: "MVR", al: "r" }], [["All strategies", f0(B.sub)], ["Contingency (" + B.cp + "% for price changes and surprises)", f0(B.cont)], [{ t: "Total 12-month budget", b: true }, { t: f0(B.total), b: true }], ["Average per month", f0(B.total / 12)]]);
  var cap = SA.num(S.biz.cap) || 8000;
  if (B.total / 12 > cap) para("This is above the MVR " + f0(cap) + " a month the student said the business could spend. A justification is needed in the report.", { col: COL.bad, bold: true, size: 9 });

  doc.addPage(); y = TOP;
  head("Monthly budget", "Each activity's cost placed in the month it is paid.");
  var mc = [{ w: 28, h: "Strategy" }].concat(lab.map(function (m) { return { w: 10.4, h: m.short, al: "r" }; })).concat([{ w: 21.2, h: "Total", al: "r" }]);
  var mrows = S.plan.strats.filter(function (s) { return s.on && B.byS[s.id]; }).map(function (s) { return [{ t: s.name.replace(" (SEO)", ""), b: true }].concat(B.byS[s.id].months.map(function (v) { return v ? f0(v) : "-"; })).concat([{ t: f0(B.byS[s.id].total), b: true }]); });
  mrows.push([{ t: "Contingency", b: true }].concat(B.contM.map(function (v) { return v ? f0(v) : "-"; })).concat([{ t: f0(B.cont), b: true }]));
  mrows.push([{ t: "Total", b: true }].concat(B.monthly.map(function (v, i) { return { t: f0(v + B.contM[i]), b: true }; })).concat([{ t: f0(B.total), b: true }]));
  table(mc, mrows, { size: 6 });
  h3("How these figures were worked out");
  bullets([
    "Price list items use Islandeative's published prices for the task (MVR). Where 4 or more of one monthly item are bought, 15% is taken off, as on the price list.",
    "Ad spend and fees paid to creators are 'at cost' and go straight to the platform or person with no mark-up.",
    T.season ? "Ad spend is weighted to the tourism peak season: 40% higher in November to April and 40% lower in May to October, so the year averages out." : "Ad spend is spread evenly across the months.",
    "Website build, SEO set-up, hosting, partner commission and prizes are estimates, because they are not on the price list. The student must replace them with written quotes and attach the quotes to the report as supporting documents.",
    "Contingency is " + B.cp + "% of the total and covers price changes and unplanned work."
  ], { size: 8.8 });

  /* control and evaluation */
  doc.addPage(); y = TOP;
  head("8. Control and evaluation", "How results will be checked against each objective. Written by the student.");
  table([{ w: 8, h: "#" }, { w: 46, h: "KPI, baseline to target" }, { w: 40, h: "End of Q1 | Q2 | Q3 | Q4" }, { w: 34, h: "Numbers from" }, { w: 18, h: "How often" }, { w: 28, h: "Act if behind by" }],
    S.objs.map(function (o, i) { var un = o.unit || ""; return [String(i + 1), o.kpi + ": " + o.base + un + " to " + o.target + un, (o.q || []).map(function (v) { return v + un; }).concat([o.target + un]).join(" | "), o.tool, o.freq, (o.trig || 10) + "% below the milestone"]; }), { size: 7.8, zebra: true });
  S.objs.forEach(function (o, i) { para("Objective " + (i + 1) + ", if behind: " + (SA.picks(o.acts, SA.ACTS).join(", ") || "-") + (o.act ? ". " + o.act : "") + ".", { size: 8.8, gap: 1.8 }); });
  para("Re-run this audit at month 6 and month 12 and compare the scores with the baseline in this report. Report each KPI against its milestone, explain every miss, and say what was changed.", { size: 9 });

  doc.addPage(); y = TOP;
  head("What the student still writes", "The assignment is about 8,000 words. The tool structured and costed the plan. These sections need the student's own writing, with suggested lengths.");
  table([{ w: 56, h: "Section" }, { w: 106, h: "What to write" }, { w: 12, h: "Words", al: "r" }], SA.WRITE_GUIDE.map(function (r) { return [{ t: r[0], b: true }, r[2], String(r[1])]; }), { size: 8, zebra: true });
  para("Use of AI: the report must state honestly how AI, including this tool, was used. Explanations, justification, theory and references must be the student's own work.", { size: 9, bold: true });

  /* appendices */
  doc.addPage(); y = TOP;
  head("Appendix A: evidence", "What the student saw and entered, with the date checked (" + S.biz.checked + "). Screenshots were shrunk in the browser. Reviewer names were not copied.");
  var anyEv = false;
  A.rep.plats.forEach(function (p) {
    var a = (S.rep || {})[p.id] || {}; if (a.status !== "listed") return; anyEv = true;
    var sh = IMG[p.id], d = dims[p.id], iw = 90, ih = sh && d ? iw * d.h / d.w : 0; if (ih > 70) { ih = 70; iw = ih * d.w / d.h; }
    room(Math.max(60, ih + 14)); h3(p.name + ": " + a.rating + "/" + p.scale + ", " + a.count + " reviews, newest " + a.lastDate);
    var top = y;
    if (sh && d) { try { doc.addImage(sh, "JPEG", M, y, iw, ih, undefined, "FAST"); stroke(LINE); doc.rect(M, y, iw, ih); } catch (e) { F("fr", 8, MUT); tx("Screenshot could not be placed.", M, y + 4); } }
    var x2 = M + (sh && d ? iw + 6 : 0), w2 = CW - (sh && d ? iw + 6 : 0), yy = top;
    SA.arr(a.comments).forEach(function (c, i) { if (!c || !(c.d || c.t)) return; F("fb", 7.5, MUT); var lnk = split(safe(c.d || "") + ": " + safe(c.t || ""), w2); F("fr", 8.3, INK); if (yy + lnk.length * lh(8.3) > BOT) return; tx(lnk.join("\n"), x2, yy + 3); yy += lnk.length * lh(8.3) + 1.8; });
    y = Math.max(top + ih, yy) + 6;
  });
  if (!anyEv) para("No review platforms were listed for this business.");

  head("Appendix B: social media inputs");
  var LB = {}; SA.LAST_BANDS.forEach(function (x) { LB[x[0]] = x[1]; }); var FB = {}; SA.FREQ_BANDS.forEach(function (x) { FB[x[0]] = x[1]; });
  table([{ w: 24, h: "Platform" }, { w: 26, h: "Status" }, { w: 18, h: "Followers", al: "r" }, { w: 32, h: "Last post" }, { w: 36, h: "3rd newest post" }, { w: 22, h: "Avg likes + comments", al: "r" }, { w: 16, h: "Bio/link" }],
    SA.PLATS.map(function (p) { var a = (S.social || {})[p.id] || {}; var yl = { y: "Yes", p: "Partly", n: "No", u: "?" }, on = a.status && a.status !== "none", av = SA.engAvg(a); av = av == null ? null : Math.round(av);
      return [{ t: p.name, b: true }, a.status === "none" ? "Does not have" : a.status === "dormant" ? "Not used" : a.status === "active" ? "Active" : "-", on ? f0(SA.num(a.followers) || 0) : "-", on ? (LB[a.lastBand] || "-") + (a.wasActive && a.lastYear ? " (active until " + a.lastYear + ")" : "") : "-", on && a.status === "active" ? (FB[a.freqBand] || "-") : "-", on ? (a.likesHidden ? "hidden" : av == null ? "-" : String(av)) : "-", on ? (yl[a.bio] || "-") + "/" + (yl[a.link] || "-") : "-"]; }), { zebra: true, size: 7.8 });

  head("Appendix C: how the scores are worked out");
  bullets([
    "Overall score = social 30%, Google profile 20%, website 25%, reviews 25%. Parts that do not apply are left out and the rest re-weighted.",
    "Social media: each platform out of 100 = engagement 35, posting frequency 25, recency of last post 15, bio 15, working link 10. The student picks time bands (for example '3 to 4 weeks ago') and the tool scores them. A platform the business does not have scores 0. The three core platforms (Instagram, Facebook, TikTok) are averaged, and YouTube or LinkedIn can add up to 8 points.",
    "Google Business Profile: weighted checks (claimed 3, hours 2, contact 2, website link 2, photos 2, category, recent update, description and booking button 1 each). No profile for a location-based business scores 0.",
    "Website: basics and function 35, SEO 25, answer engines and AI search 20, simple to use 20. Yes counts full, Partly half, No zero. Can't tell is left out. With no website, a substitute score of up to 40 is shown (8 points each for a working Google link, a social bio link, click-to-chat, online booking or ordering, and a contact that can be found by googling).",
    "Reviews: rating 35, recency of newest review 25, review volume 15, owner replies 15, complaint themes 10. Ratings are put on a common scale (Booking.com and Agoda are out of 10, Google and TripAdvisor out of 5). A platform with no listing scores 0. Tour operators are not scored on reviews.",
    "Limits: five comments is a small sample, the theme tagging reads English words only, the tool cannot prove that reviews are genuine, and prices change daily. All figures are as seen on the date checked."
  ], { size: 8.8 });

  /* page furniture */
  var n = doc.getNumberOfPages();
  for (var p = 1; p <= n; p++) {
    doc.setPage(p);
    if (logo) { try { doc.addImage(logo, "PNG", M, 5, 11, 11 * 371 / 420, undefined, "FAST"); } catch (e) {} }
    F("fb", 8, ACC); tx("Islandeative  |  Student audit", M + 14, 11.2);
    F("fr", 7.5, MUT); tx(S.biz.name + "  |  " + S.biz.checked, W - M, 11.2, { align: "right" });
    stroke(LINE); doc.setLineWidth(0.2); doc.line(M, 18, W - M, 18);
    doc.line(M, 285, W - M, 285);
    F("fr", 7, MUT); tx("Student-authored plan, structured and costed by the tool. Scores use fixed rules and public information." + (S.code ? "  Code " + S.code : ""), M, 289);
    tx("© " + new Date().getFullYear() + " Islandeative. All rights reserved. This tool and its scoring are owned by Islandeative.", M, 292.6);
    F("fb", 8, INK); tx(p + " / " + n, W - M, 289, { align: "right" });
  }
  var nm = "Audit_" + safe(S.biz.name).replace(/[^A-Za-z0-9]+/g, "_").slice(0, 30) + "_" + S.biz.checked + ".pdf";
  doc.save(nm);
  return { pages: n, name: nm, doc: doc };
}
})();
