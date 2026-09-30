const fs = require('fs');
const { execSync } = require('child_process');

const files = [
  'packages/bruno-app/src/components/Preferences/AI/AutocompletePane.js',
  'packages/bruno-app/src/components/Preferences/AI/SecurityPane.js',
  'packages/bruno-app/src/components/Preferences/AI/ProviderCard.js',
  'packages/bruno-app/src/components/Preferences/AI/CompatEndpointCard.js',
  'packages/bruno-app/src/components/Preferences/AI/index.js',
  'packages/bruno-app/src/components/Preferences/Cache/index.js'
];

const FFFD = String.fromCharCode(0xFFFD);
for (const f of files) {
  console.log('=== ' + f.split('/').pop() + ' ===');
  let head = '';
  try {
    head = execSync('git show HEAD:' + f, { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  } catch (e) { /* new file */ }
  head.split('\n').forEach((l, i) => {
    if (/[^\x00-\x7F]/.test(l)) console.log('HEAD ', i + 1, JSON.stringify(l.trim().slice(0, 110)));
  });
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (/[^\x00-\x7F]/.test(l)) console.log('WORK ', i + 1, JSON.stringify(l.trim().slice(0, 110)));
  });
}
