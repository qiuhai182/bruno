const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Reuse the hunk pairing from extract-keys but build a key->english map
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

const map = {}; // key -> english string (when unambiguous 1:1)
const ambiguous = [];

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    const rel = f.split(path.sep).join('/');
    let head = '';
    try { head = execSync(`git show HEAD:${rel}`, { maxBuffer: 1e8 }).toString('utf8'); } catch (e) { }
    const work = fs.readFileSync(f, 'utf8');
    if (!head || head === work) continue;
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
      if (removedStrings.length === 1 && addedKeys.length === 1) {
        const key = addedKeys[0];
        const val = removedStrings[0];
        if (map[key] && map[key] !== val) {
          ambiguous.push({ file: rel, conflict: [map[key], val], key });
        } else {
          map[key] = val;
        }
      } else if (removedStrings.length && addedKeys.length) {
        ambiguous.push({ file: rel.replace(/\\/g, '/'), removed: removedStrings, added: addedKeys });
      }
    }
  }
}

fs.writeFileSync('.i18n-work/key-en-map.json', JSON.stringify(map, null, 2), 'utf8');
let out = '';
for (const a of ambiguous) out += JSON.stringify(a) + '\n';
fs.writeFileSync('.i18n-work/ambiguous-pairs.txt', out, 'utf8');
console.log('mapped:', Object.keys(map).length, 'ambiguous hunks:', ambiguous.length);
