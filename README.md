# Digital Presence Audit, Student Edition

A free audit tool for e-marketing students (MKT303). Students check a business's social media, Google Business Profile, website and reviews, then build their own 12-month plan (target market, objectives, strategies, Gantt, budget, evaluation) and download a PDF.

Runs in the browser. Answers stay on the student device until they download the PDF, when a copy of the PDF and answers is sent to the lecturer through the Apps Script. Screenshots go into the PDF appendix only.

## Publish with GitHub Pages
Settings, Pages, Source: Deploy from a branch, Branch: main, folder: / (root).

## Files
- `index.html` the landing page (animated Islandeative logo, name and MNU student ID, email shown automatically)
- `gate.js` landing page script
- `tool.html` the audit tool (sends students back to the landing page if they have not entered their ID)
- `assets/logo-loop.css`, `assets/logo-loop.js` the animated logo
- `core.js` scoring rules and draft-plan rules (no AI)
- `tools/student-audit-apps-script.gs` the Google Apps Script that receives each student copy (setup steps are inside the file)
- `ui.js` screens, `pdf.js` PDF report, `student-audit.css` styles
- `assets/` Islandeative stylesheet and logo, `pdf/` PDF fonts (Archivo and Figtree, OFL)

© 2026 Islandeative. All rights reserved. The tool, its scoring rules and benchmarks are owned by Islandeative.
