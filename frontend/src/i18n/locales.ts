export type AppLocale = 'pt-BR' | 'en' | 'es' | 'fr' | 'de' | 'it';

export type LocaleOption = {
  code: AppLocale;
  country: string;
  language: string;
  flag: string;
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'pt-BR', country: 'Brasil', language: 'Português', flag: '🇧🇷' },
  { code: 'en', country: 'United States', language: 'English', flag: '🇺🇸' },
  { code: 'es', country: 'España', language: 'Español', flag: '🇪🇸' },
  { code: 'fr', country: 'France', language: 'Français', flag: '🇫🇷' },
  { code: 'de', country: 'Deutschland', language: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', country: 'Italia', language: 'Italiano', flag: '🇮🇹' },
];

export const LOCALE_STORAGE_KEY = 'gymcode-locale';

export const DEFAULT_LOCALE: AppLocale = 'pt-BR';

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return LOCALE_OPTIONS.some((o) => o.code === value);
}

export function detectInitialLocale(): AppLocale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isAppLocale(stored)) return stored;

  const browser = (navigator.language || 'pt-BR').toLowerCase();
  if (browser.startsWith('pt')) return 'pt-BR';
  if (browser.startsWith('en')) return 'en';
  if (browser.startsWith('es')) return 'es';
  if (browser.startsWith('fr')) return 'fr';
  if (browser.startsWith('de')) return 'de';
  if (browser.startsWith('it')) return 'it';
  return DEFAULT_LOCALE;
}

export function localeToHtmlLang(code: AppLocale): string {
  if (code === 'pt-BR') return 'pt-BR';
  return code;
}
