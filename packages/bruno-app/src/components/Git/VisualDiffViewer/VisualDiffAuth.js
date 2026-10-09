import React, { useMemo } from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { useTranslation } from 'react-i18next';

const AUTH_TYPE_LABEL_KEYS = {
  awsv4: 'gitDiff.auth.awsSigV4',
  basic: 'gitDiff.auth.basic',
  bearer: 'gitDiff.auth.bearer',
  digest: 'gitDiff.auth.digest',
  ntlm: 'gitDiff.auth.ntlm',
  oauth2: 'gitDiff.auth.oauth2',
  wsse: 'gitDiff.auth.wsse',
  apikey: 'gitDiff.auth.apiKey'
};

const authTypeLabel = (t, authType) => (AUTH_TYPE_LABEL_KEYS[authType] ? t(AUTH_TYPE_LABEL_KEYS[authType]) : authType);

const AUTH_FIELD_LABEL_KEYS = {
  accessKeyId: 'gitDiff.authField.accessKeyId',
  secretAccessKey: 'gitDiff.authField.secretAccessKey',
  sessionToken: 'gitDiff.authField.sessionToken',
  service: 'gitDiff.authField.service',
  region: 'gitDiff.authField.region',
  profileName: 'gitDiff.authField.profileName',
  username: 'gitDiff.authField.username',
  password: 'gitDiff.authField.password',
  domain: 'gitDiff.authField.domain',
  token: 'gitDiff.authField.token',
  key: 'gitDiff.authField.key',
  value: 'gitDiff.authField.value',
  placement: 'gitDiff.authField.placement',
  grantType: 'gitDiff.authField.grantType',
  callbackUrl: 'gitDiff.authField.callbackUrl',
  authorizationUrl: 'gitDiff.authField.authorizationUrl',
  accessTokenUrl: 'gitDiff.authField.accessTokenUrl',
  refreshTokenUrl: 'gitDiff.authField.refreshTokenUrl',
  clientId: 'gitDiff.authField.clientId',
  clientSecret: 'gitDiff.authField.clientSecret',
  scope: 'gitDiff.authField.scope',
  state: 'gitDiff.authField.state',
  pkce: 'gitDiff.authField.pkce',
  credentialsPlacement: 'gitDiff.authField.credentialsPlacement',
  credentialsId: 'gitDiff.authField.credentialsId',
  tokenPlacement: 'gitDiff.authField.tokenPlacement',
  tokenHeaderPrefix: 'gitDiff.authField.tokenHeaderPrefix',
  tokenQueryKey: 'gitDiff.authField.tokenQueryKey',
  autoFetchToken: 'gitDiff.authField.autoFetchToken',
  autoRefreshToken: 'gitDiff.authField.autoRefreshToken'
};

const authFieldLabel = (t, field) => (AUTH_FIELD_LABEL_KEYS[field] ? t(AUTH_FIELD_LABEL_KEYS[field]) : field);

const VisualDiffAuth = ({ oldData, newData, showSide }) => {
  const { t } = useTranslation();
  const oldAuth = get(oldData, 'request.auth', {});
  const newAuth = get(newData, 'request.auth', {});

  const currentAuth = showSide === 'old' ? oldAuth : newAuth;
  const otherAuth = showSide === 'old' ? newAuth : oldAuth;

  const authTypes = useMemo(() => {
    const types = new Set([...Object.keys(currentAuth), ...Object.keys(otherAuth)]);
    types.delete('mode');
    return Array.from(types);
  }, [currentAuth, otherAuth]);

  const authSections = useMemo(() => {
    return authTypes.map((authType) => {
      const rawCurrentConfig = currentAuth[authType];
      const rawOtherConfig = otherAuth[authType];
      const currentConfig = (typeof rawCurrentConfig === 'object' && rawCurrentConfig !== null) ? rawCurrentConfig : {};
      const otherConfig = (typeof rawOtherConfig === 'object' && rawOtherConfig !== null) ? rawOtherConfig : {};

      if (Object.keys(currentConfig).length === 0 && showSide === 'old') {
        return null;
      }
      if (Object.keys(currentConfig).length === 0 && showSide === 'new') {
        return null;
      }

      let sectionStatus = 'unchanged';
      if (Object.keys(otherConfig).length === 0) {
        sectionStatus = showSide === 'old' ? 'deleted' : 'added';
      } else if (!isEqual(currentConfig, otherConfig)) {
        sectionStatus = 'modified';
      }

      const allFields = new Set([...Object.keys(currentConfig), ...Object.keys(otherConfig)]);
      const fields = Array.from(allFields).map((field) => {
        const currentValue = currentConfig[field];
        const otherValue = otherConfig[field];

        let status = 'unchanged';
        if (otherValue === undefined) {
          status = showSide === 'old' ? 'deleted' : 'added';
        } else if (currentValue !== otherValue) {
          status = 'modified';
        }

        let displayValue = currentValue;
        if (typeof displayValue === 'boolean') {
          displayValue = displayValue ? 'true' : 'false';
        } else if (displayValue === undefined || displayValue === null) {
          displayValue = '';
        }

        return {
          key: authFieldLabel(t, field),
          value: String(displayValue),
          status
        };
      });

      return {
        type: authType,
        label: authTypeLabel(t, authType),
        status: sectionStatus,
        fields
      };
    }).filter(Boolean);
  }, [authTypes, currentAuth, otherAuth, showSide, t]);

  const currentMode = currentAuth.mode;
  const otherMode = otherAuth.mode;
  const modeStatus = currentMode !== otherMode ? (otherMode === undefined ? (showSide === 'old' ? 'deleted' : 'added') : 'modified') : 'unchanged';

  if (authSections.length === 0 && !currentMode) {
    return null;
  }

  return (
    <>
      {currentMode && (
        <div className="diff-section">
          <table className="diff-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th style={{ width: '40%' }}>{t('gitDiff.field')}</th>
                <th>{t('gitDiff.value')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className={modeStatus}>
                <td>
                  {modeStatus !== 'unchanged' && (
                    <span className={`status-badge ${modeStatus}`}>
                      {modeStatus === 'added' ? 'A' : modeStatus === 'deleted' ? 'D' : 'M'}
                    </span>
                  )}
                </td>
                <td className="key-cell">{t('gitDiff.authMode')}</td>
                <td className="value-cell">{authTypeLabel(t, currentMode)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {authSections.map((section) => (
        <div key={section.type} className="diff-section">
          <div className="diff-section-header">
            <span>{section.label}</span>
            {section.status !== 'unchanged' && (
              <span className={`status-badge ${section.status}`}>
                {section.status === 'added' ? 'A' : section.status === 'deleted' ? 'D' : 'M'}
              </span>
            )}
          </div>
          <table className="diff-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th style={{ width: '40%' }}>{t('gitDiff.field')}</th>
                <th>{t('gitDiff.value')}</th>
              </tr>
            </thead>
            <tbody>
              {section.fields.map((field, index) => (
                <tr key={index} className={field.status}>
                  <td>
                    {field.status !== 'unchanged' && (
                      <span className={`status-badge ${field.status}`}>
                        {field.status === 'added' ? 'A' : field.status === 'deleted' ? 'D' : 'M'}
                      </span>
                    )}
                  </td>
                  <td className="key-cell">{field.key}</td>
                  <td className="value-cell">{field.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
};

export default VisualDiffAuth;
