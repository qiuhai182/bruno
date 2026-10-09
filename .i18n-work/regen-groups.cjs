const fs = require('fs');
const path = require('path');

// fix last key + regenerate translation groups
const file = path.join(__dirname, 'final-key-en.json');
const en = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!/^[\w\s]*in$/.test(String(en['sidebar.changeVersion.in'] || ''))) en['sidebar.changeVersion.in'] = 'in';
en['sidebar.changeVersion.into'] = undefined;
delete en['sidebar.changeVersion.into'];
fs.writeFileSync(file, JSON.stringify(Object.fromEntries(Object.entries(en).sort()), null, 2), 'utf8');

const missing = fs.readFileSync(path.join(__dirname, 'missing-authoritative.txt'), 'utf8').split('\n').filter(Boolean);
const groups = {};
for (const k of missing) {
  if (!(k in en)) { console.log('STILL MISSING EN:', k); continue; }
  const g = k.split('.')[0];
  (groups[g] = groups[g] || {})[k] = en[k];
}
for (const [g, obj] of Object.entries(groups)) {
  fs.writeFileSync(path.join(__dirname, 'en2-group-' + g + '.json'), JSON.stringify(Object.fromEntries(Object.entries(obj).sort()), null, 2), 'utf8');
}
console.log('groups:', Object.entries(groups).map(([g, o]) => g + '=' + Object.keys(o).length).join(', '));
