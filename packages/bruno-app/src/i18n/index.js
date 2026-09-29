import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEn from './translation/en.json';
import translationZhCN from './translation/zh-CN.json';

export const DEFAULT_LANGUAGE = 'zh-CN';
export const SUPPORTED_LANGUAGES = ['zh-CN', 'en'];

const resources = {
  en: {
    translation: translationEn
  },
  'zh-CN': {
    translation: translationZhCN
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: DEFAULT_LANGUAGE, // 默认中文；未翻译的 key 回退英文
    fallbackLng: 'en',

    ns: 'translation', // Use translation as the default Namespace that will be loaded by default

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
