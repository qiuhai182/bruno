const fs = require('fs');
const { TextDecoder } = require('util');

const W = 'd:/bruno/.i18n-work/';

function readEn(name) {
  return JSON.parse(fs.readFileSync(W + name, 'utf8'));
}
function readZh(name) {
  // dataset files were converted to UTF-8 by PowerShell (Node v26 TextDecoder+writeFileSync bug)
  return JSON.parse(fs.readFileSync(W + name, 'utf8'));
}

const en = { ...readEn('en-dataset.json'), ...readEn('env-en-dataset.json') };
const zh = { ...readZh('zh-dataset.json'), ...readZh('env-zh-dataset.json') };

// expected keys from component scan
const expected = fs.readFileSync(W + 'used-keys.txt', 'utf8').split('\n')
  .map((l) => l.trim())
  .filter((l) => /^[\w.]+\s+@/.test(l))
  .map((l) => l.split(/\s+/)[0])
  .filter((k) => /^(workspace|welcome|globalSearch|environments)\./.test(k));

const enKeys = new Set(Object.keys(en));
const zhKeys = new Set(Object.keys(zh));
const expSet = new Set(expected);

const missInEn = expected.filter((k) => !enKeys.has(k));
const missInZh = expected.filter((k) => !zhKeys.has(k));
const extraEn = [...enKeys].filter((k) => !expSet.has(k));
const extraZh = [...zhKeys].filter((k) => !expSet.has(k));
const enNotZh = [...enKeys].filter((k) => !zhKeys.has(k));
const zhNotEn = [...zhKeys].filter((k) => !enKeys.has(k));

console.log('expected (scan):', expected.length, ' en:', enKeys.size, ' zh:', zhKeys.size);
if (missInEn.length) console.log('MISSING IN EN:', JSON.stringify(missInEn));
if (missInZh.length) console.log('MISSING IN ZH:', JSON.stringify(missInZh));
if (extraEn.length) console.log('EXTRA IN EN:', JSON.stringify(extraEn));
if (extraZh.length) console.log('EXTRA IN ZH:', JSON.stringify(extraZh));
if (enNotZh.length || zhNotEn.length) {
  console.log('EN/ZH MISMATCH:', JSON.stringify(enNotZh), JSON.stringify(zhNotEn));
}

// empty value check
for (const [k, v] of Object.entries(en)) if (typeof v !== 'string' || !v.length) console.log('BAD EN VALUE:', k);
for (const [k, v] of Object.entries(zh)) if (typeof v !== 'string' || !v.length) console.log('BAD ZH VALUE:', k);

// leaf/branch collision check: a key must not also be a prefix of another key
for (const set of [enKeys, zhKeys]) {
  for (const k of set) {
    for (const other of set) {
      if (other !== k && other.startsWith(k + '.')) console.log('COLLISION:', k, ' vs ', other);
    }
  }
}

function nest(flat) {
  const out = {};
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split('.');
    let cur = out;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) cur[p] = v;
      else {
        cur[p] = cur[p] || {};
        cur = cur[p];
      }
    });
  }
  return out;
}

const groups = { workspace: 'workspace', welcome: 'welcome', globalSearch: 'globalsearch', environments: 'environments' };
for (const [prefix, file] of Object.entries(groups)) {
  const flat = {};
  for (const [k, v] of Object.entries(en)) if (k.startsWith(prefix + '.')) flat[k] = v;
  const flatZh = {};
  for (const [k, v] of Object.entries(zh)) if (k.startsWith(prefix + '.')) flatZh[k] = v;
  fs.writeFileSync(W + file + '.en.json', JSON.stringify(nest(flat), null, 2) + '\n', 'utf8');
  fs.writeFileSync(W + file + '.zh.json', JSON.stringify(nest(flatZh), null, 2) + '\n', 'utf8');
  console.log('wrote', file, ':', Object.keys(flat).length, 'keys');
}
