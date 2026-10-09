const fs = require('fs');
const path = require('path');

const cands = JSON.parse(fs.readFileSync(path.join(__dirname, 'garbage-candidates.json'), 'utf8'));
const BAD = /_blank|noreferrer|mailto:|https?:|rgba?\(|^\W*$|className|onChange|onClick|disabled|checked|isOpen|maxLength|value=|formik\.|errors\.|props\.|state\.|event\.|window\.|=>|function |const |let |import |export |require\(|\.then|\.map|\.filter|\.join|JSON\./;
const CLASSY = /^(flex|grid|block|inline|w-|h-|py-|px-|p-|m[trblxy]?-|text-|font-|bg-|border|rounded|opacity|hover|items|justify|gap|space-|cursor|transition|relative|absolute|hidden|truncate|overflow|secondary|ghost|danger|primary|info|success|warning|off|false|true|empty-|error-|warning-|section-|modal-|textbox|preview|pkg-|env-|grpc-|oauth1-|method-|selected-|inherited|environment-|inheritance|create-|change-|bruno-|errors-|tab-|info-|label|checkbox|input|button|sm|lg|md|xs|full|default)/;
const chosen = {};
for (const [k, { candidates }] of Object.entries(cands)) {
  // score candidates
  let best = null;
  for (const c of candidates) {
    if (BAD.test(c) || CLASSY.test(c)) continue;
    if (!/[A-Za-z]{2,}/.test(c)) continue;
    if (c.length < 2) continue;
    const words = c.trim().split(/\s+/).length;
    const hasSpace = /\s/.test(c.trim());
    const upperStart = /^[A-Z"*(]/.test(c.trim());
    const score = (hasSpace ? 4 : 0) + (words >= 2 ? 2 : 0) + (upperStart ? 2 : 0) + (/\{\{|\$\{|\*|\.$|\?$|:$/.test(c) ? 1 : 0);
    if (!best || score > best.score) best = { c, score };
  }
  chosen[k] = best ? best.c : '';
}
fs.writeFileSync(path.join(__dirname, 'garbage-chosen.json'), JSON.stringify(Object.fromEntries(Object.entries(chosen).sort()), null, 2), 'utf8');
const empty = Object.entries(chosen).filter(([, v]) => !v);
console.log('chosen:', Object.keys(chosen).length, ' empty:', empty.length);
console.log(empty.map(([k]) => k).join('\n'));
