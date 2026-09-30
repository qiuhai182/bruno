const fs = require('fs');
const W = 'd:/bruno/.i18n-work/';
const groups = ['workspace', 'welcome', 'globalsearch', 'environments'];

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out.push(key);
  }
  return out;
}

// reference datasets (now valid UTF-8)
const refZh = {
  ...JSON.parse(fs.readFileSync(W + 'zh-dataset.json', 'utf8')),
  ...JSON.parse(fs.readFileSync(W + 'env-zh-dataset.json', 'utf8'))
};
const refEn = {
  ...JSON.parse(fs.readFileSync(W + 'en-dataset.json', 'utf8')),
  ...JSON.parse(fs.readFileSync(W + 'env-en-dataset.json', 'utf8'))
};

function unnest(obj) {
  const out = {};
  flatten(obj, '', []).forEach(() => {});
  (function walk(o, prefix) {
    for (const [k, v] of Object.entries(o)) {
      const key = prefix ? prefix + '.' + k : k;
      if (v && typeof v === 'object') walk(v, key);
      else out[key] = v;
    }
  })(obj, '');
  return out;
}

let fail = 0;
for (const g of groups) {
  const enBuf = fs.readFileSync(W + g + '.en.json');
  const zhBuf = fs.readFileSync(W + g + '.zh.json');
  const enTxt = enBuf.toString('utf8');
  const zhTxt = zhBuf.toString('utf8');
  const enFffd = (enTxt.match(/\uFFFD/g) || []).length;
  const zhFffd = (zhTxt.match(/\uFFFD/g) || []).length;
  const zhBom = zhBuf[0] === 0xEF && zhBuf[1] === 0xBB && zhBuf[2] === 0xBF;
  let enObj, zhObj;
  try { enObj = JSON.parse(enTxt); } catch (e) { console.log(g + ' EN PARSE FAIL: ' + e.message); fail++; continue; }
  try { zhObj = JSON.parse(zhTxt); } catch (e) { console.log(g + ' ZH PARSE FAIL: ' + e.message); fail++; continue; }
  const enKeys = flatten(enObj, '', []).sort();
  const zhKeys = flatten(zhObj, '', []).sort();
  const same = JSON.stringify(enKeys) === JSON.stringify(zhKeys);
  const zhHasChinese = /[\u4e00-\u9fff]/.test(zhTxt);
  const enAscii = /^[\x00-\x7F]*$/.test(enTxt);
  console.log(
    g + ': en=' + enKeys.length + ' zh=' + zhKeys.length + ' keyParity=' + same +
    ' zhFFFD=' + zhFffd + ' enFFFD=' + enFffd + ' zhBOM=' + zhBom +
    ' zhChinese=' + zhHasChinese + ' enAscii=' + enAscii
  );
  if (!same || zhFffd || enFffd || !zhHasChinese || zhBom) fail++;

  // value parity against reference datasets
  const enFlat = unnest(enObj);
  const zhFlat = unnest(zhObj);
  for (const [k, v] of Object.entries(enFlat)) {
    if (refEn[k] !== v) { console.log('EN VALUE MISMATCH ' + k); fail++; }
  }
  for (const [k, v] of Object.entries(zhFlat)) {
    if (refZh[k] !== v) { console.log('ZH VALUE MISMATCH ' + k); fail++; }
  }
}

console.log(fail === 0 ? 'ALL VERIFICATIONS PASSED' : 'FAILURES: ' + fail);
