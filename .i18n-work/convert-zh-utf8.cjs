const fs = require('fs');
const buf = fs.readFileSync(__dirname + '/sidebar.zh.json');
const dec = new TextDecoder('gbk');
let s;
try {
  s = dec.decode(buf);
} catch (e) {
  console.error('gbk decode failed:', e.message);
  process.exit(1);
}
if (s.includes('\uFFFD')) { console.error('FFFD after gbk decode - aborting'); process.exit(1); }
// sanity: '添加新集合' via unicode escapes
const sanity = '\u6dfb\u52a0\u65b0\u96c6\u5408';
if (!s.includes(sanity)) { console.error('sanity text missing after decode - aborting'); process.exit(1); }
const obj = JSON.parse(s);
console.log('decoded & parsed OK,', Object.keys(obj).length, 'keys');
fs.writeFileSync(__dirname + '/sidebar.zh.json', s, 'utf8');
const re = fs.readFileSync(__dirname + '/sidebar.zh.json');
const reDecoded = re.toString('utf8');
console.log('re-read fffd count:', (reDecoded.match(/\uFFFD/g) || []).length);
console.log('converted to UTF-8 successfully');
