// packages
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// locales
import en from './locales/en.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ema:lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

function syncDocumentLanguage(language: string): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
}

syncDocumentLanguage(i18n.resolvedLanguage ?? 'en');
i18n.on('languageChanged', (): void => syncDocumentLanguage(i18n.resolvedLanguage ?? 'en'));

export default i18n;
