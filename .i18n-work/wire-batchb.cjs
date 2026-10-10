const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
let fail = 0;
function patch(rel, pairs, opts = {}) {
  const p = path.join(SRC, rel);
  let s = fs.readFileSync(p, 'utf8');
  let n = 0;
  for (const [from, to] of pairs) {
    const c = s.split(from).length - 1;
    if (c === 0) { console.log('!! NOT FOUND [' + rel + ']: ' + from.slice(0, 80)); fail++; continue; }
    s = s.split(from).join(to);
    n += c;
  }
  if (opts.hook && !s.includes('useTranslation')) {
    // insert import after first import line
    const lines = s.split('\n');
    let last = -1;
    for (let i = 0; i < lines.length; i++) if (/^import /.test(lines[i])) last = i;
    lines.splice(last + 1, 0, "import { useTranslation } from 'react-i18next';");
    s = lines.join('\n');
    // insert hook after component opening: after 'const { t } = useTranslation();' we need the right anchor
    if (opts.hookAfter) {
      const idx = s.indexOf(opts.hookAfter);
      if (idx === -1) { console.log('!! hookAfter anchor missing [' + rel + ']'); fail++; }
      else s = s.slice(0, idx + opts.hookAfter.length) + "\n  const { t } = useTranslation();" + s.slice(idx + opts.hookAfter.length);
    }
  }
  if (opts.i18nImport && !s.includes("from '" + opts.i18nImport + "'")) {
    const lines = s.split('\n');
    let last = -1;
    for (let i = 0; i < lines.length; i++) if (/^import /.test(lines[i])) last = i;
    lines.splice(last + 1, 0, "import i18n from '" + opts.i18nImport + "';");
    s = lines.join('\n');
  }
  fs.writeFileSync(p, s, 'utf8');
  console.log(rel + ': ' + n + ' replacements' + (opts.hook ? ' (+hook)' : '') + (opts.i18nImport ? ' (+i18n import)' : ''));
}

// 1. CreateUntitledRequest
patch('components/CreateUntitledRequest/index.js', [
  ["toast.success('New request created!')", "toast.success(t('untitledRequest.created'))"],
  ["toast.error(err ? err.message : 'An error occurred while adding the request')", "toast.error(err ? err.message : t('untitledRequest.createFailed'))"],
  ["}, [dispatch, collection, itemUid, onRequestCreated]);", "}, [dispatch, collection, itemUid, onRequestCreated, t]);"]
], {
  hook: true,
  hookAfter: "const collection = collections?.find((c) => c.uid === collectionUid);"
});

// 2. CreateTransientRequest
patch('components/CreateTransientRequest/index.js', [
  ["toast.error(formatIpcError(err) || 'An error occurred while adding the request')", "toast.error(formatIpcError(err) || t('transientRequest.createFailed'))"],
  ['aria-label="New Transient Request"', "aria-label={t('transientRequest.ariaLabel')}"],
  ["}, [dispatch, collection, collectionPresets.requestUrl]);", "}, [dispatch, collection, collectionPresets.requestUrl, t]);"]
], {
  hook: true,
  hookAfter: "const collections = useSelector((state) => state.collections.collections);"
});

// 3. RequestTabPanel
patch('components/RequestTabPanel/index.js', [
  ['<span>Loading...</span>', "<span>{t('requestTabPanel.loading')}</span>"],
  ['<div className="font-medium">Mock server not found</div>', "<div className=\"font-medium\">{t('requestTabPanel.mockServerNotFound')}</div>"],
  ["This mock server may have been removed. Create a new one from the Mock Servers sidebar.", "{t('requestTabPanel.mockServerNotFoundDesc')}"],
  ['<div className="pb-4 px-4">An error occurred!</div>', "<div className=\"pb-4 px-4\">{t('requestPane.errorOccurred')}</div>"],
  ['<div className="pb-4 px-4">Collection not found!</div>', "<div className=\"pb-4 px-4\">{t('requestTabPanel.collectionNotFound')}</div>"],
  ["toast.error('Please enter a valid gRPC server URL');", "toast.error(t('requestTabPanel.grpcUrlRequired'));"],
  ["toast.error('Please select a gRPC method');", "toast.error(t('requestTabPanel.grpcMethodRequired'));"],
  ["toast.error('Please enter a valid WebSocket URL');", "toast.error(t('requestTabPanel.wsUrlRequired'));"],
  ['aria-label="Close Documentation Explorer"', "aria-label={t('requestTabPanel.closeDocsExplorer')}"]
], {
  hook: true,
  hookAfter: "const RequestTabPanel = () => {"
});

// 4. RequestNotLoaded
patch('components/RequestTabPanel/RequestNotLoaded/index.js', [
  ['File Info', "{t('requestTabPanel.fileInfo')}"],
  ['>Name:</span>', ">{t('requestTabPanel.name')}</span>"],
  ['>Path:</span>', ">{t('requestTabPanel.path')}</span>"],
  ['>Size:</span>', ">{t('requestTabPanel.size')}</span>"],
  ["<span>The request wasn't loaded due to its large size. Please try again with the following options:</span>", "<span>{t('requestTabPanel.notLoadedHint')}</span>"],
  ['                    Load Request\n', "                    {t('requestTabPanel.loadRequest')}\n"],
  ['<p>(Uses a regex based parsing approach)</p>', "<p>{t('requestTabPanel.loadRequestHint')}</p>"],
  ['<span>Loading...</span>', "<span>{t('requestTabPanel.loading')}</span>"]
], {
  hook: true,
  hookAfter: "const RequestNotLoaded = ({ collection, item }) => {"
});

// 5. RequestIsLoading
patch('components/RequestTabPanel/RequestIsLoading/index.js', [
  ['File Info', "{t('requestTabPanel.fileInfo')}"],
  ['>Name:</span>', ">{t('requestTabPanel.name')}</span>"],
  ['>Path:</span>', ">{t('requestTabPanel.path')}</span>"],
  ['>Size:</span>', ">{t('requestTabPanel.size')}</span>"],
  ['<span>Loading...</span>', "<span>{t('requestTabPanel.loading')}</span>"]
], {
  hook: true,
  hookAfter: "const RequestIsLoading = ({ item }) => {"
});

// 6. CollapsedPanelIndicator
patch('components/RequestTabPanel/CollapsedPanelIndicator/index.js', [
  ["const label = panelType === 'request' ? 'Request' : 'Response';", "const label = panelType === 'request' ? t('requestTabPanel.requestLabel') : t('requestTabPanel.responseLabel');"],
  ['aria-label={`Expand ${label} pane`}', "aria-label={t('requestTabPanel.expandPaneAria', { label })}"],
  ['title={`Click to expand ${label} pane, or drag to resize`}', "title={t('requestTabPanel.expandPaneHint', { label })}"],
  ["}, [isVertical]);", "}, [isVertical, t]);"],
  ["}, [onExpand, dragThresholdSq]);", "}, [onExpand, dragThresholdSq, t]);"]
], {
  hook: true,
  hookAfter: "const dragThresholdSq = dragThresholdPx * dragThresholdPx; // to use in distance check"
});

// 7. BrunoSupport (labels reused from COMMON.*)
patch('components/BrunoSupport/index.js', [
  ['title="Support"', "title={t('support.title')}"],
  ['<span className="label ml-2">Documentation</span>', "<span className=\"label ml-2\">{t('COMMON.DOCUMENTATION')}</span>"],
  ['<span className="label ml-2">Report Issues</span>', "<span className=\"label ml-2\">{t('COMMON.REPORT_ISSUES')}</span>"]
], {
  hook: true,
  hookAfter: "const BrunoSupport = ({ onClose }) => {"
});

// 8. ErrorBoundary (class component -> i18n.t direct)
patch('pages/ErrorBoundary/index.js', [
  ['<h1 className="text-2xl font-medium text-red-600 mb-2">Oops! Something went wrong</h1>', "<h1 className=\"text-2xl font-medium text-red-600 mb-2\">{i18n.t('errorBoundary.title')}</h1>"],
  ["If you are using an official production build: the above error is most likely a bug!", "{i18n.t('errorBoundary.bugLikely')}"],
  ["Please report this under:", "{i18n.t('errorBoundary.reportAt')}"],
  ["                Return to App\n", "                {i18n.t('errorBoundary.returnToApp')}\n"],
  ['<span className="px-3 text-gray-500 text-sm">or</span>', "<span className=\"px-3 text-gray-500 text-sm\">{i18n.t('errorBoundary.or')}</span>"],
  ["                  Clear caches on quit\n", "                  {i18n.t('errorBoundary.clearCachesOnQuit')}\n"],
  ["                  Force Quit\n", "                  {i18n.t('errorBoundary.forceQuit')}\n"],
  ['<h2 className="text-lg font-medium text-red-600 mb-3">Stack Trace</h2>', "<h2 className=\"text-lg font-medium text-red-600 mb-3\">{i18n.t('errorBoundary.stackTrace')}</h2>"],
  ["'No stack trace available'", "i18n.t('errorBoundary.noStackTrace')"]
], { i18nImport: '../../i18n' });

// 9. pages/Main.js
patch('pages/Main.js', [
  ['<strong class="font-bold">ERROR:</strong>', "<strong class=\"font-bold\">{i18n.t('main.errorTitle')}</strong>"],
  ['<span className="block inline ml-1">"ipcRenderer" not found in window object.</span>', "<span className=\"block inline ml-1\">{i18n.t('main.ipcMissing')}</span>"],
  ["You most likely opened Bruno inside your web browser. Bruno only works within Electron, you can start Electron\n          in an adjacent terminal using \"npm run dev:electron\".", "{i18n.t('main.ipcMissingDesc')}"]
], { i18nImport: '../i18n' });

console.log(fail ? 'FAILURES: ' + fail : 'ALL PATCHED');
