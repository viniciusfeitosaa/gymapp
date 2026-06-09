import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import type { RegisterStep } from './registerTypes';
import { registerLinkClass, registerPrimaryButtonClass } from './registerStyles';
import { LanguagePicker } from '../../components/LanguagePicker';

type Props = {
  step: RegisterStep;
  progress: number;
  error: string;
  loading: boolean;
  primaryLabel: string;
  showBack: boolean;
  showLoginLink: boolean;
  onBack: () => void;
  onPrimary: () => void;
  children: React.ReactNode;
  animClass: string;
};

export default function RegisterWizardShell({
  step,
  progress,
  error,
  loading,
  primaryLabel,
  showBack,
  showLoginLink,
  onBack,
  onPrimary,
  children,
  animClass,
}: Props) {
  const { t } = useTranslation();
  const isCelebration = step === 'celebration';

  const copy = isCelebration
    ? {
        title: t('register.celebrationTitle'),
        subtitle: t('register.celebrationSubtitle'),
      }
    : {
        welcome: { title: t('register.welcomeTitle'), subtitle: t('register.welcomeSubtitle') },
        identity: { title: t('register.identityTitle'), subtitle: t('register.identitySubtitle') },
        access: { title: t('register.accessTitle'), subtitle: t('register.accessSubtitle') },
        address: { title: t('register.addressTitle'), subtitle: t('register.addressSubtitle') },
      }[step as Exclude<RegisterStep, 'celebration'>];

  const showProgress = progress > 0;

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <LanguagePicker className="absolute top-[max(1rem,env(safe-area-inset-top,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] left-auto z-20 sm:top-[max(1.5rem,env(safe-area-inset-top,0px))] sm:right-[max(1.5rem,env(safe-area-inset-right,0px))]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-lg relative">
        <div className="bg-white rounded-3xl shadow-lg border border-[#E8E8ED] p-6 sm:p-10">
          {showProgress && (
            <div className="mb-8">
              <div className="flex gap-2 mb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i <= progress ? 'bg-gradient-accent' : 'bg-[#E8E8ED]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-[#86868B] tracking-wide">
                {t('register.stepOf', { current: Math.min(progress, 4), total: 4 })}
              </p>
            </div>
          )}

          <div className={`mb-6 ${animClass}`}>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tracking-tight mb-2">
              {copy.title}
            </h1>
            <p className="text-[#6E6E73] text-sm sm:text-base leading-relaxed">{copy.subtitle}</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#C41E16] text-sm">
              {error}
            </div>
          )}

          <div className={`${animClass} ${isCelebration ? '' : 'mb-8'}`}>{children}</div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={onPrimary}
              disabled={loading}
              className={registerPrimaryButtonClass}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('register.registering')}
                </span>
              ) : (
                primaryLabel
              )}
            </button>

            {showBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="w-full py-2.5 text-[#6E6E73] hover:text-accent-600 font-medium text-sm inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('register.back')}
              </button>
            )}
          </div>

          {showLoginLink && (
            <p className="text-center text-sm text-[#6E6E73] mt-6">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className={registerLinkClass}>
                {t('register.loginLink')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
