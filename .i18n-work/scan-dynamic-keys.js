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

const tpl = /\bt\(\s*`([^`]+)`/g;
const prop = /(labelKey|statusLabelKey|titleKey|label)\s*[:=]\s*['"]([A-Za-z][\w.-]+['"])/g;
const out = [];
for (const r of roots) {
  if (!fs.existsSync(r)) continue;
  for (const f of walk(r)) {
    const t = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = tpl.exec(t)) !== null) out.push('TPL ' + f.split('components/')[1] + ' :: ' + m[1]);
    while ((m = prop.exec(t)) !== null) {
      if (m[2].split('.').length >= 2) out.push('PROP ' + f.split('components/')[1] + ' :: ' + m[1] + '=' + m[2]);
    }
  }
}
console.log([...new Set(out)].join('\n') || 'none');
