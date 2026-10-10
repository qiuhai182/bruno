const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CWD = 'd:\\bruno';
const targets = [
  'packages/bruno-app/src/components/RequestPane/Auth/EdgeGridAuth/index.tsx',
  'packages/bruno-app/src/components/CollectionSettings/Auth/EdgeGridAuth/index.tsx',
  'packages/bruno-app/src/components/Preferences/AI/AutocompletePane.js',
  'packages/bruno-app/src/components/RequestPane/Auth/OAuth1/index.js',
  'packages/bruno-app/src/components/RequestPane/GrpcScript/index.js',
  'packages/bruno-app/src/components/RequestPane/RequestBody/RequestBodyMode/index.js',
  'packages/bruno-app/src/components/RequestPane/WSSettingsPane/index.js',
  'packages/bruno-app/src/components/WelcomeModal/WelcomeStep/index.js'
];
// keys to recover (from dynamic-key check), plus tooltips
const WANTED = [];
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation', 'en.json'), 'utf8'));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
const known = new Set(flat(en));
// regenerate wanted from the missing list logic: scan target files for labelKey/tooltipKey/nameKey/descriptionKey/titleKey/actionKey string literals not in known
for (const rel of targets) {
  const abs = path.join(CWD, rel);
  if (!fs.existsSync(abs)) { console.log('!! missing file', rel); continue; }
  const s = fs.readFileSync(abs, 'utf8');
  for (const m of s.matchAll(/(?:labelKey|tooltipKey|nameKey|descriptionKey|titleKey|actionKey|warningKey|sectionKey):\s*'([\w.]+)'/g)) {
    if (!known.has(m[1])) WANTED.push({ rel, key: m[1] });
  }
}
console.log('wanted keys:', WANTED.length);

function sh(args) { return execFileSync('git', args, { cwd: CWD, encoding: 'utf8', maxBuffer: 64e6 }); }

function extractStrings(line) {
  const out = [];
  for (const m of line.matchAll(/'([^'\n]+)'/g)) out.push(m[1]);
  for (const m of line.matchAll(/"([^"\n]+)"/g)) out.push(m[1]);
  const jsx = line.replace(/<[^>]*>/g, '').replace(/[{};]/g, ' ').trim();
  if (!/['"`]/.test(line) && /[A-Za-z]{2,}/.test(jsx)) out.push(jsx);
  return out;
}
function extractKeyRefs(line) {
  const out = [];
  for (const m of line.matchAll(/(?:labelKey|tooltipKey|nameKey|descriptionKey|titleKey|actionKey|warningKey|sectionKey):\s*'([\w.]+)'/g)) out.push(m[1]);
  return out;
}

const found = {};
for (const rel of [...new Set(WANTED.map((w) => w.rel))]) {
  const keys = WANTED.filter((w) => w.rel === rel).map((w) => w.key);
  // find commit that introduced the first key
  let commit = null;
  try {
    const log = sh(['log', '--all', '-S', keys[0], '--format=%H', '--', rel]).trim().split('\n').filter(Boolean);
    if (log.length) commit = log[log.length - 1]; // earliest
  } catch (e) {}
  if (!commit) { console.log('no commit for', rel); continue; }
  let oldSrc = null, newSrc = null;
  try { oldSrc = sh(['show', commit + '^:' + rel]); newSrc = sh(['show', commit + ':' + rel]); } catch (e) {}
  if (!oldSrc) { console.log('no parent for', rel, commit.slice(0, 8)); continue; }
  const a = oldSrc.split('\n'), b = newSrc.split('\n');
  const n = a.length, m = b.length;
  if (n * m > 15e6) { console.log('SKIP large', rel); continue; }
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ t: 'del', l: a[i++] });
    else ops.push({ t: 'add', l: b[j++] });
  }
  while (i < n) ops.push({ t: 'del', l: a[i++] });
  while (j < m) ops.push({ t: 'add', l: b[j++] });
  for (let k = 0; k < ops.length; k++) {
    if (ops[k].t !== 'del') continue;
    const dels = [], adds = [];
    while (k < ops.length && ops[k].t === 'del') dels.push(ops[k++].l);
    while (k < ops.length && ops[k].t === 'add') { adds.push(ops[k].l); k++; }
    k--;
    const ks = adds.flatMap(extractKeyRefs).filter((x) => keys.includes(x));
    if (!ks.length) continue;
    const strs = dels.flatMap(extractStrings);
    for (let x = 0; x < ks.length; x++) {
      const cand = strs[x] !== undefined ? strs[x] : strs.length ? strs[strs.length - 1] : '';
      if (cand && !(ks[x] in found)) found[ks[x]] = cand;
    }
  }
}
fs.writeFileSync(path.join(__dirname, 'dynamic-keys-en.json'), JSON.stringify(found, null, 2), 'utf8');
const still = WANTED.map((w) => w.key).filter((k) => !(k in found));
fs.writeFileSync(path.join(__dirname, 'dynamic-keys-missing.txt'), still.join('\n'), 'utf8');
console.log('recovered:', Object.keys(found).length, '/', WANTED.length, ' still missing:', still.length);
