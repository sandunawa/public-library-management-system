import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en/common.json';
import siTranslation from '../locales/si/common.json';
import taTranslation from '../locales/ta/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'si', 'ta'],
    defaultNS: 'common',
    resources: {
      en: { common: enTranslation },
      si: { common: siTranslation },
      ta: { common: taTranslation },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
