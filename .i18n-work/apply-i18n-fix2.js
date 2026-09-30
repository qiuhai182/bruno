const fs = require('fs');
const p = 'd:/bruno/packages/bruno-app/src/components/Preferences/AI/SecurityPane.js';
let s = fs.readFileSync(p, 'utf8');
const f = "          <IconPlus size={13} strokeWidth={1.75} />\n          Add\n        </button>";
const r = "          <IconPlus size={13} strokeWidth={1.75} />\n          {t('preferences.ai.card.add')}\n        </button>";
const count = s.split(f).length - 1;
if (count === 1) {
  s = s.replace(f, r);
  fs.writeFileSync(p, s, 'utf8');
  console.log('OK SecurityPane Add replaced');
} else {
  console.log('!! matches: ' + count);
}
