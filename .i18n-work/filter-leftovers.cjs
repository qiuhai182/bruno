const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = 'd:\\bruno';
const leftovers = JSON.parse(fs.readFileSync(path.join(__dirname, 'x2-leftovers.json'), 'utf8'));
const diffOut = execSync('git diff --name-only -- packages/bruno-app/src/components/Sidebar packages/bruno-app/src/components/WorkspaceSidebar', { cwd: ROOT, encoding: 'utf8' });
const changed = new Set(diffOut.split('\n').map((s) => s.trim()).filter(Boolean));

const seen = new Set();
for (const item of leftovers) {
  if (!changed.has(item.file)) continue;
  if (item.file.endsWith('.spec.js')) continue;
  if (/console\.(log|error|warn)/.test(item.text)) continue;
  const key = item.file + ':' + item.text;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(item.file.replace('packages/bruno-app/src/components/', '') + ':' + item.line);
  console.log('   ' + item.text.trim().slice(0, 150));
}
console.log('\ntotal (deduped, specs/console excluded):', seen.size);
