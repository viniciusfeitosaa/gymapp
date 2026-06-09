import type { AppLocale } from './locales';

const DATE_LOCALE_MAP: Record<AppLocale, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
};

export function appLocaleToDateLocale(language?: string): string {
  if (language && language in DATE_LOCALE_MAP) {
    return DATE_LOCALE_MAP[language as AppLocale];
  }
  return DATE_LOCALE_MAP['pt-BR'];
}
