const fs = require('fs');
const path = require('path');
const keys = `collection.auth.oauth2.tbd
collection.common.removeFile
collection.overview.change
collection.presets.defaultBaseUrl
collection.presets.defaultEnvironment
collection.presets.defaultRequestType
collection.presets.defaultRequestTypeSubtitle
collection.proxy.disabled
collection.proxy.enabled
collection.proxy.inherit
devtools.performance.currentCpu
devtools.performance.currentMemory
devtools.performance.processPid
devtools.requestDetails.noHeaders
devtools.requestDetails.noNetworkLogs
devtools.requestDetails.noResponseData
devtools.terminal.loadingSessions
devtools.terminal.noActiveSessions
environments.inheritance.circular
environments.validation.alreadyExists
environments.validation.globalAlreadyExists
notifications.menuAriaLabel
preferences.ai.autocomplete.triggerAria
requestPane.errorOccurred
requestPane.grpc.errorOccurred
requestPane.grpc.noAuth
requestPane.ws.errorOccurred
requestPane.ws.noAuth
requestPane.queryBuilder.failedToLoadSchema
requestPane.queryBuilder.noSchemaLoaded
requestPane.queryBuilder.somethingWentWrong
sidebar.bulkImport.groupingTags
sidebar.changeVersion.collectionLabel
sidebar.changeVersion.title
sidebar.docs.allRequests
sidebar.docs.notSet
sidebar.docs.title
sidebar.exportToPostman.fileExists
sidebar.fileFormat.bruDesc
sidebar.fileFormat.bruTitle
sidebar.goldenEdition.supportBruno
sidebar.import.groupingTags
sidebar.import.loading2
sidebar.moveToWorkspace.description
sidebar.newRequest.fileNameHelp1
sidebar.postmanReport.customPackagesMid
sidebar.postmanReport.customPackagesSuffix
sidebar.postmanReport.safeMode`.split('\n').map((s) => s.trim()).filter(Boolean);

const SRC = path.join(__dirname, '..', 'packages', 'bruno-app', 'src');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|tsx)$/.test(e.name)) files.push(p);
  }
})(SRC);
const map = {};
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  for (const k of keys) {
    if (s.includes("t('" + k + "'")) (map[k] = map[k] || []).push(f);
  }
}
const out = [];
for (const k of keys) {
  const fl = map[k] || [];
  if (!fl.length) { out.push('===== ' + k + ' NOT-FOUND'); continue; }
  const f = fl[0];
  const s = fs.readFileSync(f, 'utf8');
  const i = s.indexOf("t('" + k + "'");
  const upto = s.slice(0, i).split('\n').length - 1;
  out.push('===== ' + k + '  (' + path.relative(SRC, f) + ')');
  out.push(s.split('\n').slice(Math.max(0, upto - 5), upto + 3).join('\n'));
}
fs.writeFileSync(path.join(__dirname, 'codey-contexts.txt'), out.join('\n\n'), 'utf8');
console.log('done', keys.length, 'found', Object.keys(map).length);
