const fs = require('fs');
const src = fs.readFileSync('d:/bruno/.i18n-work/repro-input.js', 'utf8');
const applyScript = fs.readFileSync('d:/bruno/.i18n-work/apply-i18n.js', 'utf8');
// extract the ProviderCard section's pairs verbatim from apply-i18n.js
const start = applyScript.indexOf("// ---------- ProviderCard.js ----------");
const end = applyScript.indexOf("// ---------- CompatEndpointCard.js ----------");
const section = applyScript.slice(start, end);
// evaluate the pairs array from the section
const m = section.match(/apply\(ROOT \+ 'Preferences\/AI\/ProviderCard\.js', (\[[\s\S]*?)\n\]\);/);
if (!m) { console.log('!! could not extract pairs'); process.exit(1); }
const pairs = eval(m[1]);
let s = src;
const eol = s.includes('\r\n') ? '\r\n' : '\n';
pairs.forEach(([find, replace], i) => {
  const f = find.split('\n').join(eol);
  const r = replace.split('\n').join(eol);
  const before = s;
  s = s.replace(f, r);
  if (s !== before) {
    const b = (s.match(/\u2022/g) || []).length;
    const fd = (s.match(/\uFFFD/g) || []).length;
    if (fd > 0) console.log('pair', i, 'introduced FFFD! bullets:', b, 'fffd:', fd);
  }
});
console.log('bullets after all pairs:', (s.match(/\u2022/g) || []).length, 'FFFD:', (s.match(/\uFFFD/g) || []).length);
