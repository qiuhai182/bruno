const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [p + k]));
const en = JSON.parse(fs.readFileSync(path.join(base, 'i18n', 'translation', 'en.json'), 'utf8'));
const known = new Set(flat(en));

// Template t() keys found by deep-check:
const templates = [
  // [file, prefix, suffix..., varSource(file-relative regex to collect ids)]
  { t: 'environments.selector.emptyDescription.${activeTab}', file: 'components/Environments/EnvironmentSelector/index.js', var: 'activeTab' },
  { t: 'environments.selector.tab.${tab.id}', file: 'components/Environments/EnvironmentSelector/index.js', var: 'tab.id' },
  { t: 'preferences.beta.features.${feature.id}.label', file: 'components/Preferences/Beta/index.js', var: 'feature.id' },
  { t: 'preferences.beta.features.${feature.id}.description', file: 'components/Preferences/Beta/index.js', var: 'feature.id' },
  { t: 'preferences.beta.features.${feature.id}.action', file: 'components/Preferences/Beta/index.js', var: 'feature.id' },
  { t: 'preferences.keybindings.sections.${SECTION_HEADING_KEYS[section.heading]}', file: 'components/Preferences/Keybindings/index.js', special: 'SECTION_HEADING_KEYS' },
  { t: 'preferences.keybindings.actions.${action}', file: 'components/Preferences/Keybindings/index.js', var: 'action' },
  { t: 'requestPane.tabs.${key}', file: 'components/RequestPane/HttpRequestPane/index.js', var: 'key' },
  { t: 'dialogs.itemType.${itemType}', file: 'components/RequestTabs/RequestTab/ConfirmRequestClose/index.js', var: 'itemType' },
  { t: 'sidebar.dragPreview.${key}One', file: 'components/Sidebar/Collections/Collection/CollectionItem/CollectionItemDragPreview/index.js', var: 'key' },
  { t: 'sidebar.dragPreview.${key}Many', file: 'components/Sidebar/Collections/Collection/CollectionItem/CollectionItemDragPreview/index.js', var: 'key' },
  { t: 'preferences.themes.${mode.key}', file: 'components/WelcomeModal/ThemeStep/index.js', var: 'mode.key' }
];

let problems = 0;
for (const tpl of templates) {
  const p = path.join(base, tpl.file);
  if (!fs.existsSync(p)) { console.log('!! file missing: ' + tpl.file); problems++; continue; }
  const s = fs.readFileSync(p, 'utf8');
  let ids = [];
  if (tpl.special === 'SECTION_HEADING_KEYS') {
    // extract values of the map object
    const idx = s.indexOf('SECTION_HEADING_KEYS');
    const seg = s.slice(idx, idx + 600);
    ids = [...seg.matchAll(/:\s*'([\w.]+)'/g)].map((m) => m[1]);
    // these are already full keys (map values), check directly
    console.log('== ' + tpl.t);
    for (const id of ids) {
      const ok = known.has(id);
      if (!ok) problems++;
      console.log('   ' + (ok ? 'OK  ' : 'MISS') + ' ' + id);
    }
    continue;
  }
  // collect candidate values: string literals assigned near the var name, or arrays of ids
  const varName = tpl.var.split('.').pop();
  // pattern: id: 'x' or key: 'x' or { id: '...' } or items with value: 'x'
  const re = new RegExp("(?:id|key|value|tab|type|itemType|mode)\\s*:\\s*'([a-zA-Z][\\w-]*)'", 'g');
  ids = [...s.matchAll(re)].map((m) => m[1]);
  // dedupe, filter obviously non-id values (uppercase-only or containing space)
  ids = [...new Set(ids)].filter((v) => /^[a-z][\w-]*$/i.test(v));
  if (!ids.length) { console.log('?? ' + tpl.t + ' -> no candidate ids found in ' + tpl.file); problems++; continue; }
  const prefix = tpl.t.slice(0, tpl.t.indexOf('${'));
  const suffix = tpl.t.slice(tpl.t.indexOf('}') + 1);
  console.log('== ' + tpl.t + '  (candidates: ' + ids.join(', ') + ')');
  for (const id of ids) {
    const full = prefix + id + suffix;
    const ok = known.has(full);
    if (!ok) { problems++; console.log('   MISS ' + full); }
  }
}
console.log(problems ? 'TEMPLATE PROBLEMS: ' + problems : 'ALL TEMPLATE KEYS RESOLVE');
