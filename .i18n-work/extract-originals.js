const { execSync } = require('child_process');
const fs = require('fs');
const files = [
  'packages/bruno-app/src/components/Environments/EnvironmentSettings/EnvironmentList/EnvironmentDetails/index.js',
  'packages/bruno-app/src/components/WorkspaceHome/WorkspaceEnvironments/EnvironmentList/EnvironmentDetails/index.js',
  'packages/bruno-app/src/components/Environments/EnvironmentSettings/DeleteEnvironment/index.js',
  'packages/bruno-app/src/components/Environments/EnvironmentSettings/DeleteDotEnvFile/index.js',
  'packages/bruno-app/src/components/Environments/DotEnvFileDetails/index.js',
  'packages/bruno-app/src/components/Environments/DotEnvFileEditor/index.js',
  'packages/bruno-app/src/components/Environments/DotEnvFileEditor/DotEnvEmptyState.js',
  'packages/bruno-app/src/components/Environments/DotEnvFileEditor/DotEnvRawView.js',
  'packages/bruno-app/src/components/Environments/DotEnvFileEditor/DotEnvTableView.js',
  'packages/bruno-app/src/components/Environments/Common/EnvironmentInheritanceWarning/index.js',
  'packages/bruno-app/src/components/Environments/Common/ImportEnvironmentModal/index.js',
  'packages/bruno-app/src/components/Environments/Common/ImportEnvironmentModal/utils.js',
  'packages/bruno-app/src/components/Environments/Common/InheritsFrom/index.js',
  'packages/bruno-app/src/components/Environments/EnvironmentSettings/CopyEnvironment/index.js',
  'packages/bruno-app/src/components/Environments/EnvironmentSettings/CreateEnvironment/index.js',
  'packages/bruno-app/src/components/WorkspaceHome/WorkspaceEnvironments/CopyEnvironment/index.js',
  'packages/bruno-app/src/components/WorkspaceHome/WorkspaceEnvironments/CreateEnvironment/index.js',
  'packages/bruno-app/src/components/WorkspaceHome/WorkspaceEnvironments/RenameEnvironment/index.js'
];

let out = '';
for (const f of files) {
  let src = '';
  try {
    src = execSync('git show HEAD:' + JSON.stringify(f), { cwd: 'd:/bruno', encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (e) {
    out += '#### ' + f + '  [GIT ERROR]\n';
    continue;
  }
  out += '#### ' + f + '\n';
  const lines = src.split('\n');
  lines.forEach((l, i) => {
    // natural-language string literals
    if (/'[A-Za-z][^'\n]*[\sA-Za-z][^'\n]*'|"[A-Za-z][^"\n]*[\sA-Za-z][^"\n]*"|`[A-Za-z][^`\n]*`/.test(l) && !/^\s*import|require\(/.test(l)) {
      const trimmed = l.trim();
      if (trimmed.length > 0 && trimmed.length < 300) out += (i + 1) + ': ' + trimmed + '\n';
    }
  });
  out += '\n';
}
fs.writeFileSync('d:/bruno/.i18n-work/original-strings.txt', out, 'utf8');
console.log('written', out.length, 'chars');
