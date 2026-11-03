# Digital Presence Audit, Student Edition

A free audit tool for e-marketing students (MKT303). Students check a business's social media, Google Business Profile, website and reviews, then build their own 12-month plan (target market, objectives, strategies, Gantt, budget, evaluation) and download a PDF.

Runs in the browser. Students sign in with their student ID and a 6-digit PIN they make themselves (first time: "Create a PIN"). Their work saves to Firebase (project `mkt303-audit`) as they go, so they can continue on any device; only the student and the lecturer can read it (`firestore.rules`). Students can skip answers they cannot find; the PDF lists what was skipped. The submission code is made from the work only, without name or ID, so two students with the same code handed in the same work. Students attach the PDF to their assignment as an appendix and keep their own copy.

## Lecturer
- `admin.html`: sign in with the lecturer email and password. Add the class list (upload the MNU class list file or paste IDs), see each student's step, business, last save and submission code. Repeated codes are flagged.
- Forgotten PIN: Firebase console > Authentication > Users, delete that student's login (`s0xxxxx@student.mnu.edu.mv`). The student makes a new PIN with "First time: create a PIN". Their work is kept.
- Lecturer access: a document in the `admins` collection named with the lecturer's User UID. Test ID: `S000001` (in `roster` as `s000001`).
- Class list IDs are stored in Firebase only, in small letters (`s083xxx`). Never commit class list files: the repo is public.

## Publish with GitHub Pages
Settings, Pages, Source: Deploy from a branch, Branch: main, folder: / (root).

## Files
- `index.html` the sign-in page (animated Islandeative logo, student ID and PIN)
- `gate.js` sign-in script, `cloud.js` Firebase sign-in and saving, `vendor/firebase-*-compat.js` Firebase 10.12.2 (Apache-2.0)
- `admin.html`, `admin.js` the lecturer page
- `firestore.rules` the database security rules (paste into Firebase console > Firestore > Rules after any change)
- `tool.html` the audit tool (sends students back to the landing page if they have not entered their ID)
- `assets/logo-loop.css`, `assets/logo-loop.js` the animated logo
- `core.js` scoring rules and draft-plan rules (no AI)
- `tools/student-audit-apps-script.gs` the old Google Apps Script for the class list check and lecturer copies (no longer used: Google blocks outside visitors on the Islandeative account)
- `ui.js` screens, `pdf.js` PDF report, `student-audit.css` styles
- `vendor/jspdf.umd.min.js` the PDF maker (jsPDF 2.5.1, MIT), kept here so the PDF works even if a CDN is blocked
- `assets/logo-loop.js` also holds a time-limited maintenance notice (add `?preview=1` to skip it)
- `assets/` Islandeative stylesheet and logo, `pdf/` PDF fonts (Archivo and Figtree, OFL)

© 2026 Islandeative. All rights reserved. The tool, its scoring rules and benchmarks are owned by Islandeative.
