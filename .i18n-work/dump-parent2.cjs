const { execFileSync } = require('child_process');
const CWD = 'd:\\bruno';
function sh(a) { return execFileSync('git', a, { cwd: CWD, encoding: 'utf8', maxBuffer: 64e6 }); }
const P = '57c9b8c519c2c7b3d25dbfff5c093461ea6aa697^';

function show(rel, pats, ctx = 2) {
  let src;
  try { src = sh(['show', P + ':' + rel]); } catch (e) { console.log('!! ' + rel); return; }
  console.log('##### ' + rel.split('/').slice(-3).join('/'));
  const lines = src.split('\n');
  for (const pat of pats) {
    lines.forEach((l, i) => {
      if (new RegExp(pat).test(l)) {
        for (let k = Math.max(0, i - ctx); k <= Math.min(lines.length - 1, i + ctx); k++) {
          const t = lines[k].trim();
          if (t) console.log('  ' + k + ': ' + t.slice(0, 150));
        }
        console.log('  ---');
      }
    });
  }
}
// 1. edgegrid tooltips (nonce/timestamp)
show('packages/bruno-app/src/components/RequestPane/Auth/EdgeGridAuth/index.tsx', ['label: .Nonce.', 'label: .Timestamp.'], 5);
// 2. oauth1 placement
show('packages/bruno-app/src/components/RequestPane/Auth/OAuth1/index.js', ['placement', 'Add Params'], 3);
// 3. ws invalid errors
show('packages/bruno-app/src/components/RequestPane/WSSettingsPane/index.js', ['ERRORS =', 'invalid:'], 3);
// 4. welcome highlights
show('packages/bruno-app/src/components/WelcomeModal/WelcomeStep/index.js', ['highlights', 'filesystem|git|privacy|fast'], 4);
// 5. autocomplete manual description
show('packages/bruno-app/src/components/Preferences/AI/AutocompletePane.js', ['Manual'], 3);
