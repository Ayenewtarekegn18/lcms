'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../../messages/en.json';
import am from '../../messages/am.json';

const resources = {
  en: { translation: en },
  am: { translation: am },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: ['en', 'am'],
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'sessionStorage', 'cookie', 'querystring', 'navigator', 'htmlTag'],
        caches: ['localStorage', 'sessionStorage', 'cookie'],
        lookupLocalStorage: 'i18nextLng',
      },
      react: {
        useSuspense: false,
      },
    });

  i18n.on('languageChanged', (lng) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng.split('-')[0];
    }
  });
}

export default i18n;

