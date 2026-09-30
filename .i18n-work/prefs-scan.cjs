const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'components');
const DIRS = ['Preferences', 'AppTitleBar'];
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation', 'en.json'), 'utf8'));

const flat = (obj, prefix = '') => {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') out.push(...flat(v, key));
    else out.push(key);
  }
  return out;
};
const enKeys = new Set(flat(en));

const used = new Map(); // key -> [file:line]
const hardcoded = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(p); continue; }
    if (!/\.(js|jsx|tsx)$/.test(entry.name) || entry.name.endsWith('.spec.js')) continue;
    const rel = path.relative(ROOT, p);
    const src = fs.readFileSync(p, 'utf8');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      // static keys
      for (const m of line.matchAll(/\bt\(\s*'([^']+)'/g)) {
        const key = m[1];
        if (!used.has(key)) used.set(key, []);
        used.get(key).push(`${rel}:${i + 1}`);
      }
      for (const m of line.matchAll(/\bt\(\s*`([^`$]+)`/g)) {
        const key = m[1].replace(/\$\{[^}]+\}/g, '*');
        if (!used.has(key)) used.set(key, []);
        used.get(key).push(`${rel}:${i + 1}`);
      }
      // hardcoded JSX text: >English<
      const jsx = line.match(/>\s*([A-Z][a-zA-Z0-9 ,''&.()/+-]{2,})\s*</);
      if (jsx && !/^[A-Z]:\\/.test(jsx[1])) {
        hardcoded.push(`${rel}:${i + 1} JSX> ${jsx[1].trim()}`);
      }
      // hardcoded attrs
      for (const m of line.matchAll(/(placeholder|title|aria-label)="([^"]*[A-Za-z]{3}[^"]*)"/g)) {
        hardcoded.push(`${rel}:${i + 1} ATTR(${m[1]}) ${m[2]}`);
      }
    });
  }
};
DIRS.forEach((d) => walk(path.join(ROOT, d)));

console.log('=== USED KEYS NOT IN en.json (fragment candidates) ===');
const missing = [...used.keys()].filter((k) => !enKeys.has(k) && !k.includes('*'));
for (const k of missing.sort()) console.log(k, '  <=', used.get(k)[0]);
console.log('\n=== TEMPLATE (dynamic) KEYS ===');
for (const k of [...used.keys()].filter((k) => k.includes('*')).sort()) console.log(k, '  <=', used.get(k).join(', '));
console.log('\n=== HARDCODED SUSPECTS ===');
for (const h of hardcoded) console.log(h);
console.log(`\nused=${used.size} missingStatic=${missing.length}`);
