import { IconAdjustmentsHorizontal, IconInfoCircle } from '@tabler/icons';
import get from 'lodash/get';
import React from 'react';
import { useDispatch } from 'react-redux';

import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import SingleLineEditor from 'components/SingleLineEditor';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import { useTheme } from 'providers/Theme';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';

interface AkamaiEdgeGridAuthValues {
  accessToken?: string;
  clientToken?: string;
  clientSecret?: string;
  baseURL?: string | null;
  nonce?: string | null;
  timestamp?: string | null;
  headersToSign?: string | null;
  maxBodySize?: number | null;
}

type EdgeGridField = keyof AkamaiEdgeGridAuthValues;

// Coerce the Max Body Size editor string into the numeric value the model stores (empty/invalid -> null).
const toMaxBodySize = (value: string): number | null => {
  if (value === '' || value == null) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

interface AkamaiEdgeGridAuthProps {
  item: any;
  collection: any;
  request: any;
  updateAuth: (payload: any) => any;
  save: () => void;
}

const FIELDS: Array<{ key: EdgeGridField; labelKey: string; tooltipKey?: string; isSecret?: boolean }> = [
  { key: 'accessToken', labelKey: 'requestPane.edgegrid.accessToken', isSecret: true },
  { key: 'clientToken', labelKey: 'requestPane.edgegrid.clientToken', isSecret: true },
  { key: 'clientSecret', labelKey: 'requestPane.edgegrid.clientSecret', isSecret: true },
  { key: 'baseURL', labelKey: 'requestPane.edgegrid.baseURL', tooltipKey: 'requestPane.edgegrid.baseURLTooltip' },
  {
    key: 'nonce',
    labelKey: 'requestPane.edgegrid.nonce',
    tooltipKey: 'requestPane.edgegrid.nonceTooltip'
  },
  {
    key: 'timestamp',
    labelKey: 'requestPane.edgegrid.timestamp',
    tooltipKey: 'requestPane.edgegrid.timestampTooltip'
  },
  {
    key: 'headersToSign',
    labelKey: 'requestPane.edgegrid.headersToSign',
    tooltipKey: 'requestPane.edgegrid.headersToSignTooltip'
  },
  {
    key: 'maxBodySize',
    labelKey: 'requestPane.edgegrid.maxBodySize',
    tooltipKey: 'requestPane.edgegrid.maxBodySizeTooltip'
  }
];

type EdgeGridFieldConfig = (typeof FIELDS)[number];

// Fields shown up front vs. those grouped under the "Advanced Settings" section
const BASIC_FIELDS = FIELDS.slice(0, 3);
const ADVANCED_FIELDS = FIELDS.slice(3);

const EdgeGridAuth: React.FC<AkamaiEdgeGridAuthProps> = ({ item, collection, updateAuth, request, save }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { storedTheme } = useTheme();

  const edgeGridAuth: AkamaiEdgeGridAuthValues = get(request, 'auth.akamaiEdgegrid') || {};
  const requestUrl = get(request, 'url', '');
  const { isSensitive } = useDetectSensitiveField(collection);

  const handleRun = () => dispatch(sendRequest(item, collection.uid));

  const handleSave = () => {
    save();
  };

  const handleFieldChange = (field: EdgeGridField, value: string) => {
    const content: AkamaiEdgeGridAuthValues = {
      accessToken: edgeGridAuth.accessToken || '',
      clientToken: edgeGridAuth.clientToken || '',
      clientSecret: edgeGridAuth.clientSecret || '',
      nonce: edgeGridAuth.nonce || '',
      timestamp: edgeGridAuth.timestamp || '',
      baseURL: edgeGridAuth.baseURL || '',
      headersToSign: edgeGridAuth.headersToSign || '',
      maxBodySize: edgeGridAuth.maxBodySize ?? null
    };

    if (field === 'maxBodySize') {
      content.maxBodySize = toMaxBodySize(value);
    } else {
      (content as Record<string, unknown>)[field] = value || '';
    }

    dispatch(
      updateAuth({
        mode: 'akamai-edgegrid',
        collectionUid: collection.uid,
        itemUid: item.uid,
        content
      })
    );
  };

  const renderField = ({ key, labelKey, tooltipKey, isSecret }: EdgeGridFieldConfig) => {
    const rawValue = key === 'baseURL' ? edgeGridAuth.baseURL || requestUrl : edgeGridAuth[key];
    const fieldValue = rawValue === null || rawValue === undefined ? '' : String(rawValue);
    const { showWarning, warningMessage } = isSecret ? isSensitive(rawValue) : { showWarning: false, warningMessage: '' };
    return (
      <div key={key}>
        <label>
          {t(labelKey)}
          {tooltipKey && (
            <span className="field-info">
              <IconInfoCircle size={16} />
              <span className="field-tooltip">{t(tooltipKey)}</span>
            </span>
          )}
        </label>
        <div className="single-line-editor-wrapper">
          <SingleLineEditor
            value={fieldValue}
            theme={storedTheme}
            onSave={handleSave}
            onChange={(val: string) => handleFieldChange(key, val)}
            onRun={handleRun}
            collection={collection}
            item={item}
            isSecret={isSecret}
            isCompact
          />
          {showWarning && (
            <SensitiveFieldWarning fieldName={`edgegrid-${key}`} warningMessage={warningMessage} />
          )}
        </div>
      </div>
    );
  };

  return (
    <StyledWrapper className="mt-2 w-full">
      {BASIC_FIELDS.map(renderField)}

      <div className="advanced-settings-header">
        <span className="advanced-settings-icon">
          <IconAdjustmentsHorizontal size={16} />
        </span>
        <span>{t('requestPane.oauth2.advancedSettings')}</span>
      </div>

        <>
          {ADVANCED_FIELDS.map(renderField)}
        </>

    </StyledWrapper>
  );
};

export default EdgeGridAuth;
