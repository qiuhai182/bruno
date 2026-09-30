const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = 'd:\\bruno';
let failures = 0;
const fail = (msg) => { console.error('FAIL:', msg); failures++; };

// (a) both JSON parse
let en, zh;
try {
  en = JSON.parse(fs.readFileSync(path.join(__dirname, 'sidebar.en.json'), 'utf8'));
  console.log('(a) sidebar.en.json parses OK,', Object.keys(en).length, 'keys');
} catch (e) { fail('sidebar.en.json parse: ' + e.message); process.exit(1); }
try {
  zh = JSON.parse(fs.readFileSync(path.join(__dirname, 'sidebar.zh.json'), 'utf8'));
  console.log('(a) sidebar.zh.json parses OK,', Object.keys(zh).length, 'keys');
} catch (e) { fail('sidebar.zh.json parse: ' + e.message); process.exit(1); }

// (b) key sets identical
const enKeys = new Set(Object.keys(en));
const zhKeys = new Set(Object.keys(zh));
const onlyEn = [...enKeys].filter((k) => !zhKeys.has(k));
const onlyZh = [...zhKeys].filter((k) => !enKeys.has(k));
if (onlyEn.length || onlyZh.length) {
  fail('key sets differ; only-en: ' + JSON.stringify(onlyEn) + ' only-zh: ' + JSON.stringify(onlyZh));
} else {
  console.log('(b) key sets identical (' + enKeys.size + ' keys)');
}

// (c) zh values contain Chinese (incl. CJK punctuation), no U+FFFD, no BOM
const zhRaw = fs.readFileSync(path.join(__dirname, 'sidebar.zh.json'));
if (zhRaw[0] === 0xEF && zhRaw[1] === 0xBB && zhRaw[2] === 0xBF) fail('sidebar.zh.json has BOM');
else console.log('(c) no BOM');
const enRaw = fs.readFileSync(path.join(__dirname, 'sidebar.en.json'));
if (enRaw[0] === 0xEF && enRaw[1] === 0xBB && enRaw[2] === 0xBF) fail('sidebar.en.json has BOM');
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff]|[\u3000-\u303f\uff01-\uff5e\u2014\u2018-\u201d\u2026\u00b7]/;
const noChinese = [], fffd = [];
for (const [k, v] of Object.entries(zh)) {
  if (v.includes('\uFFFD')) fffd.push(k);
  if (!CJK.test(v) && k !== 'sidebar.fileFormat.ocOption') noChinese.push(k); // ocOption: product name, intentionally ASCII
}
if (fffd.length) fail('U+FFFD in zh: ' + fffd.join(', '));
else console.log('(c) no U+FFFD in zh');
if (noChinese.length) fail('zh values without Chinese: ' + noChinese.join(', '));
else console.log('(c) all zh values contain Chinese characters or CJK punctuation');

// (d) coverage: every key referenced via t() in changed files
const flat = (obj, prefix = '') => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') Object.assign(out, flat(v, prefix + k + '.'));
    else out[prefix + k] = v;
  }
  return out;
};
const excludedSets = {};
const excludeFiles = [
  ['en.json (main)', path.join(ROOT, 'packages/bruno-app/src/i18n/translation/en.json')],
  ['workspace', path.join(__dirname, 'workspace.en.json')],
  ['collection', path.join(__dirname, 'collection.en.json')],
  ['prefs', path.join(__dirname, 'prefs.en.json')],
  ['devtools', path.join(__dirname, 'devtools.en.json')],
  ['welcome', path.join(__dirname, 'welcome.en.json')],
  ['environments', path.join(__dirname, 'environments.en.json')],
  ['globalsearch', path.join(__dirname, 'globalsearch.en.json')],
  ['reqpane-http', path.join(__dirname, 'reqpane-http.en.json')],
  ['reqpane-alt', path.join(__dirname, 'reqpane-alt.en.json')]
];
for (const [name, p] of excludeFiles) {
  if (fs.existsSync(p)) excludedSets[name] = new Set(Object.keys(flat(JSON.parse(fs.readFileSync(p, 'utf8')))));
  else console.log('  (exclude file missing, skipped):', name);
}

const diffOut = execSync('git diff --name-only -- packages/bruno-app/src/components/Sidebar packages/bruno-app/src/components/WorkspaceSidebar', { cwd: ROOT, encoding: 'utf8' });
const changedFiles = diffOut.split('\n').map((s) => s.trim()).filter(Boolean);
console.log('(d) changed files:', changedFiles.length);

// collect keys referenced inside balanced t(...) calls
const candidates = new Set();
const templatePatterns = new Set(); // key-building templates (contain ${ and start with dotted namespace)
const keyShape = /^[a-zA-Z][a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]+)+$/;

function extractFromSpan(spanRaw, candidates, templatePatterns) {
  // strip lodash get(...) calls - their path strings are not i18n keys
  let span = spanRaw;
  let prev = null;
  while (prev !== span) {
    prev = span;
    span = span.replace(/\bget\s*\(([^()]*)\)/g, ' ');
  }
  // quoted literals that look like keys (handles ternaries / nested calls)
  const re = /['"]([^'"\n]+)['"]/g;
  let m;
  while ((m = re.exec(span))) {
    const k = m[1];
    if (!keyShape.test(k)) continue;
    candidates.add(k);
  }
  // first-arg template literal that builds a key: `ns.path.${var}Suffix`
  const tre = /`([^`\n]*\$\{[^`\n]*)`/g;
  while ((m = tre.exec(span))) {
    const body = m[1];
    if (/^[a-zA-Z][a-zA-Z0-9_-]*(\.[a-zA-Z0-9_-]+)+\$\{/.test(body)) templatePatterns.add(body);
  }
}

for (const rel of changedFiles) {
  const abs = path.join(ROOT, rel);
  let text;
  try { text = fs.readFileSync(abs, 'utf8'); } catch (e) { console.log('  (unreadable, skipped):', rel); continue; }
  const tCall = /(?:^|[^\w$.])t\s*\(/g; // t( but not i18next.something.t( ... i18n.t( still matches via .t(
  let m;
  while ((m = tCall.exec(text))) {
    const openIdx = m.index + m[0].length - 1;
    // balanced paren scan
    let depth = 0, i = openIdx, inStr = null, end = -1;
    for (; i < text.length; i++) {
      const c = text[i];
      if (inStr) {
        if (c === '\\') { i++; continue; }
        if (c === inStr) inStr = null;
        continue;
      }
      if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) continue;
    extractFromSpan(text.slice(openIdx + 1, end), candidates, templatePatterns);
  }
}

// expand known key-building templates
const expandedTemplates = new Set();
for (const t of templatePatterns) {
  if (/^sidebar\.dragPreview\.\$\{[^}]+\}(One|Many)$/.test(t)) {
    for (const base of ['app', 'collection', 'folder', 'request']) {
      for (const suffix of ['One', 'Many']) expandedTemplates.add('sidebar.dragPreview.' + base + suffix);
    }
  } else {
    fail('unhandled template key pattern: ' + t);
  }
}
const referenced = new Set([...candidates, ...expandedTemplates]);

const missing = [];
const coveredElsewhere = [];
for (const k of referenced) {
  if (enKeys.has(k)) continue;
  const owner = Object.keys(excludedSets).find((name) => excludedSets[name].has(k));
  if (owner) { coveredElsewhere.push(k + ' [' + owner + ']'); continue; }
  missing.push(k);
}
const sidebarMissing = missing.filter((k) => k.startsWith('sidebar.'));
const otherMissing = missing.filter((k) => !k.startsWith('sidebar.'));
if (sidebarMissing.length) fail('sidebar.* keys missing from fragment: ' + sidebarMissing.join(', '));
if (otherMissing.length) fail('non-sidebar keys not covered by any fragment: ' + otherMissing.join(', '));
if (!missing.length) {
  console.log('(d) coverage OK:', referenced.size, 'referenced keys all covered');
  if (coveredElsewhere.length) console.log('    covered by other fragments:', coveredElsewhere.join(', '));
  const inExcluded = [...referenced].filter((k) => k.startsWith('sidebar.') && Object.keys(excludedSets).some((n) => excludedSets[n].has(k)));
  console.log('    sidebar.* keys living in other fragments:', inExcluded.length ? inExcluded.join(', ') : '(none)');
}

// extra: placeholder consistency EN vs zh
const ph = (s) => [...String(s).matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1].trim()).sort().join(',');
let phBad = 0;
for (const k of enKeys) {
  if (!zhKeys.has(k)) continue;
  const a = ph(en[k]);
  const b = ph(zh[k]);
  if (a !== b) { console.error('PLACEHOLDER MISMATCH:', k, '| en:', a, '| zh:', b); phBad++; }
}
if (phBad) fail(phBad + ' placeholder mismatches');
else console.log('extra: placeholders consistent between en and zh');

console.log(failures ? '\nRESULT: ' + failures + ' failure(s)' : '\nRESULT: ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
