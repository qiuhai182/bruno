const fs = require('fs');
const f = require('d:/bruno/.i18n-work/x2-fragment-en.json');
const keys = Object.keys(f).sort();
let out = '';
for (const k of keys) out += k + '\t' + JSON.stringify(f[k]) + '\n';
fs.writeFileSync('d:/bruno/.i18n-work/x2-en-list.txt', out);
console.log('wrote', keys.length, 'keys');
