const { execSync } = require('child_process');
const fs = require('fs');
const scope = 'packages/bruno-app/src/components/WorkspaceHome packages/bruno-app/src/components/WorkspaceSidebar packages/bruno-app/src/components/WelcomeModal packages/bruno-app/src/components/ManageWorkspace packages/bruno-app/src/components/GlobalSearchModal';
const files = execSync('git diff --name-only -- ' + scope, { cwd: 'd:\\bruno', encoding: 'utf8' }).trim().split('\n').map(f => f.trim()).filter(Boolean);
const out = [];
for (const file of files) {
  const diff = execSync('git diff -U0 -- "' + file + '"', { cwd: 'd:\\bruno', encoding: 'utf8' });
  const lines = diff.split('\n');
  const hunks = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith('@@')) {
      if (cur) hunks.push(cur);
      cur = { rem: [], add: [] };
    } else if (cur) {
      if (line.startsWith('-')) cur.rem.push(line.slice(1));
      else if (line.startsWith('+')) cur.add.push(line.slice(1));
    }
  }
  if (cur) hunks.push(cur);
  hunks.forEach((h, i) => {
    const keys = [];
    h.add.forEach(l => {
      for (const m of l.matchAll(/(?:^|[^.\w])t\(\s*'([^']+)'/g)) keys.push(m[1]);
      for (const m of l.matchAll(/i18n\.t\(\s*'([^']+)'/g)) keys.push(m[1]);
      for (const m of l.matchAll(/t\(\s*`([^`]+)`/g)) keys.push(m[1]);
    });
    const strs = [];
    h.rem.forEach(l => {
      const t = l.trim();
      if (!t) return;
      for (const m of t.matchAll(/'([^'\n]+)'/g)) strs.push(m[1]);
      for (const m of t.matchAll(/"([^"\n]+)"/g)) strs.push(m[1]);
      if (!/['"{}()]/.test(t) && /[A-Za-z]{2,}/.test(t)) strs.push('JSXTEXT: ' + t);
    });
    if (keys.length || strs.length) out.push({ file: file.replace('packages/bruno-app/src/components/', ''), h: i + 1, keys, strs });
  });
}
fs.writeFileSync('d:/bruno/.i18n-work/pairs.json', JSON.stringify(out, null, 1));
console.log('files:', files.length, 'hunks with content:', out.length);
