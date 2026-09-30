const fs = require('fs');
const en = JSON.parse(fs.readFileSync('d:/bruno/packages/bruno-app/src/i18n/translation/en.json', 'utf8'));
const zh = JSON.parse(fs.readFileSync('d:/bruno/packages/bruno-app/src/i18n/translation/zh-CN.json', 'utf8'));

console.log('TOP-LEVEL en:', Object.keys(en).join(', '));
console.log('TOP-LEVEL zh:', Object.keys(zh).join(', '));

function get(obj, key) {
  let cur = obj;
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

const lines = fs.readFileSync('d:/bruno/.i18n-work/used-keys.txt', 'utf8').split('\n');
const used = [];
for (const l of lines) {
  const m = l.match(/^([\w.]+\s+@[^\s].*)$/);
  if (m) used.push(m[1].split(/\s+/)[0]);
}

const missingEn = [], missingZh = [], presentEn = [], presentZh = [];
for (const k of used) {
  if (get(en, k) === undefined) missingEn.push(k); else presentEn.push(k);
  if (get(zh, k) === undefined) missingZh.push(k); else presentZh.push(k);
}
console.log('\nused total:', used.length);
console.log('present in en:', presentEn.length);
console.log('missing in en:', missingEn.length);
console.log('present in zh:', presentZh.length);
console.log('missing in zh:', missingZh.length);
console.log('\nPRESENT EN:', JSON.stringify(presentEn));
console.log('\nIN EN BUT NOT ZH:', JSON.stringify(presentEn.filter((k) => !presentZh.includes(k))));
console.log('\nIN ZH BUT NOT EN:', JSON.stringify(presentZh.filter((k) => !presentEn.includes(k))));
fs.writeFileSync('d:/bruno/.i18n-work/missing-keys.txt', missingEn.join('\n'), 'utf8');
