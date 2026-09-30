import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconFolder, IconDownload } from '@tabler/icons';
import { importCollection, importCollectionFromZip } from 'providers/ReduxStore/slices/collections/actions';
import { setIsCreatingCollection, setIsOpeningCollection, toggleSidebarCollapse } from 'providers/ReduxStore/slices/app';
import { setLocalStorageValue, SIDEBAR_COLLAPSED_KEY } from 'utils/common/localStorage';
import toast from 'react-hot-toast';
import ImportCollection from 'components/Sidebar/ImportCollection';
import ImportCollectionLocation from 'components/Sidebar/ImportCollectionLocation';
import BulkImportCollectionLocation from 'components/Sidebar/BulkImportCollectionLocation';
import CloneGitRepository from 'components/Sidebar/CloneGitRespository';
import PostmanPackageReport from 'components/Sidebar/PostmanPackageReport';
import usePostmanPackagePrompt from 'hooks/usePostmanPackagePrompt';
import Button from 'ui/Button';
import CollectionsList from './CollectionsList';
import WorkspaceDocs from '../WorkspaceDocs';
import StyledWrapper from './StyledWrapper';

const WorkspaceOverview = ({ workspace }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { globalEnvironments } = useSelector((state) => state.globalEnvironments);
  const { sidebarCollapsed, isCreatingCollection } = useSelector((state) => state.app);

  const [importCollectionModalOpen, setImportCollectionModalOpen] = useState(false);
  const [importCollectionLocationModalOpen, setImportCollectionLocationModalOpen] = useState(false);
  const [importData, setImportData] = useState(null);
  const [showCloneGitModal, setShowCloneGitModal] = useState(false);
  const [gitRepositoryUrl, setGitRepositoryUrl] = useState(null);
  const { postmanPackagePrompt, clearPostmanPackagePrompt, handleImportResolved } = usePostmanPackagePrompt();

  const workspaceCollectionsCount = workspace?.collections?.length || 0;

  const workspaceEnvironmentsCount = globalEnvironments?.length || 0;

  const handleCreateCollection = async () => {
    if (isCreatingCollection) {
      return;
    }

    if (!workspace?.pathname) {
      toast.error(t('workspace.toast.workspacePathNotFound'));
      return;
    }

    try {
      const { ipcRenderer } = window;
      await ipcRenderer.invoke('renderer:ensure-collections-folder', workspace.pathname);
      if (sidebarCollapsed) {
        dispatch(toggleSidebarCollapse());
        setLocalStorageValue(SIDEBAR_COLLAPSED_KEY, false);
      }
      dispatch(setIsCreatingCollection(true));
    } catch (error) {
      console.error('Error ensuring collections folder exists:', error);
      toast.error(t('workspace.toast.prepareError'));
    }
  };

  const handleOpenCollection = () => {
    dispatch(setIsOpeningCollection(true));
  };

  const handleImportCollection = () => {
    setImportCollectionModalOpen(true);
  };

  const handleImportCollectionSubmit = ({ rawData, type, repositoryUrl, ...rest }) => {
    setImportCollectionModalOpen(false);

    if (type === 'git-repository') {
      setGitRepositoryUrl(repositoryUrl);
      setShowCloneGitModal(true);
      return;
    }

    setImportData({ rawData, type, ...rest });
    setImportCollectionLocationModalOpen(true);
  };

  const handleImportCollectionLocation = (convertedCollection, collectionLocation, options = {}) => {
    const importAction = options.isZipImport
      ? importCollectionFromZip(convertedCollection.zipFilePath, collectionLocation)
      : importCollection(convertedCollection, collectionLocation, options);

    dispatch(importAction)
      .then((importedItem) => {
        setImportCollectionLocationModalOpen(false);
        setImportData(null);
        handleImportResolved(convertedCollection, importedItem);
      });
  };

  const handleCloseGitModal = () => {
    setShowCloneGitModal(false);
    setGitRepositoryUrl(null);
  };

  return (
    <StyledWrapper>
      {importCollectionModalOpen && (
        <ImportCollection
          onClose={() => setImportCollectionModalOpen(false)}
          handleSubmit={handleImportCollectionSubmit}
        />
      )}

      {importCollectionLocationModalOpen && importData && (importData.type !== 'multiple' && importData.type !== 'bulk') && (
        <ImportCollectionLocation
          rawData={importData.rawData}
          format={importData.type}
          sourceUrl={importData.sourceUrl}
          filePath={importData.filePath}
          rawContent={importData.rawContent}
          onClose={() => setImportCollectionLocationModalOpen(false)}
          handleSubmit={handleImportCollectionLocation}
        />
      )}
      {importCollectionLocationModalOpen && importData && (importData.type === 'multiple' || importData.type === 'bulk') && (
        <BulkImportCollectionLocation
          importData={importData}
          onClose={() => setImportCollectionLocationModalOpen(false)}
          handleSubmit={handleImportCollectionLocation}
        />
      )}
      {showCloneGitModal && (
        <CloneGitRepository
          onClose={handleCloseGitModal}
          onFinish={handleCloseGitModal}
          collectionRepositoryUrl={gitRepositoryUrl}
        />
      )}
      {postmanPackagePrompt && (
        <PostmanPackageReport
          key={postmanPackagePrompt.collectionPath}
          report={postmanPackagePrompt.report}
          collectionPath={postmanPackagePrompt.collectionPath}
          onClose={clearPostmanPackagePrompt}
        />
      )}

      <div className="overview-layout">
        <div className="overview-main">
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">{workspaceCollectionsCount}</span>
              <span className="stat-label">{t('COMMON.COLLECTIONS')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{workspaceEnvironmentsCount}</span>
              <span className="stat-label">{t('workspace.stats.environments')}</span>
            </div>
          </div>

          <div className="quick-actions-section">
            <div className="section-title">{t('workspace.quickActions')}</div>
            <div className="quick-actions-buttons">
              <Button
                color="light"
                size="sm"
                icon={<IconPlus size={14} strokeWidth={1.5} />}
                onClick={handleCreateCollection}
                disabled={isCreatingCollection}
              >
                {t('WELCOME.CREATE_COLLECTION')}
              </Button>
              <Button
                color="light"
                size="sm"
                icon={<IconFolder size={14} strokeWidth={1.5} />}
                onClick={handleOpenCollection}
              >
                {t('WELCOME.OPEN_COLLECTION')}
              </Button>
              <Button
                color="light"
                size="sm"
                icon={<IconDownload size={14} strokeWidth={1.5} />}
                onClick={handleImportCollection}
              >
                {t('WELCOME.IMPORT_COLLECTION')}
              </Button>
            </div>
          </div>

          <div className="collections-section">
            <div className="section-title">{t('COMMON.COLLECTIONS')}</div>
            <CollectionsList workspace={workspace} />
          </div>
        </div>

        <div className="overview-docs">
          <WorkspaceDocs key={workspace?.uid} workspace={workspace} />
        </div>
      </div>
    </StyledWrapper>
  );
};

export default WorkspaceOverview;
