const { execSync } = require('child_process');
const fs = require('fs');
const files = execSync('git diff --name-only', { cwd: 'd:/bruno', encoding: 'utf8' }).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  .filter((f) => /components\/(CollectionSettings|FolderSettings|ResponseExample|ShareCollection|CollectionApp)\//.test(f));

let out = [];
for (const f of files) {
  const diff = execSync(`git diff -U1 -- "${f}"`, { cwd: 'd:/bruno', encoding: 'utf8' });
  const lines = diff.split(/\r?\n/);
  let hunk = null;
  const hunks = [];
  for (const ln of lines) {
    if (ln.startsWith('@@')) { hunk = { old: [], new: [] }; hunks.push(hunk); }
    else if (hunk) {
      if (ln.startsWith('-')) hunk.old.push(ln.slice(1));
      else if (ln.startsWith('+')) hunk.new.push(ln.slice(1));
    }
  }
  for (const h of hunks) {
    const newKeys = h.new.flatMap((l) => [...l.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)].map((m) => m[1]));
    if (!newKeys.length) continue;
    out.push({ file: f, keys: [...new Set(newKeys)], oldLines: h.old.filter((l) => l.trim()) });
  }
}
let text = '';
for (const e of out) {
  text += 'FILE: ' + e.file + '\n';
  text += '  KEYS: ' + e.keys.join(', ') + '\n';
  for (const l of e.oldLines) text += '  OLD| ' + l.trim() + '\n';
}
fs.writeFileSync('d:/bruno/.i18n-work/key-origins.txt', text);
console.log('files:', files.length, 'hunks:', out.length);
