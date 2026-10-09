const { execFileSync } = require('child_process');
const B = 'e39db0118';
function show(p) {
  try { return execFileSync('git', ['show', B + ':' + p], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 }); }
  catch (e) { return null; }
}
function seg(p, a, b) {
  const s = show(p);
  if (!s) { console.log('!! not in baseline: ' + p); return; }
  console.log('##### ' + p.split('/').slice(-2).join('/'));
  console.log(s.split('\n').slice(a, b).map((l, i) => (a + i) + ': ' + l.trim()).filter((x) => x.length > 3).join('\n'));
}
seg('packages/bruno-app/src/components/RequestPane/WSSettingsPane/index.js', 1, 140);
seg('packages/bruno-app/src/components/Sidebar/NewApp/index.js', 1, 120);
seg('packages/bruno-app/src/components/WorkspaceHome/WorkspaceOverview/CollectionsList/RemoveGitRemote/index.js', 1, 80);
seg('packages/bruno-app/src/components/Sidebar/GoldenEdition/index.js', 80, 100);
seg('packages/bruno-app/src/components/Sidebar/ImportCollectionLocation/index.js', 1, 60);
