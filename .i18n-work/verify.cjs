const fs = require('fs');

const en = JSON.parse(fs.readFileSync('.i18n-work/reqpane-http.en.json', 'utf8'));
const zh = JSON.parse(fs.readFileSync('.i18n-work/reqpane-http.zh.json', 'utf8'));

console.log('en keys:', Object.keys(en).length, '| zh keys:', Object.keys(zh).length);

const enKeys = new Set(Object.keys(en));
const zhKeys = new Set(Object.keys(zh));
const missingInZh = [...enKeys].filter((k) => !zhKeys.has(k));
const missingInEn = [...zhKeys].filter((k) => !enKeys.has(k));
if (missingInZh.length) console.log('MISSING IN ZH:', missingInZh);
if (missingInEn.length) console.log('MISSING IN EN:', missingInEn);
if (!missingInZh.length && !missingInEn.length) console.log('KEY SETS IDENTICAL: YES');

// sample zh values
console.log('sample zh auth.username =', zh['requestPane.auth.username']);
console.log('sample zh oauth1.bodyPlacementHint =', zh['requestPane.oauth1.bodyPlacementHint']);
console.log('sample zh headers.folderSource =', zh['requestPane.headers.folderSource']);
console.log('sample zh oauth2.expiresIn =', zh['requestPane.oauth2.expiresIn']);

// non-ascii check in en (should only be curly quotes + em dash in specific keys)
const nonAsciiEn = Object.entries(en).filter(([, v]) => /[^\x00-\x7F]/.test(v));
console.log('en values with non-ascii:', nonAsciiEn.map(([k]) => k));

// extract keys used in code and compare
const base = 'packages/bruno-app/src/components/RequestPane/';
const files = JSON.parse(fs.readFileSync('.i18n-work/my-files.json', 'utf8'));
const used = new Set();
for (const f of files) {
  const s = fs.readFileSync(base + f, 'utf8');
  for (const m of s.matchAll(/requestPane\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*/g)) {
    used.add(m[0]);
  }
}
for (const k of ['params', 'body', 'headers', 'auth', 'vars', 'script', 'assert', 'tests', 'docs', 'app', 'settings']) {
  used.add('requestPane.tabs.' + k);
}
const usedList = [...used].sort();
const notInFragment = usedList.filter((k) => !enKeys.has(k));
console.log('used keys in code:', usedList.length, '| missing from fragment:', notInFragment.length ? notInFragment : 'NONE');
const inFragmentNotUsed = [...enKeys].filter((k) => !used.has(k));
console.log('fragment keys not referenced in code:', inFragmentNotUsed.length ? inFragmentNotUsed : 'NONE');
