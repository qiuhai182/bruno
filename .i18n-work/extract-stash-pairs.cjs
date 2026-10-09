const { execSync } = require('child_process');
const fs = require('fs');
const CWD = 'd:\\bruno';

const diff = execSync('git stash show -p "stash@{0}"', { cwd: CWD, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lines = diff.split('\n');
let curFile = null;
let hunk = null;
const hunks = [];
for (const line of lines) {
  if (line.startsWith('diff --git')) {
    const m = line.match(/ b\/(.+)$/);
    curFile = m ? m[1] : null;
  } else if (curFile && line.startsWith('@@')) {
    hunk = { file: curFile, rem: [], add: [] };
    hunks.push(hunk);
  } else if (hunk && line.startsWith('-')) {
    hunk.rem.push(line.slice(1));
  } else if (hunk && line.startsWith('+')) {
    hunk.add.push(line.slice(1));
  }
}

const keyEn = {};
const conflicts = {};
let paired = 0;
for (const h of hunks) {
  if (!h.file || !h.file.startsWith('packages/bruno-app/src/')) continue;
  const keys = [];
  for (const l of h.add) {
    for (const m of l.matchAll(/(?:^|[^.\w])t\(\s*'([^']+)'/g)) keys.push(m[1]);
    for (const m of l.matchAll(/i18n\.t\(\s*'([^']+)'/g)) keys.push(m[1]);
  }
  if (!keys.length) continue;
  const strs = [];
  for (const l of h.rem) {
    const t = l.trim();
    if (!t) continue;
    for (const m of t.matchAll(/'([^'\n]+)'/g)) strs.push(m[1]);
    for (const m of t.matchAll(/"([^"\n]+)"/g)) strs.push(m[1]);
    const jsx = t.replace(/<[^>]*>/g, '').replace(/[{}]/g, '').trim();
    if (!/['"{}()]/.test(jsx) && /[A-Za-z]{2,}/.test(jsx)) strs.push(jsx);
  }
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const en = strs[i] !== undefined ? strs[i] : strs.length ? strs[strs.length - 1] : '';
    paired++;
    if (!(k in keyEn)) keyEn[k] = en;
    else if (keyEn[k] !== en) {
      (conflicts[k] = conflicts[k] || new Set()).add(keyEn[k]);
      conflicts[k].add(en);
    }
  }
}
const out = {};
for (const k of Object.keys(keyEn).sort()) out[k] = keyEn[k];
fs.writeFileSync(__dirname + '/stash-key-en.json', JSON.stringify(out, null, 2), 'utf8');
const conf = {};
for (const k of Object.keys(conflicts).sort()) conf[k] = [...conflicts[k]];
fs.writeFileSync(__dirname + '/stash-key-conflicts.json', JSON.stringify(conf, null, 2), 'utf8');
console.log('paired occurrences:', paired, ' distinct keys:', Object.keys(out).length, ' conflicted:', Object.keys(conf).length);
