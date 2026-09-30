const fs = require('fs');
const path = require('path');

const dir = __dirname;
const en = JSON.parse(fs.readFileSync(path.join(dir, 'prefs.en.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(dir, 'prefs.zh.json'), 'utf8'));

const fail = [];
const enKeys = Object.keys(en).sort();
const zhKeys = Object.keys(zh).sort();

if (JSON.stringify(enKeys) !== JSON.stringify(zhKeys)) {
  const onlyEn = enKeys.filter((k) => !zhKeys.includes(k));
  const onlyZh = zhKeys.filter((k) => !enKeys.includes(k));
  fail.push(`key set mismatch — only in en: ${JSON.stringify(onlyEn)}, only in zh: ${JSON.stringify(onlyZh)}`);
}
const CJK = /[\u4e00-\u9fff]/;
for (const [k, v] of Object.entries(zh)) {
  if (!CJK.test(v)) fail.push(`zh value not Chinese: ${k} = ${v}`);
}
for (const [name, obj] of [['en', en], ['zh', zh]]) {
  for (const [k, v] of Object.entries(obj)) {
    if (String(v).includes('\uFFFD')) fail.push(`${name} U+FFFD in ${k}`);
    if (/\{\{(\w+)\}\}/g.test(v) === false && /\{\{/.test(v)) fail.push(`${name} bad interpolation in ${k}`);
  }
  // interpolation params must match between en/zh
}
for (const k of enKeys) {
  const pe = (en[k].match(/\{\{\w+\}\}/g) || []).sort().join();
  const pz = (zh[k].match(/\{\{\w+\}\}/g) || []).sort().join();
  if (pe !== pz) fail.push(`interpolation mismatch for ${k}: en=${pe} zh=${pz}`);
}
for (const f of ['prefs.en.json', 'prefs.zh.json']) {
  const buf = fs.readFileSync(path.join(dir, f));
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) fail.push(`${f} has BOM`);
}

console.log(`keys: en=${enKeys.length} zh=${zhKeys.length}`);
if (fail.length) {
  console.log('FAIL');
  fail.forEach((f) => console.log(' -', f));
  process.exit(1);
}
console.log('PASS: parseable, key sets match, zh is Chinese, no U+FFFD, no BOM');
