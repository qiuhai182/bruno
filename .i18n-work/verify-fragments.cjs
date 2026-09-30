const fs = require('fs');

const en = JSON.parse(fs.readFileSync('d:/bruno/.i18n-work/collection.en.json', 'utf8'));
const zh = JSON.parse(fs.readFileSync('d:/bruno/.i18n-work/collection.zh.json', 'utf8'));

const enKeys = new Set(Object.keys(en));
const zhKeys = new Set(Object.keys(zh));
const onlyEn = [...enKeys].filter((k) => !zhKeys.has(k));
const onlyZh = [...zhKeys].filter((k) => !enKeys.has(k));
console.log('EN:', enKeys.size, 'ZH:', zhKeys.size);
console.log('onlyInEn:', onlyEn.length ? onlyEn : 'none');
console.log('onlyInZh:', onlyZh.length ? onlyZh : 'none');

// every key referenced in code must be covered by fragment (with plural fallback) or existing en.json
const codeKeys = JSON.parse(fs.readFileSync('d:/bruno/.i18n-work/keys-found.json', 'utf8'));
const enTranslation = JSON.parse(fs.readFileSync('packages/bruno-app/src/i18n/translation/en.json', 'utf8'));
const existing = new Set();
(function flatten(obj, prefix) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') flatten(v, prefix + k + '.');
    else existing.add(prefix + k);
  }
})(enTranslation, '');

const missing = [];
for (const k of codeKeys) {
  if (enKeys.has(k) || existing.has(k)) continue;
  // plural base key: check suffixed variants in fragment
  if (enKeys.has(k + '_one') || enKeys.has(k + '_other') || existing.has(k + '_one') || existing.has(k + '_other')) continue;
  missing.push(k);
}
console.log('codeKeys:', codeKeys.length, 'missingFromFragments:', missing.length ? missing : 'none');

// spot check zh encoding
console.log('zh spotcheck:', zh['collection.app.title'], '|', zh['collection.example.filesAlreadyAdded'], '|', zh['collection.share.exporting']);
console.log('en spotcheck:', en['collection.example.filesAlreadyAdded']);
