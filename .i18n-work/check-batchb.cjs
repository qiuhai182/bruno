const fs = require('fs');
const path = require('path');
const targets = [
  'components/SaveTransientRequest/index.js',
  'components/SaveTransientRequest/Container/index.js',
  'components/MigrateCollectionToYmlModal/index.js',
  'components/CreateUntitledRequest/index.js',
  'components/CreateTransientRequest/index.js',
  'components/RequestTabPanel/index.js',
  'components/RequestTabPanel/RequestNotLoaded/index.js',
  'components/RequestTabPanel/RequestIsLoading/index.js',
  'components/RequestTabPanel/CollapsedPanelIndicator/index.js',
  'components/BrunoSupport/index.js',
  'pages/ErrorBoundary/index.js',
  'pages/Main.js'
];
const base = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
for (const t of targets) {
  const p = path.join(base, t);
  if (!fs.existsSync(p)) { console.log('MISSING FILE', t); continue; }
  const s = fs.readFileSync(p, 'utf8');
  const wired = s.includes('useTranslation') || s.includes('i18n.t(');
  const fffd = s.includes('\uFFFD');
  // count t() calls
  const tCalls = (s.match(/\bt\(\s*['"]/g) || []).length;
  console.log((wired ? 'WIRED ' : 'RAW   ') + (fffd ? ' FFFD!' : '      ') + ' t=' + String(tCalls).padStart(3) + '  ' + t);
}
