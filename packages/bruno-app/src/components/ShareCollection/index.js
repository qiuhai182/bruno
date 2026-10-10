import React, { useState, useMemo } from 'react';
import * as FileSaver from 'file-saver';
import Modal from 'components/Modal';
import Button from 'ui/Button';
import { IconCheck, IconAlertTriangle, IconFileExport, IconFileCode } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import ExportToPostman from 'components/Sidebar/Collections/Collection/ExportCollection/ExportToPostman';
import exportOpenCollection from 'utils/exporters/opencollection';
import { exportApiSpec } from 'utils/exporters/openapi-spec';
import { cloneDeep } from 'lodash';
import { sanitizeName } from 'utils/common/regex';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { transformCollectionToSaveToExportAsFile, findCollectionByUid, areItemsLoading, flattenItems, getEnvironmentVariables } from 'utils/collections/index';
import toast from 'react-hot-toast';

const EXPORT_FORMATS = {
  ZIP: 'zip',
  YAML: 'yaml',
  POSTMAN: 'postman',
  OPENAPI: 'openapi'
};

const ShareCollection = ({ onClose, collectionUid }) => {
  const { t } = useTranslation();
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));
  const isCollectionLoading = areItemsLoading(collection);
  const [selectedFormat, setSelectedFormat] = useState(EXPORT_FORMATS.ZIP);
  const [isExporting, setIsExporting] = useState(false);
  const [showPostmanExportModal, setShowPostmanExportModal] = useState(false);

  const hasNonExportableRequestTypes = useMemo(() => {
    let types = new Set();
    const checkItem = (item) => {
      if (item.type === 'grpc-request') {
        types.add('gRPC');
        return true;
      }
      if (item.type === 'ws-request') {
        types.add('WebSocket');
        return true;
      }
      if (item.items) {
        return item.items.some(checkItem);
      }
      return false;
    };
    return {
      has: collection?.items?.filter(checkItem).length || false,
      types: [...types]
    };
  }, [collection]);

  const handleExportZip = async () => {
    try {
      const { ipcRenderer } = window;
      const result = await ipcRenderer.invoke('renderer:export-collection-zip', collection.pathname, collection.name);
      if (result.success) {
        toast.success(t('collection.share.exportSuccess'));
      }
    } catch (error) {
      toast.error(t('collection.share.exportFailed', { message: error.message }));
    }
  };

  const handleExportYaml = () => {
    const collectionCopy = cloneDeep(collection);
    exportOpenCollection(transformCollectionToSaveToExportAsFile(collectionCopy));
  };

  const handleExportOpenApi = () => {
    const { content } = exportApiSpec({
      variables: getEnvironmentVariables(collection),
      items: flattenItems(collection.items),
      name: collection.name,
      environments: collection.environments || []
    });

    const fileName = `${sanitizeName(collection.name)}.openapi.yaml`;
    FileSaver.saveAs(new Blob([content], { type: 'application/yaml' }), fileName);
  };

  const handlePostmanModalClose = () => {
    setShowPostmanExportModal(false);
    onClose();
  };

  const handleProceed = async () => {
    if (isCollectionLoading || isExporting) return;

    if (selectedFormat === EXPORT_FORMATS.POSTMAN) {
      setShowPostmanExportModal(true);
      return;
    }

    setIsExporting(true);
    try {
      switch (selectedFormat) {
        case EXPORT_FORMATS.ZIP:
          await handleExportZip();
          break;
        case EXPORT_FORMATS.YAML:
          handleExportYaml();
          toast.success(t('collection.share.exportSuccess'));
          break;
        case EXPORT_FORMATS.OPENAPI:
          handleExportOpenApi();
          toast.success(t('collection.share.exportSuccess'));
          break;
      }
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('collection.share.exportFailed', { message: error.message }));
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = isCollectionLoading || isExporting;

  if (showPostmanExportModal) {
    return (
      <ExportToPostman
        collection={collection}
        onClose={handlePostmanModalClose}
        onExported={handlePostmanModalClose}
      />
    );
  }

  return (
    <>
      <Modal size="lg" title={t('collection.share.title')} handleCancel={onClose} hideFooter>
        <StyledWrapper className="flex flex-col">
          <p className="text-sm mb-4">
            {t('collection.share.descriptionPrefix')}{' '}
            <a
              href="https://opencollection.com"
              target="_blank"
              rel="noopener noreferrer"
              className="opencollection-link"
            >
              OpenCollection
            </a>
            {' '}{t('collection.share.descriptionSuffix')}
          </p>

          {/* Bruno Format Section */}
          <div className="section-title">{t('collection.share.brunoFormat')}</div>
          <div className="bruno-format-grid mb-6">
            {/* ZIP Option */}
            <div
              className={`format-card ${selectedFormat === EXPORT_FORMATS.ZIP ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && setSelectedFormat(EXPORT_FORMATS.ZIP)}
            >
              <div className="card-header">
                <span className="card-title">{t('collection.share.zipTitle')}</span>
                <span className="recommended-badge">{t('collection.share.recommended')}</span>
              </div>
              <p className="card-description">{t('collection.share.zipDescription')}</p>
              <div className="feature-list">
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('collection.share.zipFeature1')}</span>
                </div>
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('collection.share.zipFeature2')}</span>
                </div>
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('collection.share.zipFeature3')}</span>
                </div>
              </div>
              <p className="best-for">{t('collection.share.zipBestFor')}</p>
            </div>

            {/* Single File YAML Option */}
            <div
              className={`format-card ${selectedFormat === EXPORT_FORMATS.YAML ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && setSelectedFormat(EXPORT_FORMATS.YAML)}
            >
              <div className="card-header">
                <span className="card-title">{t('collection.share.yamlTitle')}</span>
              </div>
              <p className="card-description">{t('collection.share.yamlDescription')}</p>
              <div className="feature-list">
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('collection.share.yamlFeature1')}</span>
                </div>
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('collection.share.yamlFeature2')}</span>
                </div>
              </div>
              <p className="best-for">{t('collection.share.yamlBestFor')}</p>
            </div>
          </div>

          <div className="section-title">{t('collection.share.otherFormat')}</div>
          <div className="other-format-grid">
            <div
              className={`other-format-card ${selectedFormat === EXPORT_FORMATS.POSTMAN ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && setSelectedFormat(EXPORT_FORMATS.POSTMAN)}
              data-testid="export-format-postman"
            >
              <div className="format-icon">
                <IconFileExport size={28} strokeWidth={1.5} />
              </div>
              <div className="format-info">
                <div className="format-name">Postman</div>
                <div className="format-description">{t('collection.share.exportForPostman')}</div>
              </div>
            </div>
            <div
              className={`other-format-card ${selectedFormat === EXPORT_FORMATS.OPENAPI ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && setSelectedFormat(EXPORT_FORMATS.OPENAPI)}
              data-testid="export-format-openapi"
            >
              <div className="format-icon">
                <IconFileCode size={28} strokeWidth={1.5} />
              </div>
              <div className="format-info">
                <div className="format-name">OpenAPI</div>
                <div className="format-description">{t('collection.share.exportForOpenapi')}</div>
              </div>
            </div>
          </div>

          {(selectedFormat === EXPORT_FORMATS.POSTMAN || selectedFormat === EXPORT_FORMATS.OPENAPI) && hasNonExportableRequestTypes.has && (
            <div className="flex items-center mt-4 p-3 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
              <IconAlertTriangle size={16} className="mr-2 flex-shrink-0" style={{ color: '#f59e0b' }} />
              <span className="text-sm" style={{ color: '#f59e0b' }}>
                {t('collection.share.nonExportableNote', { types: hasNonExportableRequestTypes.types.join(', ') })}
              </span>
            </div>
          )}

          <div className="modal-footer">
            <Button
              onClick={handleProceed}
              disabled={isDisabled}
              loading={isExporting}
            >
              {isExporting ? t('collection.share.exporting') : t('collection.share.proceed')}
            </Button>
          </div>
        </StyledWrapper>
      </Modal>
    </>
  );
};

export default ShareCollection;
