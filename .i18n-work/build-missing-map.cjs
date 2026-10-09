const fs = require('fs');
const path = require('path');

// union of extracted EN maps from all artifacts
const sources = [
  ['stash-key-en.json', 'stash'],
  ['extracted.json', 'extracted'],
  ['key-en-map.json', 'key-en-map'],
  ['en-dataset.json', 'en-dataset'],
  ['tabs.en.json', 'tabs']
];
const map = {}; // key -> {en, src}
const conflicts = {};
for (const [f, tag] of sources) {
  let o;
  try { o = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')); }
  catch (e) { console.log('skip', f, e.message.slice(0, 40)); continue; }
  for (const [k, v] of Object.entries(o)) {
    const en = String(v).trim();
    if (!en || !/\w/.test(en)) continue;
    if (!(k in map)) map[k] = { en, src: tag };
    else if (map[k].en !== en) {
      (conflicts[k] = conflicts[k] || new Set()).add(map[k].en);
      conflicts[k].add(en);
    }
  }
}
// report coverage of currently missing keys
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation', 'en.json'), 'utf8'));
function flat(o, p = '') {
  return Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
}
const known = new Set(flat(en));

// recompute missing list from source scan (reuse saved list if present)
const missingFile = path.join(__dirname, 'missing-keys.txt');
let missing = fs.existsSync(missingFile)
  ? fs.readFileSync(missingFile, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
  : [];
if (!missing.length) {
  // quick rescan
  const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
  const walk = (d, out) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, out);
      else if (/\.(js|jsx|tsx)$/.test(e.name)) out.push(p);
    }
    return out;
  };
  const re = /\bt\(\s*['"]([\w.]+)['"]/g;
  const set = new Set();
  for (const f of walk(base, [])) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(re)) set.add(m[1]);
  }
  missing = [...set].filter((k) => !known.has(k)).sort();
  fs.writeFileSync(missingFile, missing.join('\n'), 'utf8');
}

const covered = missing.filter((k) => k in map);
const uncovered = missing.filter((k) => !(k in map));
fs.writeFileSync(path.join(__dirname, 'missing-covered.json'), JSON.stringify(Object.fromEntries(covered.map((k) => [k, map[k].en])), null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'missing-uncovered.txt'), uncovered.join('\n'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'source-conflicts.json'), JSON.stringify(Object.fromEntries(Object.entries(conflicts).map(([k, v]) => [k, [...v]])), null, 2), 'utf8');
console.log('missing keys:', missing.length, ' covered by extraction:', covered.length, ' uncovered:', uncovered.length);
console.log('multi-source conflicts:', Object.keys(conflicts).length);
