import React from 'react';
import { IconEdit, IconEye } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import Button from 'ui/Button';
import { useDocsEditingState } from '../useDocsEditingState';
import StyledWrapper from './StyledWrapper';

const DocsAction = () => {
  const { t } = useTranslation();
  const { isEditing, setEditing } = useDocsEditingState();

  return (
    <StyledWrapper>
      <Button
        variant="ghost"
        color="secondary"
        size="sm"
        data-testid="docs-edit-toggle"
        className="opacity-70 hover:opacity-100"
        onClick={() => setEditing(!isEditing)}
        icon={isEditing ? <IconEye strokeWidth={1.5} /> : <IconEdit strokeWidth={1.5} />}
      >
        {isEditing ? t('docs.preview') : t('docs.edit')}
      </Button>
    </StyledWrapper>
  );
};

export default DocsAction;
