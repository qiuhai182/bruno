/* Assemble sidebar.en.json fragment: auto pairs + manual map, classified */
const fs = require('fs');

function flat(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out);
    else out[key] = v;
  }
  return out;
}

const en = flat(JSON.parse(fs.readFileSync('d:/bruno/packages/bruno-app/src/i18n/translation/en.json', 'utf8')));
const wsEn = flat(JSON.parse(fs.readFileSync('d:/bruno/.i18n-work/workspace.en.json', 'utf8')));
const colEn = flat(JSON.parse(fs.readFileSync('d:/bruno/.i18n-work/collection.en.json', 'utf8')));

const pairs = JSON.parse(fs.readFileSync('d:/bruno/.i18n-work/x2-pairs.json', 'utf8'));
const auto = new Map();
for (const p of pairs) auto.set(p.key, p);

/* ---- manual values (override / additions) ---- */
const manual = {
  // conflicts resolution
  'sidebar.validation.locationRequired': 'Location is required',
  'sidebar.validation.min1Char': 'Must be at least 1 character',
  'sidebar.validation.max255': 'Must be 255 characters or less',
  'sidebar.validation.nameRequired': 'Name is required',
  'sidebar.validation.folderNameRequired': 'Folder name is required',
  'sidebar.copiedToClipboard': 'Copied to clipboard!',
  'sidebar.item.cloneError': 'An error occurred while cloning the {{type}}',
  'sidebar.exportToPostman.fileExists': 'Name already exists in this location.',
  // interp fixes
  'sidebar.docs.versionLabel': 'Version: {{version}}',
  // html entity
  'sidebar.goldenEdition.perUser': '/\u00A0user',
  // manual blocks / dynamic / nested
  'sidebar.cloneGit.selectedCount': '{{selected}} of {{total}} selected',
  'sidebar.cloneGit.clone': 'Clone',
  'sidebar.cloneGit.close': 'Close',
  'sidebar.cloneGit.open': 'Open',
  'sidebar.changeVersion.title': 'Change Collection Version',
  'sidebar.changeVersion.notFound': 'Collection not found. It may have been deleted or is no longer available.',
  'sidebar.changeVersion.collectionLabel': 'Collection: ',
  'sidebar.changeVersion.from': 'from ',
  'sidebar.folderName': 'Folder',
  'sidebar.newRequest.fileName': 'File',
  'sidebar.newRequest.onFilesystem': '(on filesystem)',
  'sidebar.deleteItems.and': 'and',
  'sidebar.deleteItems.folderOne': '{{count}} folder',
  'sidebar.deleteItems.folderMany': '{{count}} folders',
  'sidebar.deleteItems.requestOne': '{{count}} request',
  'sidebar.deleteItems.requestMany': '{{count}} requests',
  'sidebar.deleteItems.appOne': '{{count}} app',
  'sidebar.deleteItems.appMany': '{{count}} apps',
  'sidebar.deleteItems.exampleOne': '{{count}} example',
  'sidebar.deleteItems.exampleMany': '{{count}} examples',
  'sidebar.deleteItems.titleItems': 'Delete Items',
  'sidebar.deleteItems.titleFolderOne': 'Delete Folder',
  'sidebar.deleteItems.titleFolderMany': 'Delete Folders',
  'sidebar.deleteItems.titleAppOne': 'Delete App',
  'sidebar.deleteItems.titleAppMany': 'Delete Apps',
  'sidebar.deleteItems.titleExampleOne': 'Delete Example',
  'sidebar.deleteItems.titleExampleMany': 'Delete Examples',
  'sidebar.deleteItems.titleRequestOne': 'Delete Request',
  'sidebar.deleteItems.titleRequestMany': 'Delete Requests',
  'sidebar.generateCode.title': 'Generate Code',
  'sidebar.generateCode.titleWithExample': 'Generate Code - {{name}}',
  'sidebar.generateCode.example': 'Example',
  'sidebar.ignore.prefix': 'Ignoring',
  'sidebar.ignore.hideFrom': 'will hide it from this',
  'sidebar.ignore.collectionByAdding': 'collection by adding it to the',
  'sidebar.ignore.listIn': 'list in',
  'sidebar.ignore.notDeletedRestore': ". The folder and its files are not deleted. To restore it later, remove the entry from the",
  'sidebar.ignore.listInAfter': 'list in',
  'sidebar.ignore.finalPeriod': '.',
  'sidebar.docs.tagPlaceholder': 'e.g., smoke, regression',
  'sidebar.docs.tagsHint': 'Tags are labels on requests (e.g. smoke, WIP). Manage tags in Request ? Settings',
  'sidebar.docs.allRequests': 'All requests',
  'sidebar.docs.filterByTags': 'Filter by Tags',
  'sidebar.docs.folderOne': 'Folder',
  'sidebar.docs.folderMany': 'Folders',
  'sidebar.docs.requestOne': 'request',
  'sidebar.docs.requestMany': 'requests',
  'sidebar.docs.environments': 'Environments',
  'sidebar.docs.featureStandaloneHtml': 'Standalone HTML file - no server required',
  'sidebar.docs.featurePlayground': 'Interactive API playground',
  'sidebar.docs.featureHostAnywhere': 'Host on any static file server',
  'sidebar.docs.notSet': 'Not Set',
  'sidebar.drafts.unsavedChangesPrefix': 'You have unsaved changes in',
  'sidebar.drafts.requestItemOne': 'request.',
  'sidebar.drafts.requestItemMany': 'requests.',
  'sidebar.drafts.savedRequestsOne': 'Saved {{count}} Request',
  'sidebar.drafts.savedRequestsMany': 'Saved {{count}} Requests',
  'sidebar.drafts.additionalOne': '...{{count}} additional request not shown',
  'sidebar.drafts.additionalMany': '...{{count}} additional requests not shown',
  'sidebar.drafts.transientRequestsOne': 'Transient {{count}} Request',
  'sidebar.drafts.transientRequestsMany': 'Transient {{count}} Requests',
  'sidebar.drafts.transientHintMove': 'These requests need to be saved individually before moving the collection.',
  'sidebar.import.loading1': 'Processing collection...',
  'sidebar.import.loading2': 'Analyzing requests...',
  'sidebar.import.loading3': 'Translating scripts...',
  'sidebar.import.loading4': 'Preparing collection...',
  'sidebar.import.loading5': 'Almost done...',
  'sidebar.import.mayTakeMoment': 'This may take a moment depending on the collection size',
  'sidebar.newApp.createsIn': 'Creates a standalone app file in {{target}}.',
  'sidebar.newApp.thisFolder': 'this folder',
  'sidebar.newApp.collectionName': 'collection "{{name}}"',
  'sidebar.postmanReport.and': 'and',
  'sidebar.postmanReport.andMore': 'and {{count}} more',
  'sidebar.postmanReport.installedOne': 'Installed {{count}} package',
  'sidebar.postmanReport.installedMany': 'Installed {{count}} packages',
  'sidebar.postmanReport.installOne': 'Install {{count}} package',
  'sidebar.postmanReport.installMany': 'Install {{count}} packages',
  'sidebar.postmanReport.done': 'Done',
  'sidebar.postmanReport.installingOne': 'Installing {{count}} package…',
  'sidebar.postmanReport.installingMany': 'Installing {{count}} packages…',
  'sidebar.postmanReport.installedIntoOne': 'Installed {{count}} package into this collection.',
  'sidebar.postmanReport.installedIntoMany': 'Installed {{count}} packages into this collection.',
  'sidebar.postmanReport.devModeDescPrefix': 'Your imported scripts call ',
  'sidebar.postmanReport.devModeDescMid': ', which need ',
  'sidebar.postmanReport.devModeDescSuffix': ' to run.',
  'sidebar.postmanReport.developerMode': 'Developer Mode',
  'sidebar.postmanReport.safeMode': 'Safe Mode',
  'sidebar.postmanReport.runsInDevModePrefix': 'This collection runs in ',
  'sidebar.postmanReport.runsInDevModeSuffix': ' - your scripts can use these packages right away.',
  'sidebar.postmanReport.customPackagesPrefix': 'Custom npm packages (such as ',
  'sidebar.postmanReport.customPackagesMid': ' are installed, but this collection is currently running in ',
  'sidebar.postmanReport.customPackagesSuffix': '.',
  'sidebar.openCollection.collectionAdded': 'Collection added to workspace',
  'sidebar.openCollection.collectionsAdded': 'Collections added to workspace',
  'sidebar.openCollection.failedToOpenOne': 'Failed to open {{count}} collection',
  'sidebar.openCollection.failedToOpenMany': 'Failed to open {{count}} collections',
  'sidebar.openCollection.failedToScanOne': 'Failed to scan {{count}} folder',
  'sidebar.openCollection.failedToScanMany': 'Failed to scan {{count}} folders',
  // second pass additions
  'sidebar.docs.collectionNotFound': 'Collection not found. It may have been deleted or is no longer available.',
  'sidebar.dragPreview.items': '{{count}} items',
  'sidebar.dragPreview.and': 'and',
  'sidebar.bulkImport.groupingTags': 'Tags',
  'sidebar.bulkImport.groupingTagsDesc': 'Group requests by OpenAPI/Swagger tags',
  'sidebar.bulkImport.groupingPaths': 'Paths',
  'sidebar.bulkImport.groupingPathsDesc': 'Group requests by URL path structure',
  'sidebar.import.groupingTags': 'Tags',
  'sidebar.import.groupingTagsDesc': 'Group requests by OpenAPI/Swagger tags',
  'sidebar.import.groupingPaths': 'Paths',
  'sidebar.import.groupingPathsDesc': 'Group requests by URL path structure',
  'sidebar.import.nameFallback': 'Collection',
  'sidebar.import.openapiFallback': 'OpenAPI Collection',
  'sidebar.import.postmanFallback': 'Postman Collection',
  'sidebar.import.insomniaFallback': 'Insomnia Collection',
  'sidebar.import.brunoFallback': 'Bruno Collection',
  'sidebar.import.wsdlFallback': 'WSDL Collection',
  'sidebar.import.unknownFormat': 'Unknown collection format',
  'sidebar.import.parseError': 'Failed to parse the file ? ensure it is valid JSON or YAML',
  'sidebar.toast.errorConvertingCollection': 'Failed to convert collection',
  // dragPreview template keys (from t(`sidebar.dragPreview.${key}One|Many`))
  'sidebar.dragPreview.collectionOne': '{{count}} collection',
  'sidebar.dragPreview.collectionMany': '{{count}} collections',
  'sidebar.dragPreview.folderOne': '{{count}} folder',
  'sidebar.dragPreview.folderMany': '{{count}} folders',
  'sidebar.dragPreview.appOne': '{{count}} app',
  'sidebar.dragPreview.appMany': '{{count}} apps',
  'sidebar.dragPreview.requestOne': '{{count}} request',
  'sidebar.dragPreview.requestMany': '{{count}} requests'
};

// build merged candidate: auto first, then manual overrides
const merged = new Map();
for (const [k, p] of auto) merged.set(k, p.value);
for (const [k, v] of Object.entries(manual)) merged.set(k, v);

/* ---- classify ---- */
const fragment = {};
const alreadyEn = [];
const alreadyWs = [];
const alreadyCol = [];
for (const [key, value] of merged) {
  if (Object.prototype.hasOwnProperty.call(en, key)) { alreadyEn.push(key); continue; }
  if (Object.prototype.hasOwnProperty.call(wsEn, key)) { alreadyWs.push(key); continue; }
  if (Object.prototype.hasOwnProperty.call(colEn, key)) { alreadyCol.push(key); continue; }
  fragment[key] = value;
}

/* ---- coverage: all current t() keys in the scanned files ---- */
const cur = JSON.parse(fs.readFileSync('d:/bruno/.i18n-work/x2-current-keys.json', 'utf8'));
const allUsed = cur.keys.map((x) => x.k);
const expandTpl = (k) => {
  if (k === 'sidebar.dragPreview.${key}One') return ['sidebar.dragPreview.collectionOne', 'sidebar.dragPreview.folderOne', 'sidebar.dragPreview.appOne', 'sidebar.dragPreview.requestOne'];
  if (k === 'sidebar.dragPreview.${key}Many') return ['sidebar.dragPreview.collectionMany', 'sidebar.dragPreview.folderMany', 'sidebar.dragPreview.appMany', 'sidebar.dragPreview.requestMany'];
  return [k];
};
const missing = new Set();
for (const k of allUsed) {
  for (const kk of expandTpl(k)) {
    if (Object.prototype.hasOwnProperty.call(en, kk)) continue;
    if (Object.prototype.hasOwnProperty.call(wsEn, kk)) continue;
    if (Object.prototype.hasOwnProperty.call(colEn, kk)) continue;
    if (Object.prototype.hasOwnProperty.call(fragment, kk)) continue;
    missing.add(kk);
  }
}

fs.writeFileSync('d:/bruno/.i18n-work/x2-fragment-en.json', JSON.stringify(fragment, null, 2));
fs.writeFileSync('d:/bruno/.i18n-work/x2-report.json', JSON.stringify({
  autoKeys: auto.size,
  manualKeys: Object.keys(manual).length,
  mergedKeys: merged.size,
  alreadyInEn: alreadyEn,
  alreadyInWorkspace: alreadyWs,
  alreadyInCollection: alreadyCol,
  fragmentCount: Object.keys(fragment).length,
  missingKeys: [...missing].sort()
}, null, 2));

console.log('merged:', merged.size, '| fragment:', Object.keys(fragment).length);
console.log('already in en.json:', alreadyEn.length);
console.log('already in workspace fragment:', alreadyWs.length);
console.log('already in collection fragment:', alreadyCol.length);
console.log('MISSING (used but defined nowhere):', missing.size);
missing.forEach((k) => console.log('  -', k));
