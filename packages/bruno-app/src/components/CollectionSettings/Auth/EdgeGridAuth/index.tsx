import { IconAdjustmentsHorizontal, IconInfoCircle } from '@tabler/icons';
import get from 'lodash/get';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import SingleLineEditor from 'components/SingleLineEditor';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import { updateCollectionAuth } from 'providers/ReduxStore/slices/collections';
import { saveCollectionRoot } from 'providers/ReduxStore/slices/collections/actions';
import { useTheme } from 'providers/Theme';
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

const toMaxBodySize = (value: string): number | null => {
  if (value === '' || value == null) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

interface AkamaiEdgeGridAuthProps {
  collection: any;
}

const FIELDS: Array<{ key: EdgeGridField; labelKey: string; tooltipKey?: string; isSecret?: boolean }> = [
  { key: 'accessToken', labelKey: 'collection.auth.edgegrid.accessToken', isSecret: true },
  { key: 'clientToken', labelKey: 'collection.auth.edgegrid.clientToken', isSecret: true },
  { key: 'clientSecret', labelKey: 'collection.auth.edgegrid.clientSecret', isSecret: true },
  { key: 'baseURL', labelKey: 'collection.auth.edgegrid.baseURL', tooltipKey: 'collection.auth.edgegrid.baseURLTooltip' },
  {
    key: 'nonce',
    labelKey: 'collection.auth.edgegrid.nonce',
    tooltipKey: 'collection.auth.edgegrid.nonceTooltip'
  },
  {
    key: 'timestamp',
    labelKey: 'collection.auth.edgegrid.timestamp',
    tooltipKey:
      'collection.auth.edgegrid.timestampTooltip'
  },
  {
    key: 'headersToSign',
    labelKey: 'collection.auth.edgegrid.headersToSign',
    tooltipKey: 'collection.auth.edgegrid.headersToSignTooltip'
  },
  {
    key: 'maxBodySize',
    labelKey: 'collection.auth.edgegrid.maxBodySize',
    tooltipKey: 'collection.auth.edgegrid.maxBodySizeTooltip'
  }
];

type EdgeGridFieldConfig = (typeof FIELDS)[number];

// Fields shown up front vs. those grouped under the "Advanced Settings" section
const BASIC_FIELDS = FIELDS.slice(0, 3);
const ADVANCED_FIELDS = FIELDS.slice(3);

const EdgeGridAuth: React.FC<AkamaiEdgeGridAuthProps> = ({ collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();

  const edgeGridAuth: AkamaiEdgeGridAuthValues =
    (collection.draft?.root
      ? get(collection, 'draft.root.request.auth.akamaiEdgegrid')
      : get(collection, 'root.request.auth.akamaiEdgegrid')) || {};
  const { isSensitive } = useDetectSensitiveField(collection);

  const handleSave = () => dispatch(saveCollectionRoot(collection.uid));

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
      updateCollectionAuth({
        mode: 'akamai-edgegrid',
        collectionUid: collection.uid,
        content
      })
    );
  };

  const renderField = ({ key, labelKey, tooltipKey, isSecret }: EdgeGridFieldConfig) => {
    const rawValue = edgeGridAuth[key];
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
            collection={collection}
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
        <span>{t('collection.auth.edgegrid.advancedSettings')}</span>
      </div>

      <>
        {ADVANCED_FIELDS.map(renderField)}
      </>

    </StyledWrapper>
  );
};

export default EdgeGridAuth;
