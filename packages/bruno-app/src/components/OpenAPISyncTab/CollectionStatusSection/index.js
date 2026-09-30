import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconCheck,
  IconPlus,
  IconTrash,
  IconArrowBackUp,
  IconExternalLink,
  IconAlertTriangle,
  IconInfoCircle,
  IconLoader2
} from '@tabler/icons';
import moment from 'moment';
import Button from 'ui/Button';
import StatusBadge from 'ui/StatusBadge';
import Modal from 'components/Modal';
import EndpointChangeSection from '../EndpointChangeSection';
import ExpandableEndpointRow from '../EndpointChangeSection/ExpandableEndpointRow';
import useEndpointActions from '../hooks/useEndpointActions';

const CollectionStatusSection = ({
  collection,
  collectionDrift,
  reloadDrift,
  specDrift,
  storedSpec,
  lastSyncDate,
  onOpenEndpoint,
  isLoading,
  onTabSelect
}) => {
  const { t } = useTranslation();
  const {
    pendingAction, setPendingAction,
    confirmPendingAction,
    handleResetEndpoint,
    handleResetAllModified,
    handleDeleteEndpoint,
    handleDeleteAllLocalOnly,
    handleRevertAllChanges,
    handleAddMissingEndpoint,
    handleAddAllMissing
  } = useEndpointActions(collection, collectionDrift, reloadDrift);

  const spec = storedSpec || specDrift?.newSpec;
  const hasStoredSpec = collectionDrift && !collectionDrift.noStoredSpec;
  const hasDrift = hasStoredSpec && (collectionDrift.modified?.length > 0
    || collectionDrift.missing?.length > 0
    || collectionDrift.localOnly?.length > 0);

  const renderDriftRow = (endpoint, idx, actions) => (
    <ExpandableEndpointRow
      key={endpoint.id}
      endpoint={endpoint}
      collectionPath={collection.pathname}
      newSpec={spec}
      showDecisions={false}
      diffLeftLabel={t('openApiSync.diff.lastSyncedSpec')}
      diffRightLabel={t('openApiSync.diff.currentInCollection')}
      swapDiffSides
      collectionUid={collection.uid}
      actions={actions}
    />
  );

  const modifiedCount = collectionDrift?.modified?.length || 0;
  const missingCount = collectionDrift?.missing?.length || 0;
  const localOnlyCount = collectionDrift?.localOnly?.length || 0;
  const version = specDrift?.storedVersion || storedSpec?.info?.version;

  const bannerState = useMemo(() => {
    if (hasDrift) {
      return {
        variant: 'muted',
        message: t('openApiSync.collection.bannerTitle'),
        badges: { modifiedCount, missingCount, localOnlyCount },
        actions: ['revert-all']
      };
    }
    return null;
  }, [hasDrift, modifiedCount, missingCount, localOnlyCount, version, lastSyncDate, t]);

  return (
    <div className="collection-status-section">
      {bannerState && (
        <div className={`spec-update-banner ${bannerState.variant}`}>
          <div className="banner-left">
            {bannerState.variant === 'success'
              ? <IconCheck size={16} className="status-check-icon" />
              : <div className={`status-dot ${bannerState.variant}`} />}
            <span className="banner-title">
              {bannerState.message}
            </span>
            {bannerState.badges && (
              <span className="banner-details">
                {bannerState.badges.modifiedCount > 0 && <StatusBadge status="warning" radius="full">{t('openApiSync.collection.modifiedCount', { count: bannerState.badges.modifiedCount })}</StatusBadge>}
                {bannerState.badges.missingCount > 0 && <StatusBadge status="danger" radius="full">{t('openApiSync.collection.deletedCount', { count: bannerState.badges.missingCount })}</StatusBadge>}
                {bannerState.badges.localOnlyCount > 0 && <StatusBadge status="muted" radius="full">{t('openApiSync.collection.addedCount', { count: bannerState.badges.localOnlyCount })}</StatusBadge>}
              </span>
            )}
          </div>
          {bannerState.actions.includes('revert-all') && (
            <div className="banner-actions">
              <Button size="sm" variant="ghost" color="danger" onClick={handleRevertAllChanges}>
                {t('openApiSync.collection.revertAllToSpec')}
              </Button>
            </div>
          )}
        </div>
      )}

      {hasDrift && (
        <div className="sync-info-notice mt-4">
          <IconInfoCircle size={14} className="sync-info-icon" />
          <span><span className="whats-updated-title">{t('openApiSync.collection.whatsTrackedTitle')}</span> {t('openApiSync.collection.whatsTrackedBody')}</span>
        </div>
      )}

      {hasDrift ? (
        <div className="mt-5">
          {/* Modified in Collection */}
          <EndpointChangeSection
            title={t('openApiSync.collection.modifiedInCollection')}
            type="modified"
            endpoints={collectionDrift.modified || []}
            expandableLayout
            collectionUid={collection.uid}
            sectionKey="drift-modified"
            renderItem={(endpoint, idx) =>
              renderDriftRow(endpoint, idx, (
                <>
                  <Button size="xs" variant="ghost" onClick={() => onOpenEndpoint(endpoint.id)} title={t('openApiSync.collection.openInTab')} icon={<IconExternalLink size={14} />}>
                    {t('openApiSync.collection.open')}
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => handleResetEndpoint(endpoint)} title={t('openApiSync.collection.resetToSpec')} icon={<IconArrowBackUp size={14} />}>
                    {t('openApiSync.collection.reset')}
                  </Button>
                </>
              ))}
            actions={(
              <Button
                size="xs"
                variant="outline"
                onClick={handleResetAllModified}
                title={t('openApiSync.collection.resetAllTitle')}
                icon={<IconArrowBackUp size={14} />}
              >
                {t('openApiSync.collection.resetAll')}
              </Button>
            )}
          />

          {/* Deleted from Collection */}
          <EndpointChangeSection
            title={t('openApiSync.collection.deletedFromCollection')}
            type="missing"
            endpoints={collectionDrift.missing || []}
            expandableLayout
            collectionUid={collection.uid}
            sectionKey="drift-missing"
            renderItem={(endpoint, idx) =>
              renderDriftRow(endpoint, idx, (
                <Button size="xs" variant="ghost" onClick={() => handleAddMissingEndpoint(endpoint)} title={t('openApiSync.collection.restoreToCollection')} icon={<IconPlus size={14} />}>
                  {t('openApiSync.collection.restore')}
                </Button>
              ))}
            actions={(
              <Button
                size="xs"
                variant="outline"
                onClick={handleAddAllMissing}
                title={t('openApiSync.collection.restoreAllTitle')}
                icon={<IconPlus size={14} />}
              >
                {t('openApiSync.collection.restoreAll')}
              </Button>
            )}
          />

          {/* Added to Collection */}
          <EndpointChangeSection
            title={t('openApiSync.collection.addedToCollection')}
            type="local-only"
            endpoints={collectionDrift.localOnly || []}
            expandableLayout
            collectionUid={collection.uid}
            sectionKey="drift-local-only"
            renderItem={(endpoint, idx) =>
              renderDriftRow(endpoint, idx, (
                <>
                  <Button size="xs" variant="ghost" onClick={() => onOpenEndpoint(endpoint.id)} title={t('openApiSync.collection.openInTab')} icon={<IconExternalLink size={14} />}>
                    {t('openApiSync.collection.open')}
                  </Button>
                  <Button size="xs" variant="ghost" color="danger" onClick={() => handleDeleteEndpoint(endpoint)} title={t('openApiSync.collection.deleteEndpointTitle')} icon={<IconTrash size={14} />}>
                    {t('openApiSync.collection.delete')}
                  </Button>
                </>
              ))}
            actions={(
              <Button
                size="xs"
                variant="outline"
                color="danger"
                onClick={handleDeleteAllLocalOnly}
                title={t('openApiSync.collection.deleteAllTitle')}
                icon={<IconTrash size={14} />}
              >
                {t('openApiSync.collection.deleteAll')}
              </Button>
            )}
          />
        </div>
      ) : isLoading ? (
        <div className="sync-review-empty-state mt-5">
          <IconLoader2 size={40} className="empty-state-icon animate-spin" />
          <h4>{t('openApiSync.checkingForUpdates')}</h4>
          <p>{t('openApiSync.collection.comparingCollection')}</p>
        </div>
      ) : !hasStoredSpec ? (
        <div className="sync-review-empty-state mt-5">
          <IconAlertTriangle size={40} className="empty-state-icon" />
          <h4>{lastSyncDate ? t('openApiSync.collection.cannotTrack') : t('openApiSync.collection.waitingForInitialSync')}</h4>
          <p>{lastSyncDate
            ? t('openApiSync.collection.specMissingDesc')
            : t('openApiSync.collection.onceYouSync')}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => onTabSelect('spec-updates')}>{t('openApiSync.overview.goToSpecUpdates')}</Button>
        </div>
      ) : (
        <div className="sync-review-empty-state mt-5">
          <IconCheck size={40} className="empty-state-icon" />
          <h4>{t('openApiSync.collection.noChanges')}</h4>
          <p>{t('openApiSync.collection.noChangesDesc')}</p>
        </div>
      )}
      {/* Action confirmation modal */}
      {pendingAction && (
        <Modal size="sm" title={pendingAction.title} hideFooter={true} handleCancel={() => setPendingAction(null)}>
          <div className="action-confirm-modal">
            <p className="confirm-message">{pendingAction.message}</p>
            <div className="confirm-actions">
              <Button variant="ghost" onClick={() => setPendingAction(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                color={pendingAction.type.includes('delete') ? 'danger' : 'primary'}
                onClick={confirmPendingAction}
              >
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CollectionStatusSection;
