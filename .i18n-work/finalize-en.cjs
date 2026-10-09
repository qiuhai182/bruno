const fs = require('fs');
const path = require('path');

const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'final-key-en.json'), 'utf8'));
const manual = {
  'app.deprecation.deprecatedSuffix': '. They are deprecated and will no longer be supported. Learn more in',
  'app.deprecation.removedIn': '{{feature}} will be removed in',
  'collection.auth.descriptionPrefix': 'Configures authentication for the entire collection. This applies to all requests using the',
  'collection.example.nameLabel': 'Example Name',
  'collection.folder.auth.descriptionPrefix': 'Configures authentication for the entire folder. This applies to all requests using the',
  'collection.overview.collectionEnvironments': '{{count}} collection environment{{s}}',
  'collection.overview.globalEnvironments': '{{count}} global environment{{s}}',
  'collection.share.descriptionPrefix': 'Bruno uses',
  'collection.share.descriptionSuffix': '- An open format for API collections',
  'collection.share.nonExportableNote': 'Note: {{types}} requests in this collection will not be exported',
  'collection.share.title': 'Share Collection',
  'cookies.clearDomainCookiesConfirm': 'Are you sure you want to clear all cookies for the domain {{domain}}?',
  'cookies.deleteCookieConfirm': 'Are you sure you want to delete the cookie {{cookieName}}?',
  'cookies.fieldDomain': 'Domain',
  'cookies.fieldKey': 'Key',
  'cookies.fieldValue': 'Value',
  'devtools.debug.colTime': 'Time',
  'devtools.performance.na': 'N/A',
  'devtools.requestDetails.na': 'N/A',
  'environments.copy.title': 'Copy Environment',
  'environments.export.exportOne': 'Export {{num}} Environment',
  'environments.export.inherits': 'inherits',
  'environments.unsaved.dontSave': "Don't Save",
  'preferences.ai.autocomplete.modelAuto': 'Autocomplete model',
  'requestPane.grpc.selectMethod': 'Select Method',
  'requestPane.oauth1.uploadFile': 'Upload File',
  'requestPane.oauth2.autoRefreshToken': 'Auto refresh token',
  'sidebar.changeVersion.versionPlaceholder': 'e.g. v1.0.0',
  'sidebar.ignore.finalPeriod': '.',
  'sidebar.postmanReport.devModeDescMid': 'which need Developer Mode to run.',
  'sidebar.postmanReport.devModeDescSuffix': 'Only enable Developer Mode for collections you trust.',
  'sidebar.postmanReport.installedIntoMany': 'Installed {{count}} packages into this collection.',
  'sidebar.postmanReport.installingMany': 'Installing {{count}} packages',
  'sidebar.postmanReport.installingOne': 'Installing {{count}} package',
  'sidebar.runCollection.delayPlaceholder': 'e.g. 5'
};
const merged = { ...base, ...manual };
fs.writeFileSync(path.join(__dirname, 'final-key-en.json'), JSON.stringify(Object.fromEntries(Object.entries(merged).sort()), null, 2), 'utf8');

// group by top prefix for batch translation
const groups = {};
for (const [k, v] of Object.entries(merged)) {
  const g = k.split('.')[0];
  (groups[g] = groups[g] || {})[k] = v;
}
for (const [g, obj] of Object.entries(groups)) {
  fs.writeFileSync(path.join(__dirname, 'en-group-' + g + '.json'), JSON.stringify(Object.fromEntries(Object.entries(obj).sort()), null, 2), 'utf8');
}
console.log('total EN keys:', Object.keys(merged).length);
console.log('groups:', Object.entries(groups).map(([g, o]) => g + '=' + Object.keys(o).length).join(', '));
