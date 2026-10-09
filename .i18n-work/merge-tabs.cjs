const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation');
const EN_FILE = path.join(SRC_DIR, 'en.json');
const ZH_FILE = path.join(SRC_DIR, 'zh-CN.json');
const TABS_EN = path.join(__dirname, 'tabs.en.json');
const TABS_ZH = path.join(__dirname, 'tabs-zh-fixed.json');

// flat dotted key -> nested object
function nest(flat) {
  const root = {};
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split('.');
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof cur[parts[i]] === 'string') {
        throw new Error('structure collision at ' + parts.slice(0, i + 1).join('.'));
      }
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    if (typeof cur[parts[parts.length - 1]] === 'object') {
      throw new Error('leaf/branch collision at ' + k);
    }
    cur[parts[parts.length - 1]] = v;
  }
  return root;
}

function deepMerge(base, patch, overwriteLog) {
  for (const [k, v] of Object.entries(patch)) {
    if (k in base && typeof base[k] === 'object' && typeof v === 'object') {
      deepMerge(base[k], v, overwriteLog);
    } else if (k in base) {
      overwriteLog.push(k);
      base[k] = v;
    } else {
      base[k] = v;
    }
  }
}

const FFFD = String.fromCharCode(0xFFFD);

function mergeOne(srcFile, flatFile, label) {
  const srcRaw = fs.readFileSync(srcFile, 'utf8');
  if (srcRaw.includes(FFFD)) throw new Error('source file ' + label + ' already contains FFFD');
  const src = JSON.parse(srcRaw);
  let flatRaw = fs.readFileSync(flatFile, 'utf8');
  if (flatRaw.includes(FFFD)) {
    // Write tool transcodes non-ASCII to GBK on disk; decode back
    const buf = fs.readFileSync(flatFile);
    flatRaw = new TextDecoder('gbk').decode(buf);
    if (flatRaw.includes(FFFD)) throw new Error('flat file for ' + label + ' unrecoverable even after GBK decode');
  }
  const flat = JSON.parse(flatRaw);
  const before = JSON.stringify(src);
  const overwriteLog = [];
  deepMerge(src, nest(flat), overwriteLog);
  if (overwriteLog.length) {
    console.log(label + ' OVERWROTE existing keys:', overwriteLog.join(', '));
  }
  fs.writeFileSync(srcFile, JSON.stringify(src, null, 2) + '\n', 'utf8');
  const after = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  const count = (o) => Object.values(o).reduce((n, v) => n + (typeof v === 'object' ? count(v) : 1), 0);
  console.log(label + ': before', count(JSON.parse(before)), 'keys -> after', count(after), 'keys');
  if (fs.readFileSync(srcFile, 'utf8').includes(FFFD)) throw new Error('FFFD introduced in ' + label);
  console.log(label + ': merged OK, no FFFD');
}

mergeOne(EN_FILE, TABS_EN, 'en.json');
mergeOne(ZH_FILE, TABS_ZH, 'zh-CN.json');
console.log('ALL MERGED');
