const { execFileSync } = require('child_process');
const B = 'e39cb0118'.replace('e39cb0118', 'e39db0118');
function show(p) {
  try { return execFileSync('git', ['show', B + ':' + p], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 }); }
  catch (e) { return null; }
}
function seg(p, a, b) {
  const s = show(p);
  if (!s) { console.log('!! ' + p); return; }
  console.log('##### ' + p.split('/').slice(-2).join('/') + ' lines ' + a + '-' + b);
  console.log(s.split('\n').slice(a, b).map((l, i) => (a + i) + ': ' + l.trim()).filter((l) => l.length > 3).join('\n'));
}
seg('packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/RunCollectionItem/index.js', 60, 135);
seg('packages/bruno-app/src/components/Sidebar/GoldenEdition/index.js', 100, 200);
seg('packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/IgnoreCollectionItem/index.js', 12, 60);
