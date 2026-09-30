import React, { useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'providers/Theme';
import get from 'lodash/get';
import { moveResponseExampleParam, setResponseExampleParams } from 'providers/ReduxStore/slices/collections';
import { updateTableColumnWidths } from 'providers/ReduxStore/slices/tabs';
import EditableTable from 'components/EditableTable';
import SingleLineEditor from 'components/SingleLineEditor';
import BulkEditor from 'components/BulkEditor';
import InfoTip from 'components/InfoTip';
import StyledWrapper from './StyledWrapper';

const ResponseExampleParams = ({ editMode, item, collection, exampleUid }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  // Get column widths from Redux
  const focusedTab = tabs?.find((t) => t.uid === activeTabUid);
  const exampleQueryParamsWidths = focusedTab?.tableColumnWidths?.['example-query-params'] || {};
  const examplePathParamsWidths = focusedTab?.tableColumnWidths?.['example-path-params'] || {};

  const handleColumnWidthsChange = (tableId, widths) => {
    dispatch(updateTableColumnWidths({ uid: activeTabUid, tableId, widths }));
  };

  const params = useMemo(() => {
    return item.draft
      ? get(item, 'draft.examples', []).find((e) => e.uid === exampleUid)?.request?.params || []
      : get(item, 'examples', []).find((e) => e.uid === exampleUid)?.request?.params || [];
  }, [item, exampleUid]);

  const queryParams = params.filter((param) => param.type === 'query');
  const pathParams = params.filter((param) => param.type === 'path');

  const handleQueryParamsChange = useCallback((updatedQueryParams) => {
    if (!editMode) {
      return;
    }

    // Merge updated query params with path params
    const allParams = [...updatedQueryParams, ...pathParams];
    dispatch(setResponseExampleParams({
      itemUid: item.uid,
      collectionUid: collection.uid,
      exampleUid: exampleUid,
      params: allParams
    }));
  }, [editMode, dispatch, item.uid, collection.uid, exampleUid, pathParams]);

  const handleQueryParamDrag = useCallback(({ updateReorderedItem }) => {
    if (!editMode) {
      return;
    }

    dispatch(moveResponseExampleParam({
      itemUid: item.uid,
      collectionUid: collection.uid,
      exampleUid: exampleUid,
      updateReorderedItem
    }));
  }, [editMode, dispatch, item.uid, collection.uid, exampleUid]);

  const handlePathParamsChange = useCallback((updatedPathParams) => {
    if (!editMode) {
      return;
    }

    // Merge updated path params with query params
    const allParams = [...queryParams, ...updatedPathParams];
    dispatch(setResponseExampleParams({
      itemUid: item.uid,
      collectionUid: collection.uid,
      exampleUid: exampleUid,
      params: allParams
    }));
  }, [editMode, dispatch, item.uid, collection.uid, exampleUid, queryParams]);

  const toggleBulkEditMode = () => {
    setIsBulkEditMode(!isBulkEditMode);
  };

  const handleBulkParamsChange = (newParams) => {
    if (!editMode) {
      return;
    }

    // Merge bulk edited query params with path params
    const allParams = [...newParams, ...pathParams];
    dispatch(setResponseExampleParams({
      itemUid: item.uid,
      collectionUid: collection.uid,
      exampleUid: exampleUid,
      params: allParams
    }));
  };

  if (isBulkEditMode && editMode) {
    return (
      <StyledWrapper className="w-full mt-3">
        <BulkEditor
          params={queryParams}
          onChange={handleBulkParamsChange}
          onToggle={toggleBulkEditMode}
        />
      </StyledWrapper>
    );
  }

  const queryColumns = [
    {
      key: 'name',
      name: t('collection.table.name'),
      isKeyField: true,
      placeholder: t('collection.table.name'),
      width: '40%',
      readOnly: !editMode,
      render: ({ value, onChange }) => (
        <SingleLineEditor
          value={value || ''}
          theme={storedTheme}
          onSave={() => {}}
          onChange={onChange}
          onRun={() => {}}
          collection={collection}
          variablesAutocomplete={true}
          readOnly={!editMode}
          placeholder={!value ? t('collection.table.name') : ''}
        />
      )
    },
    {
      key: 'value',
      name: t('collection.table.value'),
      placeholder: t('collection.table.value'),
      width: '60%',
      readOnly: !editMode,
      render: ({ value, onChange }) => (
        <SingleLineEditor
          value={value || ''}
          theme={storedTheme}
          onSave={() => {}}
          onChange={onChange}
          onRun={() => {}}
          collection={collection}
          variablesAutocomplete={true}
          readOnly={!editMode}
          placeholder={!value ? t('collection.table.value') : ''}
        />
      )
    }
  ];

  const pathColumns = [
    {
      key: 'name',
      name: t('collection.table.name'),
      readOnly: true,
      width: '40%'
    },
    {
      key: 'value',
      name: t('collection.table.value'),
      placeholder: t('collection.table.value'),
      width: '60%',
      readOnly: !editMode,
      render: ({ value, onChange }) => (
        <SingleLineEditor
          value={value || ''}
          theme={storedTheme}
          onSave={() => {}}
          onChange={onChange}
          onRun={() => {}}
          collection={collection}
          variablesAutocomplete={true}
          readOnly={!editMode}
          placeholder={!value ? t('collection.table.value') : ''}
        />
      )
    }
  ];

  const defaultQueryRow = {
    name: '',
    value: '',
    enabled: true,
    type: 'query'
  };

  if (queryParams.length === 0 && pathParams.length === 0 && !editMode) {
    return null;
  }

  return (
    <StyledWrapper className="w-full mt-4">
      <div className="mb-3 title text-xs font-bold">{t('collection.example.queryParams')}</div>
      <EditableTable
        tableId="example-query-params"
        columns={queryColumns}
        rows={queryParams || []}
        onChange={handleQueryParamsChange}
        defaultRow={defaultQueryRow}
        reorderable={editMode}
        onReorder={handleQueryParamDrag}
        showAddRow={editMode}
        showDelete={editMode}
        disableCheckbox={!editMode}
        columnWidths={exampleQueryParamsWidths}
        onColumnWidthsChange={(widths) => handleColumnWidthsChange('example-query-params', widths)}
      />
      {editMode && (
        <div className="flex justify-end mt-2">
          <button
            className="btn-action text-link select-none"
            onClick={toggleBulkEditMode}
          >
            {t('common.bulkEdit')}
          </button>
        </div>
      )}
      {pathParams && pathParams.length > 0 && (
        <>
          <div className="mb-3 title text-xs font-bold flex items-stretch mt-4">
            <span>{t('collection.example.pathParams')}</span>
            <InfoTip infotipId="path-param-InfoTip">
              <div>
                {t('collection.example.pathParamsTipPrefix')}
                <code className="font-mono mx-2">:name</code>
                {t('collection.example.pathParamsTipMiddle')} <br /> {t('collection.example.pathParamsTipSuffix')}
                <code className="font-mono mx-2">
                  https://example.com/v1/users/<span>:id</span>
                </code>
              </div>
            </InfoTip>
          </div>
          <EditableTable
            tableId="example-path-params"
            columns={pathColumns}
            rows={pathParams}
            onChange={handlePathParamsChange}
            defaultRow={{}}
            showCheckbox={false}
            showDelete={false}
            showAddRow={false}
            reorderable={false}
            columnWidths={examplePathParamsWidths}
            onColumnWidthsChange={(widths) => handleColumnWidthsChange('example-path-params', widths)}
          />
        </>
      )}

    </StyledWrapper>
  );
};

export default ResponseExampleParams;
