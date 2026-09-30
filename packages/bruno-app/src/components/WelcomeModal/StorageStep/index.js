import React from 'react';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

const StorageStep = ({ collectionLocation, onBrowse }) => {
  const { t } = useTranslation();

  return (
    <StyledWrapper className="step-body">
      <div className="step-label">{t('welcome.storage.label')}</div>
      <div className="step-title">{t('welcome.storage.title')}</div>
      <div className="step-description">
        {t('welcome.storage.description')}
      </div>

      <div className="location-input-group">
        <div
          className="location-path-display"
          onClick={onBrowse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onBrowse();
            }
          }}
          role="button"
          tabIndex={0}
        >
          {collectionLocation ? (
            <span className="path-text">{collectionLocation}</span>
          ) : (
            <span className="path-text path-placeholder">{t('welcome.storage.clickToChoose')}</span>
          )}
          <span className="browse-label">{t('preferences.general.browse')}</span>
        </div>
      </div>
      <div className="location-hint">
        {t('welcome.storage.hint')}
      </div>
    </StyledWrapper>
  );
};

export default StorageStep;
