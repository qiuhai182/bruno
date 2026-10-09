const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const out = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) out.push(p);
  }
})(base);
console.log('files:', out.length);
const set = new Set();
const re = /\bt\(\s*['"]([\w.]+)['"]/g;
for (const f of out) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(re)) set.add(m[1]);
}
const en = JSON.parse(fs.readFileSync(path.join(base, 'i18n', 'translation', 'en.json'), 'utf8'));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
const known = new Set(flat(en));
console.log('en known keys:', known.size);
console.log('distinct t() keys:', set.size);
console.log('has app.titleBar.minimize in t():', set.has('app.titleBar.minimize'));
console.log('has app.titleBar.minimize in en.json:', known.has('app.titleBar.minimize'));
const missing = [...set].filter((k) => !known.has(k)).sort();
fs.writeFileSync(path.join(__dirname, 'missing-authoritative.txt'), missing.join('\n'), 'utf8');
console.log('missing:', missing.length);
// why did old scan see more? count keys captured only in check-t-keys regex form
const re2 = /\bt\(\s*['"]([\w.]+)['"]/g;
let count2 = new Set();
for (const f of out) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(re2)) count2.add(m[1]);
}
console.log('regex2 distinct:', count2.size);
