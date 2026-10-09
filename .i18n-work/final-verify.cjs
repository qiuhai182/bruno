const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const FFFD = '\uFFFD';

function flat(o, p = '') {
  return Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
}
const en = JSON.parse(fs.readFileSync(path.join(base, 'i18n', 'translation', 'en.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(base, 'i18n', 'translation', 'zh-CN.json'), 'utf8'));
const ek = flat(en), zk = flat(zh);
const enSet = new Set(ek), zhSet = new Set(zk);
const enRaw = fs.readFileSync(path.join(base, 'i18n', 'translation', 'en.json'), 'utf8');
const zhRaw = fs.readFileSync(path.join(base, 'i18n', 'translation', 'zh-CN.json'), 'utf8');

// 1. parity
const onlyEn = ek.filter((k) => !zhSet.has(k));
const onlyZh = zk.filter((k) => !enSet.has(k));
console.log('en keys:', ek.length, ' zh keys:', zk.length);
console.log('only in en:', onlyEn.length, onlyEn.slice(0, 5));
console.log('only in zh:', onlyZh.length, onlyZh.slice(0, 5));

// 2. FFFD
console.log('FFFD en:', enRaw.includes(FFFD), ' zh:', zhRaw.includes(FFFD));

// 3. placeholder parity ({{s}} exempt)
const ph = (s) => { const m = String(s).match(/\{\{\s*[\w.]+\s*\}\}/g) || []; return m.filter((x) => x !== '{{s}}').sort().join(','); };
const bad = [];
for (const k of ek) {
  const ev = k.split('.').reduce((o, x) => (o && o[x] !== undefined ? o[x] : undefined), en);
  const zv = k.split('.').reduce((o, x) => (o && o[x] !== undefined ? o[x] : undefined), zh);
  if (ph(ev) !== ph(zv)) bad.push(k);
}
console.log('placeholder mismatches:', bad.length, bad.slice(0, 10));

// 4. sweep t() usages
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) files.push(p);
  }
})(base);
const used = new Set();
for (const f of files) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) used.add(m[1]);
}
const miss = [...used].filter((k) => !enSet.has(k));
console.log('t() keys used:', used.size, ' missing from locales:', miss.length);
if (miss.length) console.log(miss.slice(0, 20).join('\n'));

// 5. empty values
const emptyEn = ek.filter((k) => { const v = k.split('.').reduce((o, x) => (o && o[x] !== undefined ? o[x] : undefined), en); return !String(v).trim(); });
console.log('empty en values:', emptyEn.length);
console.log(emptyEn.length ? 'DONE WITH ISSUES' : 'ALL CHECKS PASSED');
