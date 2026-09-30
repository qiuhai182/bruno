const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const roots = [
  'packages/bruno-app/src/components/RequestTabs',
  'packages/bruno-app/src/components/ResponsePane',
  'packages/bruno-app/src/components/RunnerResults',
  'packages/bruno-app/src/components/VariablesEditor',
  'packages/bruno-app/src/components/Documentation',
  'packages/bruno-app/src/components/OpenAPISpecTab',
  'packages/bruno-app/src/components/OpenAPISyncTab',
  'packages/bruno-app/src/components/ResponseExample'
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const inv = (s) => {
  const m = s.match(/[^\x00-\x7F]/g) || [];
  const d = {};
  for (const c of m) {
    const cp = c.codePointAt(0).toString(16);
    d[cp] = (d[cp] || 0) + 1;
  }
  return d;
};

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    const rel = f.split(path.sep).join('/');
    let head = '';
    try {
      head = execSync(`git show HEAD:${rel}`, { maxBuffer: 1e8 }).toString('utf8');
    } catch (e) {
      console.log('UNTRACKED', rel);
      continue;
    }
    const work = fs.readFileSync(f, 'utf8');
    const h = inv(head);
    const w = inv(work);
    const hKeys = JSON.stringify(h);
    const wKeys = JSON.stringify(w);
    if (hKeys !== wKeys) {
      console.log('NONASCII-DIFF', rel, '\n  head:', hKeys, '\n  work:', wKeys);
    }
    if (work.includes('\uFFFD')) console.log('FFFD', rel);
    // suspicious literal '??' introduced: compare counts of '??' runs
    const q = (s) => (s.match(/\?\?/g) || []).length;
    if (q(work) > q(head)) {
      console.log('QQ-INCREASE', rel, 'head:', q(head), 'work:', q(work));
    }
  }
}
console.log('scan done');
