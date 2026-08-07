#!/usr/bin/env node
// Renders the review-agent's feature-toggle and assertion-density results into one
// styled HTML report. CRAP score gets its own separate report (build/reports/crap-java/report.html),
// rendered by the renderCrapJavaReportHtml Gradle task — not this script.
// Usage: render-report.js <input.json> <output.html>
//
// Input JSON shape:
// {
//   "toggle": [ { "file": "path", "line": 12, "issue": "what's ungated", "why": "..." }, ... ],
//   "assertionDensity": { "ratio": 0.032, "threshold": 0.1, "flagged": true,
//                          "sourceFiles": 10, "sourceLoc": 500, "testFiles": 4, "asserts": 16 }
// }
// The toggle array may be empty; that section renders as "No issues found."

const fs = require('fs');

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: render-report.js <input.json> <output.html>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const toggle = data.toggle || [];
const density = data.assertionDensity || null;

const escape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const toggleSection = toggle.length
  ? `<ul>${toggle
      .map(
        (f) => `
      <li class="fail"><span class="mono">${escape(f.file)}:${f.line}</span> — ${escape(f.issue)}
        <div class="why">${escape(f.why)}</div>
      </li>`
      )
      .join('')}</ul>`
  : '<p class="clean">No issues found.</p>';

const densitySection = density
  ? `
    <p class="stat-row">
      <span><strong>Ratio:</strong> ${density.ratio} (threshold ${density.threshold})</span>
      <span><strong>Status:</strong> <span class="${density.flagged ? 'bad' : 'clean'}">${
      density.flagged ? 'boo tomato tomato' : 'OK'
    }</span></span>
    </p>
    <table>
      <tr><th class="num">Source files</th><th class="num">Source LOC</th><th class="num">Test files</th><th class="num">Asserts</th></tr>
      <tr><td class="num">${density.sourceFiles}</td><td class="num">${density.sourceLoc}</td><td class="num">${density.testFiles}</td><td class="num">${density.asserts}</td></tr>
    </table>`
  : '<p class="clean">No Java files found.</p>';

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Review Report</title>
<style>
  body { font-family: -apple-system, sans-serif; margin: 2rem; color: #222; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.1rem; margin-top: 2rem; border-bottom: 2px solid #333; padding-bottom: 0.3rem; }
  .summary { background: #f4f4f4; border-radius: 6px; padding: 1rem 1.5rem; margin-bottom: 0.5rem; }
  .summary span { margin-right: 2rem; }
  .stat-row { margin: 0.5rem 0; }
  .stat-row span { margin-right: 2rem; }
  table { border-collapse: collapse; width: 100%; margin-top: 0.5rem; }
  th, td { padding: 0.4rem 0.8rem; text-align: left; border-bottom: 1px solid #ddd; }
  th { background: #333; color: #fff; }
  .mono { font-family: ui-monospace, monospace; font-size: 0.9rem; }
  .num { text-align: right; }
  ul { list-style: none; padding: 0; }
  li.fail { background: #fde2e2; border-radius: 4px; padding: 0.5rem 0.8rem; margin-bottom: 0.4rem; }
  li.fail .why { color: #555; font-size: 0.9rem; margin-top: 0.2rem; }
  .clean { color: #1b7a1b; font-weight: bold; }
  .bad { color: #b00020; font-weight: bold; }
</style>
</head>
<body>
<h1>Review Report</h1>
<div class="summary">
  <span><strong>Toggle findings:</strong> ${toggle.length}</span>
  <span><strong>Assertion density:</strong> ${density ? `${density.ratio} (${density.flagged ? 'boo tomato tomato' : 'OK'})` : 'n/a'}</span>
</div>

<h2>Feature Toggle Coverage</h2>
${toggleSection}

<h2>Assertion Density</h2>
${densitySection}

</body>
</html>
`;

fs.writeFileSync(outputPath, html);
console.log(`Wrote ${outputPath}`);
