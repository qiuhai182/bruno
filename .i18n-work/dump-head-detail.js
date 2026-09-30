const fs = require('fs');
const { execSync } = require('child_process');
process.chdir('d:/bruno');
const C = 'packages/bruno-app/src/components/';

function show(file, filterRe) {
  let content;
  try {
    content = execSync(`git show HEAD:"${C}${file}"`, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  } catch (e) {
    return '### ' + file + ' [FAILED]\n';
  }
  const lines = content.split('\n');
  let out = '### ' + file + ' (HEAD)\n';
  if (!filterRe) {
    out += lines.map((l, i) => (i + 1) + ': ' + l).join('\n') + '\n';
  } else {
    const re = new RegExp(filterRe);
    lines.forEach((l, i) => { if (re.test(l)) out += (i + 1) + ': ' + l.trim() + '\n'; });
  }
  return out;
}

let out = '';
// OverviewSection: full HEAD (cards + tooltips + details)
out += show('OpenAPISyncTab/OverviewSection/index.js');
// banner endpoint count templates
out += show('OpenAPISyncTab/SpecStatusSection/index.js', 'endpoint|checked|Last checked|updated|added|removed|modified');
// collection counts
out += show('OpenAPISyncTab/CollectionStatusSection/index.js', 'modified|added|deleted|missing|Count|count|specMissing|Go to');
// specDiff counts + resolve
out += show('OpenAPISyncTab/SpecDiffModal/index.js', 'updated|added|removed|Updated|Added|Removed|Count');
// sync review subtitle / viewSpecDiff / resolveConflicts
out += show('OpenAPISyncTab/SyncReviewPage/index.js', 'subtitle|View Spec Diff|Resolve|Review Changes|conflict');
// EndpointItem full
out += show('OpenAPISyncTab/EndpointChangeSection/EndpointItem.js');
// EndpointVisualDiff sections
out += show('OpenAPISyncTab/EndpointChangeSection/EndpointVisualDiff.js', "label|URL|Params|Headers|Auth|Body|section");
// QueryResultTypeSelector full
out += show('ResponsePane/QueryResult/QueryResultTypeSelector/index.jsx');
// runner title area
out += show('RunnerResults/index.jsx', 'in this collection|You have|Loading|request|Requests|title');
fs.writeFileSync('.i18n-work/head-detail.txt', out, 'utf8');
console.log('done, chars: ' + out.length);
