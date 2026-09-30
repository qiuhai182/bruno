import React, { useState } from 'react';
import get from 'lodash/get';
import { useTheme } from 'providers/Theme';
import { useDispatch } from 'react-redux';
import path from 'utils/common/path';
import { IconSettings, IconShieldLock, IconAdjustmentsHorizontal, IconCaretDown, IconChevronRight, IconFile, IconX, IconUpload } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import SingleLineEditor from 'components/SingleLineEditor';
import MultiLineEditor from 'components/MultiLineEditor';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { sendRequest, browseFiles } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';

const signatureMethodLabels = {
  'HMAC-SHA1': 'HMAC-SHA1',
  'HMAC-SHA256': 'HMAC-SHA256',
  'HMAC-SHA512': 'HMAC-SHA512',
  'RSA-SHA1': 'RSA-SHA1',
  'RSA-SHA256': 'RSA-SHA256',
  'RSA-SHA512': 'RSA-SHA512',
  'PLAINTEXT': 'PLAINTEXT'
};

const placementLabelKeys = {
  header: 'requestPane.oauth1.placementHeader',
  query: 'requestPane.oauth1.placementQueryParams',
  body: 'requestPane.oauth1.placementBody'
};

const OAuth1 = ({ item = {}, collection, request, save, updateAuth }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { storedTheme } = useTheme();
  const oauth1 = get(request, 'auth.oauth1', {});
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { isSensitive } = useDetectSensitiveField(collection);
  const consumerSecretSensitive = isSensitive(oauth1.consumerSecret);
  const tokenSecretSensitive = isSensitive(oauth1.accessTokenSecret);
  const privateKeySensitive = isSensitive(oauth1.privateKey);

  const handleRun = item?.uid ? () => dispatch(sendRequest(item, collection.uid)) : undefined;
  const handleSave = () => save();

  const handleChange = (field, value) => {
    dispatch(
      updateAuth({
        mode: 'oauth1',
        collectionUid: collection.uid,
        itemUid: item.uid,
        content: {
          ...oauth1,
          [field]: value
        }
      })
    );
  };

  const handlePrivateKeyChange = (val) => {
    if (val && /^@file\(/.test(val.trim())) {
      toast.error(t('requestPane.oauth1.fileRefToast'));
      return;
    }
    handleChange('privateKey', val);
  };

  const handleBrowse = () => {
    dispatch(browseFiles([], []))
      .then((filePaths) => {
        if (filePaths && filePaths.length > 0) {
          let filePath = filePaths[0];
          const collectionDir = collection.pathname;
          filePath = path.relative(collectionDir, filePath);
          dispatch(
            updateAuth({
              mode: 'oauth1',
              collectionUid: collection.uid,
              itemUid: item.uid,
              content: {
                ...oauth1,
                privateKey: filePath,
                privateKeyType: 'file'
              }
            })
          );
        }
      })
      .catch((error) => console.error(error));
  };

  const handleClearFile = () => {
    dispatch(
      updateAuth({
        mode: 'oauth1',
        collectionUid: collection.uid,
        itemUid: item.uid,
        content: {
          ...oauth1,
          privateKey: '',
          privateKeyType: 'text'
        }
      })
    );
  };

  const privateKeyValue = oauth1.privateKey || '';
  const isFileRef = oauth1.privateKeyType === 'file';
  const fileName = isFileRef ? path.basename(privateKeyValue) : '';

  return (
    <StyledWrapper className="mt-2 flex w-full gap-4 flex-col">
      {/* Configuration Section */}
      <div className="flex items-center gap-2.5 mt-2">
        <div className="flex items-center px-2.5 py-1.5 oauth1-icon-container rounded-md">
          <IconSettings size={14} className="oauth1-icon" />
        </div>
        <span className="oauth1-section-label">
          {t('requestPane.oauth1.configuration')}
        </span>
      </div>

      <div className="flex items-center gap-4 w-full">
        <label className="block min-w-[140px]">Consumer Key</label>
        <div className="single-line-editor-wrapper flex-1">
          <SingleLineEditor
            value={oauth1.consumerKey || ''}
            theme={storedTheme}
            onSave={handleSave}
            onChange={(val) => handleChange('consumerKey', val)}
            onRun={handleRun}
            collection={collection}
            item={item}
            isCompact
          />
        </div>
      </div>

      {!oauth1.signatureMethod?.startsWith('RSA-') && (
        <div className="flex items-center gap-4 w-full">
          <label className="block min-w-[140px]">Consumer Secret</label>
          <div className="single-line-editor-wrapper flex-1 flex items-center">
            <SingleLineEditor
              value={oauth1.consumerSecret || ''}
              theme={storedTheme}
              onSave={handleSave}
              onChange={(val) => handleChange('consumerSecret', val)}
              onRun={handleRun}
              collection={collection}
              item={item}
              isSecret={true}
              isCompact
            />
            {consumerSecretSensitive.showWarning && <SensitiveFieldWarning fieldName="oauth1-consumer-secret" warningMessage={consumerSecretSensitive.warningMessage} />}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 w-full">
        <label className="block min-w-[140px]">{t('requestPane.oauth1.token')}</label>
        <div className="single-line-editor-wrapper flex-1">
          <SingleLineEditor
            value={oauth1.accessToken || ''}
            theme={storedTheme}
            onSave={handleSave}
            onChange={(val) => handleChange('accessToken', val)}
            onRun={handleRun}
            collection={collection}
            item={item}
            isCompact
          />
        </div>
      </div>

      <div className="flex items-center gap-4 w-full">
        <label className="block min-w-[140px]">{t('requestPane.oauth1.tokenSecret')}</label>
        <div className="single-line-editor-wrapper flex-1 flex items-center">
          <SingleLineEditor
            value={oauth1.accessTokenSecret || ''}
            theme={storedTheme}
            onSave={handleSave}
            onChange={(val) => handleChange('accessTokenSecret', val)}
            onRun={handleRun}
            collection={collection}
            item={item}
            isSecret={true}
            isCompact
          />
          {tokenSecretSensitive.showWarning && <SensitiveFieldWarning fieldName="oauth1-token-secret" warningMessage={tokenSecretSensitive.warningMessage} />}
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex items-center gap-2.5 mt-2">
        <div className="flex items-center px-2.5 py-1.5 oauth1-icon-container rounded-md">
          <IconShieldLock size={14} className="oauth1-icon" />
        </div>
        <span className="oauth1-section-label">
          {t('requestPane.oauth1.signature')}
        </span>
      </div>

      <div className="flex items-center gap-4 w-full">
        <label className="block min-w-[140px]">{t('requestPane.oauth1.signatureMethod')}</label>
        <div className="inline-flex items-center cursor-pointer oauth1-dropdown-selector">
          <MenuDropdown
            items={Object.entries(signatureMethodLabels).map(([value, label]) => ({
              id: value,
              label,
              onClick: () => handleChange('signatureMethod', value)
            }))}
            selectedItemId={oauth1.signatureMethod}
            placement="bottom-end"
          >
            <div className="flex items-center justify-end oauth1-dropdown-label select-none">
              {signatureMethodLabels[oauth1.signatureMethod] || 'HMAC-SHA1'}
              <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
            </div>
          </MenuDropdown>
        </div>
      </div>

      {oauth1.signatureMethod?.startsWith('RSA-') && (
        <div className="flex items-start gap-4 w-full">
          <label className="block min-w-[140px] mt-1">{t('requestPane.oauth1.privateKey')}</label>
          {isFileRef ? (
            <div className="private-key-editor-wrapper flex-1 flex items-center gap-2">
              <IconFile size={16} className="oauth1-icon flex-shrink-0" />
              <span className="truncate flex-1" title={privateKeyValue}>{fileName}</span>
              <button
                className="flex-shrink-0 oauth1-icon cursor-pointer"
                onClick={handleClearFile}
                title={t('requestPane.oauth1.clearFile')}
                type="button"
              >
                <IconX size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-2">
              <div className="private-key-editor-wrapper flex-1 flex items-center">
                <MultiLineEditor
                  value={privateKeyValue}
                  theme={storedTheme}
                  onSave={handleSave}
                  onChange={handlePrivateKeyChange}
                  onRun={handleRun}
                  collection={collection}
                  item={item}
                  isSecret={true}
                  allowNewlines={true}
                />
                {privateKeySensitive.showWarning && <SensitiveFieldWarning fieldName="oauth1-private-key" warningMessage={privateKeySensitive.warningMessage} />}
              </div>
              <div className="flex flex-row gap-2">
                <button
                  className="flex items-center gap-1 oauth1-icon cursor-pointer text-link"
                  onClick={handleBrowse}
                  title={t('requestPane.oauth1.selectFile')}
                  type="button"
                >
                  <IconUpload size={14} />
                  <span className="text-xs">{t('requestPane.oauth1.uploadFile')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 w-full">
        <label className="block min-w-[140px]">{t('requestPane.oauth1.addParamsTo')}</label>
        <div className="inline-flex items-center cursor-pointer oauth1-dropdown-selector">
          <MenuDropdown
            items={Object.entries(placementLabelKeys).map(([value, labelKey]) => ({
              id: value,
              label: t(labelKey),
              onClick: () => handleChange('placement', value)
            }))}
            selectedItemId={oauth1.placement}
            placement="bottom-end"
          >
            <div className="flex items-center justify-end oauth1-dropdown-label select-none">
              {placementLabelKeys[oauth1.placement] ? t(placementLabelKeys[oauth1.placement]) : t('requestPane.oauth1.placementHeader')}
              <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
            </div>
          </MenuDropdown>
        </div>
      </div>

      {oauth1.placement === 'body' && (
        <div className="flex items-center gap-4 w-full">
          <label className="block min-w-[140px]"></label>
          <span className="text-xs opacity-60">
            {t('requestPane.oauth1.bodyPlacementHint')}
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 w-full">
        <label className="block min-w-[140px]"></label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={oauth1.includeBodyHash || false}
            onChange={(e) => handleChange('includeBodyHash', e.target.checked)}
          />
          <label
            className="block cursor-pointer"
            onClick={(e) => {
              e.preventDefault(); handleChange('includeBodyHash', !oauth1.includeBodyHash);
            }}
          >
            {t('requestPane.oauth1.includeBodyHash')}
          </label>
        </div>
      </div>

      {/* Advanced Section (collapsible) */}
      <div
        className="flex items-center gap-2.5 mt-2 cursor-pointer select-none"
        onClick={() => setAdvancedOpen(!advancedOpen)}
      >
        <div className="flex items-center px-2.5 py-1.5 oauth1-icon-container rounded-md">
          <IconAdjustmentsHorizontal size={14} className="oauth1-icon" />
        </div>
        <span className="oauth1-section-label">
          {t('requestPane.oauth1.advanced')}
        </span>
        <IconChevronRight
          size={14}
          className={`oauth1-icon transition-transform ${advancedOpen ? 'rotate-90' : ''}`}
        />
      </div>

      {advancedOpen && (
        <>
          <div className="flex items-center gap-4 w-full">
            <label className="block min-w-[140px]">{t('requestPane.oauth1.callbackUrl')}</label>
            <div className="single-line-editor-wrapper flex-1">
              <SingleLineEditor
                value={oauth1.callbackUrl || ''}
                theme={storedTheme}
                onSave={handleSave}
                onChange={(val) => handleChange('callbackUrl', val)}
                onRun={handleRun}
                collection={collection}
                item={item}
                isCompact
              />
            </div>
          </div>

          <div className="flex items-center gap-4 w-full">
            <label className="block min-w-[140px]">{t('requestPane.oauth1.verifier')}</label>
            <div className="single-line-editor-wrapper flex-1">
              <SingleLineEditor
                value={oauth1.verifier || ''}
                theme={storedTheme}
                onSave={handleSave}
                onChange={(val) => handleChange('verifier', val)}
                onRun={handleRun}
                collection={collection}
                item={item}
                isCompact
              />
            </div>
          </div>

          <div className="flex items-center gap-4 w-full">
            <label className="block min-w-[140px]">{t('requestPane.oauth1.timestamp')}</label>
            <div className="single-line-editor-wrapper flex-1">
              <SingleLineEditor
                value={oauth1.timestamp || ''}
                theme={storedTheme}
                onSave={handleSave}
                onChange={(val) => handleChange('timestamp', val)}
                onRun={handleRun}
                collection={collection}
                item={item}
                isCompact
              />
            </div>
          </div>

          <div className="flex items-center gap-4 w-full">
            <label className="block min-w-[140px]">{t('requestPane.oauth1.nonce')}</label>
            <div className="single-line-editor-wrapper flex-1">
              <SingleLineEditor
                value={oauth1.nonce || ''}
                theme={storedTheme}
                onSave={handleSave}
                onChange={(val) => handleChange('nonce', val)}
                onRun={handleRun}
                collection={collection}
                item={item}
                isCompact
              />
            </div>
          </div>

          <div className="flex items-center gap-4 w-full">
            <label className="block min-w-[140px]">{t('requestPane.oauth1.version')}</label>
            <div className="single-line-editor-wrapper flex-1">
              <SingleLineEditor
                value={oauth1.version || ''}
                theme={storedTheme}
                onSave={handleSave}
                onChange={(val) => handleChange('version', val)}
                onRun={handleRun}
                collection={collection}
                item={item}
                isCompact
              />
            </div>
          </div>

          <div className="flex items-center gap-4 w-full">
            <label className="block min-w-[140px]">{t('requestPane.oauth1.realm')}</label>
            <div className="single-line-editor-wrapper flex-1">
              <SingleLineEditor
                value={oauth1.realm || ''}
                theme={storedTheme}
                onSave={handleSave}
                onChange={(val) => handleChange('realm', val)}
                onRun={handleRun}
                collection={collection}
                item={item}
                isCompact
              />
            </div>
          </div>
        </>
      )}
    </StyledWrapper>
  );
};

export default OAuth1;
