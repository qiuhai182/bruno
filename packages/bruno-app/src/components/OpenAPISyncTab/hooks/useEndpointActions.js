import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const useEndpointActions = (collection, collectionDrift, reloadDrift) => {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] = useState(null);

  // Action execution helper — runs IPC call(s), shows toast, reloads drift
  const executeEndpointAction = async (ipcCalls, successMsg, errorMsg) => {
    try {
      const { ipcRenderer } = window;
      if (Array.isArray(ipcCalls[0])) {
        await Promise.all(ipcCalls.map(([channel, params]) => ipcRenderer.invoke(channel, params)));
      } else {
        const [channel, params] = ipcCalls;
        await ipcRenderer.invoke(channel, params);
      }
      toast.success(successMsg);
      await reloadDrift();
    } catch (err) {
      console.error(`Error: ${errorMsg}`, err);
      toast.error(errorMsg);
    }
  };

  // Confirmation handlers — show modal before executing
  const handleResetEndpoint = (endpoint) => {
    setPendingAction({
      type: 'reset-endpoint',
      title: t('openApiSync.actions.resetEndpoint'),
      message: t('openApiSync.actions.resetEndpointMessage', { method: endpoint.method, path: endpoint.path }),
      endpoint
    });
  };

  const handleResetAllModified = () => {
    if (!collectionDrift?.modified?.length) return;
    setPendingAction({
      type: 'reset-all-modified',
      title: t('openApiSync.actions.resetAllModified'),
      message: t('openApiSync.actions.resetAllMessage', { count: collectionDrift.modified.length })
    });
  };

  const handleDeleteEndpoint = (endpoint) => {
    setPendingAction({
      type: 'delete-endpoint',
      title: t('openApiSync.actions.deleteEndpoint'),
      message: t('openApiSync.actions.deleteEndpointMessage', { method: endpoint.method, path: endpoint.path }),
      endpoint
    });
  };

  const handleDeleteAllLocalOnly = () => {
    if (!collectionDrift?.localOnly?.length) return;
    setPendingAction({
      type: 'delete-all-local',
      title: t('openApiSync.actions.deleteAllLocal'),
      message: t('openApiSync.actions.deleteAllMessage', { count: collectionDrift.localOnly.length })
    });
  };

  const handleRevertAllChanges = () => {
    const modifiedCount = collectionDrift?.modified?.length || 0;
    const missingCount = collectionDrift?.missing?.length || 0;
    const localOnlyCount = collectionDrift?.localOnly?.length || 0;

    setPendingAction({
      type: 'revert-all',
      title: t('openApiSync.actions.revertAll'),
      message: t('openApiSync.actions.revertAllMessage', { modifiedCount, missingCount, localOnlyCount })
    });
  };

  const handleAddMissingEndpoint = (endpoint) => {
    setPendingAction({
      type: 'restore-endpoint',
      title: t('openApiSync.actions.restoreEndpoint'),
      message: t('openApiSync.actions.restoreEndpointMessage', { method: endpoint.method, path: endpoint.path }),
      endpoint
    });
  };

  const handleAddAllMissing = () => {
    if (!collectionDrift?.missing?.length) return;
    setPendingAction({
      type: 'restore-all-missing',
      title: t('openApiSync.actions.restoreAllMissing'),
      message: t('openApiSync.actions.restoreAllMessage', { count: collectionDrift.missing.length })
    });
  };

  // Execute confirmed action
  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    const { type, endpoint } = pendingAction;
    setPendingAction(null);

    switch (type) {
      case 'reset-endpoint':
        return executeEndpointAction(
          ['renderer:reset-endpoints-to-spec', { collectionPath: collection.pathname, endpoints: [endpoint] }],
          t('openApiSync.actions.resetEndpointToast', { method: endpoint.method, path: endpoint.path }),
          t('openApiSync.actions.failedToResetEndpoint')
        );
      case 'reset-all-modified':
        return executeEndpointAction(
          ['renderer:reset-endpoints-to-spec', { collectionPath: collection.pathname, endpoints: collectionDrift.modified }],
          t('openApiSync.actions.resetAllToast', { count: collectionDrift.modified.length }),
          t('openApiSync.actions.failedToResetEndpoints')
        );
      case 'delete-endpoint':
        return executeEndpointAction(
          ['renderer:delete-endpoints', { collectionPath: collection.pathname, collectionUid: collection.uid, endpoints: [endpoint] }],
          t('openApiSync.actions.deletedEndpointToast', { method: endpoint.method, path: endpoint.path }),
          t('openApiSync.actions.failedToDeleteEndpoint')
        );
      case 'delete-all-local':
        return executeEndpointAction(
          ['renderer:delete-endpoints', { collectionPath: collection.pathname, collectionUid: collection.uid, endpoints: collectionDrift.localOnly }],
          t('openApiSync.actions.deletedAllToast', { count: collectionDrift.localOnly.length }),
          t('openApiSync.actions.failedToDeleteEndpoints')
        );
      case 'revert-all': {
        const calls = [];
        if (collectionDrift?.modified?.length > 0) {
          calls.push(['renderer:reset-endpoints-to-spec', { collectionPath: collection.pathname, endpoints: collectionDrift.modified }]);
        }
        if (collectionDrift?.missing?.length > 0) {
          calls.push(['renderer:add-missing-endpoints', { collectionPath: collection.pathname, endpoints: collectionDrift.missing }]);
        }
        if (collectionDrift?.localOnly?.length > 0) {
          calls.push(['renderer:delete-endpoints', { collectionPath: collection.pathname, collectionUid: collection.uid, endpoints: collectionDrift.localOnly }]);
        }
        return executeEndpointAction(calls, t('openApiSync.actions.allChangesDiscarded'), t('openApiSync.actions.failedToDiscard'));
      }
      case 'restore-endpoint':
        return executeEndpointAction(
          ['renderer:add-missing-endpoints', { collectionPath: collection.pathname, endpoints: [endpoint] }],
          t('openApiSync.actions.addedEndpointToast', { method: endpoint.method, path: endpoint.path }),
          t('openApiSync.actions.failedToAddEndpoint')
        );
      case 'restore-all-missing':
        return executeEndpointAction(
          ['renderer:add-missing-endpoints', { collectionPath: collection.pathname, endpoints: collectionDrift.missing }],
          t('openApiSync.actions.addedAllToast', { count: collectionDrift.missing.length }),
          t('openApiSync.actions.failedToAddEndpoints')
        );
    }
  };

  return {
    pendingAction, setPendingAction,
    confirmPendingAction,
    handleResetEndpoint,
    handleResetAllModified,
    handleDeleteEndpoint,
    handleDeleteAllLocalOnly,
    handleRevertAllChanges,
    handleAddMissingEndpoint,
    handleAddAllMissing
  };
};

export default useEndpointActions;
