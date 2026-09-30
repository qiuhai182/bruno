const fs = require('fs');
const { execSync } = require('child_process');
process.chdir('d:/bruno');
const C = 'packages/bruno-app/src/components/';
let out = '';

// HEAD SyncReviewPage lines 230-275 (review.subtitle area)
const head = execSync('git show HEAD:"' + C + 'OpenAPISyncTab/SyncReviewPage/index.js"', { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
out += '### SyncReviewPage HEAD 228-275\n';
out += head.split('\n').slice(227, 275).map((l, i) => (i + 228) + ': ' + l).join('\n') + '\n';

// current-file t() call sites with interpolation
function grepCurrent(file, re) {
  const cur = fs.readFileSync(C + file, 'utf8').split('\n');
  out += '### CURRENT ' + file + '\n';
  const rx = new RegExp(re);
  cur.forEach((l, i) => { if (rx.test(l)) out += (i + 1) + ': ' + l.trim() + '\n'; });
}
grepCurrent('OpenAPISyncTab/SpecStatusSection/index.js', "banner\\.|checkedAt|endpointsUpdated|endpointsAdded|endpointsRemoved");
grepCurrent('OpenAPISyncTab/SyncReviewPage/index.js', "resolveConflictsAndSync|review\\.conflictCount|changeCounter|specDiff\\.");
grepCurrent('OpenAPISyncTab/CollectionStatusSection/index.js', 'specMissingDesc');
grepCurrent('OpenAPISyncTab/SpecDiffModal/index.js', 'changeCounter|addedCount|updatedCount|removedCount');
grepCurrent('RunnerResults/index.jsx', "runner\\.youHave|runner\\.request|runner\\.inThisCollection|runner\\.loading");
fs.writeFileSync('.i18n-work/head-detail2.txt', out, 'utf8');
console.log('ok');
