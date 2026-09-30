const fs = require('fs');
const frag = JSON.parse(fs.readFileSync(__dirname + '/x2-fragment-en.json', 'utf8'));

const keys = Object.keys(frag);
console.log('total fragment keys:', keys.length);

// 1. scan every value for non-ASCII / U+FFFD / backtick
const suspicious = [];
for (const [k, v] of Object.entries(frag)) {
  if (typeof v !== 'string') { console.log('NON-STRING VALUE:', k, typeof v); continue; }
  const chars = [];
  for (const ch of v) {
    const cp = ch.codePointAt(0);
    if (cp > 126 || cp === 0xFFFD) chars.push(ch);
  }
  const hasBacktick = v.includes('`');
  if (chars.length || hasBacktick) {
    suspicious.push({ k, v, chars, hasBacktick });
  }
}

console.log('\n=== suspicious values (non-ASCII / backtick) ===');
for (const s of suspicious) {
  const charInfo = [...new Set(s.chars)].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
  console.log('\nKEY:', s.k);
  console.log('  value:', JSON.stringify(s.v));
  console.log('  nonascii:', charInfo || '(none)', s.hasBacktick ? 'HAS-BACKTICK' : '');
}

// 2. full escape dump of the known suspicious keys
const targets = [
  'sidebar.gitRemote.clickToClone',
  'sidebar.postmanReport.installing',
  'sidebar.postmanReport.installingOne',
  'sidebar.postmanReport.installingMany',
  'sidebar.docs.tagsHint',
  'sidebar.import.parseError',
  'sidebar.goldenEdition.perUser',
  'sidebar.validation.invalidCurl',
  'sidebar.validation.reservedFileNames'
];
console.log('\n=== target keys escape dump ===');
for (const t of targets) {
  const v = frag[t];
  if (v === undefined) { console.log(t, '=> MISSING'); continue; }
  let esc = '';
  for (const ch of v) {
    const cp = ch.codePointAt(0);
    esc += cp > 126 ? '\\u{' + cp.toString(16).toUpperCase() + '}' : ch;
  }
  console.log(t, '=>', esc);
}
