import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import InfoTip from 'components/InfoTip/index';
import SingleLineEditor from 'components/SingleLineEditor';
import ToolHint from 'components/ToolHint/index';
import { useFormik } from 'formik';
import get from 'lodash/get';
import { updateItemSettings } from 'providers/ReduxStore/slices/collections';
import { useTheme } from 'providers/Theme';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import StyledWrapper from './StyledWrapper';

/**
 * @param {string} propertyKey
 * @param {{draft?:Record<string,unknown>}} item
 * @returns
 */
const getPropertyFromDraftOrRequest = (propertyKey, item) =>
  item.draft ? get(item, `draft.${propertyKey}`, {}) : get(item, propertyKey, {});

// i18n translation keys for the settings validation errors, resolved at render time.
const ERRORS = {
  timeout: {
    invalid: 'requestPane.ws.timeoutInvalid'
  },
  keepAliveInterval: {
    invalid: 'requestPane.ws.keepAliveInvalid'
  }
};

const WSSettingsPane = ({ item, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const requestPreferences = useSelector((state) => state.app.preferences.request);

  const { timeout: _connectionTimeout, keepAliveInterval = 0 } = getPropertyFromDraftOrRequest('settings', item);

  const connectionTimeout = _connectionTimeout ?? requestPreferences.timeout;

  const updateSetting = (key, value) => {
    dispatch(updateItemSettings({
      collectionUid: collection.uid,
      itemUid: item.uid,
      settings: {
        [key]: value
      }
    }));
  };

  const formErrors = {
    timeout: isNaN(Number(connectionTimeout)) && t(ERRORS.timeout.invalid),
    keepAliveInterval: isNaN(Number(keepAliveInterval)) && t(ERRORS.keepAliveInterval.invalid)
  };

  return (
    <StyledWrapper className="flex flex-col gap-4 w-full">
      <section className="grid gap-4 items-center grid-cols-2">
        <div>
          <label className="font-medium mb-2">{t('requestPane.ws.timeout')}</label>
          <InfoTip
            infotipId="setting-connection-timeout"
            className="tooltip-mod max-w-lg"
            content={(
              <div>
                <p>
                  <span>{t('requestPane.ws.timeoutHint')}</span>
                </p>
              </div>
            )}
          />
        </div>
        <div>
          <div className={cn('single-line-editor-wrapper', {
            error: formErrors.timeout
          })}
          >
            <ToolHint
              key="timeout"
              toolhintId="ws-settings-timeout"
              place="top"
              text={formErrors.timeout ? formErrors.timeout : ''}
            >
              <SingleLineEditor
                value={connectionTimeout}
                theme={storedTheme}
                onChange={(newValue) => updateSetting('timeout', newValue)}
                collection={collection}
              />
            </ToolHint>
          </div>
        </div>

        <div>
          <label className="font-medium mb-2">{t('requestPane.ws.keepAliveInterval')}</label>
          <InfoTip
            infotipId="setting-keep-alive"
            className="tooltip-mod max-w-lg"
            content={(
              <div>
                <p>
                  <span>
                    {t('requestPane.ws.keepAliveHint')}
                  </span>
                </p>
                <p className="mt-2">{t('requestPane.ws.keepAliveZero')}</p>
              </div>
            )}
          />
        </div>
        <div>
          <div className={cn('single-line-editor-wrapper', {
            error: formErrors.keepAliveInterval
          })}
          >
            <ToolHint
              key="timeout"
              toolhintId="ws-settings-keepAliveInterval"
              place="top"
              text={formErrors.keepAliveInterval ? formErrors.keepAliveInterval : ''}
            >
              <SingleLineEditor
                value={keepAliveInterval}
                theme={storedTheme}
                onChange={(newValue) => updateSetting('keepAliveInterval', newValue)}
                collection={collection}
              />
            </ToolHint>
          </div>
        </div>
      </section>
    </StyledWrapper>
  );
};

export default WSSettingsPane;
