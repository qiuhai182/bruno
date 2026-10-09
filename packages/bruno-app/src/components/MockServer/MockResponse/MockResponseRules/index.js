import React, { useEffect, useMemo, useRef } from 'react';
import EditableTable from 'components/EditableTable';
import { uuid } from 'utils/common';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const DEFAULT_CONDITION = {
  target: 'header',
  key: '',
  operator: 'equals',
  value: ''
};

const KEY_PLACEHOLDERS = {
  body: '$.user.type',
  query: 'page',
  header: 'x-api-key'
};

const MockResponseRules = ({ rules, editMode, onChange, onAddRule }) => {
  const { t } = useTranslation();
  const conditions = rules?.conditions || [];
  const operator = rules?.operator === 'OR' ? 'OR' : 'AND';
  const rowUidsRef = useRef([]);
  const wrapperRef = useRef(null);
  const focusAddRowPendingRef = useRef(false);

  const targetOptions = [
    { value: 'header', label: t('mockServer.rules.targetHeader') },
    { value: 'query', label: t('mockServer.rules.targetQuery') },
    { value: 'body', label: t('mockServer.rules.targetBody') }
  ];

  const operatorOptions = [
    { value: 'equals', label: t('mockServer.rules.equals') },
    { value: 'not_equals', label: t('mockServer.rules.notEquals') },
    { value: 'contains', label: t('mockServer.rules.contains') },
    { value: 'matches', label: t('mockServer.rules.matches') }
  ];

  const handleAddRule = () => {
    focusAddRowPendingRef.current = true;
    onAddRule();
  };

  useEffect(() => {
    if (!editMode || !focusAddRowPendingRef.current) {
      return;
    }

    focusAddRowPendingRef.current = false;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      const keyInput = wrapperRef.current
        ?.querySelector('tbody tr:last-child [data-testid="column-key"] input');

      if (keyInput) {
        keyInput.focus();
        clearInterval(interval);
      } else if (attempts >= 20) {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [editMode]);

  const rows = useMemo(() => conditions.map((condition, index) => {
    if (condition.uid) {
      return condition;
    }

    rowUidsRef.current[index] = rowUidsRef.current[index] || uuid();
    return { ...condition, uid: rowUidsRef.current[index] };
  }), [conditions]);

  const handleRowsChange = (updatedRows) => {
    onChange({
      operator,
      conditions: updatedRows.map((row) => ({
        uid: row.uid,
        target: row.target || DEFAULT_CONDITION.target,
        key: row.key || '',
        operator: row.operator || DEFAULT_CONDITION.operator,
        value: row.value || ''
      }))
    });
  };

  const columns = [
    {
      key: 'target',
      name: t('mockServer.rules.colTarget'),
      width: '20%',
      render: ({ value, onChange: onCellChange }) => (
        <select
          value={value || DEFAULT_CONDITION.target}
          disabled={!editMode}
          onChange={(event) => onCellChange(event.target.value)}
          aria-label={t('mockServer.rules.targetAria')}
        >
          {targetOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )
    },
    {
      key: 'key',
      name: t('mockServer.rules.colKey'),
      isKeyField: true,
      width: '27%',
      readOnly: !editMode,
      placeholder: KEY_PLACEHOLDERS.header,
      render: ({ row, value, onChange: onCellChange }) => (
        <input
          type="text"
          autoComplete="off"
          spellCheck="false"
          className="mousetrap"
          value={value || ''}
          readOnly={!editMode}
          placeholder={KEY_PLACEHOLDERS[row.target] || KEY_PLACEHOLDERS.header}
          onChange={(event) => onCellChange(event.target.value)}
        />
      )
    },
    {
      key: 'operator',
      name: t('mockServer.rules.colOperator'),
      width: '22%',
      render: ({ value, onChange: onCellChange }) => (
        <select
          value={value === 'regex' ? 'matches' : (value || DEFAULT_CONDITION.operator)}
          disabled={!editMode}
          onChange={(event) => onCellChange(event.target.value)}
          aria-label={t('mockServer.rules.operatorAria')}
        >
          {operatorOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )
    },
    {
      key: 'value',
      name: t('mockServer.rules.colValue'),
      width: '31%',
      readOnly: !editMode,
      placeholder: t('mockServer.rules.colValue')
    }
  ];

  return (
    <StyledWrapper ref={wrapperRef}>
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <label htmlFor="mock-response-rule-operator" className="font-medium">{t('mockServer.rules.matchLabel')}</label>
          <select
            id="mock-response-rule-operator"
            className="rule-operator"
            value={operator}
            disabled={!editMode}
            onChange={(event) => onChange({ operator: event.target.value, conditions })}
          >
            <option value="AND">{t('mockServer.rules.allAnd')}</option>
            <option value="OR">{t('mockServer.rules.anyOr')}</option>
          </select>
        </div>
        {!editMode ? (
          <button
            type="button"
            className="add-rule-link"
            onClick={handleAddRule}
            data-testid="mock-response-add-rule-btn"
          >
            {t('mockServer.rules.addRule')}
          </button>
        ) : null}
      </div>

      {rows.length === 0 && !editMode ? (
        <div className="text-xs opacity-70">
          {t('mockServer.rules.noRulesHint')}
        </div>
      ) : (
        <EditableTable
          tableId="mock-response-rules"
          columns={columns}
          rows={rows}
          onChange={handleRowsChange}
          defaultRow={DEFAULT_CONDITION}
          showCheckbox={false}
          showAddRow={editMode}
          showDelete={editMode}
          testId="mock-response-rules-table"
        />
      )}
    </StyledWrapper>
  );
};

export default MockResponseRules;
