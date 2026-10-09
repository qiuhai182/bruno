const fs = require('fs');
const path = require('path');

const workDir = __dirname;
const appSrc = path.join(workDir, '..', 'packages', 'bruno-app', 'src');

const enPath = path.join(workDir, 'batch-mockserver-keys.en.json');
const zhPath = path.join(workDir, 'batch-mockserver-keys.zh.json');
const filesPath = path.join(workDir, 'batch-mockserver-files.txt');

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
};

// ---------- load ----------
let en, zh;
try {
  en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  check('load en.json (valid JSON, utf8)', true, `${Object.keys(en).length} keys`);
} catch (err) {
  check('load en.json (valid JSON, utf8)', false, err.message);
  process.exit(1);
}
try {
  zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
  check('load zh.json (valid JSON, utf8)', true, `${Object.keys(zh).length} keys`);
} catch (err) {
  check('load zh.json (valid JSON, utf8)', false, err.message);
  process.exit(1);
}

// ---------- key set parity ----------
const enKeys = Object.keys(en).sort();
const zhKeys = Object.keys(zh).sort();
const sameKeys = enKeys.length === zhKeys.length && enKeys.every((k, i) => k === zhKeys[i]);
check('key sets identical (en === zh)', sameKeys,
  sameKeys ? '' : `only-en=[${enKeys.filter((k) => !(k in zh)).slice(0, 5)}] only-zh=[${zhKeys.filter((k) => !(k in en)).slice(0, 5)}]`);

// ---------- non-empty values ----------
const emptyEn = enKeys.filter((k) => typeof en[k] !== 'string' || en[k].trim() === '');
const emptyZh = zhKeys.filter((k) => typeof zh[k] !== 'string' || zh[k].trim() === '');
check('all values non-empty strings', emptyEn.length === 0 && emptyZh.length === 0,
  `en-empty=[${emptyEn}] zh-empty=[${emptyZh}]`);

// ---------- encoding: no U+FFFD ----------
const enRaw = fs.readFileSync(enPath, 'utf8');
const zhRaw = fs.readFileSync(zhPath, 'utf8');
check('no U+FFFD replacement chars', !enRaw.includes('\uFFFD') && !zhRaw.includes('\uFFFD'));

// ---------- encoding: real CJK present ----------
const hasCJK = /[\u4e00-\u9fff]/.test(zhRaw);
const hasServerChar = zhRaw.includes('\u670d'); // 服
check('zh contains real CJK (incl. 服 U+670D)', hasCJK && hasServerChar);

// ---------- placeholder parity ({{s}} exempt, EN-only) ----------
const placeholders = (v) => [...v.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]);
const phMismatches = [];
for (const k of enKeys) {
  const enPh = placeholders(en[k]).filter((p) => p !== 's');
  const zhPh = placeholders(zh[k] || '');
  const a = [...enPh].sort().join(',');
  const b = [...zhPh].sort().join(',');
  if (a !== b) {
    phMismatches.push(`${k}: en=[${a}] zh=[${b}]`);
  }
  if (zh[k] && zh[k].includes('{{s}}')) {
    phMismatches.push(`${k}: zh must not contain {{s}}`);
  }
}
check('placeholder sets match ({{s}} exempt)', phMismatches.length === 0, phMismatches.slice(0, 5).join(' | '));

// ---------- files list ----------
const relFiles = fs.readFileSync(filesPath, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
const missingFiles = relFiles.filter((f) => !fs.existsSync(path.join(appSrc, f)));
check(`files list has ${relFiles.length} entries, all exist`, missingFiles.length === 0, missingFiles.join(', '));

// ---------- source wiring: every t('mockServer.*') key exists ----------
const usedKeys = new Set();
for (const rel of relFiles) {
  const src = fs.readFileSync(path.join(appSrc, rel), 'utf8');
  const hookCount = (src.match(/useTranslation/g) || []).length;
  if (!hookCount) {
    check(`${rel}: uses useTranslation`, false, 'no useTranslation found');
  }
  for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) {
    const key = m[1];
    if (key.startsWith('mockServer.')) {
      usedKeys.add(key);
      if (!(key in en) || !(key in zh)) {
        check(`${rel}: key "${key}" defined`, false, 'missing from key files');
      }
    }
  }
}
check(`all ${usedKeys.size} used t('mockServer.*') keys defined in key files`, results.every((r) => !r.name.includes('defined') || r.ok));

// ---------- leftover hardcoded strings scan ----------
const leftovers = [];
for (const rel of relFiles) {
  const src = fs.readFileSync(path.join(appSrc, rel), 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    if (/useTranslation|import|require\(|console\.|data-testid|className|testId|aria-label=\{t/.test(line)) return;
    // bare quoted English sentences/words in JSX or props (heuristic)
    const m = line.match(/(?:title|label|placeholder|confirmText|allLabel|viewMoreText|viewLessText)="[A-Za-z][^"]{2,}"/);
    if (m) leftovers.push(`${rel}:${i + 1}: ${line.trim().slice(0, 90)}`);
  });
}
check('no leftover hardcoded title/label/placeholder props', leftovers.length === 0, leftovers.slice(0, 8).join(' | '));

// ---------- key prefix sanity ----------
const badPrefix = enKeys.filter((k) => !k.startsWith('mockServer.'));
check('all keys use mockServer. prefix', badPrefix.length === 0, badPrefix.join(', '));

const failed = results.filter((r) => !r.ok).length;
console.log(`\nSUMMARY: ${results.length - failed}/${results.length} checks passed, ${failed} failed, ${usedKeys.size} unique keys referenced by sources, ${enKeys.length} keys defined.`);
process.exit(failed ? 1 : 0);
