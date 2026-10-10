const fs = require('fs');
const path = require('path');
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation', 'en.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'i18n', 'translation', 'zh-CN.json'), 'utf8'));
const get = (o, k) => k.split('.').reduce((x, y) => (x && x[y] !== undefined ? x[y] : undefined), o);

const expected = [];
// requestPane.tabs full set
for (const t of ['params', 'body', 'headers', 'auth', 'vars', 'script', 'assert', 'tests', 'docs', 'app', 'settings']) expected.push('requestPane.tabs.' + t);
// keybindings sections
for (const s of ['tabs', 'sidebar', 'requests', 'collectionsEnvironment', 'search', 'view', 'developerTool', 'others']) expected.push('preferences.keybindings.sections.' + s);
// keybindings actions (37 from extraction)
const actions = JSON.parse(fs.readFileSync(path.join(__dirname, 'keybinding-actions.json'), 'utf8'));
for (const a of Object.keys(actions)) expected.push('preferences.keybindings.actions.' + a);
// environments selector
for (const t of ['collection', 'global']) { expected.push('environments.selector.tab.' + t); expected.push('environments.selector.emptyDescription.' + t); }
// beta features with real ids
for (const f of ['ai-assistant', 'file-cache', 'akamai-edgegrid', 'mock-server', 'grpc-scripting']) {
  expected.push('preferences.beta.features.' + f + '.label');
  expected.push('preferences.beta.features.' + f + '.description');
}
expected.push('preferences.beta.features.ai-assistant.action', 'preferences.beta.features.file-cache.action');
// themes
for (const t of ['light', 'dark', 'system']) expected.push('preferences.themes.' + t);
// dialogs item types
for (const t of ['request', 'example']) expected.push('dialogs.itemType.' + t);
// drag preview
for (const k of ['collection', 'folder', 'app', 'request']) { expected.push('sidebar.dragPreview.' + k + 'One'); expected.push('sidebar.dragPreview.' + k + 'Many'); }

let missEn = 0, missZh = 0;
for (const k of expected) {
  const e = get(en, k), z = get(zh, k);
  if (e === undefined || !String(e).trim()) { missEn++; console.log('MISS EN ' + k); }
  if (z === undefined || !String(z).trim()) { missZh++; console.log('MISS ZH ' + k); }
}
console.log('expected dynamic/template keys:', expected.length, '| missing EN:', missEn, '| missing ZH:', missZh);
console.log(missEn + missZh === 0 ? 'TEMPLATE ASSERTIONS PASSED' : 'FAILED');
