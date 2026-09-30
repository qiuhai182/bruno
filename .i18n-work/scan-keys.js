const fs = require('fs');
const path = require('path');

const ROOT = 'd:/bruno/packages/bruno-app/src/components/Sidebar';

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(ROOT, []);
const keys = new Map(); // key -> Set of files

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const re2 = /(?:i18n\.)?\bt\(\s*'([^']+)'/g;
  let m;
  while ((m = re2.exec(src)) !== null) {
    const key = m[1];
    if (!key.startsWith('sidebar.')) continue;
    if (!keys.has(key)) keys.set(key, new Set());
    keys.get(key).add(file);
  }
}

const rel = (f) => f.replace(/\\/g, '/').replace('d:/bruno/packages/bruno-app/src/components/Sidebar/', '');
const sorted = [...keys.entries()].sort((a, b) => a[0].localeCompare(b[0]));

console.log('TOTAL_SIDEBAR_KEYS:', sorted.length);
for (const [k, fsSet] of sorted) {
  console.log(k + ' <- ' + [...fsSet].map(rel).join(', '));
}
