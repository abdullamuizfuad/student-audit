/**
 * Student Audit: lecturer copy catcher (MKT303).
 *
 * When a student downloads their PDF in the Student Audit tool, the tool sends a copy here. For each one this script:
 *   1. Saves the student's PDF in a Google Drive folder (MKT303 student audits).
 *   2. Adds a row to the "Submissions" tab (time, name, ID, business, score, submission code, link to the PDF).
 *   3. Emails you the PDF, the student's own plan and the tool's suggested plan side by side, plus their answers file.
 *
 * Setup (about 10 minutes, once):
 * 1. Sign in to the Google account you want the copies to go to. Create a Google Sheet named "MKT303 student audits".
 * 2. Extensions > Apps Script. Delete the sample code, paste this whole file, Save.
 * 3. Run the function "setup" once from the toolbar. Allow the permissions (Drive, Sheets, Gmail). It creates the Drive folder.
 * 4. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy, then copy the Web app URL (it ends in /exec).
 * 5. Send that URL to Claude (it is not a secret) and it goes into the tool. Or put it in ui.js where it says COPY_URL.
 *
 * Class list (Roster tab):
 * - Any tab with "Roster" in its name holds the student IDs allowed in (for example "Class Roster 2025 T2"):
 *   IDs in column A (for example S083354), names in column B (optional), email in column C (optional).
 *   The student's copy goes to the email in column C if there is one, otherwise to s0xxxxx@student.mnu.edu.mv.
 *   A header row is fine but not needed.
 * - To close access for an old cohort, rename its tab so it no longer says Roster (for example "Archive 2025 T2"), or delete it.
 * - When a student presses Verify on the landing page, the page asks this script whether the ID is on the list. The list itself never leaves your sheet.
 * - New semester: delete the old rows and paste the new cohort. No website change is needed.
 * - While the Roster tab is empty, every correctly formatted ID is let in.
 *
 * Updating later: paste the new file over the old one, then Deploy > Manage deployments > pencil > Version "New version" > Deploy.
 * Never choose "New deployment" again: that makes a new URL.
 *
 * The emails come from your own Gmail account, to NOTIFY_TO (blank means the account that owns this script).
 */
const NOTIFY_TO = "";                 // blank = the owner of this script
const SHEET_NAME = "Submissions";
const ROSTER_NAME = "Roster";
const FOLDER_NAME = "MKT303 student audits";
const DAILY_CAP = 200;                // emails a day, well under Google's limit
const MAX_PDF_BYTES = 25 * 1024 * 1024;

function setup() {
  folder_();
  roster_();
  const sh = sheet_();
  Logger.log("Ready. Sheet tab: " + sh.getName() + ". Drive folder: " + FOLDER_NAME);
}

/* Verify: GET ?action=check&sid=S083354 answers {ok, name} without revealing the list. */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== "check") return out_({ ok: false });
  const sid = String(p.sid || "").trim().toUpperCase();
  if (!/^S0\d{5}$/.test(sid)) return out_({ ok: false, reason: "format" });
  const r = lookup_(sid);
  return out_(r.empty ? { ok: true, open: true } : r.found ? { ok: true, name: r.name } : { ok: false, reason: "not-listed" });
}

function lookup_(sid) {
  let rows = [];
  rosters_().forEach(sh => { rows = rows.concat(sh.getDataRange().getValues().filter(r => /^S0\d{5}$/i.test(String(r[0] || "").trim()))); });
  if (!rows.length) return { empty: true };
  for (const r of rows) {
    if (String(r[0]).trim().toUpperCase() === sid) return { found: true, name: String(r[1] || "").trim(), email: String(r[2] || "").trim() };
  }
  return { found: false };
}

function rosters_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().filter(s => /roster/i.test(s.getName()));
}

function roster_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = rosters_()[0];
  if (!sh) {
    sh = ss.insertSheet(ROSTER_NAME);
    sh.appendRow(["student id", "name (optional)"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!d.student || !d.pdf || !d.code) return out_({ ok: false });
    const bytes = Utilities.base64Decode(d.pdf);
    if (bytes.length > MAX_PDF_BYTES) return out_({ ok: false, error: "too big" });

    const props = PropertiesService.getScriptProperties(), today = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
    let n = Number(props.getProperty("day_" + today) || 0);
    const name = safe_(d.student) + "_" + safe_(d.sid) + "_" + safe_(d.business) + "_" + d.code + ".pdf";
    const blob = Utilities.newBlob(bytes, "application/pdf", name);
    const file = folder_().createFile(blob);

    const r = lookup_(String(d.sid || "").toUpperCase());
    const listed = r.empty ? "list empty" : r.found ? "yes" : "NOT ON LIST";
    const sh = sheet_();
    sh.appendRow([new Date(), d.student, d.sid, d.business, d.type, d.score, d.pages, d.code, file.getUrl(), listed]);

    if (n < DAILY_CAP) {
      props.setProperty("day_" + today, String(n + 1));
      const to = NOTIFY_TO || Session.getEffectiveUser().getEmail();
      const studentTo = (r.email && /@/.test(r.email)) ? r.email : (/^S0\d{5}$/i.test(String(d.sid || "")) ? String(d.sid).toLowerCase() + "@student.mnu.edu.mv" : "");
      if (studentTo) {
        GmailApp.sendEmail(studentTo, "Your MKT303 audit report: " + d.business + " (code " + d.code + ")",
          "Dear " + d.student + ",\n\nYour Digital Presence Audit report for " + d.business + " is attached (" + d.pages + " pages, submission code " + d.code + ").\n\n" +
          "Keep this email as your backup copy. A copy has also gone to your lecturer. If you make the report again, the code changes, so submit the version you want marked.\n\n" +
          "Use the PDF as evidence and as the map for your report: the explanations, theory and references must be your own work.\n\nIslandeative Student Audit", {
          name: "Islandeative Student Audit", attachments: [blob] });
      }
      GmailApp.sendEmail(to, (listed === "NOT ON LIST" ? "[NOT ON CLASS LIST] " : "") + "MKT303 audit: " + d.student + " (" + d.sid + "), " + d.business + ", code " + d.code, "Open this email in a mail app that shows HTML.", {
        name: "Student Audit tool",
        htmlBody: body_(d, file.getUrl()),
        attachments: [blob, Utilities.newBlob(d.answers || "{}", "application/json", "answers_" + d.code + ".json")]
      });
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function body_(d, link) {
  const e = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const br = s => e(s).replace(/\n/g, "<br>");
  const pos = d.positioning || {};
  const stmt = "For " + (pos["for"] || "") + " who " + (pos.need || "") + ", " + d.business + " is the " + (pos.cat || "") + " that " + (pos.benefit || "") + ". Unlike " + (pos.comp || "") + ", we " + (pos.diff || "") + " because " + (pos.proof || "") + ".";
  return '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1d2b34;max-width:760px">' +
    '<h2 style="margin:0 0 4px">' + e(d.student) + " (" + e(d.sid) + ")</h2>" +
    "<p style=\"margin:0 0 12px\">Business: <b>" + e(d.business) + "</b> (" + e(d.type) + "). Digital visibility score <b>" + e(d.score) + "/100</b>. Checked " + e(d.checked) + ". Submission code <b>" + e(d.code) + "</b>. " + e(d.pages) + " pages.</p>" +
    '<p style="margin:0 0 16px">The PDF is attached and saved in Drive: <a href="' + e(link) + '">open the saved copy</a>. When marking, compare the code printed in the PDF footer and on the first page with the code above. A different code means the file was made again or changed.</p>' +
    '<table style="border-collapse:collapse;width:100%"><tr><th style="text-align:left;padding:8px;border:1px solid #d6dee4;background:#f3f6f8;width:50%">Student\'s own plan</th><th style="text-align:left;padding:8px;border:1px solid #d6dee4;background:#f3f6f8;width:50%">What the tool would suggest from the audit</th></tr>' +
    '<tr><td style="vertical-align:top;padding:8px;border:1px solid #d6dee4">' + br(d.studentPlan) + '</td><td style="vertical-align:top;padding:8px;border:1px solid #d6dee4">' + br(d.modelPlan) + "</td></tr></table>" +
    '<h3 style="margin:18px 0 4px">Segments the student chose</h3><p style="margin:0">' + br(d.segments) + "</p>" +
    '<h3 style="margin:18px 0 4px">Positioning statement</h3><p style="margin:0">' + e(stmt) + "</p>" +
    '<p style="margin:18px 0 0;color:#63717c;font-size:12px">The tool\'s suggestions are for comparison only. Similar objectives are not proof of copying, because the audit gives every student the same kind of baselines. Look for identical wording and identical numbers across students.</p></div>';
}

function safe_(s) { return String(s || "x").replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function folder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["received", "student", "student id", "business", "type", "score", "pages", "code", "pdf in drive", "on class list"]);
    sh.setFrozenRows(1);
  }
  return sh;
}
