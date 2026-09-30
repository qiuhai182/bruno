import React, { useCallback, useMemo, useState, Fragment } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { cloneDeep } from 'lodash';
import * as FileSaver from 'file-saver';
import jsyaml from 'js-yaml';
import jsesc from 'jsesc';
import toast from 'react-hot-toast';
import { IconBook, IconCheck, IconAlertTriangle, IconLoader2 } from '@tabler/icons';

import Modal from 'components/Modal';
import Portal from 'components/Portal';
import StyledWrapper from './StyledWrapper';
import CollectionVersionInfo from './CollectionVersionInfo';
import EnvironmentSelectionList from './EnvironmentSelectionList';
import Advanced from './Advanced';
import { useApp } from 'providers/App';
import useCollectionGitRemoteUrl from 'hooks/useCollectionGitRemoteUrl';
import { transformCollectionToSaveToExportAsFile, findCollectionByUid, areItemsLoading, sortItemsBySidebarOrder, getCollectionItemCounts, getCollectionVersion, getUniqueTagsFromItems } from 'utils/collections/index';
import { brunoToOpenCollection } from '@usebruno/converters';
import { generateApiDocsHtml, getApiDocsFileName, filterRequestItemsByTags } from '@usebruno/common';

const CollectionNotFound = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <Portal>
      <Modal size="md" title={t('sidebar.docs.title')} confirmText={t('common.close')} handleConfirm={onClose} hideCancel>
        <StyledWrapper>
          <div className="flex items-center gap-2 text-warning">
            <IconAlertTriangle size={16} className="shrink-0" />
            <span>{t('sidebar.docs.collectionNotFound')}</span>
          </div>
        </StyledWrapper>
      </Modal>
    </Portal>
  );
};

const GenerateDocumentation = ({ onClose, collectionUid }) => {
  const { t } = useTranslation();
  const { version } = useApp();
  const collection = useSelector((state) =>
    findCollectionByUid(state.collections.collections, collectionUid)
  );

  const isLoading = useMemo(
    () => (collection ? areItemsLoading(collection) : false),
    [collection]
  );

  const currentVersion = getCollectionVersion(collection);

  const environments = useMemo(() => collection?.environments || [], [collection?.environments]);

  // Track *selected* environments, starting empty, so nothing is included by default.
  const [selectedEnvUidsSet, setSelectedEnvUidsSet] = useState(() => new Set());
  const selectedEnvUids = useMemo(
    () => environments.filter((env) => selectedEnvUidsSet.has(env.uid)).map((env) => env.uid),
    [environments, selectedEnvUidsSet]
  );

  const toggleEnv = useCallback((uid) => {
    setSelectedEnvUidsSet((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  }, []);

  const toggleAllEnvs = useCallback(
    (selectAll) => setSelectedEnvUidsSet(selectAll ? new Set(environments.map((env) => env.uid)) : new Set()),
    [environments]
  );

  const availableTags = useMemo(
    () => getUniqueTagsFromItems(collection?.items || [], { includeDrafts: false }),
    [collection?.items]
  );
  const [filterByTags, setFilterByTags] = useState(false);
  const [docTags, setDocTags] = useState({ include: [], exclude: [] });
  const [includeGitLink, setIncludeGitLink] = useState(true);

  const activeTags = useMemo(
    () => (filterByTags ? docTags : { include: [], exclude: [] }),
    [filterByTags, docTags]
  );

  const { folderCount, requestCount } = useMemo(
    () => getCollectionItemCounts(filterRequestItemsByTags(collection?.items || [], activeTags.include, activeTags.exclude)),
    [collection?.items, activeTags]
  );

  const { gitCollectionUrl, isResolved: gitUrlLoaded } = useCollectionGitRemoteUrl(collection?.pathname);
  const hasGitUrl = gitUrlLoaded && Boolean(gitCollectionUrl);

  const features = [
    t('sidebar.docs.featureStandaloneHtml'),
    t('sidebar.docs.featurePlayground'),
    t('sidebar.docs.featureHostAnywhere')
  ];

  const handleGenerate = useCallback(() => {
    try {
      const collectionCopy = cloneDeep(collection);

      // Match the sidebar's ordering (folders then requests, by seq, at every depth)
      // so the generated docs read in the same order as the collection tree.
      collectionCopy.items = sortItemsBySidebarOrder(collectionCopy.items);

      collectionCopy.environments = (collectionCopy.environments || []).filter((env) => selectedEnvUidsSet.has(env.uid));

      const transformedCollection = transformCollectionToSaveToExportAsFile(collectionCopy);

      const htmlContent = generateApiDocsHtml(
        transformedCollection,
        {
          tags: activeTags,
          gitCollectionUrl: includeGitLink ? gitCollectionUrl : undefined,
          collectionVersion: currentVersion,
          exportedAt: new Date().toISOString(),
          exportedUsing: version ? `Bruno/${version}` : 'Bruno'
        },
        { brunoToOpenCollection, dumpYaml: jsyaml.dump, escapeString: jsesc }
      );

      const fileName = getApiDocsFileName(collection.name);
      FileSaver.saveAs(new Blob([htmlContent], { type: 'text/html' }), fileName);

      toast.success(t('sidebar.docs.generatedSuccess'));
      onClose();
    } catch (error) {
      console.error('Error generating documentation:', error);
      toast.error(t('sidebar.docs.generatedError'));
    }
  }, [collection, version, onClose, currentVersion, selectedEnvUidsSet, activeTags, includeGitLink, gitCollectionUrl, t]);

  if (!collection) {
    return <CollectionNotFound onClose={onClose} />;
  }

  return (
    <Portal>
      <Modal
        size="md"
        title={t('sidebar.docs.title')}
        confirmText={isLoading ? t('sidebar.docs.loading') : t('sidebar.docs.generate')}
        cancelText={t('common.cancel')}
        handleConfirm={isLoading ? undefined : handleGenerate}
        handleCancel={onClose}
        confirmDisabled={isLoading || (includeGitLink && !gitUrlLoaded)}
      >
        <StyledWrapper>
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <IconLoader2 size={20} className="animate-spin" aria-hidden="true" />
              <span>{t('sidebar.docs.loadingCollection')}</span>
            </div>
          ) : (
            <div className="content">
              <h3 className="title flex items-center gap-2 mt-2 font-medium">
                <IconBook size={18} aria-hidden="true" />
                <span>{t('sidebar.docs.interactiveDocs')}</span>
              </h3>
              <p className="description mb-4">
                {t('sidebar.docs.description')}
              </p>

              <ul className="features flex flex-col list-none gap-2 p-0 mb-4">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <IconCheck size={16} className="check-icon flex-shrink-0" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="config-card mb-4">
                <CollectionVersionInfo name={collection.name} version={currentVersion} folderCount={folderCount} requestCount={requestCount} environmentCount={environments.length} />
                {environments.length > 0 && (
                  <Fragment>
                    <div className="card-divider" />
                    <div className="env-section">
                      <EnvironmentSelectionList
                        title={t('sidebar.docs.environmentsToInclude')}
                        environments={environments}
                        selectedUids={selectedEnvUids}
                        onToggle={toggleEnv}
                        onToggleAll={toggleAllEnvs}
                      />
                    </div>
                  </Fragment>
                )}

                <div className="card-divider" />
                <Advanced
                  filterByTags={filterByTags}
                  onFilterModeChange={setFilterByTags}
                  tags={docTags}
                  availableTags={availableTags}
                  onTagsChange={setDocTags}
                  includeGitLink={includeGitLink}
                  onGitLinkToggle={() => setIncludeGitLink((prev) => !prev)}
                  hasGitUrl={hasGitUrl}
                />
              </div>

              <p className="note m-0">
                {t('sidebar.docs.cdnNote')}
              </p>
            </div>
          )}
        </StyledWrapper>
      </Modal>
    </Portal>
  );
};

export default GenerateDocumentation;
