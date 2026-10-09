const fs = require('fs');
// rename leaf key sidebar.fileFormat -> sidebar.fileFormatLabel in components
for (const p of [
  'd:/bruno/packages/bruno-app/src/components/Sidebar/ImportCollectionLocation/index.js',
  'd:/bruno/packages/bruno-app/src/components/Sidebar/CreateCollection/index.js'
]) {
  let s = fs.readFileSync(p, 'utf8');
  const n = s.split("t('sidebar.fileFormat')").length - 1;
  s = s.split("t('sidebar.fileFormat')").join("t('sidebar.fileFormatLabel')");
  fs.writeFileSync(p, s, 'utf8');
  console.log(p.split('/').pop(), 'replaced', n);
}
// rename in final-key-en map: leaf label value = "File Format"
const f = 'd:/bruno/.i18n-work/final-key-en.json';
const en = JSON.parse(fs.readFileSync(f, 'utf8'));
const label = en['sidebar.fileFormat'];
delete en['sidebar.fileFormat'];
en['sidebar.fileFormatLabel'] = label || 'File Format';
fs.writeFileSync(f, JSON.stringify(Object.fromEntries(Object.entries(en).sort()), null, 2), 'utf8');
console.log('map renamed; label =', en['sidebar.fileFormatLabel']);
