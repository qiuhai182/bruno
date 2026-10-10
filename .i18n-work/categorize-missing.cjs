const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
const en = JSON.parse(fs.readFileSync(path.join(base, 'i18n', 'translation', 'en.json'), 'utf8'));
const known = new Set(flat(en));
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) files.push(p);
  }
})(base);
const used = new Set();
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) used.add(m[1]);
const missing = [...used].filter((k) => !known.has(k)).sort();

const artifacts = {};
for (const f of fs.readdirSync(__dirname)) {
  if (/^batch-.*-keys\.en\.json$/.test(f)) {
    artifacts[f] = Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')));
  }
}
const coveredBy = {};
const residue = [];
for (const k of missing) {
  let hit = null;
  for (const [f, ks] of Object.entries(artifacts)) if (ks.includes(k)) hit = f;
  if (hit) (coveredBy[hit] = coveredBy[hit] || []).push(k);
  else residue.push(k);
}
console.log('total missing:', missing.length);
for (const [f, ks] of Object.entries(coveredBy)) console.log('covered by', f, ':', ks.length);
console.log('RESIDUE (no artifact):', residue.length);
const groups = {};
for (const k of residue) { const g = k.split('.').slice(0, 2).join('.'); groups[g] = (groups[g] || 0) + 1; }
console.log(Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([g, n]) => g + '=' + n).join('\n'));
fs.writeFileSync(path.join(__dirname, 'batchb-residue.txt'), residue.join('\n'), 'utf8');
