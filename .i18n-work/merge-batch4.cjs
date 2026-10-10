const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation');
const FFFD = '\uFFFD';

function loadMaybeGbk(p) {
  const buf = fs.readFileSync(p);
  let s = buf.toString('utf8');
  if (s.includes(FFFD)) {
    s = new TextDecoder('gbk').decode(buf);
    if (s.includes(FFFD)) throw new Error('unrecoverable ' + p);
  }
  return JSON.parse(s);
}
function nest(flat) {
  const root = {};
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split('.');
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof cur[parts[i]] === 'string') throw new Error('collision ' + parts.slice(0, i + 1).join('.'));
      cur = cur[parts[i]] = cur[parts[i]] || {};
    }
    if (typeof cur[parts[parts.length - 1]] === 'object') throw new Error('leaf/branch ' + k);
    cur[parts[parts.length - 1]] = v;
  }
  return root;
}
function merge(file, batchFile) {
  const p = path.join(SRC, file);
  const o = JSON.parse(fs.readFileSync(p, 'utf8'));
  const flat = loadMaybeGbk(path.join(__dirname, batchFile));
  let n = 0, over = 0;
  (function walk(base, patch) {
    for (const [k, v] of Object.entries(patch)) {
      if (k in base && typeof base[k] === 'object' && typeof v === 'object') walk(base[k], v);
      else {
        if (k in base) over++;
        base[k] = v;
        n++;
      }
    }
  })(o, nest(flat));
  const out = JSON.stringify(o, null, 2) + '\n';
  if (out.includes(FFFD)) throw new Error('FFFD in output ' + file);
  fs.writeFileSync(path.join(__dirname, file + '.merged.b64'), Buffer.from(out, 'utf8').toString('base64'), 'ascii');
  console.log(file + ': +' + n + ' keys, overwrote ' + over);
}
merge('en.json', 'batch-template-keys.en.json');
merge('zh-CN.json', 'batch-template-keys.zh.json');
console.log('b64 ready');
