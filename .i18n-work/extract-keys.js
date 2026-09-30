const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const roots = [
  'packages/bruno-app/src/components/RequestTabs',
  'packages/bruno-app/src/components/ResponsePane',
  'packages/bruno-app/src/components/RunnerResults',
  'packages/bruno-app/src/components/VariablesEditor',
  'packages/bruno-app/src/components/Documentation',
  'packages/bruno-app/src/components/OpenAPISpecTab',
  'packages/bruno-app/src/components/OpenAPISyncTab',
  'packages/bruno-app/src/components/ResponseExample/ResponseExampleResponsePane'
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(e.name) && !/\.spec\./.test(e.name)) out.push(p);
  }
  return out;
}

const keyRe = /\bt\(\s*'([A-Za-z][\w.-]*)'/g;
const strRe = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`([^`]*)`/g;

const usedKeys = new Map(); // key -> Set(files)
const perFilePairs = [];

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    const rel = f.split(path.sep).join('/');
    let head = '';
    try { head = execSync(`git show HEAD:${rel}`, { maxBuffer: 1e8 }).toString('utf8'); } catch (e) { }
    const work = fs.readFileSync(f, 'utf8');

    const keys = new Set();
    let m;
    while ((m = keyRe.exec(work)) !== null) keys.add(m[1]);
    for (const k of keys) {
      if (!usedKeys.has(k)) usedKeys.set(k, new Set());
      usedKeys.get(k).add(rel);
    }

    // pair removed strings with added keys per diff hunk
    if (head && head !== work) {
      let diff = '';
      try { diff = execSync(`git diff HEAD -- ${rel}`, { maxBuffer: 1e8 }).toString('utf8'); } catch (e) { }
      const hunks = diff.split('\n@@');
      for (const h of hunks.slice(1)) {
        const removedStrings = [];
        const addedKeys = [];
        for (const line of h.split('\n')) {
          if (line.startsWith('-') && !line.startsWith('---')) {
            let s;
            strRe.lastIndex = 0;
            while ((s = strRe.exec(line)) !== null) {
              const raw = s[1] !== undefined ? s[1] : (s[2] !== undefined ? s[2] : s[3]);
              if (raw && raw.trim() && /[A-Za-z]{2}/.test(raw) && !/^[a-z$._-]+$/.test(raw)) removedStrings.push(raw);
            }
          } else if (line.startsWith('+') && !line.startsWith('+++')) {
            let k;
            keyRe.lastIndex = 0;
            while ((k = keyRe.exec(line)) !== null) addedKeys.push(k[1]);
          }
        }
        if (removedStrings.length && addedKeys.length) {
          perFilePairs.push({ file: rel.replace('packages/bruno-app/src/components/', ''), removed: removedStrings, added: addedKeys });
        }
      }
    }
  }
}

const flat = (obj, prefix = '') => {
  let out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'object' && v !== null) out = out.concat(flat(v, prefix ? prefix + '.' + k : k));
    else out.push(prefix ? prefix + '.' + k : k);
  }
  return out;
};
const enKeys = new Set(flat(JSON.parse(fs.readFileSync('packages/bruno-app/src/i18n/translation/en.json', 'utf8'))));

const all = [...usedKeys.keys()].sort();
const existing = all.filter((k) => enKeys.has(k));
const newKeys = all.filter((k) => !enKeys.has(k));

let out = '=== USED KEYS: ' + all.length + ' total, ' + existing.length + ' existing, ' + newKeys.length + ' new ===\n\n';
out += '--- EXISTING (reuse, do not add) ---\n' + existing.join('\n') + '\n\n';
out += '--- NEW KEYS ---\n' + newKeys.join('\n') + '\n\n';
out += '=== DIFF-DERIVED PAIRS (removed strings <-> added keys, per hunk) ===\n';
for (const p of perFilePairs) {
  out += '\n[' + p.file + ']\n  removed: ' + JSON.stringify(p.removed) + '\n  added:   ' + JSON.stringify(p.added) + '\n';
}
fs.writeFileSync('.i18n-work/keys-report.txt', out, 'utf8');
fs.writeFileSync('.i18n-work/new-keys.json', JSON.stringify(newKeys, null, 2), 'utf8');
console.log('total', all.length, 'existing', existing.length, 'new', newKeys.length);
