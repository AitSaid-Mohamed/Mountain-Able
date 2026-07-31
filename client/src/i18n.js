import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import it from './locales/it.json';

export const LANG_KEY = 'mountainable_lang';

/**
 * i18next configuration. English and Italian; the chosen language is persisted
 * to localStorage. Pluralisation uses i18next's `_one` / `_other` suffixes.
 */
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    it: { translation: it },
  },
  lng: localStorage.getItem(LANG_KEY) ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANG_KEY, lng);
  document.documentElement.lang = lng;
});

export default i18n;
