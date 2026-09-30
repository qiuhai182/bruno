const fs = require('fs');
const b = fs.readFileSync(__dirname + '/sidebar.zh.json');
console.log('size:', b.length);
console.log('first 64 bytes hex:', b.slice(0, 64).toString('hex'));
console.log('first line as utf8:', JSON.stringify(b.slice(0, 60).toString('utf8')));
console.log('has EF BF BD (U+FFFD):', b.includes(Buffer.from([0xEF, 0xBF, 0xBD])));
// count high bytes
let hi = 0, fffd = 0;
for (const byte of b) { if (byte > 0x7F) hi++; }
console.log('high bytes:', hi);
// try gbk-style interpretation: check if valid utf8 by re-encoding
const s = b.toString('utf8');
console.log('decoded fffd count:', (s.match(/\uFFFD/g) || []).length);
