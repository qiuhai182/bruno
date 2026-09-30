import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getTotalRequestCountInCollection } from 'utils/collections/';
import { countEndpoints } from '../utils';
import moment from 'moment';
import { IconCheck } from '@tabler/icons';
import Button from 'ui/Button';
import Help from 'components/Help';

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

const SUMMARY_CARDS = [
  {
    key: 'total',
    labelKey: 'openApiSync.overview.totalInCollection',
    color: 'blue',
    tooltipKey: 'openApiSync.overview.totalInCollectionTooltip'
  },
  {
    key: 'inSync',
    labelKey: 'openApiSync.overview.inSyncWithSpec',
    color: 'green',
    tooltipKey: 'openApiSync.overview.inSyncTooltip'
  },
  {
    key: 'changed',
    labelKey: 'openApiSync.overview.changedInCollection',
    color: 'muted',
    tooltipKey: 'openApiSync.overview.changedTooltip',
    tab: 'collection-changes'
  },
  {
    key: 'pending',
    labelKey: 'openApiSync.overview.specUpdatesPending',
    color: 'amber',
    tooltipKey: 'openApiSync.overview.pendingTooltip',
    tab: 'spec-updates'
  }
];

const OverviewSection = ({ collection, storedSpec, collectionDrift, specDrift, remoteDrift, onTabSelect, error, onOpenSettings }) => {
  const { t } = useTranslation();
  const openApiSyncConfig = collection?.brunoConfig?.openapi?.[0];

  const reduxError = useSelector((state) => state.openapiSync?.collectionUpdates?.[collection.uid]?.error);
  const specMeta = useSelector((state) => state.openapiSync?.storedSpecMeta?.[collection.uid] || null);
  const activeError = error || reduxError;

  const version = specMeta?.version;
  const endpointCount = specMeta?.endpointCount ?? null;
  const lastSyncDate = openApiSyncConfig?.lastSyncDate;
  const groupBy = openApiSyncConfig?.groupBy || 'tags';
  const autoCheckEnabled = openApiSyncConfig?.autoCheck !== false;
  const autoCheckInterval = openApiSyncConfig?.autoCheckInterval || 5;

  // Endpoint Summary counts
  // Total: from collection items in Redux; In Sync: from remote spec comparison
  // Changed/Conflicts: compare against stored spec in AppData (0 on initial sync)
  const hasDriftData = collectionDrift && !collectionDrift.noStoredSpec;

  const totalInCollection = getTotalRequestCountInCollection(collection);

  const inSyncCount = remoteDrift
    ? (remoteDrift.inSync?.length || 0)
    : null;

  const changedInCollection = hasDriftData
    ? (collectionDrift.modified?.length || 0) + (collectionDrift.missing?.length || 0) + (collectionDrift.localOnly?.length || 0)
    : 0;

  const specUpdatesPending = hasDriftData
    ? (specDrift?.added?.length || 0) + (specDrift?.modified?.length || 0) + (specDrift?.removed?.length || 0)
    : (remoteDrift?.modified?.length || 0) + (remoteDrift?.missing?.length || 0);

  // Conflict count: endpoints modified in both spec and collection
  const conflictCount = hasDriftData && specDrift?.modified
    ? (() => {
        const localModifiedIds = new Set((collectionDrift.modified || []).map((ep) => ep.id));
        return specDrift.modified.filter((ep) => localModifiedIds.has(ep.id)).length;
      })()
    : 0;

  const summaryValues = {
    total: totalInCollection,
    inSync: inSyncCount,
    changed: changedInCollection,
    pending: activeError ? null : specDrift ? specUpdatesPending : null
  };

  const details = [
    { label: t('openApiSync.overview.specVersion'), value: version ? `v${version}` : '–' },
    { label: t('openApiSync.overview.endpointsInSpec'), value: endpointCount != null ? endpointCount : '–' },
    { label: t('openApiSync.overview.lastSyncedAt'), value: lastSyncDate ? moment(lastSyncDate).fromNow() : '–', tooltip: lastSyncDate ? moment(lastSyncDate).format('MMMM D, YYYY [at] h:mm A') : undefined },
    { label: t('openApiSync.overview.folderGrouping'), value: capitalize(groupBy) },
    { label: t('openApiSync.overview.autoCheck'), value: autoCheckEnabled ? t('openApiSync.overview.everyMinutes', { count: autoCheckInterval }) : t('openApiSync.overview.disabled') }
  ];

  const hasCollectionChanges = changedInCollection > 0;
  const hasSpecUpdates = specUpdatesPending > 0;

  const bannerState = useMemo(() => {
    const versionInfo = (specDrift?.storedVersion && specDrift?.newVersion && specDrift.storedVersion !== specDrift.newVersion)
      ? ` (v${specDrift.storedVersion} → v${specDrift.newVersion})`
      : '';

    if (activeError) {
      return {
        variant: 'danger',
        title: t('openApiSync.overview.failedToCheck'),
        subtitle: activeError,
        buttons: ['open-settings']
      };
    }
    if (specDrift?.storedSpecMissing && !lastSyncDate) {
      return {
        variant: 'warning',
        title: t('openApiSync.overview.initialSyncRequired'),
        subtitle: t('openApiSync.overview.initialSyncSubtitle'),
        buttons: ['review']
      };
    }
    if (hasSpecUpdates && hasCollectionChanges) {
      return {
        variant: 'warning',
        title: t('openApiSync.overview.specUpdatesAndCollectionChanges', { versionInfo }),
        subtitle: t('openApiSync.overview.someOverwrittenSubtitle'),
        buttons: ['sync', 'changes']
      };
    }
    if (hasSpecUpdates) {
      return {
        variant: 'warning',
        title: t('openApiSync.overview.specHasNewUpdates', { versionInfo }),
        subtitle: t('openApiSync.overview.newRequestsAvailable'),
        buttons: ['sync']
      };
    }
    if (specDrift?.storedSpecMissing && lastSyncDate) {
      return {
        variant: 'warning',
        title: t('openApiSync.overview.lastSyncedSpecNotFound'),
        subtitle: t('openApiSync.overview.restoreToTrackSubtitle'),
        buttons: ['spec-details']
      };
    }
    if (!hasDriftData) return null;
    if (hasCollectionChanges) {
      return {
        variant: 'muted',
        title: t('openApiSync.overview.collectionHasChanges'),
        subtitle: t('openApiSync.overview.noLongerMatchSubtitle'),
        buttons: ['changes']
      };
    }
    return null;
  }, [activeError, hasDriftData, hasSpecUpdates, hasCollectionChanges, specDrift?.storedSpecMissing, specDrift?.storedVersion, specDrift?.newVersion, lastSyncDate, t]);

  return (
    <div className="overview-section">
      {bannerState && (
        <div className={`overview-status-banner ${bannerState.variant}`}>
          <div className="banner-text">
            <div className="banner-title-row">
              {bannerState.variant === 'success'
                ? <IconCheck size={16} className="status-check-icon" />
                : <div className={`status-dot ${bannerState.variant}`} />}
              <span className="banner-title">{bannerState.title}</span>
            </div>
            {bannerState.subtitle && (
              <p className="banner-subtitle">{bannerState.subtitle}</p>
            )}
          </div>
          {bannerState.buttons.length > 0 && (
            <div className="banner-button-row">
              {bannerState.buttons.includes('changes') && (
                <Button
                  size="sm"
                  variant={bannerState.buttons.includes('sync') ? 'outline' : 'filled'}
                  color={bannerState.buttons.includes('sync') ? 'secondary' : 'primary'}
                  onClick={() => onTabSelect('collection-changes')}
                >
                  {t('openApiSync.overview.viewCollectionChanges')}
                </Button>
              )}
              {(bannerState.buttons.includes('sync') || bannerState.buttons.includes('review')) && (
                <Button size="sm" onClick={() => onTabSelect('spec-updates')}>
                  {t('openApiSync.overview.reviewAndSync')}
                </Button>
              )}
              {bannerState.buttons.includes('spec-details') && (
                <Button variant="outline" size="sm" onClick={() => onTabSelect('spec-updates')}>
                  {t('openApiSync.overview.goToSpecUpdates')}
                </Button>
              )}
              {bannerState.buttons.includes('open-settings') && (
                <Button variant="outline" size="sm" onClick={onOpenSettings}>
                  {t('openApiSync.banner.updateConnectionSettings')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <h4 className="overview-section-title mt-5">{t('openApiSync.overview.endpointSummary')}</h4>
      <div className="sync-summary-cards">
        {SUMMARY_CARDS.map(({ key, labelKey, tooltipKey, tab, color }) => {
          const count = summaryValues[key];
          const label = t(labelKey);
          const tooltip = t(tooltipKey);
          const resolvedColor = count > 0 ? color : 'muted';
          const isClickable = tab && count > 0;
          return (
            <div
              className={`summary-card${isClickable ? ' clickable' : ''}`}
              key={key}
              onClick={isClickable ? () => onTabSelect(tab) : undefined}
            >
              <span className="card-info-icon">
                <Help icon="info" size={12} placement="top" width={220}>{tooltip}</Help>
              </span>
              <div className="summary-count-row">
                <span className={`summary-count ${resolvedColor}`}>{count != null ? count : '–'}</span>
                {key === 'pending' && conflictCount > 0 && (
                  <span className="conflict-annotation">{t('openApiSync.overview.conflictCount', { count: conflictCount, s: conflictCount === 1 ? '' : 's' })}</span>
                )}
              </div>
              <div className="summary-label">
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <h4 className="overview-section-title mt-7">{t('openApiSync.overview.lastSyncedSpecDetails')}</h4>
      <div className="spec-details-grid">
        {details.map(({ label, value, tooltip }) => (
          <div className="spec-detail-item" key={label}>
            <div className="spec-detail-label">{label}</div>
            <div className="spec-detail-value">
              {value}
              {tooltip && (
                <Help icon="info" size={11} placement="top" width={200}>{tooltip}</Help>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewSection;
