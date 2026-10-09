const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = walk(base, []);
const keys = new Set();
const re = /\bt\(\s*['"]([\w.]+)['"]/g;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(re)) keys.add(m[1]);
}
const en = JSON.parse(fs.readFileSync(path.join(base, 'i18n', 'translation', 'en.json'), 'utf8'));
function flat(o, p = '') {
  return Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
}
const known = new Set(flat(en));
const missing = [...keys].filter((k) => !known.has(k));
console.log('scanned files:', files.length, ' distinct t() keys:', keys.size);
console.log('missing from en.json:', missing.length);
// group by first two segments
const groups = {};
for (const k of missing) {
  const g = k.split('.').slice(0, 2).join('.');
  groups[g] = (groups[g] || 0) + 1;
}
console.log(
  Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .map(([g, n]) => g.padEnd(45) + n)
    .join('\n')
);
