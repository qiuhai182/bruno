const fs = require('fs');

// [file, [old, new, expectedCount]]
const EM = '\u2014'; // em-dash
const AR = '\u2192'; // rightwards arrow
const NE = '\u2197'; // north-east arrow
const EN = '\u2013'; // en-dash
const MOJI = '\u6F69'; // mojibake that replaced em-dash in some byte contexts
const MOJI2 = '\u6EFc'.toUpperCase(); // mojibake that replaced NE arrow

const jobs = [
  ['packages/bruno-app/src/components/RequestTabs/RequestTab/index.js', [
    [`shortcut ${MOJI} draft-aware`, `shortcut ${EM} draft-aware`, 1],
    [`shortcut ${MOJI} tab-type-aware`, `shortcut ${EM} tab-type-aware`, 1]
  ]],
  ['packages/bruno-app/src/components/ResponsePane/Timeline/TimelineItem/index.js', [
    [`src-icon">${MOJI2}<`, `src-icon">${NE}<`, 1]
  ]],
  ['packages/bruno-app/src/components/VariablesEditor/index.js', [
    [`drawerWidth ${MOJI} that changes`, `drawerWidth ${EM} that changes`, 1]
  ]],
  ['packages/bruno-app/src/components/OpenAPISpecTab/index.js', [
    [`not found ${MOJI} fall back`, `not found ${EM} fall back`, 1]
  ]],
  ['packages/bruno-app/src/components/OpenAPISyncTab/OverviewSection/index.js', [
    ['storedVersion} ?? v${specDrift.newVersion}', `storedVersion} ${AR} v${'$'}{specDrift.newVersion}`, 1],
    ['Initial sync required ?? your collection', `Initial sync required ${EM} your collection`, 1],
    [": '?C'}", `: '${EN}'}`, 1]
  ]],
  ['packages/bruno-app/src/components/OpenAPISyncTab/SpecDiffModal/index.js', [
    [`'?'} ${MOJI} v${'$'}{specDrift.newVersion}`, `'?'} ${AR} v${'$'}{specDrift.newVersion}`, 1]
  ]],
  ['packages/bruno-app/src/components/OpenAPISyncTab/SpecStatusSection/index.js', [
    ['storedVersion} ? v${specDrift.newVersion}', `storedVersion} ${AR} v${'$'}{specDrift.newVersion}`, 1]
  ]],
  ['packages/bruno-app/src/components/OpenAPISyncTab/SyncReviewPage/index.js', [
    ['here ?? they belong', `here ${EM} they belong`, 2],
    ['what ?? treat as spec update', `what ${EM} treat as spec update`, 1],
    ['changed ?? user modification', `changed ${EM} user modification`, 1],
    ['mounts ??', `mounts ${EM}`, 1],
    ['Bulk actions ?? all spec-driven', `Bulk actions ${EM} all spec-driven`, 1],
    ['summary ?? grouped endpoint', `summary ${EM} grouped endpoint`, 1],
    [`Accepted ${MOJI} changes`, `Accepted ${EM} changes`, 1],
    [`Skipped ${MOJI} changes`, `Skipped ${EM} changes`, 1]
  ]]
];

let failed = 0;
for (const [file, reps] of jobs) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [oldStr, newStr, expect] of reps) {
    const count = text.split(oldStr).length - 1;
    if (count !== expect) {
      console.log(`MISMATCH ${file}: pattern found ${count}x, expected ${expect}: ${JSON.stringify(oldStr.slice(0, 60))}`);
      failed++;
      continue;
    }
    text = text.split(oldStr).join(newStr);
  }
  fs.writeFileSync(file, text, 'utf8');
}
console.log(failed === 0 ? 'all repairs applied' : `${failed} mismatches`);
