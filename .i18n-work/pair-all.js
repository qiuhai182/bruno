const fs = require('fs');
const { execSync } = require('child_process');
const ROOT = 'd:/bruno';
process.chdir(ROOT);

// 1. parse authority list: key -> [files]
const lines = fs.readFileSync('.i18n-work/all-prefix-keys.txt', 'utf8').split('\n').filter((l) => l.trim());
const keyFiles = {};
const files = new Set();
for (const line of lines) {
  const m = line.match(/^(\S+)\s+\[(.+)\]$/);
  if (!m) continue;
  const key = m[1];
  const fl = m[2].split(',').map((s) => s.trim().replace(/\\/g, '/'));
  keyFiles[key] = fl.map((f) => 'packages/bruno-app/src/components' + f);
  fl.forEach((f) => files.add('packages/bruno-app/src/components' + f));
}

// 2. per file: git diff HEAD, parse hunks, pair removed strings <-> added keys
function extractStrings(text) {
  const out = [];
  // string literals (single/double), no newlines
  const re = /'([^'\n]+)'|"([^"\n]+)"/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1] !== undefined ? m[1] : m[2]);
  }
  // template literals (may span the joined hunk text)
  const tre = /`([^`]+)`/g;
  while ((m = tre.exec(text)) !== null) {
    out.push('`' + m[1] + '`');
  }
  // JSX text: >Text< (strip already-matched literals first)
  let stripped = text.replace(/'[^'\n]+'|"[^"\n]+"|`[^`]+`/g, '');
  const jre = />([^<>{}]+)</g;
  while ((m = jre.exec(stripped)) !== null) {
    const s = m[1].trim();
    if (s) out.push(s);
  }
  return out;
}

function extractKeys(text) {
  const out = [];
  const re = /\bt\(\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

const pairs = {}; // key -> english (first wins)
const ambiguous = []; // {file, removed, added}
const unusedStrings = []; // strings removed but no key added in same hunk

for (const file of files) {
  let diff;
  try {
    diff = execSync(`git diff -U1 HEAD -- "${file}"`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    console.log('DIFF FAIL: ' + file + ' :: ' + e.message.slice(0, 80));
    continue;
  }
  if (!diff) continue;
  // split into hunks
  const hunks = [];
  let cur = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('@@')) {
      if (cur) hunks.push(cur);
      cur = { rm: [], add: [] };
    } else if (cur) {
      if (line.startsWith('-')) cur.rm.push(line.slice(1));
      else if (line.startsWith('+')) cur.add.push(line.slice(1));
    }
  }
  if (cur) hunks.push(cur);
  for (const h of hunks) {
    const rmText = h.rm.join('\n');
    const addText = h.add.join('\n');
    const strs = extractStrings(rmText);
    const keys = extractKeys(addText);
    if (keys.length === 0) {
      if (strs.length) unusedStrings.push({ file, strs });
      continue;
    }
    if (strs.length === keys.length) {
      for (let i = 0; i < keys.length; i++) {
        if (!(keys[i] in pairs)) pairs[keys[i]] = strs[i];
      }
    } else {
      ambiguous.push({ file, strs, keys });
    }
  }
}

// 3. report
const allKeys = Object.keys(keyFiles);
const missing = allKeys.filter((k) => !(k in pairs));
fs.writeFileSync('.i18n-work/auto-pairs.json', JSON.stringify(pairs, null, 1), 'utf8');
fs.writeFileSync('.i18n-work/ambiguous-hunks.json', JSON.stringify(ambiguous, null, 1), 'utf8');
console.log('total keys: ' + allKeys.length);
console.log('auto-paired: ' + Object.keys(pairs).length);
console.log('missing: ' + missing.length);
console.log('--- MISSING KEYS ---');
console.log(missing.join('\n'));
console.log('--- files with missing keys (unique) ---');
const mf = new Set();
for (const k of missing) (keyFiles[k] || []).forEach((f) => mf.add(f));
console.log([...mf].join('\n'));
