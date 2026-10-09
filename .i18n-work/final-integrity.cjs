#!/usr/bin/env node
/** Final integrity sweep (ASCII-only source). */
const fs = require('fs');
const path = require('path');
const dir = __dirname;
let ok = true;
for (const f of fs.readdirSync(dir).filter((x) => /^en2-group-|^zh2-group-/.test(x) && x.endsWith('.json'))) {
  const buf = fs.readFileSync(path.join(dir, f));
  const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const hasFffd = buf.includes(Buffer.from([0xef, 0xbf, 0xbd]));
  const s = buf.toString('utf8');
  const crlf = (s.match(/\r\n/g) || []).length;
  let json;
  try { json = JSON.parse(s); } catch (e) { console.log('FAIL ' + f + ' invalid JSON: ' + e.message); ok = false; continue; }
  const indent2 = s.split('\n').filter((l) => /^  /.test(l)).length > 0;
  const trailingNl = /\n$/.test(s);
  const emptyVals = Object.values(json).filter((v) => typeof v !== 'string' || v.trim() === '').length;
  if (hasBom || hasFffd || crlf > 0 || !indent2 || emptyVals > 0) {
    console.log(`FAIL ${f} bom=${hasBom} fffd=${hasFffd} crlf=${crlf} indent2=${indent2} emptyVals=${emptyVals}`);
    ok = false;
  } else {
    console.log(`OK   ${f}  ${Object.keys(json).length} keys, utf8/noBOM/LF/2-space, trailingNL=${trailingNl}`);
  }
}
console.log(ok ? '\nINTEGRITY OK' : '\nINTEGRITY FAIL');
process.exit(ok ? 0 : 1);
