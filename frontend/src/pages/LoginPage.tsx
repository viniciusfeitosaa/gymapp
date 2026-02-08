import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, User, Lock, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [userType, setUserType] = useState<'personal' | 'student' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginStudent } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (userType === 'personal') {
        await login(email, password, 'personal');
        navigate('/personal/dashboard');
      } else if (userType === 'student') {
        await loginStudent(accessCode);
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-md w-full relative">
          <div className="glass-effect rounded-3xl shadow-strong p-10 border border-white/10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-accent rounded-2xl mb-6 shadow-medium">
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-display font-bold text-white mb-3">
                Gym<span className="bg-gradient-accent bg-clip-text text-transparent">Connect</span>
              </h1>
              <p className="text-slate-300 text-lg">Conectando Personal Trainers e Alunos</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Sparkles className="w-4 h-4 text-accent-400" />
                <p className="text-slate-400 text-sm">Escolha seu perfil para continuar</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setUserType('personal')}
                className="group w-full flex items-center justify-between px-8 py-5 bg-gradient-accent text-white rounded-xl hover:shadow-strong transform hover:-translate-y-1 transition-all duration-300 font-display font-semibold text-lg relative overflow-hidden"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div>Personal Trainer</div>
                    <div className="text-xs font-normal opacity-90">Gerencie seus alunos</div>
                  </div>
                </div>
                <div className="text-2xl group-hover:translate-x-1 transition-transform">→</div>
                <div className="absolute inset-0 bg-gradient-to-r from-accent-600/0 via-accent-400/20 to-accent-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </button>

              <button
                onClick={() => setUserType('student')}
                className="group w-full flex items-center justify-between px-8 py-5 bg-dark-700/50 backdrop-blur-sm text-white rounded-xl hover:bg-dark-700 hover:shadow-medium transform hover:-translate-y-1 transition-all duration-300 font-display font-semibold text-lg border border-dark-600"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div>Aluno</div>
                    <div className="text-xs font-normal opacity-75">Acesse seus treinos</div>
                  </div>
                </div>
                <div className="text-2xl group-hover:translate-x-1 transition-transform">→</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative">
        <div className="glass-effect rounded-3xl shadow-strong p-10 border border-white/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-accent rounded-2xl mb-5 shadow-medium">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              {userType === 'personal' ? 'Área do Personal' : 'Área do Aluno'}
            </h1>
            <button
              onClick={() => setUserType(null)}
              className="text-sm text-accent-400 hover:text-accent-300 font-medium transition-colors inline-flex items-center gap-1"
            >
              ← Voltar para GymConnect
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl backdrop-blur-sm">
                {error}
              </div>
            )}

            {userType === 'personal' ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2.5">
                    Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-200 mb-2.5">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2.5 text-center">
                  Código de Acesso
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-4 py-4 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none text-center text-3xl font-bold tracking-[0.5em] text-white placeholder:text-slate-600 placeholder:tracking-[0.5em]"
                  placeholder="00000"
                  maxLength={5}
                  required
                />
                <p className="text-xs text-slate-400 text-center mt-2">Digite os 5 dígitos fornecidos pelo seu Personal</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>

            {userType === 'personal' && (
              <div className="text-center pt-2">
                <p className="text-sm text-slate-300">
                  Não tem cadastro?{' '}
                  <Link to="/register" className="text-accent-400 hover:text-accent-300 font-semibold transition-colors">
                    Cadastre-se aqui
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
