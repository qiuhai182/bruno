const fs = require('fs');
const path = require('path');

const roots = [
  'packages/bruno-app/src/components/CollectionSettings',
  'packages/bruno-app/src/components/FolderSettings',
  'packages/bruno-app/src/components/ResponseExample',
  'packages/bruno-app/src/components/ShareCollection',
  'packages/bruno-app/src/components/CollectionApp'
];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|tsx)$/.test(e.name) && !e.name.endsWith('.spec.js') && !e.name.endsWith('.spec.jsx')) out.push(p);
  }
  return out;
}

const set = new Set();
const perFile = {};
for (const root of roots) {
  for (const f of walk(root, [])) {
    const s = fs.readFileSync(f, 'utf8');
    const found = [];
    for (const m of s.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) {
      set.add(m[1]);
      found.push(m[1]);
    }
    if (found.length) perFile[f.replace(/\\/g, '/')] = found;
  }
}

const en = JSON.parse(fs.readFileSync('packages/bruno-app/src/i18n/translation/en.json', 'utf8'));
function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') flatten(v, prefix + k + '.', out);
    else out.add(prefix + k);
  }
}
const existing = new Set();
flatten(en, '', existing);

const keys = [...set].sort();
for (const k of keys) {
  console.log((existing.has(k) ? 'EXISTS ' : 'NEW    ') + k);
}
console.error('TOTAL:', keys.length, 'NEW:', keys.filter((k) => !existing.has(k)).length, 'EXISTING:', keys.filter((k) => existing.has(k)).length);
fs.writeFileSync('d:/bruno/.i18n-work/keys-found.json', JSON.stringify(keys, null, 2));
