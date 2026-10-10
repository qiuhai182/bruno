const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const FFFD = '\uFFFD';
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
const en = JSON.parse(fs.readFileSync(path.join(base, 'i18n', 'translation', 'en.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(base, 'i18n', 'translation', 'zh-CN.json'), 'utf8'));
const known = new Set(flat(en));
const get = (o, k) => k.split('.').reduce((x, y) => (x && x[y] !== undefined ? x[y] : undefined), o);

// ---- 1. dynamic t() usages: template literals and variables ----
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) files.push(p);
  }
})(base);
console.log('=== 1. DYNAMIC t() KEYS ===');
let dynTotal = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\bt\(\s*`([^`]+)`/g)) {
    dynTotal++;
    console.log('  TEMPLATE ' + path.relative(base, f).replace(/\\/g, '/') + ': ' + m[1].slice(0, 90));
  }
  // t(someVariable) patterns — non-literal
  for (const m of s.matchAll(/\bt\(\s*([a-zA-Z_$][\w.$]*)\s*[,)]/g)) {
    const arg = m[1];
    if (['t', 'i18n'].includes(arg)) continue;
    // skip common non-key identifiers inside JSX like {t(label)}? still report
    console.log('  VARKEY  ' + path.relative(base, f).replace(/\\/g, '/') + ': t(' + arg + ')');
    dynTotal++;
  }
}
console.log('  dynamic total:', dynTotal);

// ---- 2. untranslated detection: zh value === en value (long latin strings) ----
console.log('\n=== 2. ZH VALUE IDENTICAL TO EN (possible untranslated) ===');
let same = 0, flagged = 0;
const identical = [];
for (const k of known) {
  const ev = get(en, k), zv = get(zh, k);
  if (typeof ev !== 'string' || typeof zv !== 'string') continue;
  if (ev === zv) {
    same++;
    const words = ev.trim().split(/\s+/).length;
    const hasCJK = /[\u4e00-\u9fff]/.test(zv);
    if (!hasCJK && words >= 4) { flagged++; identical.push(k + '  ||  ' + ev.slice(0, 70)); }
  }
}
console.log('  identical values total:', same, ' long-sentence suspects:', flagged);
identical.slice(0, 60).forEach((l) => console.log('  ' + l));

// ---- 3. FFFD inside locale values ----
console.log('\n=== 3. FFFD IN VALUES ===');
let fffd = 0;
for (const k of known) {
  for (const [obj, tag] of [[en, 'EN'], [zh, 'ZH']]) {
    const v = get(obj, k);
    if (typeof v === 'string' && v.includes(FFFD)) { fffd++; console.log('  ' + tag + ' ' + k); }
  }
}
console.log('  total:', fffd);

// ---- 4. zh has no CJK at all but is not a known technical term ----
console.log('\n=== 4. ZH WITHOUT CJK (len>=3 words, likely untranslated) ===');
let noCjk = 0;
for (const k of known) {
  const zv = get(zh, k);
  if (typeof zv !== 'string') continue;
  if (/[\u4e00-\u9fff]/.test(zv)) continue;
  const words = zv.trim().split(/\s+/).length;
  if (words >= 3) { noCjk++; console.log('  ' + k + '  ||  ' + zv.slice(0, 70)); }
}
console.log('  total:', noCjk);
