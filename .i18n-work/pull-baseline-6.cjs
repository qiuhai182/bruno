const { execFileSync } = require('child_process');
function sh(a) { return execFileSync('git', a, { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 64e6 }); }
// Presets baseline
const p = sh(['show', 'e39db0118:packages/bruno-app/src/components/CollectionSettings/Presets/index.js']);
console.log('##### Presets');
p.split('\n').forEach((l, i) => { if (/label|subtitle|Select|Base URL|Environment|placeholder|env/i.test(l) && !/className|import |useState|=>|dispatch|const \w+ = \(/.test(l)) { const t = l.trim(); if (t.length < 160) console.log(i + ': ' + t); } });
// FullscreenLoader history
const commits = sh(['log', '--all', '-S', 'loadingMessages', '--format=%H', '--', 'packages/bruno-app/src/components/Sidebar/ImportCollection/FullscreenLoader/index.js']).trim().split('\n').filter(Boolean);
console.log('##### loader commits:', commits.map((c) => c.slice(0, 8)).join(','));
for (const c of commits) {
  try {
    const src = sh(['show', c + ':packages/bruno-app/src/components/Sidebar/ImportCollection/FullscreenLoader/index.js']);
    const i = src.indexOf('loadingMessages');
    if (i >= 0) { console.log('== ' + c.slice(0, 8)); console.log(src.slice(i, i + 400)); break; }
  } catch (e) {}
}
