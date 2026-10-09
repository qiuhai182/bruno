const fs = require('fs');
const path = require('path');
const unresolved = fs.readFileSync(path.join(__dirname, 'final-unresolved.txt'), 'utf8').split('\n').filter(Boolean);
const SRC = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) files.push(p);
  }
})(SRC);
for (const key of unresolved) {
  const needle = "t('" + key + "'";
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    let idx = s.indexOf(needle);
    while (idx !== -1) {
      const start = Math.max(0, s.lastIndexOf('\n', Math.max(0, idx - 200)));
      const ctx = s.slice(start, s.indexOf('\n', idx + needle.length) + 1 || undefined);
      console.log('=== ' + key + ' @ ' + path.relative(SRC, f));
      console.log(ctx.trim().split('\n').slice(-6).join('\n'));
      idx = s.indexOf(needle, idx + 1);
      break;
    }
  }
}
