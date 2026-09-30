import React from 'react';
import IconAlertTriangleFilled from '../Icons/IconAlertTriangleFilled';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const DeprecationWarning = ({ featureName, learnMoreUrl }) => {
  const { t } = useTranslation();
  return (
    <StyledWrapper>
      <div className="deprecation-warning">
        <IconAlertTriangleFilled className="warning-icon" size={16} />
        <span className="warning-text">
          {t('app.deprecation.removedIn', { feature: featureName })}{' '}
          <strong>v3.0.0</strong>
          {t('app.deprecation.deprecatedSuffix')}{' '}
          <a href={learnMoreUrl} target="_blank" rel="noreferrer">{t('app.deprecation.thisPost')}</a>
          {t('app.deprecation.contactPrefix')}{' '}
          <a href="mailto:support@usebruno.com">support@usebruno.com</a>
          {t('app.deprecation.contactSuffix')}
        </span>
      </div>
    </StyledWrapper>
  );
};

export default DeprecationWarning;
