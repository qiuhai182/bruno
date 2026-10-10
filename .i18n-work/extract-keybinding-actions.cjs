const fs = require('fs');
const path = require('path');
const s = fs.readFileSync(path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'providers', 'Hotkeys', 'keyMappings.js'), 'utf8');

// structure: bindings: { actionId: { mac, windows, name: 'Label' }, ... }
const out = {};
const bindingRe = /bindings:\s*\{([\s\S]*?)\n\s{2,}\}/g;
let m;
while ((m = bindingRe.exec(s))) {
  const block = m[1];
  const entryRe = /(\w+):\s*\{[^}]*?name:\s*'([^']+)'/g;
  let e;
  while ((e = entryRe.exec(block))) {
    out[e[1]] = e[2];
  }
}
console.log('actions:', Object.keys(out).length);
fs.writeFileSync(path.join(__dirname, 'keybinding-actions.json'), JSON.stringify(out, null, 2), 'utf8');
for (const [k, v] of Object.entries(out)) console.log(k + ' || ' + v);
