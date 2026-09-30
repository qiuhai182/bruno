const { execSync } = require('child_process');
const fs = require('fs');

const files = [
  'packages/bruno-app/src/components/Devtools/Console/index.js',
  'packages/bruno-app/src/components/Devtools/Console/FilterDropdown/index.js',
  'packages/bruno-app/src/components/Devtools/Console/NetworkTab/index.js',
  'packages/bruno-app/src/components/Devtools/Console/RequestDetailsPanel/index.js',
  'packages/bruno-app/src/components/Devtools/Console/ErrorDetailsPanel/index.js',
  'packages/bruno-app/src/components/Devtools/Console/DebugTab/index.js',
  'packages/bruno-app/src/components/Devtools/Console/TerminalTab/index.js',
  'packages/bruno-app/src/components/Devtools/Console/TerminalTab/SessionList.js',
  'packages/bruno-app/src/components/Devtools/Performance/index.js',
  'packages/bruno-app/src/components/Notifications/index.js',
  'packages/bruno-app/src/components/Notifications/NotificationsModal/index.js',
  'packages/bruno-app/src/components/Notifications/NotificationsModal/NotificationTabs.js',
  'packages/bruno-app/src/components/Notifications/NotificationsModal/NotificationList.js',
  'packages/bruno-app/src/components/Notifications/NotificationsModal/NotificationDetail.js',
  'packages/bruno-app/src/components/Cookies/index.js',
  'packages/bruno-app/src/components/Cookies/ModifyCookieModal/index.js',
  'packages/bruno-app/src/components/DeprecationWarning/index.js',
  'packages/bruno-app/src/components/SkippedPathsWarning/index.js',
  'packages/bruno-app/src/components/Toast/ImportIssuesToast/index.js',
  'packages/bruno-app/src/components/EmptyAppState/index.js'
];

const out = {};

for (const file of files) {
  let diff;
  try {
    diff = execSync(`git diff -U0 HEAD -- "${file}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (e) {
    console.error('DIFF FAIL', file, e.message);
    continue;
  }
  const lines = diff.split('\n');
  const hunks = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith('@@')) {
      if (cur) hunks.push(cur);
      cur = { minus: [], plus: [] };
    } else if (cur) {
      if (line.startsWith('-') && !line.startsWith('---')) cur.minus.push(line.slice(1));
      else if (line.startsWith('+') && !line.startsWith('+++')) cur.plus.push(line.slice(1));
    }
  }
  if (cur) hunks.push(cur);

  for (const h of hunks) {
    if (h.minus.length !== h.plus.length) continue;
    for (let i = 0; i < h.minus.length; i++) {
      const m = h.minus[i];
      const p = h.plus[i];
      // extract t('key') from plus line
      const km = p.match(/\bt\(\s*'([^']+)'/) || p.match(/\btranslate\(\s*'([^']+)'/) || p.match(/\bi18n\.t\(\s*'([^']+)'/);
      if (!km) continue;
      const key = km[1];
      // extract original user-visible text from minus line
      const texts = [];
      // JSX text between tags: >text<
      let jm;
      const jsxRe = />([^<>{}]+)</g;
      while ((jm = jsxRe.exec(m))) {
        const s = jm[1].trim();
        if (s) texts.push(s);
      }
      // attribute strings: title="..." placeholder="..." aria-label="..."
      const attrRe = /(title|placeholder|aria-label|html|text|content|label)="([^"]+)"/g;
      let am;
      while ((am = attrRe.exec(m))) {
        if (am[2].trim()) texts.push(am[2].trim());
      }
      // quoted JS strings
      const qRe = /'([^'\n]+)'|"([^"\n]+)"/g;
      let qm;
      while ((qm = qRe.exec(m))) {
        const s = (qm[1] ?? qm[2]).trim();
        if (s && !/^[a-zA-Z0-9_\-./]+$/.test(s)) texts.push(s); // skip technical short tokens
      }
      if (texts.length === 0) continue;
      out[key] = { file: file.replace('packages/bruno-app/src/components/', ''), texts: [...new Set(texts)] };
    }
  }
}

fs.writeFileSync('d:/bruno/.i18n-work/scope-pairs.json', JSON.stringify(out, null, 2));
console.log('keys found:', Object.keys(out).length);
for (const [k, v] of Object.entries(out)) {
  console.log(k, '=>', JSON.stringify(v.texts));
}
