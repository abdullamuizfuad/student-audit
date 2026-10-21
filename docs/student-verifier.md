# Student verification landing page: how it was built, and how to build another

> **Update, October 2026:** the Google Apps Script check below no longer works. Google blocks outside visitors on the Islandeative account ("Sorry, unable to open the file at this time"). The landing page now checks the ID against `roster.js`, which holds scrambled IDs only. To update it, run `python3 tools/build-roster.py <class list .xls or .csv>` and push `roster.js`. Never commit the class list file. The rest of this page is kept for reference.

This explains the sign-in page in front of the MKT303 Student Audit tool (https://abdullamuizfuad.github.io/student-audit/), and gives a ready brief for a new chat to build the same kind of verifier for another tool.

---

## 1. What it does

1. The student types their **full name** and the **6 numbers of their student ID**. The **S** is already fixed in the box.
2. As they type, the page shows their **MNU email**, `s0xxxxx@student.mnu.edu.mv`, and turns it green when the ID is complete.
3. **Verify and start** stays disabled until the name has at least 3 letters and the ID is `0` followed by 5 digits.
4. On Verify, the page sends **only the ID** to a Google Apps Script attached to the lecturer's Google Sheet. The script checks the **Roster** tab and answers yes or no. It never sends the list itself.
5. If the ID is listed, the student's name, ID and email are saved in the browser and the tool page opens. If the roster has a name for that ID, the official name replaces what they typed.
6. The tool page checks for that saved record and sends anyone without one back to the landing page.
7. The tool fills in the name, ID and email itself. Students can't edit them inside the tool; "Not you?" returns to the landing page.

**Lecturer access:** `S000001` is a test ID in the roster for Muiz. Column C on that row holds his own email, so test reports go to him and not to a student address.

---

## 2. The pieces

| Piece | Where | What it does |
|---|---|---|
| Landing page | `index.html` + `gate.js` | Animated logo, name and ID form, live email preview, Verify button |
| Logo animation | `assets/logo-loop.css` + `assets/logo-loop.js` | The looping Islandeative logo (plays once, then the water keeps moving) |
| Styles | `student-audit.css` (gate section) and `assets/site.css` (tokens) | Islandeative navy, blue, teal and green; light and dark mode |
| Guard on the tool page | First `<script>` in `tool.html` | No valid saved record, so go back to `index.html` |
| Using the record in the tool | `ui.js` (`ME`, `stamp()`) | Fills in name, ID and email, and clears another student's draft |
| Class list check | `tools/student-audit-apps-script.gs`, `doGet` | Answers `{ok:true,name}` or `{ok:false,reason:"not-listed"}` |
| Class list | Google Sheet "MKT303 student audits", any tab with **Roster** in its name | Column A: ID, column B: name (optional), column C: email override (optional) |

Hosting: GitHub Pages from the public repo `abdullamuizfuad/student-audit`, branch `main`, root folder.
Apps Script owner: the **Islandeative Google Workspace account**. The MNU account cannot be used (see section 6).

---

## 3. The roster sheet

- Put each tab's IDs in column A. A header row is optional, because only cells that look like `S0` + 5 digits are read.
- Column B: the student's name as it should appear. Optional.
- Column C: an email that replaces the student address. Optional, and used for `S000001`.
- **More than one roster tab:** every tab whose name contains "Roster" counts, for example "Class Roster 2025 T2".
- **New semester:** add a new Roster tab, then rename the old one so it no longer says Roster (for example "Archive 2025 T2"). That locks the old cohort out.
- **Empty roster:** any correctly formatted ID gets in. That is a safety switch for the first day, not a setting to rely on.

Lecturer row, kept in every roster tab:

| A | B | C |
|---|---|---|
| S000001 | Abdulla Muiz Fuad | abdulla.muiz@mnu.edu.mv |

---

## 4. The code that matters

### 4.1 Apps Script: the check (in the sheet's script)

```javascript
const ADMIN_IDS = ["S000001"];   // always allowed, even if missing from a roster tab

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== "check") return out_({ ok: false });
  const sid = String(p.sid || "").trim().toUpperCase();
  if (!/^S0\d{5}$/.test(sid)) return out_({ ok: false, reason: "format" });
  if (ADMIN_IDS.indexOf(sid) >= 0) return out_({ ok: true, name: "Lecturer access" });
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

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
```

`ADMIN_IDS` is a small upgrade over the live tool, which relies on the `S000001` row being in the roster. Add it to the live script the next time you update it.

### 4.2 Landing page form (HTML)

```html
<form id="gate" novalidate autocomplete="off">
  <label for="gName">Full name</label>
  <input id="gName" type="text" autocomplete="name" placeholder="As it appears on your student record" required>

  <label for="gId">Student ID</label>
  <div class="sa-id"><span class="sa-id-s" aria-hidden="true">S</span>
    <input id="gId" type="text" inputmode="numeric" maxlength="6" placeholder="0XXXXX" aria-describedby="gIdHint" required></div>
  <span id="gIdHint">Type the 6 numbers after the S. They start with 0.</span>

  <div class="sa-mail" id="gMail" aria-live="polite">
    <small>Your student email</small><b id="gMailTxt">s<i>0xxxxx</i>@student.mnu.edu.mv</b></div>

  <p id="gErr" role="alert"></p>
  <button id="gGo" type="submit" disabled>Verify and start</button>
</form>
```

### 4.3 Landing page logic (gate.js, shortened)

```javascript
var CHECK_URL = "https://script.google.com/macros/s/XXXX/exec";   // the sheet's web app link
var KEY = "ia-student";                                            // where the record is saved

function check() {
  var d = id.value.replace(/\D/g, "").slice(0, 6); if (id.value !== d) id.value = d;   // digits only, max 6
  mailText.innerHTML = "s" + d + (d.length < 6 ? "<i>" + "0xxxxx".slice(d.length) + "</i>" : "") + "@student.mnu.edu.mv";
  var idOk = /^0\d{5}$/.test(d), nameOk = name.value.trim().length >= 3;
  mailBox.classList.toggle("ok", idOk);
  err.textContent = d.length && d[0] !== "0" ? "MNU student IDs start with S0. Check the first number." : "";
  go.disabled = !(idOk && nameOk);
  return idOk && nameOk;
}

form.addEventListener("submit", function (ev) {
  ev.preventDefault(); if (!check()) return;
  var sid = "S" + id.value;
  go.disabled = true; go.textContent = "Checking the class list...";
  fetch(CHECK_URL + "?action=check&sid=" + encodeURIComponent(sid), { credentials: "omit", redirect: "follow", cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res.ok) { /* show "This ID is not on the class list..." and re-enable */ return; }
      var rec = { name: res.name || name.value.trim(), sid: sid, email: sid.toLowerCase() + "@student.mnu.edu.mv", verified: !res.open };
      localStorage.setItem(KEY, JSON.stringify(rec)); sessionStorage.setItem(KEY, JSON.stringify(rec));
      location.href = "tool.html";
    })
    .catch(function () { /* Google unreachable: see section 5 */ });
});
```

### 4.4 Guard at the top of the tool page

```html
<script>
try { var s = JSON.parse(localStorage.getItem("ia-student") || sessionStorage.getItem("ia-student") || "null");
      if (!s || !/^S0\d{5}$/.test(s.sid || "")) location.replace("index.html"); }
catch (e) { location.replace("index.html"); }
</script>
```

### 4.5 Using the record inside the tool

```javascript
var ME = JSON.parse(localStorage.getItem("ia-student") || sessionStorage.getItem("ia-student") || "{}");
function stamp(st) { st.biz.student = ME.name; st.biz.sid = ME.sid; st.biz.email = ME.email; return st; }
// When loading a saved draft: if the draft belongs to a different student ID, start a fresh one.
```

---

## 5. Decisions and why

- **Fixed "S" and digits only:** stops format mistakes before anything is sent.
- **Live email preview:** the student sees and confirms their address, and the tool never asks for it.
- **The check runs in Google, not in the page:** the site is public on GitHub, so a list inside the page would expose every student's ID.
- **`credentials: "omit"`:** stops the browser sending Google cookies, which can confuse Apps Script when someone is signed in to several Google accounts.
- **If Google can't be reached, the student gets in marked `verified:false`:** the class can keep working during a Google outage. The protection comes later: when the report is submitted, the script checks the ID against the roster again and flags the email **[NOT ON CLASS LIST]**. For a stricter build, block instead of letting them in.
- **Limit:** this stops made-up IDs, but not a student using a classmate's real ID. The only fix is a one-time code sent to the student's MNU email before they get in, which needs a mail step in the script.

---

## 6. Deployment and problems we hit

1. **Create the web app:** in Apps Script, Deploy > New deployment > Web app. Set **Execute as: Me** and **Who has access: Anyone**, then copy the `/exec` link into `CHECK_URL`.
2. **Update the script without breaking the link:** Deploy > Manage deployments > pencil > **Version: New version** > Deploy. Never choose "New deployment" again, because that makes a new link.
3. **"Sorry, unable to open the file at this time":** the script was owned by the **MNU account**, and MNU's Google settings block outside visitors. Moving the sheet and script to the **Islandeative Workspace account** fixed it. Always test the link in an Incognito window, with `?action=check&sid=S000001` added to the end. You should see `{"ok":true,...}`.
4. **Caching:** after every change, bump the `?v=` numbers on the CSS and JS links and reload with Ctrl+Shift+R.
5. **Secrets:** none are needed. The `/exec` link is not a secret, because it only answers yes or no and accepts submissions.

---

## 7. Test checklist

- [ ] The ID box takes only digits, max 6, and complains if the first digit isn't 0.
- [ ] The email preview fills in as you type and turns green at 6 digits.
- [ ] Verify stays disabled until the name and ID are valid.
- [ ] `S000001` gets in and the email goes to the column C address.
- [ ] An ID on the roster gets in, and the roster name replaces the typed one.
- [ ] An ID not on the roster is refused with a clear message.
- [ ] Opening the tool page directly without signing in sends you back.
- [ ] A different student signing in on the same device does not see the previous student's draft.
- [ ] Phone (390 px) and desktop (1440 px), light and dark: no errors, no sideways scroll.

---

## 8. Brief for a new chat (copy and paste)

> I want a student sign-in landing page in front of a new web tool, built like the one in my repo `abdullamuizfuad/student-audit` (read `docs/student-verifier.md`, `index.html`, `gate.js`, `tools/student-audit-apps-script.gs`). Plain HTML, CSS and JS, no framework, hosted on GitHub Pages.
>
> **Landing page:**
> - The Islandeative looping logo centred (reuse `assets/logo-loop.css` and `assets/logo-loop.js`), with the tool's title and course line under it.
> - A **Full name** field (at least 3 letters).
> - A **Student ID** field with a fixed "S" in front: students type only 6 digits, digits only, max 6, and the first digit must be 0. Show an error if it isn't.
> - Their email shown automatically as they type: `s` + the 6 digits + `@student.mnu.edu.mv`, with greyed placeholder characters until complete, turning green when valid.
> - A **Verify and start** button, disabled until the name and ID are valid.
>
> **Verification:**
> - On Verify, send only the ID to a Google Apps Script web app with `?action=check&sid=S0xxxxx` (fetch with `credentials: "omit"`).
> - The script reads every tab with "Roster" in its name in the attached Google Sheet: column A IDs, column B optional name, column C optional email override.
> - It answers `{ok:true,name}`, `{ok:false,reason:"not-listed"}`, or `{ok:true,open:true}` when the roster is empty.
> - Keep **S000001** as my lecturer access: add it to an `ADMIN_IDS` list in the script so it always passes, and route its emails to the column C address (abdulla.muiz@mnu.edu.mv).
> - On success, save `{name, sid, email, verified}` to localStorage and sessionStorage under a key named for this tool, then open the tool page. Use the roster name if there is one.
> - The tool page must redirect to the landing page if that record is missing or invalid, fill in the name, ID and email itself, and clear any draft that belongs to another ID.
> - Decide with me whether a Google outage should block entry or let students in marked unverified.
>
> **Setup:**
> - The Apps Script must be owned by my **Islandeative Workspace account**, not MNU, because MNU blocks outside access.
> - Give me step-by-step setup:
>   1. Create the sheet and roster tab.
>   2. Paste the script and run setup.
>   3. Deploy as a web app with Execute as Me and access Anyone.
>   4. Test the link in Incognito with `?action=check&sid=S000001`.
>   5. Update later with Manage deployments > New version.
> - Never ask me for passwords or secret keys.
>
> **Design and testing:**
> - Islandeative colours: navy `#245582`, blue `#2a82bb`, teal `#3ac0c0`, green `#56c095`. Light and dark mode. No em or en dashes in the copy.
> - Test with Playwright at 390 px and 1440 px, light and dark: no console errors, no sideways scroll. Mock the Apps Script link in tests so no real emails are sent.
