import React, { memo, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

const CollectionVersionInfo = ({ name, version, folderCount = 0, requestCount = 0, environmentCount = 0 }) => {
  const { t } = useTranslation();
  const folderLabel = folderCount === 1 ? t('sidebar.docs.folderOne') : t('sidebar.docs.folderMany');
  const requestLabel = requestCount === 1 ? t('sidebar.docs.requestOne') : t('sidebar.docs.requestMany');

  return (
    <div className="version-info" data-testid="version-info">
      <div className="version-line">
        <span className="collection-name" data-testid="collection-name">{name}</span>
        <span className={`version-value ${version ? '' : 'unset'}`} data-testid="version-value">{t('sidebar.docs.versionLabel', { version: version || t('sidebar.docs.notSet') })}</span>
      </div>
      <p className="version-summary" data-testid="version-summary">
        <span>{`${folderCount} ${folderLabel}`}</span>
        <span className="version-dot" aria-hidden="true" />
        <span>{`${requestCount} ${requestLabel}`}</span>
        {environmentCount === 0 ? (
          <Fragment>
            <span className="version-dot" aria-hidden="true" />
            <span>{t('sidebar.docs.noEnvironments')}</span>
          </Fragment>
        ) : null}
      </p>
    </div>
  );
};

export default memo(CollectionVersionInfo);
