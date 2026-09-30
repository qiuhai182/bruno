import React, { useCallback } from 'react';
import { IconAppWindow } from '@tabler/icons';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const APPS_DOCS_URL = 'https://link.usebruno.com/apps';

const EmptyAppState = ({ hint, onAddCode }) => {
  const { t } = useTranslation();
  const openAppsDocs = useCallback(() => {
    window?.ipcRenderer?.openExternal(APPS_DOCS_URL);
  }, []);

  return (
    <StyledWrapper data-testid="empty-app-state">
      <div className="empty-app-inner">
        <IconAppWindow size={32} strokeWidth={1.25} />
        <div className="empty-app-title">{t('emptyAppState.title')}</div>
        {hint ? <div className="empty-app-hint">{hint}</div> : null}
        <div className="empty-app-actions">
          <Button
            size="sm"
            variant="filled"
            color="primary"
            onClick={onAddCode}
            data-testid="empty-app-add-code"
          >
            {t('emptyAppState.addCode')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            color="secondary"
            onClick={openAppsDocs}
            data-testid="empty-app-learn-more"
          >
            {t('emptyAppState.learnMore')}
          </Button>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default EmptyAppState;
