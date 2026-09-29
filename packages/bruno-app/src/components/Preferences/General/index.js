import React, { useRef, useEffect, useCallback } from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import { useFormik } from 'formik';
import { useSelector, useDispatch } from 'react-redux';
import { savePreferences } from 'providers/ReduxStore/slices/app';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import path from 'utils/common/path';
import { IconTrash } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
import i18n, { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../../../i18n';

const LANGUAGE_LABELS = {
  'zh-CN': '简体中文',
  en: 'English'
};

const General = () => {
  const preferences = useSelector((state) => state.app.preferences);
  const dispatch = useDispatch();
  const inputFileCaCertificateRef = useRef();
  const { t } = useTranslation();

  const preferencesSchema = Yup.object().shape({
    sslVerification: Yup.boolean(),
    customCaCertificate: Yup.object({
      enabled: Yup.boolean(),
      filePath: Yup.string().nullable()
    }),
    keepDefaultCaCertificates: Yup.object({
      enabled: Yup.boolean()
    }),
    storeCookies: Yup.boolean(),
    sendCookies: Yup.boolean(),
    timeout: Yup.mixed()
      .transform((value, originalValue) => {
        return originalValue === '' ? undefined : value;
      })
      .nullable()
      .test('isNumber', t('preferences.general.timeoutMustBeNumber'), (value) => {
        return value === undefined || !isNaN(value);
      })
      .test('isValidTimeout', t('preferences.general.timeoutMustBeNonNegative'), (value) => {
        return value === undefined || Number(value) >= 0;
      }),
    autoSave: Yup.object({
      enabled: Yup.boolean(),
      interval: Yup.mixed()
        .transform((value, originalValue) => {
          return originalValue === '' ? undefined : value;
        })
        .test('isNumber', t('preferences.general.saveDelayMustBeNumber'), (value) => {
          return value === undefined || !isNaN(value);
        })
        .test('isValidInterval', t('preferences.general.saveDelayMustBeAtLeast500'), (value) => {
          return value === undefined || Number(value) >= 500;
        })
    }).test('intervalRequired', t('preferences.general.saveDelayRequired'), (value) => {
      // If autosave is enabled, interval must be provided
      if (value.enabled && (value.interval === undefined || value.interval === '')) {
        return false;
      }
      return true;
    }),
    oauth2: Yup.object({
      useSystemBrowser: Yup.boolean()
    }),
    trayResident: Yup.boolean(),
    webServer: Yup.object({
      enabled: Yup.boolean(),
      port: Yup.mixed()
        .transform((value, originalValue) => {
          return originalValue === '' ? undefined : value;
        })
        .nullable()
        .test('isNumber', t('preferences.general.portMustBeNumber'), (value) => {
          return value === undefined || !isNaN(value);
        })
        .test('isValidPort', t('preferences.general.portMustBeValid'), (value) => {
          return value === undefined || (Number(value) >= 1 && Number(value) <= 65535);
        })
    }),
    defaultLocation: Yup.string().max(1024)
  });

  const formik = useFormik({
    initialValues: {
      sslVerification: preferences.request.sslVerification,
      customCaCertificate: {
        enabled: get(preferences, 'request.customCaCertificate.enabled', false),
        filePath: get(preferences, 'request.customCaCertificate.filePath', null)
      },
      keepDefaultCaCertificates: {
        enabled: get(preferences, 'request.keepDefaultCaCertificates.enabled', true)
      },
      timeout: preferences.request.timeout,
      storeCookies: get(preferences, 'request.storeCookies', true),
      sendCookies: get(preferences, 'request.sendCookies', true),
      autoSave: {
        enabled: get(preferences, 'autoSave.enabled', false),
        interval: get(preferences, 'autoSave.interval', 1000)
      },
      oauth2: {
        useSystemBrowser: get(preferences, 'request.oauth2.useSystemBrowser', false)
      },
      trayResident: get(preferences, 'tray.resident', true),
      webServer: {
        enabled: get(preferences, 'web.enabled', true),
        port: get(preferences, 'web.port', 43110)
      },
      defaultLocation: get(preferences, 'general.defaultLocation', '')
    },
    validationSchema: preferencesSchema,
    onSubmit: async (values) => {
      try {
        const newPreferences = await preferencesSchema.validate(values, { abortEarly: true });
        handleSave(newPreferences);
      } catch (error) {
        console.error('Preferences validation error:', error.message);
      }
    }
  });

  const handleSave = useCallback((newPreferences) => {
    dispatch(
      savePreferences({
        ...preferences,
        request: {
          ...preferences.request,
          sslVerification: newPreferences.sslVerification,
          customCaCertificate: {
            enabled: newPreferences.customCaCertificate.enabled,
            filePath: newPreferences.customCaCertificate.filePath
          },
          keepDefaultCaCertificates: {
            enabled: newPreferences.keepDefaultCaCertificates.enabled
          },
          timeout: newPreferences.timeout,
          storeCookies: newPreferences.storeCookies,
          sendCookies: newPreferences.sendCookies,
          oauth2: {
            useSystemBrowser: newPreferences.oauth2.useSystemBrowser
          }
        },
        autoSave: {
          enabled: newPreferences.autoSave.enabled,
          interval: newPreferences.autoSave.interval
        },
        tray: {
          resident: newPreferences.trayResident
        },
        web: {
          enabled: newPreferences.webServer.enabled,
          port: Number(newPreferences.webServer.port)
        },
        general: {
          ...preferences.general,
          defaultLocation: newPreferences.defaultLocation
        }
      }))
      .catch((err) => console.log(err) && toast.error(t('preferences.saveFailed')));
  }, [dispatch, preferences, t]);

  const currentLanguage = get(preferences, 'general.language', DEFAULT_LANGUAGE) || DEFAULT_LANGUAGE;

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    if (!SUPPORTED_LANGUAGES.includes(newLanguage) || newLanguage === currentLanguage) {
      return;
    }
    i18n.changeLanguage(newLanguage);
    dispatch(
      savePreferences({
        ...preferences,
        general: {
          ...preferences.general,
          language: newLanguage
        }
      })
    ).catch((err) => console.log(err) && toast.error(t('preferences.saveFailed')));
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  const debouncedSave = useCallback(
    debounce((values) => {
      preferencesSchema.validate(values, { abortEarly: true })
        .then((validatedValues) => {
          handleSaveRef.current(validatedValues);
        })
        .catch((error) => {
        });
    }, 500),
    []
  );

  useEffect(() => {
    if (formik.dirty && formik.isValid) {
      debouncedSave(formik.values);
    }
    return () => {
      debouncedSave.flush();
    };
  }, [formik.values, formik.dirty, formik.isValid, debouncedSave]);

  const addCaCertificate = (e) => {
    const filePath = window?.ipcRenderer?.getFilePath(e?.target?.files?.[0]);
    if (filePath) {
      formik.setFieldValue('customCaCertificate.filePath', filePath);
    }
  };

  const deleteCaCertificate = () => {
    formik.setFieldValue('customCaCertificate.filePath', null);
  };

  const browseDefaultLocation = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string') {
          formik.setFieldValue('defaultLocation', dirPath);
        }
      })
      .catch((error) => {
        formik.setFieldValue('defaultLocation', '');
        console.error(error);
      });
  };

  return (
    <StyledWrapper className="w-full">
      <div className="section-header">{t('preferences.general.title')}</div>
      <div className="flex items-center mb-4">
        <label className="block select-none w-40" htmlFor="language">
          {t('preferences.general.language')}
        </label>
        <select
          id="language"
          name="language"
          className="block textbox mt-0 w-40"
          value={currentLanguage}
          onChange={handleLanguageChange}
          data-testid="language-select"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang] || lang}
            </option>
          ))}
        </select>
      </div>
      <form className="bruno-form" onSubmit={formik.handleSubmit}>
        <div className="flex items-center mb-2">
          <input
            id="sslVerification"
            type="checkbox"
            name="sslVerification"
            checked={formik.values.sslVerification}
            onChange={formik.handleChange}
            className="mousetrap mr-0"
          />
          <label className="block ml-2 select-none" htmlFor="sslVerification">
            {t('preferences.general.sslVerification')}
          </label>
        </div>
        <div className="flex items-center mt-2">
          <input
            id="customCaCertificateEnabled"
            type="checkbox"
            name="customCaCertificate.enabled"
            checked={formik.values.customCaCertificate.enabled}
            onChange={formik.handleChange}
            className="mousetrap mr-0"
          />
          <label className="block ml-2 select-none" htmlFor="customCaCertificateEnabled">
            {t('preferences.general.useCustomCaCertificate')}
          </label>
        </div>
        {formik.values.customCaCertificate.filePath ? (
          <div
            className={`flex items-center mt-2 pl-6 ${formik.values.customCaCertificate.enabled ? '' : 'opacity-25'}`}
          >
            <span className="flex items-center border px-2 rounded-md">
              {path.basename(formik.values.customCaCertificate.filePath)}
              <button
                type="button"
                tabIndex="-1"
                className="pl-1"
                disabled={formik.values.customCaCertificate.enabled ? false : true}
                onClick={deleteCaCertificate}
              >
                <IconTrash strokeWidth={1.5} size={14} />
              </button>
            </span>
          </div>
        ) : (
          <div
            className={`flex items-center mt-2 pl-6 ${formik.values.customCaCertificate.enabled ? '' : 'opacity-25'}`}
          >
            <button
              type="button"
              tabIndex="-1"
              className="flex items-center border px-2 rounded-md"
              disabled={formik.values.customCaCertificate.enabled ? false : true}
              onClick={() => inputFileCaCertificateRef.current.click()}
            >
              {t('preferences.general.selectFile')}
              <input
                id="caCertFilePath"
                type="file"
                name="customCaCertificate.filePath"
                className="hidden"
                ref={inputFileCaCertificateRef}
                disabled={formik.values.customCaCertificate.enabled ? false : true}
                onChange={addCaCertificate}
              />
            </button>
          </div>
        )}
        <div className="flex items-center mt-2">
          <input
            id="keepDefaultCaCertificatesEnabled"
            type="checkbox"
            name="keepDefaultCaCertificates.enabled"
            checked={formik.values.keepDefaultCaCertificates.enabled}
            onChange={formik.handleChange}
            className={`mousetrap mr-0 ${formik.values.customCaCertificate.enabled && formik.values.customCaCertificate.filePath ? '' : 'opacity-25'}`}
            disabled={formik.values.customCaCertificate.enabled && formik.values.customCaCertificate.filePath ? false : true}
          />
          <label
            className={`block ml-2 select-none ${formik.values.customCaCertificate.enabled && formik.values.customCaCertificate.filePath ? '' : 'opacity-25'}`}
            htmlFor="keepDefaultCaCertificatesEnabled"
          >
            {t('preferences.general.keepDefaultCaCertificates')}
          </label>
        </div>
        <div className="flex items-center mt-2">
          <input
            id="storeCookies"
            type="checkbox"
            name="storeCookies"
            checked={formik.values.storeCookies}
            onChange={formik.handleChange}
            className="mousetrap mr-0"
          />
          <label className="block ml-2 select-none" htmlFor="storeCookies">
            {t('preferences.general.storeCookies')}
          </label>
        </div>
        <div className="flex items-center mt-2">
          <input
            id="sendCookies"
            type="checkbox"
            name="sendCookies"
            checked={formik.values.sendCookies}
            onChange={formik.handleChange}
            className="mousetrap mr-0"
          />
          <label className="block ml-2 select-none" htmlFor="sendCookies">
            {t('preferences.general.sendCookies')}
          </label>
        </div>
        <div className="flex items-center mt-2">
          <input
            id="oauth2.useSystemBrowser"
            type="checkbox"
            name="oauth2.useSystemBrowser"
            checked={formik.values.oauth2.useSystemBrowser}
            onChange={formik.handleChange}
            className="mousetrap mr-0"
          />
          <label className="block ml-2 select-none" htmlFor="oauth2.useSystemBrowser">
            {t('preferences.general.useSystemBrowserOauth2')}
          </label>
        </div>
        <div className="flex flex-col mt-6">
          <label className="block select-none" htmlFor="timeout">
            {t('preferences.general.requestTimeout')}
          </label>
          <input
            type="text"
            name="timeout"
            className="block textbox mt-2 w-16"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.timeout}
          />
        </div>
        {formik.touched.timeout && formik.errors.timeout ? (
          <div className="text-red-500">{formik.errors.timeout}</div>
        ) : null}
        <div className="flex items-center mt-6">
          <input
            id="autoSaveEnabled"
            type="checkbox"
            name="autoSave.enabled"
            checked={formik.values.autoSave.enabled}
            onChange={formik.handleChange}
            className="mousetrap mr-0"
          />
          <label className="block ml-2 select-none" htmlFor="autoSaveEnabled">
            {t('preferences.general.enableAutoSave')}
          </label>
        </div>
        <div className={`flex flex-col mt-2 ${!formik.values.autoSave.enabled ? 'opacity-50' : ''}`}>
          <label className="block select-none" htmlFor="autoSaveInterval">
            {t('preferences.general.saveDelay')}
          </label>
          <input
            type="text"
            name="autoSave.interval"
            id="autoSaveInterval"
            className="block textbox mt-2 w-24"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.autoSave.interval}
            disabled={!formik.values.autoSave.enabled}
          />
        </div>
        {formik.touched.autoSave && formik.errors.autoSave && typeof formik.errors.autoSave === 'string' && (
          <div className="text-red-500">{formik.errors.autoSave}</div>
        )}
        {formik.touched.autoSave?.interval && formik.errors.autoSave?.interval && (
          <div className="text-red-500">{formik.errors.autoSave.interval}</div>
        )}
        <div className="flex items-center mt-6">
          <input
            id="trayResident"
            type="checkbox"
            name="trayResident"
            checked={formik.values.trayResident}
            onChange={formik.handleChange}
            className="mousetrap mr-0"
          />
          <label className="block ml-2 select-none" htmlFor="trayResident">
            {t('preferences.general.trayResident')}
          </label>
        </div>
        <div className="flex items-center mt-2">
          <input
            id="webServerEnabled"
            type="checkbox"
            name="webServer.enabled"
            checked={formik.values.webServer.enabled}
            onChange={formik.handleChange}
            className="mousetrap mr-0"
          />
          <label className="block ml-2 select-none" htmlFor="webServerEnabled">
            {t('preferences.general.webClientEnabled')}
          </label>
        </div>
        <div className={`flex flex-col mt-2 ${!formik.values.webServer.enabled ? 'opacity-50' : ''}`}>
          <label className="block select-none" htmlFor="webServerPort">
            {t('preferences.general.webServerPort')}
          </label>
          <input
            type="text"
            name="webServer.port"
            id="webServerPort"
            className="block textbox mt-2 w-24"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.webServer.port}
            disabled={!formik.values.webServer.enabled}
          />
        </div>
        {formik.touched.webServer?.port && formik.errors.webServer?.port && (
          <div className="text-red-500">{formik.errors.webServer.port}</div>
        )}
        <div className="flex flex-col mt-6">
          <label className="block select-none default-location-label" htmlFor="defaultLocation">
            {t('preferences.general.defaultLocation')}
          </label>
          <p className="text-muted mt-1 text-xs">
            {t('preferences.general.defaultLocationHint')}
          </p>
          <input
            type="text"
            name="defaultLocation"
            id="defaultLocation"
            className="block textbox mt-2 w-full cursor-pointer default-location-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            readOnly={true}
            onChange={formik.handleChange}
            value={formik.values.defaultLocation || ''}
            onClick={browseDefaultLocation}
            placeholder={t('preferences.general.clickToBrowse')}
          />
          <div className="mt-1">
            <span
              className="text-link cursor-pointer hover:underline default-location-browse"
              onClick={browseDefaultLocation}
            >
              {t('preferences.general.browse')}
            </span>
          </div>
        </div>
        {formik.touched.defaultLocation && formik.errors.defaultLocation ? (
          <div className="text-red-500">{formik.errors.defaultLocation}</div>
        ) : null}
      </form>
    </StyledWrapper>
  );
};

export default General;
