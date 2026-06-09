import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { GymCodeIcon } from '../components/GymCodeIcon';
import { LanguagePicker } from '../components/LanguagePicker';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data.message || t('forgotPassword.successDefault'));
      setEmail('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        t('forgotPassword.errorDefault');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-dark flex items-center justify-center p-3 md:p-4 relative">
      <LanguagePicker className="absolute top-[max(1rem,env(safe-area-inset-top,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] left-auto z-20 md:top-[max(1.5rem,env(safe-area-inset-top,0px))] md:right-[max(1.5rem,env(safe-area-inset-right,0px))]" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 w-48 h-48 md:w-72 md:h-72 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-5 w-64 h-64 md:w-96 md:h-96 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative px-4">
        <div className="glass-effect rounded-2xl md:rounded-3xl shadow-strong p-6 md:p-10 border border-white/10">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-accent rounded-xl md:rounded-2xl mb-4 md:mb-5 shadow-medium">
              <GymCodeIcon size={32} className="text-white" />
            </div>
            <h1 className="text-xl md:text-3xl font-display font-bold text-white mb-2">
              {t('forgotPassword.title')}
            </h1>
            <p className="text-xs md:text-sm text-dark-300">{t('forgotPassword.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {error && (
              <div className="px-3 py-2 md:px-4 md:py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs md:text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="px-3 py-2 md:px-4 md:py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs md:text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-xs md:text-sm font-semibold text-dark-200 mb-2">
                {t('login.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3.5 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500 text-sm md:text-base"
                  placeholder={t('login.emailPlaceholder')}
                  required
                  disabled={!!success}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-3 md:py-3.5 bg-gradient-accent text-white font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {loading ? t('forgotPassword.sending') : t('forgotPassword.sendLink')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-xs md:text-sm text-accent-400 hover:text-accent-300 font-medium transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
