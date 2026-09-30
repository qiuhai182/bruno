const fs = require('fs');
const path = require('path');

const frag = JSON.parse(fs.readFileSync(path.join(__dirname, 'x2-fragment-en.json'), 'utf8'));

// Fixes confirmed against HEAD originals (mojibake / template-literal backticks)
const fixes = {
  'sidebar.gitRemote.clickToClone': '{{name}} \u2014 click to clone from {{remote}}',
  'sidebar.postmanReport.installing': 'Installing\u2026',
  'sidebar.postmanReport.installingOne': 'Installing {{count}} package\u2026',
  'sidebar.postmanReport.installingMany': 'Installing {{count}} packages\u2026',
  'sidebar.docs.tagsHint': 'Tags are labels on requests (e.g. smoke, WIP). Manage tags in Request \u203A Settings',
  'sidebar.import.parseError': 'Failed to parse the file \u2013 ensure it is valid JSON or YAML',
  'sidebar.goldenEdition.perUser': '/\u00A0user',
  'sidebar.validation.invalidCurl': 'Invalid cURL Command',
  'sidebar.validation.reservedFileNames': 'The file names "collection" and "folder" are reserved in bruno'
};
for (const [k, v] of Object.entries(fixes)) {
  if (!(k in frag)) { console.error('FIX TARGET MISSING:', k); process.exit(1); }
  frag[k] = v;
}

// sanity: no U+FFFD, no backticks, only whitelisted non-ASCII
const allowedNonAscii = new Set([0x2014, 0x2026, 0x203A, 0x2013, 0x00A0]);
let bad = 0;
for (const [k, v] of Object.entries(frag)) {
  if (v.includes('\uFFFD') || v.includes('`')) { console.error('BAD CHAR in', k); bad++; continue; }
  for (const ch of v) {
    const cp = ch.codePointAt(0);
    if (cp > 126 && !allowedNonAscii.has(cp)) { console.error('UNEXPECTED non-ASCII U+' + cp.toString(16).toUpperCase(), 'in', k); bad++; }
  }
  if (v.includes('?')) {
    // surface remaining '?' values for eyeball check (potential silent mojibake)
    console.log('NOTE question-mark value:', k, '=>', JSON.stringify(v));
  }
}
if (bad) process.exit(1);

const out = {};
for (const k of Object.keys(frag).sort()) out[k] = frag[k];
const json = JSON.stringify(out, null, 2) + '\n';
if (json.charCodeAt(0) === 0xFEFF) { console.error('BOM produced'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, 'sidebar.en.json'), json, 'utf8');
console.log('sidebar.en.json written:', Object.keys(out).length, 'keys');
