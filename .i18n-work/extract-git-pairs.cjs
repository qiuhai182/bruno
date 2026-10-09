const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = 'e39db0118'; // pre-i18n baseline commit
const SRC = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const missing = fs.readFileSync(path.join(__dirname, 'missing-authoritative.txt'), 'utf8').split('\n').filter(Boolean);
const missingSet = new Set(missing);

// map missing key -> files that use it
const filesFor = {};
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) {
      const s = fs.readFileSync(p, 'utf8');
      for (const m of s.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) {
        if (missingSet.has(m[1])) (filesFor[m[1]] = filesFor[m[1]] || new Set()).add(p);
      }
    }
  }
})(SRC);

const relOf = (p) => path.relative('d:\\bruno', p).replace(/\\/g, '/');
const allFiles = new Set();
for (const ks of Object.values(filesFor)) for (const f of ks) allFiles.add(f);
console.log('missing keys:', missing.size, ' files to diff:', allFiles.size);

function extractStrings(line) {
  const out = [];
  for (const m of line.matchAll(/'([^'\n]+)'/g)) out.push(m[1]);
  for (const m of line.matchAll(/"([^"\n]+)"/g)) out.push(m[1]);
  for (const m of line.matchAll(/`([^`\n]+)`/g)) out.push(m[1]);
  const jsx = line.replace(/<[^>]*>/g, '').replace(/[{};]/g, '').trim();
  if (!/['"`]/.test(line) && /[A-Za-z]{2,}/.test(jsx)) out.push(jsx);
  return out;
}
function extractKeys(line) {
  const out = [];
  for (const m of line.matchAll(/(?:^|[^.\w])t\(\s*'([\w.]+)'/g)) out.push(m[1]);
  for (const m of line.matchAll(/i18n\.t\(\s*'([\w.]+)'/g)) out.push(m[1]);
  return out;
}

const result = {}; // key -> {en, file}
const ambiguous = {}; // key -> [candidates]
for (const f of allFiles) {
  const rel = relOf(f);
  let oldSrc;
  try {
    oldSrc = execFileSync('git', ['show', BASE + ':' + rel], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (e) { continue; } // file is new since baseline
  const newSrc = fs.readFileSync(f, 'utf8');
  const oldLines = oldSrc.split('\n');
  const newLines = newSrc.split('\n');
  // simple LCS line diff
  const n = oldLines.length, m = newLines.length;
  // too big for O(n*m)? largest files ~2k lines -> 4M cells ok-ish; guard
  if (n * m > 12e6) { console.log('SKIP large', rel); continue; }
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = oldLines[i] === newLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; // {type:'del'|'add', line}
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (oldLines[i] === newLines[j]) { i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ t: 'del', l: oldLines[i++] });
    else ops.push({ t: 'add', l: newLines[j++] });
  }
  while (i < n) ops.push({ t: 'del', l: oldLines[i++] });
  while (j < m) ops.push({ t: 'add', l: newLines[j++] });
  // group consecutive del/add runs
  const groups = [];
  let g = null;
  for (const op of ops) {
    if (!g || g.t !== op.t) { g = { t: op.t, lines: [] }; groups.push(g); }
    g.lines.push(op.l);
  }
  // zip del-groups with following add-groups
  for (let k = 0; k < groups.length - 1; k++) {
    if (groups[k].t !== 'del') continue;
    const delG = groups[k], addG = groups[k + 1];
    const keys = addG.lines.flatMap(extractKeys);
    if (!keys.length) continue;
    const strs = delG.lines.flatMap(extractStrings);
    for (let x = 0; x < keys.length; x++) {
      const key = keys[x];
      const cand = strs[x] !== undefined ? strs[x] : strs.length ? strs[strs.length - 1] : '';
      if (!cand) { (ambiguous[key] = ambiguous[key] || new Set()).add(''); continue; }
      if (!(key in result)) result[key] = { en: cand, file: rel };
      else if (result[key].en !== cand) (ambiguous[key] = ambiguous[key] || new Set()).add(cand);
    }
  }
}
fs.writeFileSync(path.join(__dirname, 'git-key-en.json'), JSON.stringify(Object.fromEntries(Object.entries(result).sort().map(([k, v]) => [k, v.en])), null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'git-key-ambiguous.json'), JSON.stringify(Object.fromEntries(Object.entries(ambiguous).sort().map(([k, v]) => [k, [...v]])), null, 2), 'utf8');
const covered = missing.filter((k) => k in result);
console.log('git-extracted keys:', Object.keys(result).length, ' missing covered:', covered.length, '/', missing.size, ' ambiguous:', Object.keys(ambiguous).length);
