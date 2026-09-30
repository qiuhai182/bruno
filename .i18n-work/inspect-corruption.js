const { execSync } = require('child_process');
const fs = require('fs');

const files = [
  'packages/bruno-app/src/components/RequestTabs/RequestTab/index.js',
  'packages/bruno-app/src/components/ResponsePane/Timeline/TimelineItem/index.js',
  'packages/bruno-app/src/components/VariablesEditor/index.js',
  'packages/bruno-app/src/components/OpenAPISpecTab/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/OverviewSection/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/SpecDiffModal/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/SpecStatusSection/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/SyncReviewPage/index.js',
  'packages/bruno-app/src/components/ResponseExample/ResponseExampleResponsePane/index.js'
];

let out = '';
for (const rel of files) {
  const head = execSync(`git show HEAD:${rel}`, { maxBuffer: 1e8 }).toString('utf8');
  const work = fs.readFileSync(rel, 'utf8');
  out += '===== ' + rel + ' =====\n';
  out += '--- HEAD lines with non-ASCII ---\n';
  head.split('\n').forEach((l, i) => {
    if (/[^\x00-\x7F]/.test(l)) out += `H${i + 1}: ${l.trim()}\n`;
  });
  out += '--- WORK lines with non-ASCII ---\n';
  work.split('\n').forEach((l, i) => {
    if (/[^\x00-\x7F]/.test(l)) out += `W${i + 1}: ${l.trim()}\n`;
  });
  out += '--- WORK lines with ?? ---\n';
  work.split('\n').forEach((l, i) => {
    if (l.includes('??')) out += `W${i + 1}: ${l.trim()}\n`;
  });
  out += '\n';
}
fs.writeFileSync('.i18n-work/corruption-report.txt', out, 'utf8');
console.log('written');
