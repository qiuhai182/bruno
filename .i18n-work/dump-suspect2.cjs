const fs = require('fs');
const path = require('path');
const keys = `app.importIssues.itemsSkipped
app.importIssues.warningsCount
app.titleBar.switchedToWorkspace
app.titleBar.workspacesLabel
app.skippedPaths.warning
collection.auth.descriptionMiddle
collection.auth.descriptionSuffix
collection.auth.inherit
collection.auth.authTab
collection.example.queryParams
collection.migration.migrateToYml
collection.overview.documentation
collection.overview.requests
collection.overview.requestsInCollection
collection.overview.requestsNotLoaded.title
collection.protobuf.noImportPaths
collection.share.otherFormat
collection.share.brunoFormat
cookies.colActions
cookies.colExpires
cookies.colName
cookies.colPath
cookies.colValue
cookies.clearDomainCookiesTitle
cookies.deleteCookieTitle
cookies.setCookieString
cookies.title
cookies.secure
cookies.noSearchResults
cookies.tryDifferentSearch
devtools.requestDetails.requestMethod
environments.delete.confirmPrefix
environments.delete.confirmSuffix
environments.dotEnv.confirmSuffix
environments.export.exportedToFolder
environments.import.found
environments.import.import
environments.selector.noEnvironmentsActive
environments.inheritedFrom
environments.toast.inheritingFrom
environments.unsaved.holdOn
preferences.ai.autocomplete.keymapLabel
preferences.ai.autocomplete.modelLabel
preferences.ai.card.modelsCount
preferences.ai.card.keySaved
preferences.ai.defaultEndpointName
preferences.ai.endpoint.fallbackName
preferences.ai.security.removeNamed
requestPane.auth.authTab
requestPane.auth.descriptionMiddle
requestPane.auth.descriptionSuffix
requestPane.auth.inherit
requestPane.oauth1.addParamsTo
requestPane.oauth1.privateKey
requestPane.oauth1.signatureMethod
requestPane.oauth1.tokenSecret
requestPane.oauth1.callbackUrl
requestPane.oauth2.addCredentialsTo
requestPane.oauth2.addTokenTo
requestPane.oauth2.addParameter
requestPane.oauth2.autoFetchToken
requestPane.oauth2.autoFetchTokenShort
requestPane.oauth2.callbackUrl
requestPane.oauth2.decodedPayload
requestPane.oauth2.expiresIn
requestPane.oauth2.headerPrefix
requestPane.oauth2.noTokenFound
requestPane.oauth2.queryParamKey
requestPane.oauth2.scopeLabel
requestPane.oauth2.tokenFetchError
requestPane.oauth2.tokenId
requestPane.oauth2.tokenSource
requestPane.oauth2.tokenType
requestPane.oauth2.urlQueryKey
requestPane.oauth2.usePKCE
requestPane.ws.keepAliveInterval
requestPane.ws.keepAliveZero
requestPane.ws.timeout
requestPane.ws.defaultMessageName
requestPane.graphql.schemaLoadError
requestPane.graphql.schemaValidationIssues
requestPane.grpc.defaultMessageName
requestPane.grpc.loadedMethodsProtoFile
requestPane.grpc.loadedMethodsReflection
requestPane.grpc.saveShortcut
requestPane.grpc.addProtoFileFailed
requestPane.grpc.browseProtoFileFailed
sidebar.apiSpecs.close.confirmPrefix
sidebar.changeVersion.notSet
sidebar.changeVersion.updates
sidebar.changeVersion.into
sidebar.changeVersion.from
sidebar.deleteItems.and
sidebar.deleteItems.appMany
sidebar.deleteItems.confirmExamplePrefix
sidebar.deleteItems.exampleMany
sidebar.deleteItems.folderMany
sidebar.deleteItems.requestMany
sidebar.deleteItems.titleAppMany
sidebar.deleteItems.titleExampleMany
sidebar.deleteItems.titleFolderMany
sidebar.deleteItems.titleRequestMany
sidebar.docs.featurePlaybook
sidebar.docs.filterByTags
sidebar.docs.removeTag
sidebar.docs.selectAll
sidebar.docs.tagExists
sidebar.docs.versionLabel
sidebar.drafts.requestItemOne
sidebar.drafts.unsavedChangesPrefix
sidebar.dragPreview.items
sidebar.gitRemote.clickToClone
sidebar.goldenEdition.organizations
sidebar.goldenEdition.perUser
sidebar.ignore.hideFrom
sidebar.ignore.prefix
sidebar.ignore.finalPeriod
sidebar.import.checkForSpecUpdates
sidebar.newApp.collectionName
sidebar.newApp.thisFolder
sidebar.openCollection.noneFoundSkipped
sidebar.postmanReport.andMore
sidebar.postmanReport.devModeTitle
sidebar.postmanReport.externalModulesTitle
sidebar.postmanReport.installFailedExitCode
sidebar.postmanReport.installMany
sidebar.postmanReport.installOne
sidebar.postmanReport.installedMany
sidebar.postmanReport.installedOne
sidebar.postmanReport.installedIntoMany
sidebar.postmanReport.installedIntoOne
sidebar.postmanReport.notSupportedTitle
sidebar.postmanReport.packagesUsedInScripts
sidebar.runCollection.alreadyRunning
sidebar.runCollection.folderOnly
sidebar.runCollection.recursiveDesc
sidebar.runCollection.recursiveRun
sidebar.runCollection.requestCount
sidebar.runCollection.stillLoading
sidebar.runCollection.title
workspace.badge.notCloned
workspace.git.removeNoteMid
workspace.git.removeNotePrefix
workspace.git.removeNoteSuffix
workspace.git.urlNotePrefix
workspace.import.fileLabel
workspace.remove.confirmPrefix
workspace.remove.confirmSuffix
workspace.toast.couldNotOpen
workspace.toast.needsClone
workspace.toast.notOnDisk
workspace.toast.switchedTo
welcome.goToStep`
  .split('\n').map((s) => s.trim()).filter(Boolean);

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
    const needle = "t('" + k + "'";
    if (s.includes(needle)) (map[k] = map[k] || []).push(f);
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
  const lines = s.split('\n');
  out.push('===== ' + k + '  (' + path.relative(SRC, f) + ')');
  out.push(lines.slice(Math.max(0, upto - 4), upto + 3).join('\n'));
}
fs.writeFileSync(path.join(__dirname, 'suspect2-contexts.txt'), out.join('\n\n'), 'utf8');
console.log('done', keys.length);
