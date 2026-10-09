const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation');
const missing0 = fs.readFileSync(path.join(__dirname, 'missing-authoritative.txt'), 'utf8').split('\n').filter(Boolean);
// sidebar.fileFormat leaf was renamed to sidebar.fileFormatLabel (components updated accordingly)
const missing = missing0.filter((k) => k !== 'sidebar.fileFormat');
missing.push('sidebar.fileFormatLabel');

// EN values
const enFinal = JSON.parse(fs.readFileSync(path.join(__dirname, 'final-key-en.json'), 'utf8'));
// fix GBK-mangled em dash value
enFinal['sidebar.gitRemote.clickToClone'] = '{{name}} \u2014 click to clone from {{remote}}';

// ZH values: union of zh2-group files, GBK-decoding fallback
const FFFD = '\uFFFD';
function loadMaybeGbk(p) {
  const buf = fs.readFileSync(p);
  const s = buf.toString('utf8');
  if (s.includes(FFFD)) {
    const dec = new TextDecoder('gbk').decode(buf);
    if (dec.includes(FFFD)) throw new Error('unrecoverable GBK: ' + p);
    return JSON.parse(dec);
  }
  return JSON.parse(s);
}
const zh = {};
const zhDir = __dirname;
for (const f of fs.readdirSync(zhDir).filter((f) => /^zh2-group-.*\.json$/.test(f))) {
  const o = loadMaybeGbk(path.join(zhDir, f));
  for (const [k, v] of Object.entries(o)) {
    if (k in zh) throw new Error('dup key across zh groups: ' + k);
    zh[k] = String(v);
  }
}

const problems = [];
for (const k of missing) {
  const zhKey = k === 'sidebar.fileFormatLabel' ? 'sidebar.fileFormat' : k;
  if (!(k in enFinal)) problems.push('EN missing: ' + k);
  if (!(zhKey in zh)) problems.push('ZH missing: ' + k);
  else if (zh[zhKey].includes(FFFD)) problems.push('ZH FFFD: ' + k);
  else if (!zh[zhKey].trim()) problems.push('ZH empty: ' + k);
}
if (problems.length) {
  console.log(problems.slice(0, 40).join('\n'));
  throw new Error('pre-merge problems: ' + problems.length);
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

function mergeOne(srcFile, flatNew, label) {
  const srcRaw = fs.readFileSync(srcFile, 'utf8');
  if (srcRaw.includes(FFFD)) throw new Error('source has FFFD: ' + label);
  const src = JSON.parse(srcRaw);
  const before = count(src);
  const log = [];
  deepMerge(src, nest(flatNew), log, '');
  fs.writeFileSync(srcFile, JSON.stringify(src, null, 2) + '\n', 'utf8');
  const after = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  console.log(label + ': ' + before + ' -> ' + count(after) + ' keys; overwrote: ' + log.length);
  if (fs.readFileSync(srcFile, 'utf8').includes(FFFD)) throw new Error('FFFD introduced: ' + label);
}

const enFlat = Object.fromEntries(missing.map((k) => [k, enFinal[k]]));
const zhFlat = Object.fromEntries(missing.map((k) => [k, k === 'sidebar.fileFormatLabel' ? (zh['sidebar.fileFormat'] || '文件格式') : zh[k]]));
mergeOne(path.join(SRC_DIR, 'en.json'), enFlat, 'en.json');
mergeOne(path.join(SRC_DIR, 'zh-CN.json'), zhFlat, 'zh-CN.json');
console.log('ALL MERGED');
