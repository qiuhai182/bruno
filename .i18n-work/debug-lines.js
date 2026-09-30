const fs = require('fs');
const DIFF = fs.readFileSync('d:/bruno/.i18n-work/sidebar.diff', 'utf8').replace(/^\uFEFF/, '');
// find diff lines mentioning the keys of interest
const needles = ['notSet', 'generateCode.example', 'versionLabel', 'titleWithExample'];
let curFile = null;
for (const L of DIFF.split(/\r?\n/)) {
  if (L.startsWith('diff --git ')) { curFile = L.match(/ b\/(.+)$/)[1]; continue; }
  if (/^[+-]/.test(L) && needles.some((n) => L.includes(n))) {
    console.log(curFile.split('/').pop(), L[0], JSON.stringify(L.slice(1, 250)));
  }
}
