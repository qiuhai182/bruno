const { execFileSync } = require('child_process');
const CWD = 'd:\\bruno';
function sh(a) { return execFileSync('git', a, { cwd: CWD, encoding: 'utf8', maxBuffer: 64e6 }); }
function parentOf(rel) {
  const log = sh(['log', '--all', '-S', 'labelKey', '--format=%H', '--', rel]).trim().split('\n').filter(Boolean);
  const c = log[log.length - 1];
  return { commit: c, src: sh(['show', c + '^:' + rel]) };
}
const files = [
  'packages/bruno-app/src/components/RequestPane/Auth/EdgeGridAuth/index.tsx',
  'packages/bruno-app/src/components/Preferences/AI/AutocompletePane.js',
  'packages/bruno-app/src/components/RequestPane/RequestBody/RequestBodyMode/index.js',
  'packages/bruno-app/src/components/WelcomeModal/WelcomeStep/index.js'
];
for (const rel of files) {
  const { commit, src } = parentOf(rel);
  console.log('##### ' + rel.split('/').slice(-2).join('/') + ' @ ' + commit.slice(0, 8));
  const lines = src.split('\n');
  lines.forEach((l, i) => {
    const t = l.trim();
    // lines carrying label-ish english text
    if (/['"][A-Z][a-z]/.test(t) && /label|tooltip|title|desc|name|text|Field|heading/i.test(t) && t.length < 150) {
      console.log('  ' + i + ': ' + t);
    }
  });
}
