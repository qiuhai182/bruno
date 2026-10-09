const { execFileSync } = require('child_process');
function sh(args) { return execFileSync('git', args, { cwd: 'd:\\bruno', encoding: 'utf8', maxBuffer: 64e6 }); }
const src = sh(['show', '57c9b8c51:packages/bruno-app/src/components/Sidebar/Collections/Collection/GenerateDocumentation/index.js']);
const lines = src.split('\n');
lines.forEach((l, i) => { if (/Playground|Host|HTML|features\s*=|Standalone/.test(l)) console.log(i + ': ' + l.trim()); });
