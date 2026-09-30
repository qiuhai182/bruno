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

const propRe = /(\w+)\s*[:=]\s*['"]([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9-]+)+)['"]/g;
const out = [];
for (const r of roots) {
  if (!fs.existsSync(r)) continue;
  for (const f of walk(r)) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      let m;
      propRe.lastIndex = 0;
      while ((m = propRe.exec(line)) !== null) {
        const key = m[2];
        const prefixes = ['responsePane.', 'requestTabs.', 'runner.', 'variables.', 'docs.', 'openApiSpec.', 'openApiSync.', 'collection.', 'common.', 'dialogs.', 'app.'];
        if (prefixes.some((p) => key.startsWith(p)) && /Key|label|Label|title|Title/.test(m[1])) {
          out.push(f.split('components/')[1] + ':' + (i + 1) + ' ' + m[1] + '=' + key);
        }
      }
    });
  }
}
console.log([...new Set(out)].sort().join('\n') || 'none');
