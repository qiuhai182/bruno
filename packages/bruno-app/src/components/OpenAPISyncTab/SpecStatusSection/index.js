import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  IconCheck,
  IconRefresh,
  IconAlertTriangle,
  IconClock
} from '@tabler/icons';
import Button from 'ui/Button';
import StatusBadge from 'ui/StatusBadge';
import ConfirmSyncModal from '../ConfirmSyncModal';
import SyncReviewPage from '../SyncReviewPage';
import useSyncFlow from '../hooks/useSyncFlow';

const SpecStatusSection = ({
  collection, sourceUrl,
  isLoading, error, setError, fileNotFound,
  specDrift, storedSpec,
  collectionDrift, remoteDrift,
  onCheck, onOpenSettings
}) => {
  const openApiSyncConfig = collection?.brunoConfig?.openapi?.[0];
  const { t } = useTranslation();
  const lastCheckedAt = useSelector((state) => state.openapiSync?.collectionUpdates?.[collection.uid]?.lastChecked);

  const {
    isSyncing, showConfirmModal, confirmGroups,
    handleRestoreSpec, handleApplySync, cancelConfirmModal, handleConfirmModalSync
  } = useSyncFlow({
    collection, specDrift, remoteDrift, collectionDrift,
    setError, checkForUpdates: onCheck
  });

  const lastSyncedAt = openApiSyncConfig?.lastSyncDate;

  const hasRemoteUpdates = remoteDrift && (
    (remoteDrift.missing?.length || 0)
    + (remoteDrift.modified?.length || 0)
    + (remoteDrift.localOnly?.length || 0)
  ) > 0;

  const bannerState = useMemo(() => {
    if (fileNotFound) {
      return { variant: 'danger', message: t('openApiSync.banner.sourceFileNotFound', { url: sourceUrl }), actions: ['open-settings'] };
    }
    if (error || specDrift?.isValid === false) {
      return { variant: 'danger', message: error || specDrift?.error || t('openApiSync.banner.invalidSpec'), actions: ['open-settings'] };
    }
    if (!specDrift) {
      return null;
    }
    if (specDrift.storedSpecMissing && !hasRemoteUpdates) {
      return null;
    }
    const hasEndpointUpdates = specDrift.storedSpecMissing
      ? hasRemoteUpdates
      : (specDrift.added?.length || 0) + (specDrift.modified?.length || 0) + (specDrift.removed?.length || 0) > 0;
    if (hasEndpointUpdates) {
      const versionInfo = (specDrift.storedVersion && specDrift.newVersion && specDrift.storedVersion !== specDrift.newVersion)
        ? ` (v${specDrift.storedVersion} → v${specDrift.newVersion})`
        : '';
      return {
        variant: 'warning', message: t('openApiSync.banner.specUpdated', { versionInfo }), actions: [],
        changes: { added: specDrift.added?.length || 0, modified: specDrift.modified?.length || 0, removed: specDrift.removed?.length || 0 }
      };
    }
    return null;
  }, [fileNotFound, error, sourceUrl, specDrift, lastSyncedAt, storedSpec, lastCheckedAt, hasRemoteUpdates, t]);
  return (
    <>
      {bannerState && (
        <div className="spec-status-section">

          <div className={`spec-update-banner ${bannerState.variant}`}>
            <div className="banner-left">
              {bannerState.variant === 'success'
                ? <IconCheck size={16} className="status-check-icon" />
                : <div className={`status-dot ${bannerState.variant}`} />}
              <span className="banner-title">
                {bannerState.message}
                {bannerState.version && (
                  <> &middot; <code style={{ fontStyle: 'normal' }} className="checked-text">v{bannerState.version}</code></>
                )}
                {bannerState.lastChecked && (
                  <span className="checked-text"> &middot; {t('openApiSync.banner.checkedAt', { time: bannerState.lastChecked })}</span>
                )}
              </span>
              {bannerState.changes && (
                <span className="banner-details">
                  {bannerState.changes.modified > 0 && <StatusBadge key="modified" status="warning" radius="full">{t('openApiSync.banner.endpointsUpdated', { count: bannerState.changes.modified, s: bannerState.changes.modified > 1 ? 's' : '' })}</StatusBadge>}
                  {bannerState.changes.added > 0 && <StatusBadge key="added" status="success" radius="full">{t('openApiSync.banner.endpointsAdded', { count: bannerState.changes.added, s: bannerState.changes.added > 1 ? 's' : '' })}</StatusBadge>}
                  {bannerState.changes.removed > 0 && <StatusBadge key="removed" status="danger" radius="full">{t('openApiSync.banner.endpointsRemoved', { count: bannerState.changes.removed, s: bannerState.changes.removed > 1 ? 's' : '' })}</StatusBadge>}
                </span>
              )}
            </div>
            <div className="banner-actions">
              {bannerState.actions.includes('open-settings') && (
                <Button variant="ghost" size="sm" onClick={onOpenSettings}>
                  {t('openApiSync.banner.updateConnectionSettings')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {(error || fileNotFound || specDrift?.isValid === false) ? (
        <div className="sync-review-empty-state mt-5">
          <IconAlertTriangle size={40} className="empty-state-icon" />
          <h4>{t('openApiSync.unableToCheck')}</h4>
          <p>{t('openApiSync.fixConnection')}</p>
        </div>
      ) : specDrift?.storedSpecMissing && openApiSyncConfig?.lastSyncDate && !hasRemoteUpdates ? (
        <div className="sync-review-empty-state mt-5">
          <IconCheck size={40} className="empty-state-icon" />
          <h4>{t('openApiSync.noUpdates')}</h4>
          <p>{t('openApiSync.noUpdatesRestoreDesc')}</p>
          <Button className="mt-4" color="warning" onClick={handleRestoreSpec} loading={isSyncing}>
            {t('openApiSync.review.restoreSpecFile')}
          </Button>
        </div>
      ) : (
        <div className="mt-5">
          <SyncReviewPage
            specDrift={specDrift}
            remoteDrift={remoteDrift}
            collectionDrift={collectionDrift}
            collectionPath={collection.pathname}
            collectionUid={collection.uid}
            newSpec={specDrift?.newSpec}
            isSyncing={isSyncing}
            isLoading={isLoading}
            onApplySync={handleApplySync}
          />
        </div>
      )}

      {showConfirmModal && (
        <ConfirmSyncModal
          groups={confirmGroups}
          isSyncing={isSyncing}
          onCancel={cancelConfirmModal}
          onSync={handleConfirmModalSync}
        />
      )}
    </>
  );
};

export default SpecStatusSection;
