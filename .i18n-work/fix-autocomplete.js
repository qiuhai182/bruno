const fs = require('fs');
const p = 'd:/bruno/packages/bruno-app/src/components/Preferences/AI/AutocompletePane.js';
let s = fs.readFileSync(p, 'utf8');
const lines = s.split(/\r?\n/);
lines.forEach((l, i) => {
  if (i === 154) {
    lines[i] = "              <kbd>Tab</kbd> accept \u00B7 <kbd>{getPlatformModifierKey()}</kbd>+<kbd>\u2192</kbd> accept word \u00B7 <kbd>Esc</kbd> dismiss \u00B7 <kbd>{getPlatformModifierKey()}</kbd>+<kbd>\\</kbd> {t('preferences.ai.autocomplete.keymapTrigger')}";
  } else if (i >= 9 && i <= 12) {
    lines[i] = l.replace(/\uFFFD+/g, '\u2192');
  }
});
fs.writeFileSync(p, lines.join('\r\n'), 'utf8');
const v = fs.readFileSync(p, 'utf8');
console.log('FFFD remaining:', (v.match(/\uFFFD/g) || []).length);
console.log(JSON.stringify(v.split(/\r?\n/)[154]));
console.log(JSON.stringify(v.split(/\r?\n/)[9]));
