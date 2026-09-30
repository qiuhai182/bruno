const fs = require('fs');
const path = require('path');

const ROOT = 'd:/bruno';
const enPath = path.join(ROOT, '.i18n-work/devtools.en.json');
const zhPath = path.join(ROOT, '.i18n-work/devtools.zh.json');

let fail = 0;
const check = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + msg); if (!cond) fail++; };

// 1. parse
const enRaw = fs.readFileSync(enPath);
const zhRaw = fs.readFileSync(zhPath);
let en, zh;
try { en = JSON.parse(enRaw.toString('utf8')); check(true, 'en.json parses'); } catch (e) { check(false, 'en.json parse: ' + e.message); }
try { zh = JSON.parse(zhRaw.toString('utf8')); check(true, 'zh.json parses'); } catch (e) { check(false, 'zh.json parse: ' + e.message); }

// 2. no BOM
check(enRaw[0] !== 0xEF, 'en.json no BOM');
check(zhRaw[0] !== 0xEF, 'zh.json no BOM');

// 3. key sets identical
const enKeys = Object.keys(en).sort();
const zhKeys = Object.keys(zh).sort();
check(enKeys.length === zhKeys.length && enKeys.every((k, i) => k === zhKeys[i]), `key sets identical (${enKeys.length} keys)`);

// 4. zh contains CJK (every value; Cookie attribute terms intentionally stay latin)
const latinTermKeys = new Set(['cookies.title', 'cookies.secure', 'cookies.httpOnly']);
const cjkRe = /[\u4e00-\u9fff]/;
const zhAllCjk = Object.entries(zh).every(([k, v]) => latinTermKeys.has(k) || cjkRe.test(v));
check(zhAllCjk, 'all zh values contain Chinese (latin tech terms exempt)');

// 5. no U+FFFD anywhere
const fffd = (enRaw.toString('utf8') + zhRaw.toString('utf8')).includes('\uFFFD');
check(!fffd, 'no U+FFFD');

// 6. flat dotted keys
const flat = enKeys.every((k) => !k.includes(' ') && /^[A-Za-z0-9_.]+$/.test(k));
check(flat, 'keys are flat dotted');

// 7. cross-check t() usage in scope vs fragment + reusable existing keys
const reuseOk = new Set(['common.close', 'common.delete', 'common.cancel', 'common.save', 'common.confirm']);
const scopeDirs = [
  'packages/bruno-app/src/components/Devtools',
  'packages/bruno-app/src/components/Notifications',
  'packages/bruno-app/src/components/Cookies',
  'packages/bruno-app/src/components/DeprecationWarning',
  'packages/bruno-app/src/components/SkippedPathsWarning',
  'packages/bruno-app/src/components/Toast/ImportIssuesToast',
  'packages/bruno-app/src/components/EmptyAppState'
];
const used = new Map(); // key -> files
const walk = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(f.name) && !/\.spec\./.test(f.name)) {
      const src = fs.readFileSync(p, 'utf8');
      const re = /\b(?:t|translate|i18n\.t)\(\s*'([A-Za-z0-9_.]+)'/g;
      let m;
      while ((m = re.exec(src))) {
        if (!used.has(m[1])) used.set(m[1], []);
        used.get(m[1]).push(path.basename(path.dirname(p)) + '/' + f.name);
      }
    }
  }
};
scopeDirs.forEach((d) => walk(path.join(ROOT, d)));

const missing = [...used.keys()].filter((k) => !en[k] && !reuseOk.has(k));
const extraUnused = enKeys.filter((k) => !used.has(k));
check(missing.length === 0, 'no t() key missing from fragment' + (missing.length ? ' -> ' + missing.join(', ') : ''));
console.log('INFO fragment keys not seen via literal t() in scope: ' + (extraUnused.join(', ') || '(none)'));

// 8. hardcoded leftovers scan (user-visible English in JSX) for scope dirs
const bad = [];
const scan = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (!/node_modules/.test(p)) scan(p); }
    else if (/\.(js|jsx|tsx)$/.test(f.name) && !/\.spec\./.test(f.name) && !/StyledWrapper/.test(f.name)) {
      const src = fs.readFileSync(p, 'utf8');
      const lines = src.split('\n');
      lines.forEach((line, i) => {
      const noComment = line.replace(/\/\/.*$/, '');
      const techSample = /placeholder="key=value/.test(noComment);
      if (!techSample && />[A-Z][a-z]+ [A-Za-z][^<>{}]*</.test(noComment)) bad.push(p + ':' + (i + 1) + ' ' + line.trim().slice(0, 90));
        if (!techSample && /(?:placeholder|title|aria-label)="[A-Za-z][^"]*"/.test(noComment)) bad.push(p + ':' + (i + 1) + ' ' + line.trim().slice(0, 90));
      });
    }
  }
};
scopeDirs.forEach((d) => scan(path.join(ROOT, d)));
check(bad.length === 0, 'no hardcoded JSX text left' + (bad.length ? '\n  ' + bad.join('\n  ') : ''));

console.log(fail === 0 ? 'ALL CHECKS PASSED' : fail + ' CHECKS FAILED');
process.exit(fail === 0 ? 0 : 1);
