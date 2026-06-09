import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { LOCALE_OPTIONS, type AppLocale } from '../i18n/locales';

/** Desligado temporariamente — reativar quando i18n estiver 100% pronto. */
const LANGUAGE_PICKER_ENABLED = true;

type Props = {
  variant?: 'dark' | 'light';
  className?: string;
};

export function LanguagePicker({ variant = 'dark', className = '' }: Props) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!LANGUAGE_PICKER_ENABLED || !open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  if (!LANGUAGE_PICKER_ENABLED) {
    return null;
  }

  const current =
    LOCALE_OPTIONS.find((o) => o.code === i18n.language) ?? LOCALE_OPTIONS[0];

  const selectLocale = (code: AppLocale) => {
    void i18n.changeLanguage(code);
    setOpen(false);
  };

  const isDark = variant === 'dark';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('languagePicker.label')}
        className={`group flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm transition-all duration-200 ${
          isDark
            ? 'border-white/15 bg-white/10 text-white backdrop-blur-md hover:border-white/25 hover:bg-white/15'
            : 'border-dark-200 bg-white text-dark-700 hover:border-accent-300 hover:shadow-md'
        }`}
      >
        <span className="text-lg leading-none" aria-hidden>
          {current.flag}
        </span>
        <span className="hidden sm:inline max-w-[7rem] truncate">{current.country}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('languagePicker.selectCountry')}
          className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-2xl ${
            isDark
              ? 'border-white/10 bg-dark-900/95 backdrop-blur-xl'
              : 'border-dark-100 bg-white'
          }`}
        >
          <div
            className={`flex items-center gap-2 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
              isDark ? 'border-white/10 text-slate-400' : 'border-dark-100 text-dark-400'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            {t('languagePicker.selectCountry')}
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {LOCALE_OPTIONS.map((option) => {
              const selected = option.code === current.code;
              return (
                <li key={option.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectLocale(option.code)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isDark
                        ? selected
                          ? 'bg-accent-500/15 text-white'
                          : 'text-slate-200 hover:bg-white/5'
                        : selected
                          ? 'bg-accent-50 text-dark-900'
                          : 'text-dark-700 hover:bg-dark-50'
                    }`}
                  >
                    <span className="text-2xl leading-none">{option.flag}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{option.country}</span>
                      <span
                        className={`block truncate text-xs ${
                          isDark ? 'text-slate-400' : 'text-dark-400'
                        }`}
                      >
                        {option.language}
                      </span>
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-accent-500" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
