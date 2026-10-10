const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const CWD = 'd:\\bruno';
function sh(a) { return execFileSync('git', a, { cwd: CWD, encoding: 'utf8', maxBuffer: 64e6 }); }

// 1. EMPTY_STATE_DESCRIPTIONS from parent
const es = sh(['show', '57c9b8c51^:packages/bruno-app/src/components/Environments/EnvironmentSelector/index.js']);
const i1 = es.indexOf('EMPTY_STATE_DESCRIPTIONS');
console.log('== EnvironmentSelector descriptions ==');
console.log(es.slice(i1, i1 + 500));

// 2. BETA_FEATURE_IDS values — search current source
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|ts|tsx)$/.test(e.name)) {
      const s = fs.readFileSync(p, 'utf8');
      if (/BETA_FEATURE_IDS\s*=\s*\{/.test(s)) {
        const i = s.search(/BETA_FEATURE_IDS\s*=\s*\{/);
        console.log('== BETA_FEATURE_IDS in ' + path.relative(base, p) + ' ==');
        console.log(s.slice(i, i + 400));
      }
    }
  }
})(base);

// 3. dragPreview original body
const dp = sh(['show', '57c9b8c51^:packages/bruno-app/src/components/Sidebar/Collections/Collection/CollectionItem/CollectionItemDragPreview/index.js']);
const i3 = dp.indexOf('getMultiDragLabel');
console.log('== dragPreview original ==');
console.log(dp.slice(i3, i3 + 700));

// 4. keybindings section headings from current KEY_BINDING_SECTIONS (or parent)
try {
  const kb = fs.readFileSync(path.join(base, 'components', 'Preferences', 'Keybindings', 'index.js'), 'utf8');
  const i4 = kb.indexOf('SECTION_HEADING_KEYS');
  console.log('== current SECTION_HEADING_KEYS ==');
  console.log(kb.slice(i4, i4 + 500));
} catch (e) { console.log('kb err', e.message); }
