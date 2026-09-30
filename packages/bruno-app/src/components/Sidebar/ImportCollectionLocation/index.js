import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import get from 'lodash/get';
import path from 'utils/common/path';
import { IconCaretDown } from '@tabler/icons';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { postmanToBruno } from 'utils/importers/postman-collection';
import { convertInsomniaToBruno } from 'utils/importers/insomnia-collection';
import { convertOpenapiToBruno } from 'utils/importers/openapi-collection';
import { processBrunoCollection } from 'utils/importers/bruno-collection';
import { processOpenCollection } from 'utils/importers/opencollection';
import { wsdlToBruno } from '@usebruno/converters';
import { toastError } from 'utils/common/error';
import { addLog } from 'providers/ReduxStore/slices/logs';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import Help from 'components/Help';
import Dropdown from 'components/Dropdown';
import StyledWrapper from './StyledWrapper';
import { showImportIssuesToast } from 'components/Toast/ImportIssuesToast';
import { DEFAULT_COLLECTION_FORMAT } from 'utils/common/constants';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

// Extract collection name from raw data
const getCollectionName = (format, rawData) => {
  if (!rawData) return i18n.t('sidebar.import.nameFallback');

  switch (format) {
    case 'openapi':
      return rawData.info?.title || i18n.t('sidebar.import.openapiFallback');
    case 'postman':
      return rawData.info?.name || rawData.collection?.info?.name || i18n.t('sidebar.import.postmanFallback');
    case 'insomnia':
      // For Insomnia v4 format, name is in the workspace resource
      if (rawData.resources && Array.isArray(rawData.resources)) {
        const workspace = rawData.resources.find((r) => r._type === 'workspace');
        if (workspace?.name) {
          return workspace.name;
        }
      }
      // Fallback to root name property
      return rawData.name || i18n.t('sidebar.import.insomniaFallback');
    case 'bruno':
      return rawData.name || i18n.t('sidebar.import.brunoFallback');
    case 'opencollection':
      return rawData.info?.name || 'OpenCollection';
    case 'wsdl':
      return i18n.t('sidebar.import.wsdlFallback');
    case 'bruno-zip':
      return rawData.collectionName || i18n.t('sidebar.import.brunoFallback');
    default:
      return i18n.t('sidebar.import.nameFallback');
  }
};

// Convert raw data to Bruno collection format
// Returns { collection, issues } where issues tracks items that were skipped or degraded
const convertCollection = async (format, rawData, { groupingType, collectionFormat, preserveScripts } = {}) => {
  try {
    let collection;
    let issues = [];

    switch (format) {
      case 'openapi':
        collection = convertOpenapiToBruno(rawData, { groupBy: groupingType, collectionFormat });
        break;
      case 'wsdl':
        collection = await wsdlToBruno(rawData);
        break;
      case 'postman': {
        const result = await postmanToBruno(rawData, { preserveScripts });
        collection = result.collection;
        issues = result.issues || [];
        break;
      }
      case 'insomnia':
        collection = convertInsomniaToBruno(rawData);
        break;
      case 'bruno':
        collection = await processBrunoCollection(rawData);
        break;
      case 'opencollection':
        collection = await processOpenCollection(rawData);
        break;
      case 'bruno-zip':
        // ZIP doesn't need conversion
        collection = rawData;
        break;
      default:
        throw new Error(i18n.t('sidebar.import.unknownFormat'));
    }

    return { collection, issues };
  } catch (err) {
    console.error('Conversion error:', err);
    toastError(err, i18n.t('sidebar.toast.errorConvertingCollection'));
    throw err;
  }
};

const ImportCollectionLocation = ({ onClose, handleSubmit, rawData, format, sourceUrl, filePath, rawContent }) => {
  const { t } = useTranslation();
  const inputRef = useRef();
  const dispatch = useDispatch();
  const [groupingType, setGroupingType] = useState('tags');
  const [collectionFormat, setCollectionFormat] = useState(DEFAULT_COLLECTION_FORMAT);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [enableCheckForSpecUpdates, setEnableCheckForSpecUpdates] = useState(false);
  const [preserveScripts, setPreserveScripts] = useState(false);
  const dropdownTippyRef = useRef();
  const optionsDropdownTippyRef = useRef();
  const isOpenApi = format === 'openapi';
  const isPostman = format === 'postman';
  const isZipImport = format === 'bruno-zip';
  const isOpenApiFromUrl = isOpenApi && !!sourceUrl && !filePath;
  const isOpenApiFromFile = isOpenApi && !!filePath && !sourceUrl;
  const isSwagger2 = isOpenApi && rawData?.swagger && String(rawData.swagger).startsWith('2');
  const showCheckForSpecUpdatesOption = isOpenApiFromUrl || isOpenApiFromFile;

  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);
  const preferences = useSelector((state) => state.app.preferences);
  const activeWorkspace = workspaces.find((w) => w.uid === activeWorkspaceUid);
  const isDefaultWorkspace = !activeWorkspace || activeWorkspace.type === 'default';

  const defaultLocation = isDefaultWorkspace
    ? get(preferences, 'general.defaultLocation', '')
    : (activeWorkspace?.pathname ? path.join(activeWorkspace.pathname, 'collections') : '');

  const collectionName = getCollectionName(format, rawData);

  const groupingOptions = [
    { value: 'tags', label: t('sidebar.import.groupingTags'), description: t('sidebar.import.groupingTagsDesc'), testId: 'grouping-option-tags' },
    { value: 'path', label: t('sidebar.import.groupingPaths'), description: t('sidebar.import.groupingPathsDesc'), testId: 'grouping-option-path' }
  ];

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      collectionLocation: defaultLocation
    },
    validationSchema: Yup.object({
      collectionLocation: Yup.string()
        .min(1, t('sidebar.validation.min1Char'))
        .max(500, t('sidebar.validation.max500'))
        .required(t('sidebar.validation.locationRequired'))
    }),
    onSubmit: async (values) => {
      const { collection: convertedCollection, issues } = await convertCollection(format, rawData, { groupingType, collectionFormat, preserveScripts });
      const options = { format: collectionFormat };

      if (showCheckForSpecUpdatesOption && enableCheckForSpecUpdates) {
        const syncSourceUrl = sourceUrl || filePath; // URL or absolute path (backend converts to relative)
        const baseBrunoConfig = {
          version: convertedCollection.version || '1',
          name: convertedCollection.name || 'Untitled Collection',
          type: 'collection',
          ignore: ['node_modules', '.git']
        };

        convertedCollection.brunoConfig = {
          ...baseBrunoConfig,
          ...convertedCollection.brunoConfig,
          openapi: [
            {
              sourceUrl: syncSourceUrl,
              groupBy: groupingType,
              autoCheck: true,
              autoCheckInterval: 5
            }
          ]
        };

        options.rawOpenAPISpec = rawContent || rawData;
      }

      handleSubmit(convertedCollection, values.collectionLocation, options);

      if (issues && issues.length > 0) {
        // Show toast with copy/report actions
        showImportIssuesToast(issues);

        // Log each issue to Bruno's internal console
        const skipped = issues.filter((i) => i.severity === 'error').length;
        const warnings = issues.filter((i) => i.severity === 'warning').length;
        const parts = [];
        if (skipped > 0) parts.push(`skipped ${skipped} item(s)`);
        if (warnings > 0) parts.push(`${warnings} warning(s)`);
        const timestamp = new Date().toISOString();
        dispatch(addLog({ type: 'warn', args: [`Import: ${collectionName} — ${parts.join(', ')}`], timestamp }));
        issues.forEach((issue) => {
          const logType = issue.severity === 'error' ? 'error' : 'warn';
          const logArgs = [`[${issue.path}] ${issue.message}`];
          if (issue.sourceItem) logArgs.push(issue.sourceItem);
          dispatch(addLog({ type: logType, args: logArgs, timestamp }));
        });
      }
    }
  });

  const onDropdownCreate = (ref) => {
    dropdownTippyRef.current = ref;
  };

  const onOptionsDropdownCreate = (ref) => {
    optionsDropdownTippyRef.current = ref;
  };

  const ImportOptions = forwardRef((props, ref) => {
    return (
      <div ref={ref} className="flex items-center text-link cursor-pointer">
        <button className="btn-advanced" type="button">
          {t('sidebar.options')}
        </button>
        <IconCaretDown className="caret ml-1" size={14} strokeWidth={2} />
      </div>
    );
  });

  const GroupingDropdownIcon = forwardRef((props, ref) => {
    const selectedOption = groupingOptions.find((option) => option.value === groupingType);
    return (
      <div ref={ref} className="flex items-center justify-between w-full current-group" data-testid="grouping-dropdown">
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{selectedOption.label}</div>
        </div>
        <IconCaretDown size={16} className="text-gray-400 ml-[0.25rem]" fill="currentColor" />
      </div>
    );
  });
  const browse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string' && dirPath.length > 0) {
          formik.setFieldValue('collectionLocation', dirPath);
        }
      })
      .catch((error) => {
        formik.setFieldValue('collectionLocation', '');
        console.error(error);
      });
  };

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const onSubmit = async () => {
    if (isZipImport) {
      const errors = await formik.validateForm();
      if (Object.keys(errors).length > 0) {
        formik.setTouched({ collectionLocation: true });
        return;
      }
      const collectionLocation = formik.values.collectionLocation;
      handleSubmit(rawData, collectionLocation, { format: collectionFormat, isZipImport: true });
    } else {
      formik.handleSubmit();
    }
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="md"
          title={t('sidebar.import.title')}
          confirmText={t('sidebar.import.import')}
          handleConfirm={onSubmit}
          handleCancel={onClose}
          dataTestId="import-collection-location-modal"
          footerLeft={
            !isZipImport ? (
              <div className="advanced-options flex">
                <Dropdown onCreate={onOptionsDropdownCreate} icon={<ImportOptions />} placement="bottom-start">
                  <div
                    className="dropdown-item"
                    data-testid="show-advanced-options-toggle"
                    onClick={() => {
                      optionsDropdownTippyRef?.current?.hide();
                      setShowAdvancedOptions(!showAdvancedOptions);
                    }}
                  >
                    {showAdvancedOptions ? t('sidebar.hideAdvancedOptions') : t('sidebar.showAdvancedOptions')}
                  </div>
                </Dropdown>
              </div>
            ) : null
          }
        >
          <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="collectionName" className="block font-medium">
                {t('sidebar.name')}
              </label>
              <div className="mt-2">{collectionName}</div>

              <>
                <label htmlFor="collectionLocation" className="font-medium mt-4 flex items-center">
                  {t('sidebar.location')}
                  <Help>
                    <p>{t('sidebar.locationHelp1')}</p>
                    <p className="mt-2">{t('sidebar.locationHelp2')}</p>
                  </Help>
                </label>
                <input
                  id="collection-location"
                  type="text"
                  name="collectionLocation"
                  className="block textbox mt-2 w-full cursor-pointer"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  value={formik.values.collectionLocation || ''}
                  onClick={browse}
                  onChange={(e) => {
                    formik.setFieldValue('collectionLocation', e.target.value);
                  }}
                />
              </>
              {formik.touched.collectionLocation && formik.errors.collectionLocation ? (
                <div className="text-red-500">{formik.errors.collectionLocation}</div>
              ) : null}

              <div className="mt-1">
                <span
                  data-testid="import-collection-browse-link"
                  className="text-link cursor-pointer hover:underline"
                  onClick={browse}
                >
                  {t('sidebar.browse')}
                </span>
              </div>

              {showAdvancedOptions && !isZipImport && (
                <div className="mt-4">
                  <label htmlFor="format" className="flex items-center font-medium">
                    {t('sidebar.fileFormat')}
                    <Help width="300">
                      <p>{t('sidebar.fileFormatHelp1')}</p>
                      <p className="mt-2">
                        <strong>{t('sidebar.fileFormat.ocTitle')}</strong> {t('sidebar.fileFormat.ocDesc')}
                      </p>
                      <p className="mt-1">
                        <strong>{t('sidebar.fileFormat.bruTitle')}</strong> {t('sidebar.fileFormat.bruDesc')}
                      </p>
                    </Help>
                  </label>
                  <select
                    id="format"
                    name="format"
                    className="block textbox mt-2 w-full"
                    value={collectionFormat}
                    onChange={(e) => setCollectionFormat(e.target.value)}
                  >
                    <option value="yml">{t('sidebar.fileFormat.ocOption')}</option>
                    <option value="bru">{t('sidebar.fileFormat.bruOption')}</option>
                  </select>
                </div>
              )}

              {showAdvancedOptions && isPostman && (
                <label className="mt-4 flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveScripts}
                    onChange={(e) => setPreserveScripts(e.target.checked)}
                    className="checkbox cursor-pointer mt-0.5"
                    data-testid="preserve-scripts-toggle"
                  />
                  <div>
                    <span className="checkbox-option-label">{t('sidebar.preserveScripts')}</span>
                    <p className="checkbox-option-description">
                      {t('sidebar.import.preserveScriptsDesc')}
                    </p>
                  </div>
                </label>
              )}
            </div>

            {isOpenApi && (
              <div className="mt-4 flex gap-4 items-center justify-between">
                <div>
                  <label htmlFor="groupingType" className="block font-medium">
                    {t('sidebar.import.folderArrangement')}
                  </label>
                  <p className="text-muted text-xs mt-1 mb-2">
                    {t('sidebar.import.folderArrangementDesc')}
                  </p>
                </div>
                <div className="relative">
                  <Dropdown onCreate={onDropdownCreate} icon={<GroupingDropdownIcon />} placement="bottom-start">
                    {groupingOptions.map((option) => (
                      <div
                        key={option.value}
                        className="dropdown-item"
                        data-testid={option.testId}
                        onClick={() => {
                          dropdownTippyRef?.current?.hide();
                          setGroupingType(option.value);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </Dropdown>
                </div>
              </div>
            )}
            {showCheckForSpecUpdatesOption && (
              <label className={`mt-4 flex items-start gap-2 ${isSwagger2 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={isSwagger2 ? false : enableCheckForSpecUpdates}
                  onChange={(e) => setEnableCheckForSpecUpdates(e.target.checked)}
                  disabled={isSwagger2}
                  className={`checkbox mt-0.5 ${isSwagger2 ? '' : 'cursor-pointer'}`}
                />
                <div>
                  <span className="checkbox-option-label">{t('sidebar.import.checkForSpecUpdates')}</span>
                  <p className="checkbox-option-description">
                    {isSwagger2
                      ? t('sidebar.import.swagger2Unsupported')
                      : t('sidebar.import.checkForSpecUpdatesDesc')}
                  </p>
                </div>
              </label>
            )}
          </form>
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default ImportCollectionLocation;
