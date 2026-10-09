const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'packages', 'bruno-app', 'src', 'providers', 'ReduxStore', 'slices');

function patchFile(rel, replacements, addI18nImport) {
  const p = path.join(BASE, rel);
  let s = fs.readFileSync(p, 'utf8');
  let count = 0;
  for (const [from, to] of replacements) {
    if (!s.includes(from)) { console.log('  !! NOT FOUND in ' + rel + ': ' + from.slice(0, 70)); continue; }
    s = s.split(from).join(to);
    count++;
  }
  if (addI18nImport && !/from ['"].*i18n['"]/.test(s)) {
    // insert after last import line
    const lines = s.split('\n');
    let last = -1;
    for (let i = 0; i < lines.length; i++) { if (/^import /.test(lines[i])) last = i; }
    const depth = rel.split('/').length - 1; // slices/collections/actions.js -> 2 dirs above slices? compute: file in slices/collections -> need up to src: collections(1) slices(2) ReduxStore(3) providers(4)
    const up = rel.split('/').slice(0, -1).length; // number of dir segments
    const prefix = '../'.repeat(up + 1);
    lines.splice(last + 1, 0, "import i18n from '" + prefix + "i18n';");
    s = lines.join('\n');
  }
  fs.writeFileSync(p, s, 'utf8');
  console.log(rel + ': ' + count + ' replacements');
}

// ---------- collections/actions.js ----------
patchFile('collections/actions.js', [
  ["toast.success('Request saved successfully')", "toast.success(i18n.t('toast.requestSaved'))"],
  ["toast.success('File saved successfully!')", "toast.success(i18n.t('toast.fileSaved'))"],
  ["toast.error('Failed to save file!')", "toast.error(i18n.t('toast.fileSaveFailed'))"],
  ["toast.error('Failed to save requests!')", "toast.error(i18n.t('toast.requestsSaveFailed'))"],
  ["toast.success('Collection Settings saved successfully')", "toast.success(i18n.t('toast.collectionSettingsSaved'))"],
  ["toast.error('Failed to save collection settings!')", "toast.error(i18n.t('toast.collectionSettingsSaveFailed'))"],
  ["toast.success('Collection version updated')", "toast.success(i18n.t('toast.collectionVersionUpdated'))"],
  ["toast.error('Failed to update collection version')", "toast.error(i18n.t('toast.collectionVersionUpdateFailed'))"],
  ["toast.success('Folder Settings saved successfully')", "toast.success(i18n.t('toast.folderSettingsSaved'))"],
  ["toast.error('Failed to save folder settings!')", "toast.error(i18n.t('toast.folderSettingsSaveFailed'))"],
  ["toast.success('Request made successfully')", "toast.success(i18n.t('toast.requestSent'))"],
  ["toast.error('Failed to create a new folder!')", "toast.error(i18n.t('toast.newFolderCreateFailed'))"],
  ["toast.error('Failed to rename the item name')", "toast.error(i18n.t('toast.itemRenameFailed'))"],
  ["toast.success('Item renamed successfully')", "toast.success(i18n.t('toast.itemRenamed'))"],
  ["toast.error('Moving folders between collections with different formats is not supported')", "toast.error(i18n.t('toast.crossFormatMoveUnsupported'))"],
  ["toast.success(`Variable \"${variableName}\" ${variable ? 'updated' : 'created'}`)", "toast.success(variable ? i18n.t('toast.variableUpdated', { variableName }) : i18n.t('toast.variableCreated', { variableName }))"],
  ["toast.error(`Failed to update variable: ${error.message}`)", "toast.error(i18n.t('toast.variableUpdateFailed', { error: error.message }))"],
  ["toast.success('Collection is already opened')", "toast.success(i18n.t('toast.collectionAlreadyOpened'))"],
  ["toast.success('Collection added to workspace')", "toast.success(i18n.t('toast.collectionAddedToWorkspace'))"],
  ["toast.error('Failed to add collection to workspace')", "toast.error(i18n.t('toast.collectionAddToWorkspaceFailed'))"],
  ["toast.success('Collection migrated to YML format successfully')", "toast.success(i18n.t('toast.collectionMigratedToYml'))"],
  ["toast.error(`Migration failed: ${err?.message || 'Unknown error'}`)", "toast.error(i18n.t('toast.migrationFailed', { error: err?.message || i18n.t('toast.unknownError') }))"],
  ["toast.error('Collection could not be reopened automatically. Please reopen it manually.')", "toast.error(i18n.t('toast.collectionReopenManually'))"]
], true);

// ---------- apiSpec.js ----------
patchFile('apiSpec.js', [
  ["toast.error('Error adding API spec')", "toast.error(i18n.t('apiSpec.toast.addFailed'))"],
  ["toast.success('Saved API spec successfully!')", "toast.success(i18n.t('apiSpec.toast.saved'))"],
  ["toast.error('Error saving file')", "toast.error(i18n.t('apiSpec.toast.fileSaveFailed'))"]
], true);

// ---------- notifications.js ----------
patchFile('notifications.js', [
  ["toast.error('An error occurred while fetching read notifications')", "toast.error(i18n.t('notifications.toast.fetchReadFailed'))"],
  ["toast.error('An error occurred while setting read notifications')", "toast.error(i18n.t('notifications.toast.setReadFailed'))"]
], true);

console.log('slice wiring done');
