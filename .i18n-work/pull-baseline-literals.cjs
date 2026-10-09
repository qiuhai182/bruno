const { execFileSync } = require('child_process');
const B = 'e39db0118';
function show(p) {
  try { return execFileSync('git', ['show', B + ':' + p], { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 32e6 }); }
  catch (e) { return null; }
}
const targets = {
  'packages/bruno-app/src/components/CollectionSettings/ProxySettings/index.js': ['inherit', 'enabled', 'disabled'],
  'packages/bruno-app/src/components/Cookies/ModifyCookieModal/index.js': ['Expiration', 'expires'],
  'packages/bruno-app/src/components/Preferences/AI/AutocompletePane.js': ['Tab', 'keymap', 'Keymap', 'shortcut'],
  'packages/bruno-app/src/components/RequestPane/GraphQLSchemaActions/index.js': ['Schema', 'schema'],
  'packages/bruno-app/src/components/RequestPane/GrpcQueryUrl/ProtoFileDropdown/index.js': ['import path', 'browse', 'toggle', 'Failed', 'error'],
  'packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/CloneCollectionItem/index.js': ['Options', 'More'],
  'packages/bruno-app/src/components/Sidebar/PostmanPackageReport/index.js': ['Installed', 'Install failed', 'installed'],
  'packages/bruno-app/src/components/Sidebar/RunCollectionItem/index.js': ['recursive', 'folder', 'Runner', 'loading'],
  'packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/RunCollectionItem/index.js': ['recursive', 'folder', 'Runner', 'loading', 'already'],
  'packages/bruno-app/src/components/Sidebar/Collections/Collection/ChangeCollectionVersion/index.js': ['Version', 'e.g.', 'from', 'Updates'],
  'packages/bruno-app/src/components/Sidebar/GoldenEdition/index.js': ['Organizations', 'per user', 'Per user', 'Individuals'],
  'packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/IgnoreCollectionItem/index.js': ['Hide', 'hide', 'starting', 'Bruno'],
  'packages/bruno-app/src/components/Sidebar/Drafts/index.js': ['unsaved', 'request'],
  'packages/bruno-app/src/components/DeprecationWarning/index.js': ['removed', 'deprecated', 'post', 'questions'],
  'packages/bruno-app/src/components/Sidebar/ImportCollection/ImportSpecLocation/index.js': ['Spec', 'spec']
};
for (const [p, ws] of Object.entries(targets)) {
  const src = show(p);
  if (!src) { console.log('!! not in baseline:', p); continue; }
  console.log('##### ' + p.split('/').slice(-2).join('/'));
  src.split('\n').forEach((l, i) => {
    const low = l.toLowerCase();
    if (ws.some((w) => low.includes(w.toLowerCase()))) {
      const t = l.trim();
      if (t && t.length < 170 && !/className=|useState|useEffect|const \w+ = \(|=> \{|function |^import |dispatch\(|\{\}/.test(t)) {
        console.log(i + ': ' + t);
      }
    }
  });
}
