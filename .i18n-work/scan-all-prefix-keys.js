const fs = require('fs');
const path = require('path');

const roots = [
  'RequestTabs', 'ResponsePane', 'RunnerResults', 'VariablesEditor',
  'Documentation', 'OpenAPISpecTab', 'OpenAPISyncTab', 'ResponseExample/ResponseExampleResponsePane'
].map((d) => 'packages/bruno-app/src/components/' + d);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|tsx)$/.test(e.name) && !/\.spec\./.test(e.name)) out.push(p);
  }
  return out;
}

const prefixes = ['responsePane.', 'requestTabs.', 'runner.', 'variables.', 'docs.', 'openApiSpec.', 'openApiSync.', 'collection.example.', 'collection.table.'];
const strRe = /'([a-zA-Z][\w.-]+)'|"([a-zA-Z][\w.-]+)"|`([a-zA-Z][\w.-]+)`/g;
const found = new Map();
for (const r of roots) {
  if (!fs.existsSync(r)) continue;
  for (const f of walk(r)) {
    const t = fs.readFileSync(f, 'utf8');
    let m;
    strRe.lastIndex = 0;
    while ((m = strRe.exec(t)) !== null) {
      const key = m[1] || m[2] || m[3];
      if (prefixes.some((p) => key.startsWith(p))) {
        if (!found.has(key)) found.set(key, new Set());
        found.get(key).add(f.split('components')[1]);
      }
    }
  }
}
const keys = [...found.keys()].sort();
fs.writeFileSync('.i18n-work/all-prefix-keys.txt', keys.map((k) => k + '  [' + [...found.get(k)].join(', ') + ']').join('\n'), 'utf8');
console.log('prefix-string keys:', keys.length);
