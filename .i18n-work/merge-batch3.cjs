const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation');
const FFFD = '\uFFFD';
const BATCHES = ['mockserver', 'ai-git', 'redux', 'save-panel'];

function loadMaybeGbk(p) {
  const buf = fs.readFileSync(p);
  let s = buf.toString('utf8');
  if (s.includes(FFFD)) {
    s = new TextDecoder('gbk').decode(buf);
    if (s.includes(FFFD)) throw new Error('unrecoverable: ' + p);
  }
  return JSON.parse(s);
}

function nest(flat) {
  const root = {};
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split('.');
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof cur[parts[i]] === 'string') throw new Error('collision: ' + parts.slice(0, i + 1).join('.'));
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    if (typeof cur[parts[parts.length - 1]] === 'object') throw new Error('leaf/branch: ' + k);
    cur[parts[parts.length - 1]] = v;
  }
  return root;
}
function deepMerge(base, patch, log, pfx) {
  for (const [k, v] of Object.entries(patch)) {
    const p = pfx ? pfx + '.' + k : k;
    if (k in base && typeof base[k] === 'object' && typeof v === 'object') deepMerge(base[k], v, log, p);
    else if (k in base) { log.push(p); base[k] = v; }
    else base[k] = v;
  }
}
function count(o) { return Object.values(o).reduce((n, v) => n + (typeof v === 'object' ? count(v) : 1), 0); }

// collect
const enAll = {}, zhAll = {};
for (const b of BATCHES) {
  const en = loadMaybeGbk(path.join(__dirname, 'batch-' + b + '-keys.en.json'));
  const zh = loadMaybeGbk(path.join(__dirname, 'batch-' + b + '-keys.zh.json'));
  const ek = Object.keys(en), zk = Object.keys(zh);
  if (ek.length !== zk.length || !ek.every((k) => k in zh)) throw new Error('key set mismatch in batch ' + b);
  for (const k of ek) {
    if (k in enAll && enAll[k] !== en[k]) console.log('WARN cross-batch conflict:', k);
    enAll[k] = String(en[k]);
    zhAll[k] = String(zh[k]);
  }
}
const keys = Object.keys(enAll);
console.log('total batch keys:', keys.length);
for (const k of keys) {
  if (!enAll[k].trim()) throw new Error('empty EN: ' + k);
  if (!zhAll[k].trim()) throw new Error('empty ZH: ' + k);
  if (zhAll[k].includes(FFFD)) throw new Error('FFFD ZH: ' + k);
  const ph = (x) => (String(x).match(/\{\{\s*[\w.]+\s*\}\}/g) || []).filter((v) => v !== '{{s}}').sort().join(',');
  if (ph(enAll[k]) !== ph(zhAll[k])) throw new Error('placeholder mismatch: ' + k);
}

function mergeOne(srcFile, flatNew, label) {
  const srcRaw = fs.readFileSync(srcFile, 'utf8');
  if (srcRaw.includes(FFFD)) throw new Error('source has FFFD: ' + label);
  const src = JSON.parse(srcRaw);
  const before = count(src);
  const log = [];
  deepMerge(src, nest(flatNew), log, '');
  fs.writeFileSync(srcFile, JSON.stringify(src, null, 2) + '\n', 'utf8');
  const after = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  console.log(label + ': ' + before + ' -> ' + count(after) + ' keys; overwrote: ' + log.length + (log.length ? ' (' + log.slice(0, 5).join(', ') + ')' : ''));
  if (fs.readFileSync(srcFile, 'utf8').includes(FFFD)) throw new Error('FFFD introduced: ' + label);
}

mergeOne(path.join(SRC_DIR, 'en.json'), enAll, 'en.json');
mergeOne(path.join(SRC_DIR, 'zh-CN.json'), zhAll, 'zh-CN.json');
console.log('ALL MERGED');
