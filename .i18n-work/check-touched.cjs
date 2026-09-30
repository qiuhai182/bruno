const fs = require('fs');
const { execSync } = require('child_process');

// Files touched in this step
const touched = [
  'packages/bruno-app/src/components/Preferences/AI/AutocompletePane.js',
  'packages/bruno-app/src/components/Preferences/AI/SecurityPane.js',
  'packages/bruno-app/src/components/Preferences/AI/ProviderCard.js',
  'packages/bruno-app/src/components/Preferences/AI/CompatEndpointCard.js',
  'packages/bruno-app/src/components/Preferences/AI/index.js',
  'packages/bruno-app/src/components/Preferences/Cache/index.js',
  'packages/bruno-app/src/components/AppTitleBar/index.js'
];

const FFFD = String.fromCharCode(0xFFFD);
for (const f of touched) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes(FFFD)) {
    const lines = s.split('\n');
    lines.forEach((l, i) => {
      if (l.includes(FFFD)) console.log('FFFD', f, i + 1);
    });
  }
  const q = (s.match(/\?{2,}/g) || []).length;
  if (q) console.log('QRUN', f, 'runs>=2:', q);
}

// Compare non-ASCII chars: working vs HEAD for touched files
console.log('--- diff vs HEAD (non-ascii related) ---');
for (const f of touched) {
  let head = '';
  try {
    head = execSync(`git show HEAD:${f.split('/').join('/')}`, { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  } catch (e) {
    console.log('no HEAD for', f);
    continue;
  }
  const work = fs.readFileSync(f, 'utf8');
  const cnt = (s) => {
    const m = {};
    for (const ch of s) {
      const cp = ch.codePointAt(0);
      if (cp > 127) m[ch] = (m[ch] || 0) + 1;
    }
    return m;
  };
  console.log(f.split('/').pop(), JSON.stringify(cnt(head)), '=>', JSON.stringify(cnt(work)));
}
