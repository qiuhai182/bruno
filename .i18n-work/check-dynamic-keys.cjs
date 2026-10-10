const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
const en = JSON.parse(fs.readFileSync(path.join(base, 'i18n', 'translation', 'en.json'), 'utf8'));
const known = new Set(flat(en));
// top-level groups from locale + common dynamic prefixes
const groups = new Set(Object.keys(en).concat([
  'COMMON', 'common', 'app', 'preferences', 'dialogs', 'toast', 'requestPane', 'responsePane',
  'sidebar', 'collection', 'environments', 'workspace', 'welcome', 'runner', 'variables',
  'requestTabs', 'mockServer', 'aiChat', 'gitDiff', 'gitNotFound', 'tools', 'statusBar',
  'editorSearch', 'richText', 'apiSpecPanel', 'jsSandbox', 'filePicker', 'inheritableInput',
  'tagList', 'colorPicker', 'colorRange', 'modeSwitch', 'multipartChips', 'stopWatch',
  'promptVariables', 'notifications', 'apiSpec', 'globalSearch', 'cookies', 'devtools',
  'emptyAppState', 'openApiSync', 'openApiSpec', 'docs', 'support', 'errorBoundary', 'main',
  'untitledRequest', 'transientRequest', 'requestTabPanel', 'saveTransient', 'migrateYml'
]));

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) files.push(p);
  }
})(base);

// Files with dynamic t() calls (from deep-check listing)
const dynFiles = new Set();
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  if (/\bt\(\s*`/.test(s) || /\bt\(\s*[a-zA-Z_$][\w.$]*\s*[,)]/.test(s.replace(/\bt\(\s*'[^']+'\s*[,)]/g, '').replace(/\bt\(\s*"[^"]+"\s*[,)]/g, ''))) {
    dynFiles.add(f);
  }
}

console.log('files with dynamic t():', dynFiles.size);
let totalCandidates = 0;
const missing = [];
for (const f of dynFiles) {
  const s = fs.readFileSync(f, 'utf8');
  // extract dotted string literals that look like i18n keys
  const lits = new Set();
  for (const m of s.matchAll(/['"`]([a-zA-Z][\w]*((?:\.[\w${}\`]+)+))['"`]/g)) lits.add(m[1]);
  for (const lit of lits) {
    const head = lit.split('.')[0];
    if (!groups.has(head)) continue;
    if (lit.includes('$') || lit.includes('`')) continue; // raw template, handle below
    totalCandidates++;
    if (!known.has(lit)) missing.push(path.relative(base, f).replace(/\\/g, '/') + '  ->  ' + lit);
  }
}
console.log('dotted-key-like literals in dynamic files:', totalCandidates);
console.log('MISSING:', missing.length);
missing.forEach((m) => console.log('  ' + m));
