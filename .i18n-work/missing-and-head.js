const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = 'd:/bruno';
const dir = 'packages/bruno-app/src/components/Sidebar';

// 1) collect all static t('sidebar.*') keys currently referenced in code
const referenced = new Set();
function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, f.name);
    if (f.isDirectory()) walk(fp);
    else if (/\.(jsx?)$/.test(f.name)) {
      const s = fs.readFileSync(fp, 'utf8');
      const re = /t\(\s*'(sidebar\.[A-Za-z0-9_.]+)'/g;
      let m;
      while ((m = re.exec(s)) !== null) referenced.add(m[1]);
    }
  }
}
walk(root + '/' + dir);

const extracted = JSON.parse(fs.readFileSync(root + '/.i18n-work/extracted.json', 'utf8'));
const missing = [...referenced].filter((k) => !extracted[k]).sort();
fs.writeFileSync(root + '/.i18n-work/missing-keys.txt', missing.join('\n'), 'utf8');

// 2) pull relevant original lines from HEAD for keys with no candidate
const targets = [
  ['Collections/Collection/ChangeCollectionVersion/index.js', /notFound|collectionLabel|Collection not found|Collection Name/i],
  ['Collections/Collection/CollectionItem/IgnoreCollectionItem/index.js', /hideFrom|You can hide|hide the|Ignore/i],
  ['Collections/Collection/GenerateDocumentation/Advanced/DocsTagList/index.jsx', /placeholder/i],
  ['Collections/Collection/GenerateDocumentation/Advanced/index.jsx', /TAGS_HINT|All Requests|Filter by|Advanced/i],
  ['Collections/Collection/GenerateDocumentation/index.js', /standalone|playground|host|Environments|features/i],
  ['Collections/Collection/GenerateDocumentation/EnvironmentSelectionList/index.js', /Environments|folders?|requests?/i],
  ['ImportCollection/FullscreenLoader/index.js', /loading|Loading|Importing/i],
  ['Collections/Collection/ExportCollection/ExportToPostman/index.js', /fileExists|exportFailed|already exists|exportError/i],
  ['Collections/Collection/CollectionItem/GenerateCodeItem/index.js', /example|Example|title/i],
  ['ImportCollectionLocation/index.js', /grouping|Group requests|Tags|Paths/i],
  ['Collections/Collection/MoveToWorkspace/ConfirmMoveDrafts.js', /unsaved|You have|request/i],
  ['Collections/Collection/RemoveCollections/index.js', /stillAvailable|confirm|prefix/i]
];

const out = [];
for (const [rel, re] of targets) {
  const full = dir + '/' + rel;
  let head = '';
  try {
    head = execSync('git show HEAD:' + full, { cwd: root, maxBuffer: 32 * 1024 * 1024 }).toString('utf8');
  } catch (e) { out.push('!! cannot read HEAD:' + full); continue; }
  out.push('===== ' + rel + ' =====');
  const lines = head.split('\n');
  const seen = new Set();
  lines.forEach((ln, idx) => {
    if (re.test(ln)) {
      const t = ln.trim().slice(0, 240);
      if (!seen.has(t)) { seen.add(t); out.push(idx + 1 + ': ' + t); }
    }
  });
}
fs.writeFileSync(root + '/.i18n-work/head-refs.txt', out.join('\n'), 'utf8');
console.log('referenced:', referenced.size, 'missing:', missing.length);
