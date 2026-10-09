const fs = require('fs');
const path = require('path');

const chosen = JSON.parse(fs.readFileSync(path.join(__dirname, 'garbage-chosen.json'), 'utf8'));
const BAD = /_blank|noreferrer|mailto:|https?:|rgba?\(|className|onChange|onClick|disabled|checked|isOpen|maxLength|value=|formik\.|errors\.|props\.|event\.|window\.|=>|function |const |let |import |export |require\(|JSON\.|\breturn\b|\/\*|single-line-editor|error-message|block mb|mt-2|mb-3|flex-1|flex items|w-full|text-xs|text-sm|text-lg|font-medium|dropdown-icon|caret ml|py-3|px-|key-display|off$|^false$|^true$|^value$|^key$|^text$|^domain$|^button$|^showWarning|^currentVersion|^enabled$|^const$/;
const suspect = Object.entries(chosen).filter(([k, v]) => BAD.test(v) || !/\s/.test(v) && v.length > 12 && /^[a-z]/.test(v));
fs.writeFileSync(path.join(__dirname, 'suspect-keys.txt'), suspect.map(([k]) => k).join('\n'), 'utf8');

const SRC = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) files.push(p);
  }
})(SRC);
const out = [];
for (const [k] of suspect) {
  const needle = "t('" + k + "'";
  let found = false;
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    const i = s.indexOf(needle);
    if (i === -1) continue;
    const lines = s.split('\n');
    let li = 0, pos = 0;
    const upto = s.slice(0, i).split('\n').length - 1;
    const ctx = lines.slice(Math.max(0, upto - 6), upto + 4).join('\n');
    out.push('===== ' + k + '  (' + path.relative(SRC, f) + ')');
    out.push(ctx);
    found = true;
    break;
  }
  if (!found) out.push('===== ' + k + '  NOT FOUND');
}
fs.writeFileSync(path.join(__dirname, 'suspect-contexts.txt'), out.join('\n\n'), 'utf8');
console.log('suspect:', suspect.length, ' contexts written');
