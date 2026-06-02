import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { GymCodeIcon } from '../components/GymCodeIcon';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || token.length < 32) {
      setError('Link inválido. Solicite um novo e-mail em Esqueci minha senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login', { replace: true, state: { message: 'Senha alterada com sucesso. Faça login.' } });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Erro ao redefinir senha. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <div className="glass-effect rounded-2xl p-8 border border-white/10 max-w-md text-center">
          <p className="text-red-400 mb-4 text-sm">Link inválido ou incompleto.</p>
          <Link to="/forgot-password" className="text-accent-400 hover:text-accent-300 text-sm font-medium">
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-dark flex items-center justify-center p-3 md:p-4 relative">
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
              Nova senha
            </h1>
            <p className="text-xs md:text-sm text-dark-300">Defina uma nova senha para sua conta.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {error && (
              <div className="px-3 py-2 md:px-4 md:py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs md:text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs md:text-sm font-semibold text-dark-200 mb-2">
                Nova senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-dark-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3.5 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500 text-sm md:text-base"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold text-dark-200 mb-2">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-dark-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3.5 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500 text-sm md:text-base"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 md:py-3.5 bg-gradient-accent text-white font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all disabled:opacity-50 text-sm md:text-base"
            >
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-xs md:text-sm text-accent-400 hover:text-accent-300 font-medium transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
