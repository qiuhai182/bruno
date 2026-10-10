const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const NEW = '6d08c09ae';
const OLD = NEW + '^';
const residue = fs.readFileSync(path.join(__dirname, 'batchb-residue.txt'), 'utf8').split('\n').filter(Boolean);

// files touched in NEW commit
const files = execFileSync('git', ['show', NEW, '--name-only', '--format='], { cwd: 'd:\\bruno', encoding: 'utf8' })
  .split('\n').map((s) => s.trim()).filter((s) => s && /\.(js|jsx|tsx)$/.test(s));

function extractStrings(line) {
  const out = [];
  for (const m of line.matchAll(/'([^'\n]+)'/g)) out.push(m[1]);
  for (const m of line.matchAll(/"([^"\n]+)"/g)) out.push(m[1]);
  for (const m of line.matchAll(/`([^`\n]+)`/g)) out.push(m[1]);
  const jsx = line.replace(/<[^>]*>/g, '').replace(/[{};]/g, ' ').trim();
  if (!/['"`]/.test(line) && /[A-Za-z]{2,}/.test(jsx)) out.push(jsx);
  return out;
}
function extractKeys(line) {
  const out = [];
  for (const m of line.matchAll(/(?:^|[^.\w])t\(\s*'([\w.]+)'/g)) out.push(m[1]);
  for (const m of line.matchAll(/i18n\.t\(\s*'([\w.]+)'/g)) out.push(m[1]);
  return out;
}

const found = {};
for (const rel of files) {
  let oldSrc, newSrc;
  try {
    oldSrc = execFileSync('git', ['show', OLD + ':' + rel], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 });
    newSrc = execFileSync('git', ['show', NEW + ':' + rel], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 });
  } catch (e) { continue; }
  // simple line-based diff: find -/+ runs via LCS
  const a = oldSrc.split('\n'), b = newSrc.split('\n');
  const n = a.length, m = b.length;
  if (n * m > 12e6) { console.log('SKIP large', rel); continue; }
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
  // group into del-run followed by add-run
  for (let k = 0; k < ops.length; k++) {
    if (ops[k].t !== 'del') continue;
    const dels = [], adds = [];
    while (k < ops.length && ops[k].t === 'del') dels.push(ops[k++].l);
    while (k < ops.length && ops[k].t === 'add') adds.push(ops[k].l), k++;
    k--;
    const keys = adds.flatMap(extractKeys).filter((x) => residue.includes(x));
    if (!keys.length) continue;
    const strs = dels.flatMap(extractStrings);
    for (let x = 0; x < keys.length; x++) {
      const cand = strs[x] !== undefined ? strs[x] : strs.length ? strs[strs.length - 1] : '';
      if (cand && !(keys[x] in found)) found[keys[x]] = { en: cand, file: rel };
    }
  }
}
const out = Object.fromEntries(Object.entries(found).sort().map(([k, v]) => [k, v.en]));
fs.writeFileSync(path.join(__dirname, 'residue-en.json'), JSON.stringify(out, null, 2), 'utf8');
const still = residue.filter((k) => !(k in out));
fs.writeFileSync(path.join(__dirname, 'residue-missing.txt'), still.join('\n'), 'utf8');
console.log('extracted:', Object.keys(out).length, '/', residue.length, ' still missing:', still.length);
