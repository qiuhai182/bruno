const fs = require('fs');
const path = require('path');

const missing = new Set(fs.readFileSync(path.join(__dirname, 'missing-authoritative.txt'), 'utf8').split('\n').filter(Boolean));
const chosen = JSON.parse(fs.readFileSync(path.join(__dirname, 'garbage-chosen.json'), 'utf8'));
const overrides = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-overrides.json'), 'utf8'));
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'final-key-en.json'), 'utf8'));

const garbageFile = path.join(__dirname, 'garbage-en-keys.txt');
const garbage = new Set(fs.readFileSync(garbageFile, 'utf8').split('\n').filter(Boolean));

const final = { ...base };
const applied = [], unmatched = [];
for (const [k, v] of Object.entries(overrides)) {
  if (!missing.has(k)) { unmatched.push(k); continue; }
  final[k] = v;
  garbage.delete(k);
  applied.push(k);
}
// fill remaining garbage keys with chosen values (best effort)
for (const k of garbage) {
  if (chosen[k]) final[k] = chosen[k];
}
fs.writeFileSync(path.join(__dirname, 'final-key-en.json'), JSON.stringify(Object.fromEntries(Object.entries(final).sort()), null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'en-overrides-unmatched.txt'), unmatched.join('\n'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'garbage-remaining.txt'), [...garbage].join('\n'), 'utf8');
console.log('overrides applied:', applied.length, ' unmatched:', unmatched.length, ' garbage still unfixed:', garbage.size);
console.log('unmatched keys:\n' + unmatched.join('\n'));
