const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const dirs = ['components', 'providers', 'utils', 'pages'];

// count "user-visible english" signals per file
function countSignals(s) {
  let score = 0;
  // JSX text nodes with English words
  for (const m of s.matchAll(/>([^<>{}\n]*[A-Za-z]{3}[^<>{}\n]*)</g)) {
    const t = m[1].trim();
    if (/^[A-Za-z0-9 .,:;!?'"()\-/]+$/.test(t) && /[A-Za-z]{3}/.test(t) && t.split(/\s+/).length >= 1 && !/^(const|function|return|if|else|null|true|false|div|span|input)$/.test(t)) score += 2;
  }
  // UI props with string literals
  for (const m of s.matchAll(/\b(title|label|placeholder|confirmText|cancelText|tooltip|aria-label|message|heading|subheading|description|emptyText|hint)=["'{]?\s*["'`]([A-Za-z][^"'`]{2,60})["'`]/g)) {
    score += 2;
  }
  // toast / confirm calls with literals
  for (const m of s.matchAll(/toast\.(success|error|loading)\(\s*[`'"]([A-Za-z][^`'"]{3,80})/g)) score += 3;
  for (const m of s.matchAll(/confirm\(\s*[`'"]([A-Za-z][^`'"]{5,80})/g)) score += 3;
  // Modal title= with literal
  for (const m of s.matchAll(/title=\{?\s*["'`]([A-Z][^"'`]{2,60})["'`]/g)) score += 2;
  return score;
}

const results = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) {
      const s = fs.readFileSync(p, 'utf8');
      if (s.includes('useTranslation')) return; // already wired
      const score = countSignals(s);
      if (score >= 4) {
        const rel = path.relative(base, p).replace(/\\/g, '/');
        results.push({ rel, score, lines: s.split('\n').length });
      }
    }
  }
})(base);

results.sort((a, b) => b.score - a.score);
// group by top dir
const groups = {};
for (const r of results) {
  const g = r.rel.split('/')[1];
  groups[g] = (groups[g] || 0) + r.score;
}
console.log('=== files with hardcoded UI text (unwired):', results.length);
for (const r of results) console.log(String(r.score).padStart(3), r.rel);
console.log('\n=== group totals:');
console.log(Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([g, n]) => g + '=' + n).join(', '));
fs.writeFileSync(path.join(__dirname, 'unwired-files.txt'), results.map((r) => r.rel + '\t' + r.score).join('\n'), 'utf8');
