#!/usr/bin/env node
// Renders the review-agent's three check results into one styled HTML report.
// Usage: render-report.js <input.json> <output.html>
//
// Input JSON shape:
// {
//   "toggle": [ { "file": "path", "line": 12, "issue": "what's ungated", "why": "..." }, ... ],
//   "assertionDensity": { "ratio": 0.032, "threshold": 0.05, "flagged": true,
//                          "sourceFiles": 10, "sourceLoc": 500, "testFiles": 4, "asserts": 16 },
//   "crap": [ { "src": "path", "lineStart": 10, "method": "Foo#bar", "crap": 34.2,
//               "threshold": 30, "cc": 8, "cov": 12.5 }, ... ]
// }
// Any array may be empty; that section renders as "No issues found."

const fs = require('fs');

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: render-report.js <input.json> <output.html>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const toggle = data.toggle || [];
const density = data.assertionDensity || null;
const crap = data.crap || [];

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
    <div class="summary">
      <span><strong>Ratio:</strong> ${density.ratio} (threshold ${density.threshold})</span>
      <span><strong>Status:</strong> <span class="${density.flagged ? 'bad' : 'clean'}">${
      density.flagged ? 'FLAG' : 'OK'
    }</span></span>
    </div>
    <table>
      <tr><th>Source files</th><th>Source LOC</th><th>Test files</th><th>Asserts</th></tr>
      <tr><td class="num">${density.sourceFiles}</td><td class="num">${density.sourceLoc}</td><td class="num">${density.testFiles}</td><td class="num">${density.asserts}</td></tr>
    </table>`
  : '<p class="clean">No Java files found.</p>';

const crapSection = crap.length
  ? `<table>
      <tr><th>Status</th><th>Method</th><th>Source:Line</th><th>CC</th><th>Cov%</th><th>CRAP</th><th>Threshold</th></tr>
      ${crap
        .map(
          (m) => `
      <tr class="fail">
        <td class="status">FAIL</td>
        <td class="mono">${escape(m.method)}</td>
        <td class="mono">${escape(m.src)}:${m.lineStart}</td>
        <td class="num">${m.cc}</td>
        <td class="num">${Number(m.cov).toFixed(1)}%</td>
        <td class="num crap">${Number(m.crap).toFixed(1)}</td>
        <td class="num">${m.threshold}</td>
      </tr>`
        )
        .join('')}
    </table>`
  : '<p class="clean">No methods over threshold.</p>';

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
  table { border-collapse: collapse; width: 100%; margin-top: 0.5rem; }
  th, td { padding: 0.4rem 0.8rem; text-align: left; border-bottom: 1px solid #ddd; }
  th { background: #333; color: #fff; }
  .mono { font-family: ui-monospace, monospace; font-size: 0.9rem; }
  .num, .status { text-align: right; }
  .status { text-align: center; font-weight: bold; }
  ul { list-style: none; padding: 0; }
  li.fail { background: #fde2e2; border-radius: 4px; padding: 0.5rem 0.8rem; margin-bottom: 0.4rem; }
  li.fail .why { color: #555; font-size: 0.9rem; margin-top: 0.2rem; }
  tr.fail { background: #fde2e2; }
  tr.fail .status { color: #b00020; }
  .clean { color: #1b7a1b; font-weight: bold; }
  .bad { color: #b00020; font-weight: bold; }
</style>
</head>
<body>
<h1>Review Report</h1>
<div class="summary">
  <span><strong>Toggle findings:</strong> ${toggle.length}</span>
  <span><strong>Assertion density:</strong> ${density ? `${density.ratio} (${density.flagged ? 'FLAG' : 'OK'})` : 'n/a'}</span>
  <span><strong>CRAP failures:</strong> ${crap.length}</span>
</div>

<h2>Feature Toggle Coverage</h2>
${toggleSection}

<h2>Assertion Density</h2>
${densitySection}

<h2>CRAP Score</h2>
${crapSection}

</body>
</html>
`;

fs.writeFileSync(outputPath, html);
console.log(`Wrote ${outputPath}`);
