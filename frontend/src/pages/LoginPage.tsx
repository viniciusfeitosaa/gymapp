import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, User, Lock, Sparkles } from 'lucide-react';

const STUDENT_LOCKOUT_MINUTES = 5;
const STUDENT_LOCKOUT_MS = STUDENT_LOCKOUT_MINUTES * 60 * 1000;
const STUDENT_BLOCKED_UNTIL_KEY = 'studentLoginBlockedUntil';
const MAX_STUDENT_ATTEMPTS = 2;

export default function LoginPage() {
  const [userType, setUserType] = useState<'personal' | 'student' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedStudentAttempts, setFailedStudentAttempts] = useState(0);
  const [studentBlockedUntil, setStudentBlockedUntil] = useState<number | null>(null);

  const { login, loginStudent } = useAuth();
  const navigate = useNavigate();

  const isStudentBlocked =
    studentBlockedUntil !== null && Date.now() < studentBlockedUntil;

  useEffect(() => {
    if (userType !== 'student') return;
    const stored = sessionStorage.getItem(STUDENT_BLOCKED_UNTIL_KEY);
    if (!stored) return;
    const until = Number(stored);
    if (until > Date.now()) {
      setStudentBlockedUntil(until);
      setError('Muitas tentativas de login. Aguarde 5 minutos para tentar novamente.');
    } else {
      sessionStorage.removeItem(STUDENT_BLOCKED_UNTIL_KEY);
      setStudentBlockedUntil(null);
    }
  }, [userType]);

  useEffect(() => {
    if (!studentBlockedUntil || studentBlockedUntil <= Date.now()) return;
    const t = setInterval(() => {
      if (Date.now() >= studentBlockedUntil) {
        setStudentBlockedUntil(null);
        setError('');
        sessionStorage.removeItem(STUDENT_BLOCKED_UNTIL_KEY);
        clearInterval(t);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [studentBlockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (userType === 'personal') {
        await login(email, password, 'personal');
        navigate('/personal/home');
      } else if (userType === 'student') {
        if (isStudentBlocked) {
          setError('Muitas tentativas de login. Aguarde 5 minutos para tentar novamente.');
          setLoading(false);
          return;
        }
        await loginStudent(accessCode);
        setFailedStudentAttempts(0);
        setStudentBlockedUntil(null);
        sessionStorage.removeItem(STUDENT_BLOCKED_UNTIL_KEY);
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      const message = err?.message || 'Código inválido';
      setError(message);
      if (userType === 'student') {
        const nextAttempts = failedStudentAttempts + 1;
        setFailedStudentAttempts(nextAttempts);
        if (nextAttempts >= MAX_STUDENT_ATTEMPTS) {
          const until = Date.now() + STUDENT_LOCKOUT_MS;
          setStudentBlockedUntil(until);
          sessionStorage.setItem(STUDENT_BLOCKED_UNTIL_KEY, String(until));
          setError('Muitas tentativas de login. Aguarde 5 minutos para tentar novamente.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-dark flex items-center justify-center p-3 md:p-4 relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-5 w-48 h-48 md:w-72 md:h-72 bg-primary-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-5 w-64 h-64 md:w-96 md:h-96 bg-accent-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[600px] md:h-[600px] bg-primary-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md relative px-4">
          <div className="glass-effect rounded-2xl md:rounded-3xl shadow-strong p-6 md:p-10 border border-white/10">
            <div className="text-center mb-6 md:mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 bg-gradient-accent rounded-xl md:rounded-2xl mb-4 md:mb-6 shadow-medium">
                <Dumbbell className="w-7 h-7 md:w-10 md:h-10 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-display font-bold text-white mb-2 md:mb-3">
                Gym<span className="bg-gradient-accent bg-clip-text text-transparent">Code</span>
              </h1>
              <p className="text-slate-300 text-sm md:text-lg">Conectando Personal Trainers e Alunos</p>
              <div className="flex items-center justify-center gap-2 mt-3 md:mt-4">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-accent-400" />
                <p className="text-slate-400 text-xs md:text-sm">Escolha seu perfil para continuar</p>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <button
                onClick={() => setUserType('personal')}
                className="group w-full flex items-center justify-between px-4 py-3 md:px-8 md:py-5 bg-gradient-accent text-white rounded-xl hover:shadow-strong transform hover:-translate-y-1 transition-all duration-300 font-display font-semibold text-base md:text-lg relative overflow-hidden"
              >
                <div className="flex items-center gap-3 md:gap-4 relative z-10">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm md:text-base">Personal Trainer</div>
                    <div className="text-xs font-normal opacity-90 hidden sm:block">Gerencie seus alunos</div>
                  </div>
                </div>
                <div className="text-xl md:text-2xl group-hover:translate-x-1 transition-transform">→</div>
                <div className="absolute inset-0 bg-gradient-to-r from-accent-600/0 via-accent-400/20 to-accent-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </button>

              <button
                onClick={() => setUserType('student')}
                className="group w-full flex items-center justify-between px-4 py-3 md:px-8 md:py-5 bg-dark-700/50 backdrop-blur-sm text-white rounded-xl hover:bg-dark-700 hover:shadow-medium transform hover:-translate-y-1 transition-all duration-300 font-display font-semibold text-base md:text-lg border border-dark-600"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Dumbbell className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm md:text-base">Aluno</div>
                    <div className="text-xs font-normal opacity-75 hidden sm:block">Acesse seus treinos</div>
                  </div>
                </div>
                <div className="text-xl md:text-2xl group-hover:translate-x-1 transition-transform">→</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-dark flex items-center justify-center p-3 md:p-4 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 w-48 h-48 md:w-72 md:h-72 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-5 w-64 h-64 md:w-96 md:h-96 bg-accent-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[600px] md:h-[600px] bg-primary-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative px-4">
        <div className="glass-effect rounded-2xl md:rounded-3xl shadow-strong p-6 md:p-10 border border-white/10">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-accent rounded-xl md:rounded-2xl mb-4 md:mb-5 shadow-medium">
              <Dumbbell className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h1 className="text-xl md:text-3xl font-display font-bold text-white mb-2">
              {userType === 'personal' ? 'Área do Personal' : 'Área do Aluno'}
            </h1>
            {!(userType === 'student' && error) && (
              <button
                type="button"
                onClick={() => setUserType(null)}
                className="text-xs md:text-sm text-accent-400 hover:text-accent-300 font-medium transition-colors inline-flex items-center gap-1"
              >
                ← Voltar para Gym Code
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {error && !(userType === 'student' && (error.includes('Aguarde') || isStudentBlocked)) && (
              <div
                className={`px-3 py-2 md:px-4 md:py-3 rounded-xl backdrop-blur-sm text-xs md:text-sm ${
                  error.includes('Aguarde')
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {error}
              </div>
            )}

            {userType === 'personal' ? (
              <>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-dark-200 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-dark-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3.5 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500 text-sm md:text-base"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-dark-200 mb-2">
                    Senha
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
                    />
                  </div>
                </div>
              </>
            ) : (error.includes('Aguarde') || isStudentBlocked) ? (
              <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 md:p-5 text-center">
                <p className="text-sm font-semibold text-amber-400 mb-1">Acesso bloqueado</p>
                <p className="text-xs text-amber-200/90">
                  {error || 'Muitas tentativas de login. Aguarde 5 minutos para tentar novamente.'}
                </p>
                <p className="text-xs text-slate-500 mt-2">Tente novamente em 5 minutos.</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs md:text-sm font-semibold text-dark-200 mb-2 text-center">
                  Código de Acesso
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                  className="w-full px-3 md:px-4 py-3 md:py-4 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none text-center text-2xl md:text-3xl font-bold tracking-[0.2em] md:tracking-[0.4em] text-white placeholder:text-slate-600 placeholder:tracking-[0.2em] md:placeholder:tracking-[0.4em]"
                  placeholder="A1234"
                  maxLength={5}
                  required
                />
                <p className="text-xs text-slate-400 text-center mt-2">4 números + 1 letra maiúscula (ex: A1234)</p>
                {error && (
                  <p className="text-xs text-slate-500 text-center mt-1">Tentativas são contadas por dispositivo. Após 2 erros, bloqueio de 5 minutos.</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (userType === 'student' && (error.includes('Aguarde') || isStudentBlocked))}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>

            {userType === 'personal' && (
              <div className="text-center pt-2">
                <p className="text-xs md:text-sm text-slate-300">
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
