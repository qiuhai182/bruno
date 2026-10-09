const fs = require('fs');
const path = require('path');

const missing = fs.readFileSync(path.join(__dirname, 'missing-authoritative.txt'), 'utf8').split('\n').filter(Boolean);
const git = JSON.parse(fs.readFileSync(path.join(__dirname, 'git-key-en.json'), 'utf8'));
const amb = JSON.parse(fs.readFileSync(path.join(__dirname, 'git-key-ambiguous.json'), 'utf8'));
const extracted = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted.json'), 'utf8'));
const enDataset = JSON.parse(fs.readFileSync(path.join(__dirname, 'en-dataset.json'), 'utf8'));
const stash = JSON.parse(fs.readFileSync(path.join(__dirname, 'stash-key-en.json'), 'utf8'));

// heuristics: reject candidate EN values that look like code identifiers / css fragments
const bad = (s) =>
  !s ||
  !/[A-Za-z]{2,}/.test(s) ||
  /^[a-z][A-Za-z0-9]*$/.test(s) === false && /^[\w-]+$/.test(s) && !/\s/.test(s) && /^[a-z]/.test(s) === false
    ? false
    : false;
function plausible(s) {
  if (!s || !/[A-Za-z]{2,}/.test(s)) return false;
  if (/[\n]/.test(s)) return false;
  // className-ish tokens: danger, xs, full, empty-title, text-xs
  if (/^(danger|xs|sm|lg|full|flex|items-\S+|text-\S+|empty-title|true|false|null|undefined)$/.test(s)) return false;
  if (/^(get|set|post|put|delete|patch)$/i.test(s)) return false; // method literals
  if (s.length < 2) return false;
  return true;
}

const final = {}; // key -> en
const unresolved = [];
for (const k of missing) {
  const cands = [];
  const seen = new Set();
  const push = (v, pri) => {
    if (v == null) return;
    v = String(v).replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!seen.has(v)) { seen.add(v); cands.push({ v, pri }); }
  };
  if (git[k]) push(git[k], 1);
  for (const a of amb[k] || []) push(a, 2);
  if (extracted[k]) push(extracted[k], 3);
  if (enDataset[k]) push(enDataset[k], 3);
  if (stash[k]) push(stash[k], 4);
  if (!cands.length) { unresolved.push(k); continue; }
  cands.sort((a, b) => a.pri - b.pri);
  const good = cands.filter((c) => plausible(c.v));
  if (good.length) final[k] = good[0].v;
  else { unresolved.push(k); continue; }
}
fs.writeFileSync(path.join(__dirname, 'final-key-en.json'), JSON.stringify(Object.fromEntries(Object.entries(final).sort()), null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'final-unresolved.txt'), unresolved.join('\n'), 'utf8');
console.log('resolved EN:', Object.keys(final).length, '/', missing.length, ' unresolved:', unresolved.length);
console.log(unresolved.slice(0, 20).join('\n'));
