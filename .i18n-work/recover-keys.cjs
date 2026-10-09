const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const keyListFile = process.argv[2];
const outFile = process.argv[3];
const keys = fs.readFileSync(keyListFile, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const SRC = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');

const fileOf = {};
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) files.push(p);
  }
})(SRC);
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  for (const key of keys) {
    if (s.includes("t('" + key + "'")) (fileOf[key] = fileOf[key] || []).push(f);
  }
}

const relOf = (p) => path.relative('d:\\bruno', p).replace(/\\/g, '/');
const out = {};
const fails = [];
for (const key of keys) {
  const fl = fileOf[key] || [];
  let done = false;
  for (const f of fl) {
    const rel = relOf(f);
    let commits;
    try {
      commits = execFileSync('git', ['log', '--all', '-S', "t('" + key + "'", '--format=%H', '--follow', '--', rel], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 }).trim().split('\n').filter(Boolean);
    } catch (e) { continue; }
    if (!commits.length) continue;
    for (const commit of commits.reverse()) { // earliest first
      let oldSrc;
      try {
        oldSrc = execFileSync('git', ['show', commit + '^:' + rel], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 });
      } catch (e) { continue; } // file created in this commit; try next (older won't exist) - reverse loop handles
      let newSrc;
      try {
        newSrc = execFileSync('git', ['show', commit + ':' + rel], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 });
      } catch (e) { continue; }
      const newLines = newSrc.split('\n');
      const lineIdx = newLines.findIndex((l) => l.includes("t('" + key + "'"));
      if (lineIdx === -1) continue;
      const oldLines = oldSrc.split('\n');
      // collect literals from the aligned region in old file (wider window)
      const seg = oldLines.slice(Math.max(0, lineIdx - 10), lineIdx + 6).join('\n');
      const strs = [];
      for (const m of seg.matchAll(/'([^'\n]+)'/g)) strs.push(m[1]);
      for (const m of seg.matchAll(/"([^"\n]+)"/g)) strs.push(m[1]);
      for (const m of seg.matchAll(/`([^`\n]+)`/g)) strs.push(m[1]);
      const jsxSeg = seg.replace(/<[^>]*>/g, '\n').replace(/[{};]/g, '\n');
      for (const segLine of jsxSeg.split('\n')) {
        const t = segLine.trim();
        if (!/['"{}()]/.test(t) && /[A-Za-z]{2,}/.test(t)) strs.push(t);
      }
      out[key] = { commit: commit.slice(0, 9), file: rel, candidates: [...new Set(strs)].slice(0, 14) };
      done = true;
      break;
    }
    if (done) break;
  }
  if (!done) fails.push(key);
}
fs.writeFileSync(outFile, JSON.stringify(Object.fromEntries(Object.entries(out).sort()), null, 2), 'utf8');
fs.writeFileSync(outFile.replace(/\.json$/, '-fails.txt'), fails.join('\n'), 'utf8');
console.log('candidates:', Object.keys(out).length, ' fails:', fails.length);
