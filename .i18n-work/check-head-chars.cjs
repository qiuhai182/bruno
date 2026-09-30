const { execSync } = require('child_process');
const files = [
  'packages/bruno-app/src/components/Sidebar/PostmanPackageReport/index.js',
  'packages/bruno-app/src/components/Sidebar/ImportCollection/FileTab.js',
  'packages/bruno-app/src/components/Sidebar/Collections/GitRemoteCollectionRow/index.js',
  'packages/bruno-app/src/components/Sidebar/Collections/Collection/GenerateDocumentation/Advanced/index.jsx'
];
const needles = ['Installing', 'parse the file', 'click to clone', 'Manage tags', 'tags are labels', 'Tags are labels'];

for (const f of files) {
  const buf = execSync('git show HEAD:' + JSON.stringify(f), { cwd: 'd:\\bruno', maxBuffer: 10 * 1024 * 1024 });
  const text = buf.toString('utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (needles.some((n) => line.includes(n))) {
      // dump with code points for non-ascii
      let esc = '';
      for (const ch of line) {
        const cp = ch.codePointAt(0);
        esc += cp > 126 ? '[U+' + cp.toString(16).toUpperCase().padStart(4, '0') + ']' : ch;
      }
      console.log(f + ':' + (i + 1));
      console.log('  ' + esc.trim());
    }
  });
}
