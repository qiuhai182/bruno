const fs = require('fs');
const files = [
  'd:/bruno/packages/bruno-app/src/components/Preferences/AI/SecurityPane.js',
  'd:/bruno/packages/bruno-app/src/components/Preferences/AI/ProviderCard.js',
  'd:/bruno/packages/bruno-app/src/components/Preferences/AI/CompatEndpointCard.js',
  'd:/bruno/packages/bruno-app/src/components/Preferences/AI/index.js',
  'd:/bruno/packages/bruno-app/src/components/Preferences/Keybindings/index.js',
  'd:/bruno/packages/bruno-app/src/components/Preferences/Support/index.js',
  'd:/bruno/packages/bruno-app/src/components/Preferences/Display/Font/index.js',
  'd:/bruno/packages/bruno-app/src/components/Preferences/Display/Theme/index.js',
  'd:/bruno/packages/bruno-app/src/components/Preferences/ProxySettings/index.js',
  'd:/bruno/packages/bruno-app/src/components/AppTitleBar/index.js'
];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const bad = [];
  s.split(/\r?\n/).forEach((l, i) => {
    // eslint-disable-next-line no-control-regex
    if (/[^\x00-\x7F]/.test(l)) bad.push(i + 1 + ': ' + JSON.stringify(l.trim().slice(0, 90)));
  });
  console.log('===', f, bad.length ? 'NON-ASCII (' + bad.length + ' lines)' : 'pure-ASCII');
  bad.slice(0, 8).forEach((b) => console.log('   ', b));
}
