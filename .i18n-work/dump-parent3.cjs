const { execFileSync } = require('child_process');
const CWD = 'd:\\bruno';
function sh(a) { return execFileSync('git', a, { cwd: CWD, encoding: 'utf8', maxBuffer: 64e6 }); }
function dump(rel, pats, w = 2, commit = '57c9b8c519c2c7b3d25dbfff5c093461ea6aa697^') {
  let src;
  try { src = sh(['show', commit + ':' + rel]); }
  catch (e) { console.log('!! ' + rel + ' @short'); return; }
  console.log('##### ' + rel.split('/').slice(-2).join('/'));
  const lines = src.split('\n');
  lines.forEach((l, i) => {
    if (pats.some((x) => x.test(l))) {
      for (let k = Math.max(0, i - w); k <= Math.min(lines.length - 1, i + w); k++) {
        const t = lines[k].trim();
        if (t) console.log('  ' + k + ': ' + t.slice(0, 160));
      }
      console.log('  ---');
    }
  });
}
// a) HttpRequestPane tab labels
dump('packages/bruno-app/src/components/RequestPane/HttpRequestPane/index.js', [/TAB_CONFIG|label:/], 1);
// b) EnvironmentSelector
dump('packages/bruno-app/src/components/Environments/EnvironmentSelector/index.js', [/emptyDescription|TABS\s*=|id: |description/], 2);
// c) Beta feature ids + action
dump('packages/bruno-app/src/components/Preferences/Beta/index.js', [/BETA_FEATURE_IDS\s*=|AI_ASSISTANT|FILE_CACHE|AKAMAI|MOCK_SERVER|GRPC_SCRIPTING|action:/], 1);
// d) DragPreview original
dump('packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/CollectionItemDragPreview/index.js', [/pluralizeWord|folders|requests|apps|collections/], 1);
// f) ThemeStep
dump('packages/bruno-app/src/components/WelcomeModal/ThemeStep/index.js', [/Light|Dark|System|theme-mode-btn/], 1);
// g) ConfirmRequestClose
dump('packages/bruno-app/src/components/RequestTabs/RequestTab/ConfirmRequestClose/index.js', [/itemType|request|example/], 1);
