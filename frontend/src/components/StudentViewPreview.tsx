import { useTranslation } from 'react-i18next';
import { X, Home, Dumbbell, User } from 'lucide-react';
import { formatPersonalBrandName } from '../lib/formatPersonalBrandName';
import type { BrandTheme } from '../lib/brandTheme';
import { brandThemeToCssVars } from '../lib/brandTheme';
import { resolveAssetUrl } from '../lib/resolveAssetUrl';

type Props = {
  personalName: string;
  logoUrl?: string | null;
  theme: BrandTheme;
  onClose: () => void;
};

export function StudentViewPreview({ personalName, logoUrl, theme, onClose }: Props) {
  const { t } = useTranslation();
  const logoSrc = resolveAssetUrl(logoUrl);
  const brandLabel = formatPersonalBrandName(personalName);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-preview-title"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-strong overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
          <h3 id="student-preview-title" className="font-display font-bold text-dark-900">
            {t('preview.title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-dark-500 hover:bg-dark-100"
            aria-label={t('preview.closeAria')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-dark-50">
          <p className="text-xs text-dark-500 mb-3 text-center">{t('preview.simulationHint')}</p>

          <div
            className="student-app-layout student-brand-preview mx-auto w-full max-w-[280px] rounded-[1.75rem] border-[6px] border-dark-800 bg-white overflow-hidden shadow-2xl"
            style={brandThemeToCssVars(theme)}
          >
            <header className="student-brand-header border-b px-4 py-3 flex flex-col items-center gap-2">
              {logoSrc ? (
                <div className="w-14 h-14 rounded-full border-2 border-white bg-white overflow-hidden shadow-medium ring-1 ring-dark-100/80">
                  <img src={logoSrc} alt="" className="w-full h-full object-contain p-1.5" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full student-brand-avatar flex items-center justify-center text-white font-bold text-xl shadow-medium">
                  {personalName.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="text-sm font-display font-bold text-dark-900 text-center leading-snug">
                {brandLabel}
              </p>
            </header>

            <div className="px-4 py-4 space-y-3 min-h-[200px] bg-gradient-to-br from-dark-50 via-white to-primary-50">
              <div className="rounded-xl border border-dark-100 bg-white p-3 shadow-soft">
                <p className="text-xs text-dark-500 mb-1">{t('preview.todayWorkout')}</p>
                <p className="font-semibold text-dark-900 text-sm">{t('preview.sampleWorkout')}</p>
                <button
                  type="button"
                  className="mt-3 w-full py-2.5 rounded-xl student-brand-gradient text-white text-sm font-semibold shadow-medium"
                >
                  {t('preview.startWorkout')}
                </button>
              </div>
              <div className="rounded-xl border border-dark-100 bg-white p-3">
                <p className="text-xs text-accent-600 font-medium">{t('preview.exerciseCount', { count: 3 })}</p>
              </div>
            </div>

            <nav className="border-t border-dark-200 bg-white px-1 py-1">
              <div className="grid grid-cols-3 h-12">
                <div className="flex flex-col items-center justify-center gap-0.5 student-brand-nav-active rounded-lg text-[10px] font-semibold">
                  <Home className="w-4 h-4" />
                  {t('nav.student.home')}
                </div>
                <div className="flex flex-col items-center justify-center gap-0.5 text-dark-500 text-[10px] font-semibold">
                  <Dumbbell className="w-4 h-4" />
                  {t('nav.student.workouts')}
                </div>
                <div className="flex flex-col items-center justify-center gap-0.5 text-dark-500 text-[10px] font-semibold">
                  <User className="w-4 h-4" />
                  {t('nav.student.profile')}
                </div>
              </div>
            </nav>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-dark-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-dark-100 text-dark-800 text-sm font-semibold hover:bg-dark-200"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
