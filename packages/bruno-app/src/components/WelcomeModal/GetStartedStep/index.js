import React from 'react';
import { IconPlus, IconDownload, IconFileImport, IconSend } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const GetStartedStep = ({ onCreateCollection, onImportCollection, onOpenCollection, onStartRequest }) => {
  const { t } = useTranslation();

  return (
    <StyledWrapper className="step-body">
      <div className="step-label">{t('welcome.getStarted.label')}</div>
      <div className="step-title">{t('welcome.getStarted.title')}</div>
      <div className="step-description">
        {t('welcome.getStarted.description')}
      </div>

      <div className="primary-actions">
        <button className="primary-action-card" onClick={onCreateCollection}>
          <div className="card-icon">
            <IconPlus size={20} stroke={1.5} />
          </div>
          <div className="card-title">{t('WELCOME.CREATE_COLLECTION')}</div>
          <div className="card-desc">{t('welcome.getStarted.createDesc')}</div>
        </button>

        <button className="primary-action-card" onClick={onImportCollection}>
          <div className="card-icon">
            <IconDownload size={20} stroke={1.5} />
          </div>
          <div className="card-title">{t('WELCOME.IMPORT_COLLECTION')}</div>
          <div className="card-desc">{t('welcome.getStarted.importDesc')}</div>
        </button>
      </div>

      <div className="secondary-actions">
        <button className="secondary-action" onClick={onOpenCollection}>
          <span className="secondary-icon">
            <IconFileImport size={16} stroke={1.5} />
          </span>
          <div>
            <div className="secondary-label">{t('welcome.getStarted.openLabel')}</div>
            <div className="secondary-desc">{t('welcome.getStarted.openDesc')}</div>
          </div>
        </button>
        <button className="secondary-action" onClick={onStartRequest}>
          <span className="secondary-icon">
            <IconSend size={16} stroke={1.5} />
          </span>
          <div>
            <div className="secondary-label">{t('welcome.getStarted.requestLabel')}</div>
            <div className="secondary-desc">{t('welcome.getStarted.requestDesc')}</div>
          </div>
        </button>
      </div>
    </StyledWrapper>
  );
};

export default GetStartedStep;
