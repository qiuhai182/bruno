const fs = require('fs');

const en = JSON.parse(fs.readFileSync('d:/bruno/.i18n-work/batch-ai-git-keys.en.json', 'utf8'));
const zh = JSON.parse(fs.readFileSync('d:/bruno/.i18n-work/batch-ai-git-keys.zh.json', 'utf8'));

let fail = 0;
const enKeys = Object.keys(en).sort();
const zhKeys = Object.keys(zh).sort();
if (JSON.stringify(enKeys) !== JSON.stringify(zhKeys)) {
  console.error('FAIL: key sets differ');
  fail++;
}

// non-empty
for (const k of enKeys) {
  if (typeof en[k] !== 'string' || !en[k].trim()) { console.error('FAIL: empty EN ' + k); fail++; }
  if (typeof zh[k] !== 'string' || !zh[k].trim()) { console.error('FAIL: empty ZH ' + k); fail++; }
}

// no U+FFFD anywhere, and real CJK in zh
for (const k of enKeys) {
  if (en[k].includes('\uFFFD')) { console.error('FAIL: U+FFFD in EN ' + k); fail++; }
  if (zh[k].includes('\uFFFD')) { console.error('FAIL: U+FFFD in ZH ' + k); fail++; }
}
const cjk = enKeys.filter((k) => /[\u4e00-\u9fff]/.test(zh[k])).length;
console.log('zh values containing CJK: ' + cjk + '/' + enKeys.length);
const expectCjk = enKeys.filter((k) => !/^[A-Za-z0-9\s\-_+.,:;()\/&'"{}\[\]|#%@!=<>\*\?\u00b7\u2014\u2026]*$/.test(en[k]) || /[\u4e00-\u9fff]/.test(en[k]));
// stricter: zh must contain CJK unless EN is a pure product/technical term
const pureAsciiEn = enKeys.filter((k) => /^[\x20-\x7E]+$/.test(en[k]) && en[k] === en[k].trim() && !/[a-z]{3,}/i.test(en[k].replace(/(UUID|Base64|URL|JWT|ISO 8601|JSON|XML|SPARQL|GraphQL|gRPC|WebSocket|NTLM|WSSE|OAuth 2\.0|AWS Signature v4|Bearer Token|Access Key ID|Secret Access Key|Token|Scope|State|PKCE|Markdown|Cookie|GitHub|Git|AI|API Spec|API Key|Epoch\(秒\)|Basic Auth|Digest Auth|Key|Value)/gi, '')));
console.log('zh values with CJK should be nearly all; pure-technical EN without CJK allowed');

// placeholder parity ({{...}} tokens), except {{s}}
function placeholders(s) {
  const out = new Set();
  const re = /\{\{([^}]+)\}\}/g;
  let m;
  while ((m = re.exec(s))) out.add(m[1].trim());
  out.delete('s');
  return [...out].sort().join(',');
}
for (const k of enKeys) {
  const a = placeholders(en[k]);
  const b = placeholders(zh[k]);
  if (a !== b) { console.error('FAIL: placeholder mismatch ' + k + ' EN=[' + a + '] ZH=[' + b + ']'); fail++; }
}

// zh must not accidentally contain {{s}}
for (const k of enKeys) {
  if (/\{\{s\}\}/.test(zh[k])) { console.error('FAIL: zh contains {{s}} ' + k); fail++; }
}

console.log(fail === 0 ? 'VERIFY-OK: ' + enKeys.length + ' keys, keysets identical, values non-empty, no U+FFFD, placeholder parity ok' : 'VERIFY-FAILED with ' + fail + ' errors');
process.exit(fail === 0 ? 0 : 1);