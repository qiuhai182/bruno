const fs = require('fs');

const B = 'packages/bruno-app/src/components/OpenAPISyncTab/';

const jobs = [
  [B + 'EndpointChangeSection/ExpandableEndpointRow.js', [
    ["import MethodBadge from 'ui/MethodBadge';", "import { useTranslation } from 'react-i18next';\nimport MethodBadge from 'ui/MethodBadge';", 1],
    ['  const dispatch = useDispatch();\n  const rowKey = endpoint.id', "  const dispatch = useDispatch();\n  const { t } = useTranslation();\n  const rowKey = endpoint.id", 1],
    ["setError(formatIpcError(err) || 'Failed to load diff data');", "setError(formatIpcError(err) || t('openApiSync.endpoint.failedToLoadDiff'));", 1],
    ['                This endpoint was modified in both the spec and your collection. Choose which version to keep.\n', "                {t('openApiSync.endpoint.conflictHelp')}\n", 1],
    ['          >\n            Conflict\n          </StatusBadge>', "          >\n            {t('openApiSync.endpoint.conflict')}\n          </StatusBadge>", 1],
    ['title="Keep your local version"', "title={t('openApiSync.endpoint.keepLocalTitle')}", 1],
    ["{decisionLabels?.keep || 'Keep Mine'}", "{decisionLabels?.keep || t('openApiSync.endpoint.keepMine')}", 1],
    ['title="Accept the spec version"', "title={t('openApiSync.endpoint.acceptSpecTitle')}", 1],
    ["{decisionLabels?.accept || 'Accept Spec'}", "{decisionLabels?.accept || t('openApiSync.endpoint.acceptSpec')}", 1],
    ['<span>Loading diff...</span>', "<span>{t('openApiSync.specDiff.loadingDiff')}</span>", 1],
    ['            <div className="diff-error">\n              Error: {error}\n            </div>', '            <div className="diff-error">\n              {t(\'openApiSync.endpoint.errorWithMessage\', { message: error })}\n            </div>', 1],
    ["leftLabel={diffLeftLabel || 'Current (in collection)'}", "leftLabel={diffLeftLabel || t('openApiSync.diff.currentInCollection')}", 1],
    ["rightLabel={diffRightLabel || 'Expected (from spec)'}", "rightLabel={diffRightLabel || t('openApiSync.diff.expectedFromSpec')}", 1]
  ]],
  [B + 'hooks/useEndpointActions.js', [
    ["import toast from 'react-hot-toast';", "import { useTranslation } from 'react-i18next';\nimport toast from 'react-hot-toast';", 1],
    ['const useEndpointActions = (collection, collectionDrift, reloadDrift) => {\n  const [pendingAction, setPendingAction] = useState(null);', "const useEndpointActions = (collection, collectionDrift, reloadDrift) => {\n  const { t } = useTranslation();\n  const [pendingAction, setPendingAction] = useState(null);", 1],
    ["      title: 'Reset Endpoint',", "      title: t('openApiSync.actions.resetEndpoint'),", 1],
    ['      message: `Are you sure you want to reset "${endpoint.method} ${endpoint.path}" to match the spec? Your local changes will be lost.`,', "      message: t('openApiSync.actions.resetEndpointMessage', { method: endpoint.method, path: endpoint.path }),", 1],
    ["      title: 'Reset All Modified',", "      title: t('openApiSync.actions.resetAllModified'),", 1],
    ['      message: `Are you sure you want to reset ${collectionDrift.modified.length} modified endpoint(s) to match the spec? Your local changes will be lost.`', "      message: t('openApiSync.actions.resetAllMessage', { count: collectionDrift.modified.length })", 1],
    ["      title: 'Delete Endpoint',", "      title: t('openApiSync.actions.deleteEndpoint'),", 1],
    ['      message: `Are you sure you want to delete "${endpoint.method} ${endpoint.path}"? This action cannot be undone.`,', "      message: t('openApiSync.actions.deleteEndpointMessage', { method: endpoint.method, path: endpoint.path }),", 1],
    ["      title: 'Delete All Local Endpoints',", "      title: t('openApiSync.actions.deleteAllLocal'),", 1],
    ['      message: `Are you sure you want to delete ${collectionDrift.localOnly.length} local-only endpoint(s)? This action cannot be undone.`', "      message: t('openApiSync.actions.deleteAllMessage', { count: collectionDrift.localOnly.length })", 1],
    ["      title: 'Revert All Changes',", "      title: t('openApiSync.actions.revertAll'),", 1],
    ['      message: `Are you sure you want to revert all changes? This will reset ${modifiedCount} modified, restore ${missingCount} missing, and delete ${localOnlyCount} local-only endpoint(s).`', "      message: t('openApiSync.actions.revertAllMessage', { modifiedCount, missingCount, localOnlyCount })", 1],
    ["      title: 'Restore Endpoint',", "      title: t('openApiSync.actions.restoreEndpoint'),", 1],
    ['      message: `Are you sure you want to restore "${endpoint.method} ${endpoint.path}" to your collection?`,', "      message: t('openApiSync.actions.restoreEndpointMessage', { method: endpoint.method, path: endpoint.path }),", 1],
    ["      title: 'Restore All Missing',", "      title: t('openApiSync.actions.restoreAllMissing'),", 1],
    ['      message: `Are you sure you want to restore ${collectionDrift.missing.length} missing endpoint(s) to your collection?`', "      message: t('openApiSync.actions.restoreAllMessage', { count: collectionDrift.missing.length })", 1],
    ['          `Reset ${endpoint.method} ${endpoint.path} to spec`,', "          t('openApiSync.actions.resetEndpointToast', { method: endpoint.method, path: endpoint.path }),", 1],
    ["          'Failed to reset endpoint'", "          t('openApiSync.actions.failedToResetEndpoint')", 1],
    ['          `Reset ${collectionDrift.modified.length} endpoints to spec`,', "          t('openApiSync.actions.resetAllToast', { count: collectionDrift.modified.length }),", 1],
    ["          'Failed to reset endpoints'", "          t('openApiSync.actions.failedToResetEndpoints')", 1],
    ['          `Deleted ${endpoint.method} ${endpoint.path}`,', "          t('openApiSync.actions.deletedEndpointToast', { method: endpoint.method, path: endpoint.path }),", 1],
    ["          'Failed to delete endpoint'", "          t('openApiSync.actions.failedToDeleteEndpoint')", 1],
    ['          `Deleted ${collectionDrift.localOnly.length} local-only endpoints`,', "          t('openApiSync.actions.deletedAllToast', { count: collectionDrift.localOnly.length }),", 1],
    ["          'Failed to delete endpoints'", "          t('openApiSync.actions.failedToDeleteEndpoints')", 1],
    ["          'All changes discarded successfully', 'Failed to discard changes'", "          t('openApiSync.actions.allChangesDiscarded'), t('openApiSync.actions.failedToDiscard')", 1],
    ['          `Added ${endpoint.method} ${endpoint.path} to collection`,', "          t('openApiSync.actions.addedEndpointToast', { method: endpoint.method, path: endpoint.path }),", 1],
    ["          'Failed to add endpoint'", "          t('openApiSync.actions.failedToAddEndpoint')", 1],
    ['          `Added ${collectionDrift.missing.length} endpoints to collection`,', "          t('openApiSync.actions.addedAllToast', { count: collectionDrift.missing.length }),", 1],
    ["          'Failed to add endpoints'", "          t('openApiSync.actions.failedToAddEndpoints')", 1]
  ]],
  [B + 'hooks/useOpenAPISync.js', [
    ["import toast from 'react-hot-toast';", "import { useTranslation } from 'react-i18next';\nimport toast from 'react-hot-toast';", 1],
    ['const useOpenAPISync = (collection) => {\n  const dispatch = useDispatch();', "const useOpenAPISync = (collection) => {\n  const dispatch = useDispatch();\n  const { t } = useTranslation();", 1],
    ["setError('Please enter a URL or select a file');", "setError(t('openApiSync.errors.pleaseEnterUrl'));", 2],
    ["setError('The URL does not point to a valid OpenAPI 3.x specification');", "setError(t('openApiSync.errors.invalidOpenApiUrl'));", 2],
    ["toast.error('The URL does not point to a valid OpenAPI 3.x specification');", "toast.error(t('openApiSync.errors.invalidOpenApiUrl'));", 2],
    ["formatIpcError(err) || 'Failed to check for updates'", "formatIpcError(err) || t('openApiSync.errors.failedToCheckUpdates')", 2],
    ["toast.success('OpenAPI sync connected');", "toast.success(t('openApiSync.toast.connected'));", 1],
    ["setError(formatIpcError(err) || 'Failed to connect');", "setError(formatIpcError(err) || t('openApiSync.errors.failedToConnect'));", 1],
    ["toast.success('OpenAPI sync disconnected');", "toast.success(t('openApiSync.toast.disconnected'));", 1],
    ["toast.error('Failed to disconnect sync');", "toast.error(t('openApiSync.errors.failedToDisconnect'));", 1],
    ["toast.success('Settings saved');", "toast.success(t('openApiSync.toast.settingsSaved'));", 1],
    ["toast.error('Failed to save settings');", "toast.error(t('openApiSync.errors.failedToSaveSettings'));", 1]
  ]],
  [B + 'hooks/useSyncFlow.js', [
    ["import toast from 'react-hot-toast';", "import { useTranslation } from 'react-i18next';\nimport toast from 'react-hot-toast';", 1],
    ['  const dispatch = useDispatch();\n\n  const [pendingSyncMode', "  const dispatch = useDispatch();\n  const { t } = useTranslation();\n\n  const [pendingSyncMode", 1],
    ["        mode === 'spec-only' ? 'Spec updated successfully'\n          : mode === 'reset' ? 'Collection reset to spec successfully'\n            : 'Collection synced successfully'", "        mode === 'spec-only' ? t('openApiSync.toast.specUpdated')\n          : mode === 'reset' ? t('openApiSync.toast.resetToSpec')\n            : t('openApiSync.toast.synced')", 1],
    ["setError(formatIpcError(err) || 'Failed to sync collection');", "setError(formatIpcError(err) || t('openApiSync.errors.failedToSync'));", 1],
    ["groups.push({ label: 'New endpoints to add', type: 'add', endpoints: actuallyAdded });", "groups.push({ label: t('openApiSync.groups.newEndpointsToAdd'), type: 'add', endpoints: actuallyAdded });", 1],
    ["groups.push({ label: 'Endpoints to update', type: 'update', endpoints: remoteDrift.modified });", "groups.push({ label: t('openApiSync.groups.endpointsToUpdate'), type: 'update', endpoints: remoteDrift.modified });", 1],
    ["groups.push({ label: 'Endpoints to delete', type: 'remove', endpoints: actuallyRemoved });", "groups.push({ label: t('openApiSync.groups.endpointsToDelete'), type: 'remove', endpoints: actuallyRemoved });", 1]
  ]]
];

let failed = 0;
for (const [file, reps] of jobs) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [oldStr, newStr, expect] of reps) {
    const count = text.split(oldStr).length - 1;
    if (count !== expect) {
      console.log(`MISMATCH ${file}: found ${count}x expected ${expect}: ${JSON.stringify(oldStr.slice(0, 70))}`);
      failed++;
      continue;
    }
    text = text.split(oldStr).join(newStr);
  }
  fs.writeFileSync(file, text, 'utf8');
}
console.log(failed === 0 ? 'all conversions applied' : `${failed} mismatches`);
