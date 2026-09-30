import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import EditableTable from 'components/EditableTable';
import VariableValue from '../VariableValue';
import StyledWrapper from './StyledWrapper';

const VariablesTable = ({
  rows,
  collection,
  selectedName,
  section,
  environmentUid,
  isSecretRevealed,
  onToggleSecretReveal,
  onOpenObject,
  columnWidths,
  onColumnWidthsChange,
  testId
}) => {
  const { t } = useTranslation();
  const columns = useMemo(() => [
    {
      key: 'name',
      name: t('variables.name'),
      isKeyField: true,
      sortable: true,
      readOnly: true,
      width: '35%'
    },
    {
      key: 'value',
      name: t('variables.value'),
      width: '65%',
      render: ({ row }) => (
        <VariableValue
          name={row.name}
          value={row.value}
          secret={row.secret}
          collection={collection}
          section={section}
          environmentUid={environmentUid}
          isSelected={selectedName === row.name && !!selectedName}
          revealed={isSecretRevealed(section, row.name)}
          onToggleReveal={() => onToggleSecretReveal(section, row.name)}
          onOpenObject={() => onOpenObject({ section, name: row.name })}
        />
      )
    }
  ], [
    t,
    collection,
    selectedName,
    section,
    environmentUid,
    isSecretRevealed,
    onToggleSecretReveal,
    onOpenObject
  ]);

  const sortStorageKey = section === 'environment'
    ? `variables-sort-environment::${environmentUid}`
    : `variables-sort-${section}`;

  return (
    <StyledWrapper>
      <EditableTable
        tableId={`variables-${section}`}
        testId={testId}
        columns={columns}
        rows={rows}
        showCheckbox={false}
        showDelete={false}
        showAddRow={false}
        columnWidths={columnWidths}
        onColumnWidthsChange={onColumnWidthsChange}
        initialScroll={0}
        sortStorageKey={sortStorageKey}
      />
    </StyledWrapper>
  );
};

export default VariablesTable;
