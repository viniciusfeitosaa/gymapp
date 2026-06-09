import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  DEFAULT_LOCALE,
  detectInitialLocale,
  LOCALE_STORAGE_KEY,
  localeToHtmlLang,
  type AppLocale,
} from './locales';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ptBR from './locales/pt-BR.json';

const initialLocale = detectInitialLocale();

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
  },
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

document.documentElement.lang = localeToHtmlLang(initialLocale);

i18n.on('languageChanged', (lng) => {
  if (typeof lng === 'string') {
    localStorage.setItem(LOCALE_STORAGE_KEY, lng);
    document.documentElement.lang = localeToHtmlLang(lng as AppLocale);
  }
});

export default i18n;
