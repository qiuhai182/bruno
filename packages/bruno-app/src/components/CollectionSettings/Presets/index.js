import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import StyledWrapper from './StyledWrapper';
import { updateCollectionPresets } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import { get } from 'lodash';
import Button from 'ui/Button';
import MenuDropdown from 'ui/MenuDropdown';
import SegmentedControl from 'ui/SegmentedControl';
import { IconCaretDown } from '@tabler/icons';
import { DEFAULT_PRESET_REQUEST_TYPE } from 'utils/common/constants';
import { requestTypeItems } from './constants';

const PresetsSettings = ({ collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const initialPresets = { requestType: DEFAULT_PRESET_REQUEST_TYPE, requestUrl: '' };

  // Get presets from draft.brunoConfig if it exists, otherwise from brunoConfig
  const currentPresets = collection.draft?.brunoConfig
    ? get(collection, 'draft.brunoConfig.presets', initialPresets)
    : get(collection, 'brunoConfig.presets', initialPresets);

  // Helper to update presets config
  const updatePresets = (updates) => {
    const updatedPresets = { ...currentPresets, ...updates };
    dispatch(updateCollectionPresets({
      collectionUid: collection.uid,
      presets: updatedPresets
    }));
  };

  // Default environment is part of the collection presets; like Request Type and Base URL
  // it is written to the draft and persisted via the Save button (or autosave).
  const environments = collection?.environments || [];
  const defaultEnvironmentName = currentPresets.defaultEnvironment || '';

  const handleDefaultEnvironmentChange = (name) => {
    if (name) {
      updatePresets({ defaultEnvironment: name });
    } else {
      // "None" 潩 remove the default from the draft presets.
      const { defaultEnvironment, ...rest } = currentPresets;
      dispatch(updateCollectionPresets({ collectionUid: collection.uid, presets: rest }));
    }
  };

  const defaultEnvironmentItems = [
    { id: '', label: t('collection.presets.none'), onClick: () => handleDefaultEnvironmentChange('') },
    ...environments.map((env) => ({
      id: env.name,
      label: env.name,
      onClick: () => handleDefaultEnvironmentChange(env.name)
    }))
  ];

  const handleSave = () => dispatch(saveCollectionSettings(collection.uid));

  const handleRequestTypeChange = (value) => {
    updatePresets({ requestType: value });
  };

  const handleRequestUrlChange = (e) => {
    updatePresets({ requestUrl: e.target.value });
  };

  const requestType = currentPresets.requestType || DEFAULT_PRESET_REQUEST_TYPE;

  return (
    <StyledWrapper className="h-full w-full">
      <div className="bruno-form">
        <div className="preset-field">
          <label className="preset-field-label">{t('collection.presets.defaultRequestType')}</label>
          <p className="preset-field-subtitle">{t('collection.presets.defaultRequestTypeSubtitle')}</p>
          <SegmentedControl
            ariaLabel={t('collection.presets.defaultRequestType')}
            name="requestType"
            value={requestType}
            onChange={handleRequestTypeChange}
            items={requestTypeItems}
            size="sm"
          />
        </div>

        <div className="preset-field">
          <label className="preset-field-label" htmlFor="request-url">{t('collection.presets.defaultBaseUrl')}</label>
          <p className="preset-field-subtitle">{t('collection.presets.defaultBaseUrlSubtitle')}</p>
          <input
            id="request-url"
            data-testid="presets-request-url"
            type="text"
            name="requestUrl"
            placeholder={t('collection.presets.requestUrlPlaceholder')}
            className="block textbox preset-input mousetrap"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={handleRequestUrlChange}
            value={currentPresets.requestUrl || ''}
          />
        </div>

        <div className="preset-field">
          <label className="preset-field-label" htmlFor="default-environment">{t('collection.presets.defaultEnvironment')}</label>
          <p className="preset-field-subtitle">{t('collection.presets.defaultEnvironmentSubtitle')}</p>
          <div className="default-env-dropdown">
            <MenuDropdown
              items={defaultEnvironmentItems}
              selectedItemId={defaultEnvironmentName}
              data-testid="presets-default-environment"
              placement="bottom-start"
              sameWidth
            >
              <button
                type="button"
                id="default-environment"
                className="default-env-trigger flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{defaultEnvironmentName || t('collection.presets.none')}</span>
                <IconCaretDown className="caret" size={14} strokeWidth={2} />
              </button>
            </MenuDropdown>
          </div>
        </div>

        <div className="mt-6">
          <Button type="button" size="sm" data-testid="presets-save-btn" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default PresetsSettings;
