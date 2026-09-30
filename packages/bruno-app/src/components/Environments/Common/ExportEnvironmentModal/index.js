import React, { useState, useEffect, useMemo } from 'react';
import Portal from 'components/Portal/index';
import Modal from 'components/Modal';
import { exportBrunoEnvironment } from 'utils/exporters/bruno-environment';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { IconAlertTriangle } from '@tabler/icons';
import { getInheritedEnvironments } from '@usebruno/common/utils';
import StyledWrapper from './StyledWrapper';
import Button from 'ui/Button';

const ExportEnvironmentModal = ({ onClose, environments = [], environmentType }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Helper function to truncate environment names
  const truncateEnvName = (name) => {
    if (name.length > 40) {
      return name.substring(0, 40) + '...';
    }
    return name;
  };

  const [isExporting, setIsExporting] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [selectedEnvironments, setSelectedEnvironments] = useState({});
  const [exportFormat, setExportFormat] = useState(environments.length > 1 ? 'single-file' : 'single-object');

  // Initialize selected environments
  useEffect(() => {
    const initialSelection = {};

    // Add all environments and select them by default
    environments.forEach((env) => {
      initialSelection[env.uid] = true;
    });

    setSelectedEnvironments(initialSelection);
  }, [environments]);

  useEffect(() => {
    const selectedCount = Object.values(selectedEnvironments).filter(Boolean).length;
    if (selectedCount <= 1) {
      setExportFormat('single-object');
    }
    if (exportFormat === 'single-object' && selectedCount > 1) {
      setExportFormat('single-file');
    }
  }, [selectedEnvironments]);

  const browse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string') {
          setFilePath(dirPath);
        }
      })
      .catch((error) => {
        setFilePath('');
        console.error(error);
      });
  };

  const handleEnvironmentToggle = (envUid) => {
    setSelectedEnvironments((prev) => {
      const newSelection = {
        ...prev,
        [envUid]: !prev[envUid]
      };
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    const allSelected = environments.every((env) => selectedEnvironments[env.uid]) || false;

    const newSelection = environments.reduce((acc, env) => ({
      ...acc,
      [env.uid]: !allSelected
    }), {}) || {};

    setSelectedEnvironments(newSelection);
  };

  // Memoized selected environments and count
  const selectedEnvs = useMemo(() => {
    return environments.filter((env) => selectedEnvironments[env.uid]) || [];
  }, [environments, selectedEnvironments]);

  const selectedCount = selectedEnvs.length;

  const unselectedInheritedEnvironmentNamesByUid = useMemo(() => {
    const namesByUid = {};

    environments.forEach((environment) => {
      if (!selectedEnvironments[environment.uid]) {
        namesByUid[environment.uid] = [];
        return;
      }

      const { inheritedEnvironments, missingInheritedEnvironmentName } = getInheritedEnvironments({
        environments,
        environment
      });

      const unselectedNames = inheritedEnvironments
        .filter((inheritedEnvironment) => !selectedEnvironments[inheritedEnvironment.uid])
        .map((inheritedEnvironment) => inheritedEnvironment.name);

      namesByUid[environment.uid] = missingInheritedEnvironmentName
        ? [missingInheritedEnvironmentName, ...unselectedNames]
        : unselectedNames;
    });

    return namesByUid;
  }, [environments, selectedEnvironments]);

  const exportFormatOptions = useMemo(() => {
    const isMultiple = selectedCount > 1;

    if (isMultiple) {
      return [
        { value: 'single-file', label: t('environments.export.singleFile'), description: t('environments.export.singleFileAll') },
        { value: 'folder', label: t('environments.export.folder'), description: t('environments.export.folderEach'), disabled: false }
      ];
    }

    return [
      { value: 'single-object', label: t('environments.export.singleFile'), description: t('environments.export.singleObjectDesc') },
      { value: 'folder', label: t('environments.export.folder'), description: t('environments.export.folderEach'), disabled: true }
    ];
  }, [selectedCount, exportFormat, t]);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      if (!filePath) {
        toast.error(t('environments.export.selectLocationToast'));
        return;
      }

      if (selectedCount === 0) {
        toast.error(t('environments.export.selectAtLeastOne'));
        return;
      }

      await exportBrunoEnvironment({ environments: selectedEnvs, environmentType, filePath, exportFormat });

      const successMessage = exportFormat === 'folder'
        ? t('environments.export.exportedToFolder', { type: environmentType })
        : t('environments.export.exported');
      toast.success(successMessage);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || t('environments.export.failed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="md"
          title={t('environments.export.title')}
          hideFooter={true}
          handleCancel={onClose}
        >
          <div className="py-2">
            {/* Environments Section */}
            <div className="mb-4">
              {environments && environments.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2 pb-1">
                    <h3 className="font-medium text-theme">
                      {environmentType === 'global' ? t('environments.export.globalEnvironments') : t('environments.export.collectionEnvironments')}
                    </h3>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-link px-1 py-0.5 rounded transition-colors"
                    >
                      {environments.every((env) => selectedEnvironments[env.uid]) ? t('environments.export.deselectAll') : t('environments.export.selectAll')}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
                    {environments.map((env) => {
                      const unselectedInheritedEnvironmentNames = unselectedInheritedEnvironmentNamesByUid[env.uid];

                      return (
                        <div key={env.uid}>
                          <label className="environment-item">
                            <input
                              type="checkbox"
                              checked={selectedEnvironments[env.uid] || false}
                              onChange={() => handleEnvironmentToggle(env.uid)}
                              disabled={isExporting}
                              className="w-3.5 h-3.5 flex-shrink-0"
                            />
                            <span className="environment-name">{truncateEnvName(env.name)}</span>
                          </label>
                          {unselectedInheritedEnvironmentNames.length > 0 && (
                            <div className="inheritance-warning" data-testid="env-export-inheritance-warning">
                              <IconAlertTriangle size={14} strokeWidth={1.5} className="warning-icon" />
                              <span>
                                {t('environments.export.inherits')}{' '}
                                <span className="inherited-name">{unselectedInheritedEnvironmentNames.join(', ')}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2 pb-1">
                    <h3 className="font-medium text-theme">
                      {environmentType === 'global' ? t('environments.export.globalEnvironments') : t('environments.export.collectionEnvironments')}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center flex-1 p-4 text-center">
                    <span className="text-xs text-muted">
                      {environmentType === 'global' ? t('environments.export.noGlobalEnvironments') : t('environments.export.noCollectionEnvironments')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Export Format Section */}
            {selectedCount > 0 && (
              <div className="mb-4">
                <label className="block font-medium mb-2 text-theme">
                  {t('environments.export.format')}
                </label>
                <div className="space-y-2">
                  {exportFormatOptions.map((option) => (
                    <label key={option.value} className={`flex items-start p-2 rounded transition-colors ${option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        name="exportFormat"
                        value={option.value}
                        checked={exportFormat === option.value}
                        onChange={(e) => setExportFormat(e.target.value)}
                        disabled={isExporting || option.disabled}
                        className={`mt-0.5 mr-3 w-4 h-4 ${option.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      />
                      <div>
                        <div className={`font-medium ${option.disabled ? 'text-muted' : 'text-theme'}`}>{option.label}</div>
                        <div className="text-xs text-muted">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Location Input Section */}
            <div className="mb-4">
              <label htmlFor="export-location" className="block font-medium mb-2 text-theme">
                {t('environments.export.location')}
              </label>
              <div className="flex flex-col relative items-center">
                <input
                  id="export-location"
                  type="text"
                  className={`flex-1 textbox w-full ${isExporting || selectedCount <= 0 ? '' : 'cursor-pointer'}`}
                  title={filePath}
                  value={filePath}
                  onClick={browse}
                  onChange={(e) => setFilePath(e.target.value)}
                  disabled={isExporting || selectedCount <= 0}
                  placeholder={t('environments.export.selectLocation')}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                size="sm"
                color="secondary"
                variant="ghost"
                onClick={onClose}
                disabled={isExporting}
                className="mt-2 mr-2"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || selectedCount === 0}
                className="mt-2"
              >
                {isExporting ? t('environments.export.exporting') : selectedCount !== 1 ? t('environments.export.exportCount', { num: selectedCount }) : t('environments.export.exportOne', { num: selectedCount })}
              </Button>
            </div>
          </div>
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default ExportEnvironmentModal;
