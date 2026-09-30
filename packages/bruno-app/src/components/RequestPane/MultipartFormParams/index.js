import React, { useCallback, useRef } from 'react';
import get from 'lodash/get';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { IconUpload } from '@tabler/icons';
import {
  moveMultipartFormParam,
  setMultipartFormParams
} from 'providers/ReduxStore/slices/collections';
import { browseFiles } from 'providers/ReduxStore/slices/collections/actions';
import MultiLineEditor from 'components/MultiLineEditor';
import SingleLineEditor from 'components/SingleLineEditor';
import MultipartFileChipsCell from 'components/MultipartFileChipsCell';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import { updateTableColumnWidths } from 'providers/ReduxStore/slices/tabs';
import EditableTable from 'components/EditableTable';
import { createDescriptionColumn } from 'components/EditableTable/descriptionColumn';
import StyledWrapper from './StyledWrapper';
import path, { getRelativePathWithinBasePath, normalizePath } from 'utils/common/path';
import { getMultipartAutoContentType } from 'utils/common/multipartContentType';
import { usePersistedState } from 'hooks/usePersistedState';
import { useTrackScroll } from 'hooks/useTrackScroll';
import { useTranslation } from 'react-i18next';

const fileBasename = (filePath) =>
  filePath ? path.basename(normalizePath(String(filePath))) : '';

const MultipartFormParams = ({ item, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const wrapperRef = useRef(null);
  const [scroll, setScroll] = usePersistedState({ key: `request-body-multipartForm-scroll-${item.uid}`, default: 0 });
  useTrackScroll({ ref: wrapperRef, selector: '.flex-boundary', onChange: setScroll, initialValue: scroll });
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const params = item.draft ? get(item, 'draft.request.body.multipartForm') : get(item, 'request.body.multipartForm');

  // Get column widths from Redux
  const focusedTab = tabs?.find((t) => t.uid === activeTabUid);
  const multipartFormWidths = focusedTab?.tableColumnWidths?.['multipart-form'] || {};

  const handleColumnWidthsChange = (tableId, widths) => {
    dispatch(updateTableColumnWidths({ uid: activeTabUid, tableId, widths }));
  };

  const onSave = () => dispatch(saveRequest(item.uid, collection.uid));
  const handleRun = () => dispatch(sendRequest(item, collection.uid));

  const handleParamsChange = useCallback((updatedParams) => {
    dispatch(setMultipartFormParams({
      collectionUid: collection.uid,
      itemUid: item.uid,
      params: updatedParams
    }));
  }, [dispatch, collection.uid, item.uid]);

  const handleParamDrag = useCallback(({ updateReorderedItem }) => {
    dispatch(moveMultipartFormParam({
      collectionUid: collection.uid,
      itemUid: item.uid,
      updateReorderedItem
    }));
  }, [dispatch, collection.uid, item.uid]);

  const handleBrowseFiles = useCallback((row, onChange) => {
    dispatch(browseFiles([], ['multiSelections']))
      .then((filePaths) => {
        if (!Array.isArray(filePaths) || filePaths.length === 0) return;

        const processedPaths = filePaths.map((filePath) => {
          return getRelativePathWithinBasePath(collection.pathname, filePath);
        });

        const currentParams = item.draft
          ? get(item, 'draft.request.body.multipartForm')
          : get(item, 'request.body.multipartForm');
        const existingParam = (currentParams || []).find((p) => p.uid === row.uid);
        const existingValue = existingParam && existingParam.type === 'file' && Array.isArray(existingParam.value)
          ? existingParam.value
          : [];
        const seen = new Set(existingValue);
        const merged = [...existingValue];
        const skipped = [];
        for (const p of processedPaths) {
          if (!seen.has(p)) {
            seen.add(p);
            merged.push(p);
          } else {
            skipped.push(p);
          }
        }

        if (skipped.length === 1) {
          toast(t('requestPane.multipart.fileAlreadyAdded', { name: fileBasename(skipped[0]) }));
        } else if (skipped.length > 1) {
          toast(t('requestPane.multipart.filesAlreadyAdded', { count: skipped.length }));
        }

        const autoContentType = getMultipartAutoContentType(merged);

        let updatedParams;
        if (existingParam) {
          updatedParams = currentParams.map((p) => {
            if (p.uid === row.uid) {
              return { ...p, type: 'file', value: merged, contentType: autoContentType };
            }
            return p;
          });
        } else {
          updatedParams = [
            ...(currentParams || []),
            { uid: row.uid, name: row.name || '', enabled: true, type: 'file', value: merged, contentType: autoContentType }
          ];
        }
        handleParamsChange(updatedParams);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [t, dispatch, collection.pathname, item, handleParamsChange]);

  const handleRemoveFile = useCallback((row, filePathToRemove) => {
    const currentParams = params || [];
    const target = currentParams.find((p) => p.uid === row.uid);
    if (!target || target.type !== 'file') return;
    const currentValue = Array.isArray(target.value)
      ? target.value
      : (target.value ? [target.value] : []);
    const nextValue = currentValue.filter((p) => p !== filePathToRemove);

    const updatedParams = currentParams.map((p) => {
      if (p.uid !== row.uid) return p;
      if (nextValue.length === 0) {
        return { ...p, type: 'text', value: '', contentType: '' };
      }
      return { ...p, type: 'file', value: nextValue, contentType: getMultipartAutoContentType(nextValue) };
    });
    handleParamsChange(updatedParams);
  }, [params, handleParamsChange]);

  const handleValueChange = useCallback((row, newValue, onChange) => {
    const currentParams = params || [];
    const existingParam = currentParams.find((p) => p.uid === row.uid);
    if (existingParam) {
      const updatedParams = currentParams.map((p) => {
        if (p.uid === row.uid) {
          return { ...p, type: 'text', value: newValue };
        }
        return p;
      });
      handleParamsChange(updatedParams);
    } else {
      onChange(newValue);
    }
  }, [params, handleParamsChange]);

  const getFileList = (filePaths) => {
    if (!filePaths || (Array.isArray(filePaths) && filePaths.length === 0)) {
      return [];
    }
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    return paths.filter((v) => v != null && v !== '');
  };

  const columns = [
    {
      key: 'name',
      name: t('requestPane.common.key'),
      isKeyField: true,
      placeholder: t('requestPane.common.key'),
      width: '20%'
    },
    {
      key: 'value',
      name: t('requestPane.common.value'),
      placeholder: t('requestPane.common.value'),
      width: '35%',
      render: ({ row, value, onChange }) => {
        const files = row.type === 'file' ? getFileList(value) : [];
        if (files.length > 0) {
          return (
            <MultipartFileChipsCell
              files={files}
              onRemove={(filePath) => handleRemoveFile(row, filePath)}
              onAdd={() => handleBrowseFiles(row, onChange)}
            />
          );
        }

        return (
          <div className="flex items-center value-cell">
            <div className="flex-1">
              <MultiLineEditor
                onSave={onSave}
                theme={storedTheme}
                value={value || ''}
                onChange={(newValue) => handleValueChange(row, newValue, onChange)}
                onRun={handleRun}
                allowNewlines={true}
                collection={collection}
                item={item}
                placeholder={!value ? t('requestPane.common.value') : ''}
              />
            </div>
            <button
              data-testid="multipart-file-upload"
              className="upload-btn ml-1"
              onClick={() => handleBrowseFiles(row, onChange)}
              title={t('requestPane.common.selectFile')}
            >
              <IconUpload size={16} />
            </button>
          </div>
        );
      }
    },
    {
      key: 'contentType',
      name: 'Content-Type',
      placeholder: t('requestPane.common.auto'),
      width: '20%',
      render: ({ value, onChange }) => (
        <SingleLineEditor
          onSave={onSave}
          theme={storedTheme}
          placeholder={!value ? t('requestPane.common.auto') : ''}
          value={value || ''}
          onChange={onChange}
          onRun={handleRun}
          collection={collection}
        />
      )
    },
    createDescriptionColumn({
      theme: storedTheme,
      onSave,
      onRun: handleRun,
      collection,
      item
    })
  ];

  const defaultRow = {
    name: '',
    value: '',
    contentType: '',
    type: 'text',
    description: ''
  };

  return (
    <StyledWrapper className="w-full" ref={wrapperRef}>
      <EditableTable
        tableId="multipart-form"
        testId="multipart-form-table"
        columns={columns}
        rows={params || []}
        onChange={handleParamsChange}
        defaultRow={defaultRow}
        reorderable={true}
        onReorder={handleParamDrag}
        columnWidths={multipartFormWidths}
        onColumnWidthsChange={(widths) => handleColumnWidthsChange('multipart-form', widths)}
        initialScroll={scroll}
      />
    </StyledWrapper>
  );
};

export default MultipartFormParams;
