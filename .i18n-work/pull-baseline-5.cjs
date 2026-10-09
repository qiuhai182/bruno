const { execFileSync } = require('child_process');
const B = 'e39db0118';
function show(p) {
  try { return execFileSync('git', ['show', B + ':' + p], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 }); }
  catch (e) { return null; }
}
for (const p of [
  'packages/bruno-app/src/components/CollectionSettings/Presets/index.js',
  'packages/bruno-app/src/components/Sidebar/ImportCollection/FullscreenLoader/index.js',
  'packages/bruno-app/src/components/Sidebar/BulkImportCollectionLocation/index.js',
  'packages/bruno-app/src/components/Devtools/Performance/index.js'
]) {
  const s = show(p);
  if (!s) { console.log('!! ' + p); continue; }
  console.log('##### ' + p.split('/').slice(-2).join('/'));
  s.split('\n').forEach((l, i) => {
    if (/[A-Za-z]{3,}["'`]/.test(l) && /label|subtitle|placeholder|title|loading|message|description|'"/.test(l)) {
      const t = l.trim();
      if (t.length < 150 && !/className|import |useState|const \w+ = \(|=>|dispatch/.test(t)) console.log(i + ': ' + t);
    }
  });
}
