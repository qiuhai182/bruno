const { execFileSync } = require('child_process');
function sh(args) { return execFileSync('git', args, { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 64e6 }); }
// find commits mentioning featurePlayground in GenerateDocumentation
const commits = sh(['log', '--all', '-S', 'featurePlayground', '--format=%H', '--', 'packages/bruno-app/src/components/Sidebar/Collections/Collection/GenerateDocumentation/index.js']).trim().split('\n').filter(Boolean);
console.log('commits:', commits.length);
for (const c of commits.reverse()) {
  try {
    const src = sh(['show', c + ':' + 'packages/bruno-app/src/components/Sidebar/Collections/Collection/GenerateDocumentation/index.js']);
    const lines = src.split('\n').filter((l) => /Playground|Host Anywhere|Standalone HTML|standalone HTML|feature/i.test(l) && !/t\(|const features|className/.test(l));
    if (lines.length) { console.log('== ' + c.slice(0, 9)); console.log(lines.slice(0, 8).map((l) => l.trim()).join('\n')); }
  } catch (e) { /* file absent */ }
}
