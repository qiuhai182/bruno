const { execFileSync } = require('child_process');
const B = 'e39db0118';
function show(p) {
  try { return execFileSync('git', ['show', B + ':' + p], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 }); }
  catch (e) { return null; }
}
const targets = {
  'packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/RunCollectionItem/index.js': ['recursive', 'folder', 'Runner', 'loading', 'already', 'requests'],
  'packages/bruno-app/src/components/Sidebar/Collections/Collection/ChangeCollectionVersion/index.js': ['Version', 'e.g.', 'from', 'Updates'],
  'packages/bruno-app/src/components/Sidebar/GoldenEdition/index.js': ['Organizations', 'per user', 'Per user', 'Individuals'],
  'packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/IgnoreCollectionItem/index.js': ['Hide', 'hide', 'starting', 'Bruno', 'recorded'],
  'packages/bruno-app/src/components/Sidebar/Drafts/index.js': ['unsaved', 'request', 'requestItem'],
  'packages/bruno-app/src/components/DeprecationWarning/index.js': ['removed', 'deprecated', 'post', 'questions'],
  'packages/bruno-app/src/components/Sidebar/NewRequest/index.js': ['standalone', 'collection name', 'file system'],
  'packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/DeleteCollectionItem/index.js': ['folder', 'request', 'app', 'example', 'Delete'],
  'packages/bruno-app/src/components/Sidebar/DragPreview/index.js': ['items', 'requests', 'folders'],
  'packages/bruno-app/src/components/Sidebar/GitRemote/index.js': ['click to clone', 'clone'],
  'packages/bruno-app/src/components/WorkspaceSidebar/WorkspaceLogo/index.js': ['Not cloned', 'badge', 'clone'],
  'packages/bruno-app/src/components/WorkspaceHome/WorkspaceOverview/CollectionsList/index.js': ['could not be opened', 'needs to be cloned', 'not found on disk', 'needsClone', 'notOnDisk']
};
for (const [p, ws] of Object.entries(targets)) {
  const src = show(p);
  if (!src) { console.log('!! not in baseline: ' + p); continue; }
  console.log('##### ' + p.split('/').slice(-2).join('/'));
  src.split('\n').forEach((l, i) => {
    const low = l.toLowerCase();
    if (ws.some((w) => low.includes(w.toLowerCase()))) {
      const t = l.trim();
      if (t && t.length < 180 && !/className=|useState|useEffect|const \w+ = \(|=> \{|function |^import |dispatch\(|^\{\}/.test(t)) {
        console.log(i + ': ' + t);
      }
    }
  });
}
