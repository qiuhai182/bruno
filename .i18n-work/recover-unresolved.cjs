const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const unresolved = fs.readFileSync(path.join(__dirname, 'final-unresolved.txt'), 'utf8').split('\n').filter(Boolean);
const SRC = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');

// find files containing each unresolved key
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
  for (const key of unresolved) {
    if (s.includes("t('" + key + "'")) (fileOf[key] = fileOf[key] || new Set()).add(f);
  }
}

const relOf = (p) => path.relative('d:\\bruno', p).replace(/\\/g, '/');
const out = {};
const fail = [];
for (const key of unresolved) {
  const f = fileOf[key] && [...fileOf[key]][0];
  if (!f) { fail.push(key + ' NOFILE'); continue; }
  const rel = relOf(f);
  // find first commit that introduced t('key') in this file
  let commits;
  try {
    commits = execFileSync('git', ['log', '--all', '-S', "t('" + key + "'", '--format=%H', '--follow', '--', rel], { cwd: 'd:\\bruno', encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch (e) { fail.push(key + ' GITLOG'); continue; }
  if (!commits.length) { fail.push(key + ' NOCOMMIT'); continue; }
  const commit = commits[commits.length - 1]; // earliest introduction
  let oldSrc, newSrc;
  try {
    oldSrc = execFileSync('git', ['show', commit + '^:' + rel], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 });
    newSrc = execFileSync('git', ['show', commit + ':' + rel], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 });
  } catch (e) {
    // file new in this commit: old side has no file; search same commit full message? try parent via diff
    fail.push(key + ' NOPARENT(' + commit.slice(0, 7) + ')');
    continue;
  }
  // extract literals around the key's line in newSrc, and pair with nearest preceding/same-position literal in oldSrc
  const newLines = newSrc.split('\n');
  const oldLines = oldSrc.split('\n');
  const lineIdx = newLines.findIndex((l) => l.includes("t('" + key + "'"));
  if (lineIdx === -1) { fail.push(key + ' NOLINE'); continue; }
  const keyStrs = [];
  for (let i = Math.max(0, lineIdx - 8); i <= Math.min(newLines.length - 1, lineIdx + 3); i++) keyStrs.push(newLines[i]);
  const oldSegStart = Math.max(0, lineIdx - 8);
  const oldSeg = oldLines.slice(oldSegStart, Math.min(oldLines.length, lineIdx + 4)).join('\n');
  const strs = [];
  for (const l of oldSeg.match(/'([^'\n]+)'/g) || []) strs.push(l.slice(1, -1));
  for (const l of oldSeg.match(/"([^"\n]+)"/g) || []) strs.push(l.slice(1, -1));
  const jsxSeg = oldSeg.replace(/<[^>]*>/g, ' ').replace(/[{};]/g, '\n');
  for (const seg of jsxSeg.split('\n')) {
    const t = seg.trim();
    if (!/['"{}()]/.test(t) && /[A-Za-z]{2,}/.test(t)) strs.push(t);
  }
  out[key] = { commit: commit.slice(0, 9), file: rel, candidates: [...new Set(strs)].slice(0, 10) };
}
fs.writeFileSync(path.join(__dirname, 'unresolved-candidates.json'), JSON.stringify(out, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'unresolved-fails.txt'), fail.join('\n'), 'utf8');
console.log('candidates for:', Object.keys(out).length, ' fails:', fail.length);
