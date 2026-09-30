const fs = require('fs');
const { execSync } = require('child_process');
process.chdir('d:/bruno');

const files = [
  'packages/bruno-app/src/components/OpenAPISyncTab/SpecStatusSection/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/CollectionStatusSection/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/SyncReviewPage/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/SpecDiffModal/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/ConnectSpecForm/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/ConnectionSettingsModal/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/DisconnectSyncModal/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/OpenAPISyncHeader/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/ConfirmSyncModal/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/index.js',
  'packages/bruno-app/src/components/OpenAPISpecTab/index.js',
  'packages/bruno-app/src/components/OpenAPISyncTab/EndpointChangeSection/EndpointItem.js',
  'packages/bruno-app/src/components/ResponseExample/ResponseExampleResponsePane/index.js',
  'packages/bruno-app/src/components/RequestTabs/CollectionHeader/index.js',
  'packages/bruno-app/src/components/RequestTabs/RequestTab/RequestTabNotFound.js',
  'packages/bruno-app/src/components/RequestTabs/RequestTab/SpecialTab.js',
  'packages/bruno-app/src/components/ResponsePane/ResponsePaneActions/index.js',
  'packages/bruno-app/src/components/ResponsePane/LargeResponseWarning/index.js',
  'packages/bruno-app/src/components/ResponsePane/NetworkError/index.js',
  'packages/bruno-app/src/components/ResponsePane/Placeholder/index.js',
  'packages/bruno-app/src/components/ResponsePane/QueryResult/QueryResultPreview/index.js',
  'packages/bruno-app/src/components/ResponsePane/QueryResult/index.js',
  'packages/bruno-app/src/components/ResponsePane/ScriptError/index.js',
  'packages/bruno-app/src/components/ResponsePane/Timeline/TimelineItem/index.js',
  'packages/bruno-app/src/components/ResponsePane/Timeline/GrpcTimelineItem/index.js',
  'packages/bruno-app/src/components/ResponsePane/GrpcResponsePane/GrpcTestResults/index.js',
  'packages/bruno-app/src/components/ResponsePane/GrpcResponsePane/GrpcQueryResult/index.js',
  'packages/bruno-app/src/components/ResponsePane/GrpcResponsePane/GrpcResponseHeaders/index.js',
  'packages/bruno-app/src/components/ResponsePane/GrpcResponsePane/ResponseTrailers/index.js',
  'packages/bruno-app/src/components/ResponsePane/WsResponsePane/WSMessagesList/index.js',
  'packages/bruno-app/src/components/ResponsePane/GrpcResponsePane/index.js',
  'packages/bruno-app/src/components/RunnerResults/index.jsx',
  'packages/bruno-app/src/components/RunnerResults/RunConfigurationPanel/index.jsx',
  'packages/bruno-app/src/components/RunnerResults/RunnerTags/index.jsx',
  'packages/bruno-app/src/components/VariablesEditor/index.js',
  'packages/bruno-app/src/components/VariablesEditor/VariableDetailsDrawer/index.js',
  'packages/bruno-app/src/components/VariablesEditor/VariableValue/index.js',
  'packages/bruno-app/src/components/ResponsePane/Timeline/index.js'
];

function isNoise(s) {
  if (!s) return true;
  if (/^\s+$/.test(s)) return true;
  // className-like tokens
  if (!s.includes(' ') && /[-[\]:;$]/.test(s)) return true;
  if (!s.includes(' ') && s === s.toLowerCase() && s.length < 4) return true;
  return false;
}

let out = [];
for (const file of files) {
  let content;
  try {
    content = execSync(`git show HEAD:"${file}"`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    out.push('### ' + file + '  [GIT SHOW FAILED]');
    continue;
  }
  out.push('### ' + file.replace('packages/bruno-app/src/components/', ''));
  const seen = new Set();
  // single/double quoted literals
  let re = /'([^'\n]+)'|"([^"\n]+)"/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const s = m[1] !== undefined ? m[1] : m[2];
    if (isNoise(s) || seen.has(s)) continue;
    seen.add(s);
    out.push('  ' + JSON.stringify(s));
  }
  // template literals
  re = /`([^`]+)`/g;
  while ((m = re.exec(content)) !== null) {
    const s = '`' + m[1] + '`';
    if (seen.has(s)) continue;
    seen.add(s);
    out.push('  ' + s);
  }
  // JSX text
  const stripped = content.replace(/'[^'\n]+'|"[^"\n]+"|`[^`]+`/g, '');
  re = />([^<>{}]+)</g;
  while ((m = re.exec(stripped)) !== null) {
    const s = m[1].trim();
    if (isNoise(s) || seen.has(s)) continue;
    seen.add(s);
    out.push('  JSX: ' + JSON.stringify(s));
  }
}
fs.writeFileSync('.i18n-work/head-strings.txt', out.join('\n'), 'utf8');
console.log('written, lines: ' + out.length);
