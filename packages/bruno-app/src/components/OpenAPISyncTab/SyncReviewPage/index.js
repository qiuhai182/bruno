import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  IconCheck,
  IconX,
  IconArrowRight,
  IconArrowsDiff,
  IconInfoCircle,
  IconLoader2
} from '@tabler/icons';
import Button from 'ui/Button';
import StatusBadge from 'ui/StatusBadge';
import EndpointChangeSection from '../EndpointChangeSection';
import ExpandableEndpointRow from '../EndpointChangeSection/ExpandableEndpointRow';
import ConfirmSyncModal from '../ConfirmSyncModal';
import SpecDiffModal from '../SpecDiffModal';
import Help from 'components/Help';
import { setReviewDecision, setReviewDecisions } from 'providers/ReduxStore/slices/openapi-sync';

/**
 * Categorize remoteDrift endpoints using three-way merge.
 * Uses specDrift and collectionDrift to determine who changed each modified endpoint.
 *
 * Returns:
 *  - specAddedEndpoints: new in spec, not yet in collection
 *  - specUpdatedEndpoints: modified in spec (includes conflicts where both sides changed)
 *  - localUpdatedEndpoints: modified only in the collection (spec didn't change)
 *  - specRemovedEndpoints: removed from spec, still in collection
 */
const categorizeEndpoints = (remoteDrift, specDrift, collectionDrift) => {
  // Only show endpoints as "New in Spec" if they were actually added to the spec
  // (i.e., they appear in specDrift.added). Endpoints the user deleted locally that
  // still exist in both stored and remote spec should not appear here — they belong
  // in "Collection Changes" only.
  const specAddedIds = new Set((specDrift?.added || []).map((ep) => ep.id));
  const specAddedEndpoints = (remoteDrift.missing || []).filter((ep) => specAddedIds.has(ep.id));

  // Only show endpoints as "Removed from Spec" if they were actually in the stored spec
  // (i.e., they appear in specDrift.removed). Locally-added endpoints that were never in
  // the spec should not appear here — they belong in "Collection Changes" only.
  const specRemovedIds = new Set((specDrift?.removed || []).map((ep) => ep.id));
  const specRemovedEndpoints = (remoteDrift.localOnly || []).filter((ep) => specRemovedIds.has(ep.id));

  // Build lookup sets to determine who changed each modified endpoint
  const specModifiedIds = new Set((specDrift?.modified || []).map((ep) => ep.id));
  const localModifiedIds = new Set((collectionDrift?.modified || []).map((ep) => ep.id));
  const noMergeBase = collectionDrift?.noStoredSpec;

  const specUpdatedEndpoints = [];
  const localUpdatedEndpoints = [];

  (remoteDrift.modified || []).forEach((ep) => {
    // When there's no merge base (noStoredSpec), we can't tell who changed what — treat as spec update
    const specChanged = !noMergeBase && specModifiedIds.has(ep.id);
    const localChanged = !noMergeBase && localModifiedIds.has(ep.id);

    if (!specChanged && localChanged) {
      // Only local changed — user modification, spec didn't change
      localUpdatedEndpoints.push({
        ...ep,
        source: 'collection-drift',
        localAction: 'modified'
      });
    } else {
      // Spec changed, both changed (conflict), no merge base, or sensitivity mismatch
      specUpdatedEndpoints.push({
        ...ep,
        source: 'spec-modified',
        specAction: 'modified',
        ...(specChanged && localChanged && { conflict: true, localAction: 'modified' })
      });
    }
  });

  return { specAddedEndpoints, specUpdatedEndpoints, localUpdatedEndpoints, specRemovedEndpoints };
};

const SyncReviewPage = ({
  specDrift,
  remoteDrift,
  collectionDrift,
  collectionPath,
  collectionUid,
  newSpec,
  isSyncing,
  isLoading,
  onApplySync
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const tabUiState = useSelector((state) => state.openapiSync?.tabUiState?.[collectionUid] || {});
  const [preserveValues, setPreserveValues] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSpecDiffModal, setShowSpecDiffModal] = useState(false);
  const [isOpeningSpecDiff, setIsOpeningSpecDiff] = useState(false);

  // setTimeout lets the button's spinner paint before the modal mounts —
  // without it, React batches both state updates and the spinner never shows.
  const handleOpenSpecDiff = () => {
    setIsOpeningSpecDiff(true);
    setTimeout(() => {
      setShowSpecDiffModal(true);
      setIsOpeningSpecDiff(false);
    }, 0);
  };

  const { specAddedEndpoints, specUpdatedEndpoints, localUpdatedEndpoints, specRemovedEndpoints } = useMemo(() => {
    if (!remoteDrift) {
      return { specAddedEndpoints: [], specUpdatedEndpoints: [], localUpdatedEndpoints: [], specRemovedEndpoints: [] };
    }
    return categorizeEndpoints(remoteDrift, specDrift, collectionDrift);
  }, [specDrift, remoteDrift, collectionDrift]);

  const conflictCount = specUpdatedEndpoints.filter((ep) => ep.conflict).length;
  const hasConflicts = conflictCount > 0;

  // Track decisions in Redux (persisted across navigations)
  const savedDecisions = tabUiState.reviewDecisions || {};

  // Compute defaults for any endpoints not yet in Redux
  const decisions = useMemo(() => {
    const merged = { ...savedDecisions };
    // Spec changes: accept-incoming by default, null for conflicts (must resolve manually)
    specUpdatedEndpoints.forEach((ep) => {
      if (!(ep.id in merged)) merged[ep.id] = ep.conflict ? null : 'accept-incoming';
    });
    // Local changes: keep-mine (preserved silently, not shown in review)
    localUpdatedEndpoints.forEach((ep) => {
      if (!(ep.id in merged)) merged[ep.id] = 'keep-mine';
    });
    // Added + removed endpoints: accept-incoming
    [...specAddedEndpoints, ...specRemovedEndpoints].forEach((ep) => {
      if (!(ep.id in merged)) merged[ep.id] = 'accept-incoming';
    });
    return merged;
  }, [savedDecisions, specUpdatedEndpoints, localUpdatedEndpoints, specRemovedEndpoints, specAddedEndpoints]);

  // Sync computed defaults back to Redux when they differ from saved state
  useEffect(() => {
    const hasNewDefaults = Object.keys(decisions).some((id) => !(id in savedDecisions));
    if (hasNewDefaults) {
      dispatch(setReviewDecisions({ collectionUid, decisions }));
    }
  }, [decisions, savedDecisions, collectionUid, dispatch]);

  const handleDecisionChange = (endpointId, decision) => {
    dispatch(setReviewDecision({ collectionUid, endpointId, decision }));
  };

  // Bulk actions — all spec-driven sections
  const decidableEndpoints = useMemo(() => {
    return [...specUpdatedEndpoints, ...specAddedEndpoints, ...specRemovedEndpoints];
  }, [specUpdatedEndpoints, specAddedEndpoints, specRemovedEndpoints]);

  const setBulkDecision = (decision) => {
    const newDecisions = {};
    decidableEndpoints.forEach((ep) => { newDecisions[ep.id] = decision; });
    dispatch(setReviewDecisions({ collectionUid, decisions: newDecisions }));
  };

  const allAccepted = decidableEndpoints.length > 0
    && decidableEndpoints.every((ep) => decisions[ep.id] === 'accept-incoming');
  const allSkipped = decidableEndpoints.length > 0
    && decidableEndpoints.every((ep) => decisions[ep.id] === 'keep-mine');

  const unresolvedConflicts = specUpdatedEndpoints.filter((ep) => ep.conflict && !decisions[ep.id]).length;

  // Confirmation summary — grouped endpoint lists
  const confirmGroups = useMemo(() => {
    const groups = [];
    const addGroup = (label, type, endpoints) => {
      if (endpoints.length > 0) groups.push({ label, type, endpoints });
    };

    const isAccepted = (ep) => decisions[ep.id] === 'accept-incoming';
    const isSkipped = (ep) => decisions[ep.id] === 'keep-mine';

    // Accepted — changes that will be applied
    addGroup(t('openApiSync.groups.newEndpointsToAdd'), 'add', specAddedEndpoints.filter(isAccepted));
    addGroup(t('openApiSync.groups.endpointsToUpdate'), 'update', specUpdatedEndpoints.filter(isAccepted));
    addGroup(t('openApiSync.groups.endpointsToDelete'), 'remove', specRemovedEndpoints.filter(isAccepted));

    // Skipped — changes that will be preserved as-is
    addGroup(t('openApiSync.groups.keepingLocalVersion'), 'keep', specUpdatedEndpoints.filter((ep) => ep.conflict && isSkipped(ep)));
    addGroup(t('openApiSync.groups.retainingRemovedEndpoints'), 'keep', specRemovedEndpoints.filter(isSkipped));
    addGroup(t('openApiSync.groups.skippedNewEndpoints'), 'keep', specAddedEndpoints.filter(isSkipped));
    addGroup(t('openApiSync.groups.keepingCurrentVersion'), 'keep', specUpdatedEndpoints.filter((ep) => !ep.conflict && isSkipped(ep)));

    return groups;
  }, [specAddedEndpoints, specUpdatedEndpoints, specRemovedEndpoints, decisions]);

  const handleConfirmApply = () => {
    setShowConfirmation(false);

    // Filter based on decisions
    const filteredAddedEndpoints = specAddedEndpoints.filter(
      (ep) => decisions[ep.id] === 'accept-incoming'
    );
    const filteredSpecChanges = specUpdatedEndpoints.filter(
      (ep) => !ep.conflict && decisions[ep.id] === 'accept-incoming'
    );

    // Collect "Not in Spec" endpoints where user chose to remove
    const localOnlyIds = specRemovedEndpoints
      .filter((ep) => decisions[ep.id] === 'accept-incoming')
      .map((ep) => ep.id);

    onApplySync({
      endpointDecisions: decisions,
      localOnlyIds,
      // Pass filtered categorized endpoints for performSync to construct the right backend diff
      newToCollection: filteredAddedEndpoints,
      specUpdates: filteredSpecChanges,
      resolvedConflicts: specUpdatedEndpoints.filter((ep) => ep.conflict && decisions[ep.id] === 'accept-incoming'),
      localChangesToReset: localUpdatedEndpoints.filter((ep) => decisions[ep.id] === 'accept-incoming'),
      preserveValues
    });
  };

  const totalChanges = specAddedEndpoints.length + specUpdatedEndpoints.length + localUpdatedEndpoints.length + specRemovedEndpoints.length;
  const hasRemoteUpdates = specAddedEndpoints.length + specUpdatedEndpoints.length + specRemovedEndpoints.length > 0;

  const buttonLabel = unresolvedConflicts > 0
    ? t('openApiSync.review.resolveConflictsAndSync', { count: unresolvedConflicts, s: unresolvedConflicts !== 1 ? 's' : '' })
    : !hasRemoteUpdates && specDrift?.storedSpecMissing
        ? t('openApiSync.review.restoreSpecFile')
        : t('openApiSync.review.syncCollection');

  return (
    <div className="sync-review-page sync-mode">
      {hasRemoteUpdates && (
        <div className="sync-review-header">
          <div className="title-row">
            <div className="title-left">
              <h3 className="review-title">{t('openApiSync.review.title')}</h3>
              {totalChanges > 0 && (
                <p className="review-subtitle">
                  {t('openApiSync.review.subtitle')}
                </p>
              )}
            </div>
            {(specDrift?.unifiedDiff || decidableEndpoints.length > 0) && (
              <div className="bulk-actions">
                <div className="preserve-values-control">
                  <button
                    type="button"
                    role="switch"
                    aria-pressed={preserveValues}
                    className={`preserve-toggle ${preserveValues ? 'active' : ''}`}
                    onClick={() => setPreserveValues((v) => !v)}
                  >
                    <span className="preserve-toggle-knob" />
                  </button>
                  <span className="preserve-values-label">{t('openApiSync.review.preserveValues')}</span>
                  <Help icon="info" size={12} placement="top" width={260}>
                    {t('openApiSync.review.preserveValuesHelp')}
                  </Help>
                </div>
                {specDrift?.unifiedDiff && (
                  <button
                    className="bulk-btn"
                    onClick={handleOpenSpecDiff}
                    disabled={isOpeningSpecDiff || showSpecDiffModal}
                  >
                    {isOpeningSpecDiff ? (
                      <IconLoader2 size={12} className="animate-spin" />
                    ) : (
                      <IconArrowsDiff size={12} />
                    )}{' '}
                    {t('openApiSync.review.viewSpecDiff')}
                  </button>
                )}
                {decidableEndpoints.length > 0 && (
                  <>
                    <button
                      className={`bulk-btn ${allSkipped ? 'active' : ''}`}
                      onClick={() => setBulkDecision('keep-mine')}
                    >
                      <IconX size={12} /> {t('openApiSync.review.skipAll')}
                    </button>
                    <button
                      className={`bulk-btn ${allAccepted ? 'active' : ''}`}
                      onClick={() => setBulkDecision('accept-incoming')}
                    >
                      <IconCheck size={12} /> {t('openApiSync.review.acceptAll')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sync-review-body">
        {!hasRemoteUpdates ? (
          <div className="sync-review-empty-state">
            {isLoading ? (
              <>
                <IconLoader2 size={40} className="empty-state-icon animate-spin" />
                <h4>{t('openApiSync.checkingForUpdates')}</h4>
                <p>{t('openApiSync.review.comparingSpec')}</p>
              </>
            ) : (
              <>
                <IconCheck size={40} className="empty-state-icon" />
                <h4>{t('openApiSync.noUpdates')}</h4>
                <p>{t('openApiSync.noUpdatesDesc')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="endpoints-review-sections">
            {/* === Updates from Spec === */}
            {decidableEndpoints.length > 0 && (
              <div className="review-group">

                <EndpointChangeSection
                  title={t('openApiSync.review.updatedInSpec')}
                  type="spec-modified"
                  endpoints={specUpdatedEndpoints}
                  defaultExpanded={true}
                  expandableLayout
                  subtitle={t('openApiSync.review.updatedInSpecSubtitle')}
                  headerExtra={conflictCount > 0 ? (
                    <StatusBadge
                      status="danger"
                      rightSection={(
                        <Help icon="info" size={11} placement="top" width={250}>
                          {t('openApiSync.review.conflictsHelp', { count: conflictCount, s: conflictCount === 1 ? '' : 's' })}
                        </Help>
                      )}
                    >
                      {t('openApiSync.review.conflictCount', { count: conflictCount, s: conflictCount === 1 ? '' : 's' })}
                    </StatusBadge>
                  ) : null}
                  collectionUid={collectionUid}
                  sectionKey="review-spec-modified"
                  renderItem={(endpoint, idx) => (
                    <ExpandableEndpointRow
                      key={endpoint.id || idx}
                      endpoint={endpoint}
                      decision={decisions?.[endpoint.id]}
                      onDecisionChange={(decision) => handleDecisionChange(endpoint.id, decision)}
                      collectionPath={collectionPath}
                      newSpec={newSpec}
                      showDecisions={true}
                      decisionLabels={{ keep: t('openApiSync.decision.keepCurrent'), accept: t('openApiSync.decision.update') }}
                      collectionUid={collectionUid}
                      preserveValues={preserveValues}
                    />
                  )}
                />

                <EndpointChangeSection
                  title={t('openApiSync.review.newInSpec')}
                  type="added"
                  endpoints={specAddedEndpoints}
                  defaultExpanded={true}
                  expandableLayout
                  subtitle={t('openApiSync.review.newInSpecSubtitle')}
                  collectionUid={collectionUid}
                  sectionKey="review-added"
                  renderItem={(endpoint, idx) => (
                    <ExpandableEndpointRow
                      key={endpoint.id || idx}
                      endpoint={endpoint}
                      decision={decisions?.[endpoint.id]}
                      onDecisionChange={(decision) => handleDecisionChange(endpoint.id, decision)}
                      collectionPath={collectionPath}
                      newSpec={newSpec}
                      showDecisions={true}
                      decisionLabels={{ keep: t('openApiSync.decision.skip'), accept: t('openApiSync.decision.add') }}
                      collectionUid={collectionUid}
                      preserveValues={preserveValues}
                    />
                  )}
                />

                <EndpointChangeSection
                  title={t('openApiSync.review.removedFromSpec')}
                  type="removed"
                  endpoints={specRemovedEndpoints}
                  defaultExpanded={true}
                  expandableLayout
                  subtitle={t('openApiSync.review.removedFromSpecSubtitle')}
                  collectionUid={collectionUid}
                  sectionKey="review-removed"
                  renderItem={(endpoint, idx) => (
                    <ExpandableEndpointRow
                      key={endpoint.id || idx}
                      endpoint={endpoint}
                      decision={decisions?.[endpoint.id]}
                      onDecisionChange={(decision) => handleDecisionChange(endpoint.id, decision)}
                      collectionPath={collectionPath}
                      newSpec={newSpec}
                      showDecisions={true}
                      decisionLabels={{ keep: t('openApiSync.decision.keep'), accept: t('openApiSync.decision.delete') }}
                      collectionUid={collectionUid}
                      preserveValues={preserveValues}
                    />
                  )}
                />
              </div>
            )}

          </div>
        )}
      </div>

      {hasRemoteUpdates && (
        <div className="sync-info-notice mt-4">
          <IconInfoCircle size={14} className="sync-info-icon" />
          <span><span className="whats-updated-title">{t('openApiSync.review.whatsUpdatedTitle')}</span> {t('openApiSync.review.whatsUpdatedBody')}</span>
        </div>
      )}

      {hasRemoteUpdates && (
        <div className="sync-review-bottom-bar mt-4">
          <div className="bar-stats">
            {totalChanges === 0 && (
              <span className="stats-prefix">
                {specDrift?.storedSpecMissing ? t('openApiSync.review.syncWillUpdateSpecFile') : t('openApiSync.review.noEndpointChanges')}
              </span>
            )}
          </div>
          <div className="bar-actions">
            <Button
              onClick={totalChanges === 0 ? handleConfirmApply : () => setShowConfirmation(true)}
              disabled={unresolvedConflicts > 0 || isSyncing}
              loading={isSyncing}
            >
              {buttonLabel}
              {unresolvedConflicts === 0 && <IconArrowRight size={14} style={{ marginLeft: 4 }} />}
            </Button>
          </div>
        </div>
      )}

      {showConfirmation && (
        <ConfirmSyncModal
          groups={confirmGroups}
          onCancel={() => setShowConfirmation(false)}
          onSync={handleConfirmApply}
          isSyncing={isSyncing}
        />
      )}

      {showSpecDiffModal && (
        <SpecDiffModal
          specDrift={specDrift}
          onClose={() => setShowSpecDiffModal(false)}
        />
      )}
    </div>
  );
};

export default SyncReviewPage;
