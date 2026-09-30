/* Scan the 58 Sidebar/WorkspaceSidebar files for all t() keys and leftover hardcoded English */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'd:/bruno';
const DIRS = [
  'packages/bruno-app/src/components/Sidebar',
  'packages/bruno-app/src/components/WorkspaceSidebar'
];

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const keyFiles = new Map(); // key -> Set(files)
const leftovers = []; // {file, line, text}

const T_RE = /\bt\(\s*(['"])((?:\\.|(?!\1).)*?)\1/g;
const TPL_T_RE = /\bt\(\s*`([^`$]*\$\{[^}]*\}[^`]*)`\s*/g;

for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    let m;
    T_RE.lastIndex = 0;
    while ((m = T_RE.exec(line))) {
      const key = m[2];
      if (!keyFiles.has(key)) keyFiles.set(key, new Set());
      keyFiles.get(key).add(rel);
    }
    TPL_T_RE.lastIndex = 0;
    while ((m = TPL_T_RE.exec(line))) {
      const tpl = m[1]; // e.g. sidebar.dragPreview.${key}One
      if (!keyFiles.has(tpl)) keyFiles.set(tpl, new Set());
      keyFiles.get(tpl).add(rel);
    }
  });
  // leftover hardcoded English: JSX text nodes or string literals passed to UI props/toasts
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|import|\*)/.test(line)) return;
    if (line.includes('t(') || line.includes('console.') || line.includes('data-testid')) { /* may still contain literals */ }
    const texts = [];
    // string literals in JSX props / toasts: 'Something...' — heuristics: >= 2 words, starts uppercase
    const litRe = /(?<![\w$])(?:'([^'\\]{3,})'|`([^`\\]{3,})`)/g;
    let m2;
    while ((m2 = litRe.exec(line))) {
      const s = (m2[1] ?? m2[2]).trim();
      if (!s) continue;
      if (/^[A-Z][a-zA-Z]+( [a-zA-Z(]+){1,}/.test(s) && !s.includes('${') && !/^[A-Z_]+$/.test(s)) {
        // candidate English sentence-like
        if (!/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/.test(s)) texts.push(s);
      }
    }
    if (texts.length) leftovers.push({ file: rel, line: i + 1, text: line.trim().slice(0, 180), found: texts });
  });
}

const allKeys = [...keyFiles.keys()].sort();
fs.writeFileSync('d:/bruno/.i18n-work/x2-current-keys.json', JSON.stringify({ files: files.length, count: allKeys.length, keys: allKeys.map((k) => ({ k, f: [...keyFiles.get(k)] })) }, null, 2));
fs.writeFileSync('d:/bruno/.i18n-work/x2-leftovers.json', JSON.stringify(leftovers, null, 2));
console.log('files scanned:', files.length);
console.log('distinct t() keys:', allKeys.length);
console.log('tpl keys:', allKeys.filter((k) => k.includes('${')).length);
console.log('leftover candidates:', leftovers.length);
