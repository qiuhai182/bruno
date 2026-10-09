const fs = require('fs');
const fixes = [
  ['d:/bruno/packages/bruno-app/src/providers/ReduxStore/slices/apiSpec.js', "import i18n from '../i18n';", "import i18n from '../../../i18n';"],
  ['d:/bruno/packages/bruno-app/src/providers/ReduxStore/slices/notifications.js', "import i18n from '../i18n';", "import i18n from '../../../i18n';"],
  ['d:/bruno/packages/bruno-app/src/providers/ReduxStore/slices/collections/actions.js', "import i18n from '../../i18n';", "import i18n from '../../../../i18n';"]
];
for (const [p, from, to] of fixes) {
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes(from)) { console.log('MISS', p); continue; }
  s = s.split(from).join(to);
  fs.writeFileSync(p, s, 'utf8');
  console.log('fixed', p.split('/').pop());
}
