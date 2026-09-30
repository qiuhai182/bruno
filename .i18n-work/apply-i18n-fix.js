const fs = require('fs');

function apply(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  let fail = 0;
  for (const [find, replace] of pairs) {
    const f = find.split('\n').join(eol);
    const r = replace.split('\n').join(eol);
    const count = s.split(f).length - 1;
    if (count !== 1) {
      console.log('!! [' + count + ' matches] for: ' + JSON.stringify(find.slice(0, 90)));
      fail++;
      continue;
    }
    s = s.replace(f, r);
  }
  fs.writeFileSync(file, s, 'utf8');
  console.log((fail ? 'PARTIAL ' : 'OK ') + file);
}

// Inspect SecurityPane Add button block first is done via grep; use looser unique match:
apply('d:/bruno/packages/bruno-app/src/components/Preferences/AI/SecurityPane.js', [
  ["          Add\n        </button>\n\n      {atCapacity && (",
   "          {t('preferences.ai.card.add')}\n        </button>\n\n      {atCapacity && ("]
]);

apply('d:/bruno/packages/bruno-app/src/components/Preferences/AI/ProviderCard.js', [
  ["err.message || 'Failed to clear API key'",
   "err.message || t('preferences.ai.card.keyClearFailed')"]
]);

apply('d:/bruno/packages/bruno-app/src/components/Preferences/AI/CompatEndpointCard.js', [
  ["err.message || 'Failed to clear API key'",
   "err.message || t('preferences.ai.card.keyClearFailed')"]
]);
