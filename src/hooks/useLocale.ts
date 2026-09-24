// packages
import { useTranslation } from 'react-i18next';

/** The active UI language (`'en'` or `'es'`); re-renders the caller when the language changes. */
export function useLocale(): string {
  const { i18n } = useTranslation();
  return i18n.resolvedLanguage ?? 'en';
}
