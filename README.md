# Digital Presence Audit, Student Edition

A free audit tool for e-marketing students (MKT303). Students check a business's social media, Google Business Profile, website and reviews, then build their own 12-month plan (target market, objectives, strategies, Gantt, budget, evaluation) and download a PDF.

Runs in the browser. Answers stay on the student device until they download the PDF. Nothing is sent anywhere: students attach the PDF to their assignment as an appendix and keep their own copy. Screenshots go into the PDF appendix only.

## Publish with GitHub Pages
Settings, Pages, Source: Deploy from a branch, Branch: main, folder: / (root).

## Files
- `index.html` the landing page (animated Islandeative logo, name and MNU student ID, email shown automatically)
- `gate.js` landing page script (checks the ID against `roster.js`)
- `roster.js` scrambled student IDs allowed in, built by `tools/build-roster.py` from the MNU class list (never commit the class list itself)
- `tool.html` the audit tool (sends students back to the landing page if they have not entered their ID)
- `assets/logo-loop.css`, `assets/logo-loop.js` the animated logo
- `core.js` scoring rules and draft-plan rules (no AI)
- `tools/student-audit-apps-script.gs` the old Google Apps Script for the class list check and lecturer copies (no longer used: Google blocks outside visitors on the Islandeative account)
- `ui.js` screens, `pdf.js` PDF report, `student-audit.css` styles
- `assets/` Islandeative stylesheet and logo, `pdf/` PDF fonts (Archivo and Figtree, OFL)

© 2026 Islandeative. All rights reserved. The tool, its scoring rules and benchmarks are owned by Islandeative.
