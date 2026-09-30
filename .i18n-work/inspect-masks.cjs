const fs = require('fs');
const files = [
  'packages/bruno-app/src/components/Preferences/AI/ProviderCard.js',
  'packages/bruno-app/src/components/Preferences/AI/CompatEndpointCard.js',
  'packages/bruno-app/src/components/Preferences/AI/AutocompletePane.js'
];
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (/mask|kbd>|\u00B7|\u2192|\uFFFD/.test(l)) {
      console.log(f.split('/').pop(), i + 1, JSON.stringify(l.trim().slice(0, 130)));
    }
  });
}
