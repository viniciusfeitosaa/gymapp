import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LogOut, Dumbbell, Calendar, Activity, Clock, Home, User, ChevronRight, Play, CheckCircle, X } from 'lucide-react';
import { GymCodeIcon } from '../components/GymCodeIcon';

interface Exercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  rest?: string;
  weight?: string;
  notes?: string;
  videoUrl?: string;
  imageUrl?: string;
  order: number;
}

interface Workout {
  id: string;
  name: string;
  dayOfWeek: string;
  description?: string;
  exercises: Exercise[];
}

function FocusModeWorkout({
  workout,
  onClose,
  onFinished,
}: {
  workout: Workout;
  onClose: () => void;
  onFinished?: () => void;
}) {
  const [phase, setPhase] = useState<'countdown' | 'workout'>('countdown');
  const [count, setCount] = useState(3);
  const [finishing, setFinishing] = useState(false);
  const [videoPlayer, setVideoPlayer] = useState<{ embedUrl: string; originalUrl: string } | null>(null);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count <= 0) {
      const t = setTimeout(() => setPhase('workout'), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  const handleFinish = async () => {
    try {
      setFinishing(true);
      await api.post(`/workouts/log/${workout.id}`, {});
      onFinished?.();
      onClose();
    } catch (e) {
      console.error('Erro ao registrar treino:', e);
    } finally {
      setFinishing(false);
    }
  };

  const openVideoInApp = (videoUrl: string) => {
    const embed = getYouTubeEmbedUrl(videoUrl);
    if (embed) {
      setVideoPlayer({ embedUrl: embed, originalUrl: videoUrl });
      return;
    }
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {phase === 'countdown' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-scaleIn">
            <p className="text-white/70 text-lg md:text-xl font-semibold mb-4 uppercase tracking-wider">
              Preparar...
            </p>
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-accent flex items-center justify-center shadow-strong animate-pulse">
              <span className="text-6xl md:text-7xl font-display font-bold text-white">
                {count > 0 ? count : 'Go!'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 pb-24">
          <div className="shrink-0">
            <div className="flex justify-end mb-3">
              <button
                onClick={onClose}
                className="z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Sair"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-white mb-1 truncate">
              {workout.name}
            </h2>
            {workout.description && (
              <p className="text-white/70 text-sm mb-4 line-clamp-2">{workout.description}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {(workout.exercises || []).map((ex, idx) => (
              <div
                key={ex.id ?? idx}
                className="group relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/55 via-slate-900/45 to-indigo-900/35 p-5 md:p-6 shadow-2xl shadow-black/25 backdrop-blur-xl"
              >
                <div className="pointer-events-none absolute inset-0 opacity-80">
                  <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-accent-400/15 blur-2xl" />
                  <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-accent-500/30 ring-1 ring-white/35">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/55 font-semibold">Exercício</p>
                      <h3 className="text-lg md:text-xl font-display font-bold text-white mt-0.5 leading-tight">
                        {ex.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-white/60">Séries</p>
                      <p className="text-sm font-bold text-white">{ex.sets}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-white/60">Reps</p>
                      <p className="text-sm font-bold text-white">{ex.reps}</p>
                    </div>
                    {ex.rest && (
                      <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-white/60">Descanso</p>
                        <p className="text-sm font-bold text-white">{ex.rest}</p>
                      </div>
                    )}
                    {ex.weight && (
                      <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-white/60">Peso</p>
                        <p className="text-sm font-bold text-white">{ex.weight}</p>
                      </div>
                    )}
                  </div>

                  {ex.notes && (
                    <div className="mt-4 rounded-2xl border border-amber-200/35 bg-gradient-to-r from-amber-400/12 to-orange-400/8 px-4 py-3 ring-1 ring-white/10">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100/90">Execucao</p>
                      <p className="mt-1.5 text-sm leading-relaxed font-medium text-amber-50 whitespace-pre-line">{ex.notes}</p>
                    </div>
                  )}
                </div>

                {ex.imageUrl && (
                  <div className="relative z-10 mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/55 text-[11px] font-semibold uppercase tracking-[0.12em] mb-2">Referência visual</p>
                    <div className="rounded-2xl overflow-hidden border border-white/20 bg-black/30 shadow-inner ring-1 ring-white/10">
                      <img
                        src={ex.imageUrl}
                        alt={ex.name}
                        className="w-full h-auto object-cover max-h-56"
                      />
                    </div>
                  </div>
                )}
                {ex.videoUrl && (
                  <button
                    type="button"
                    onClick={() => openVideoInApp(ex.videoUrl!)}
                    className={`relative z-10 inline-flex items-center justify-center gap-2 mt-4 px-4 py-3 rounded-2xl bg-red-500/18 hover:bg-red-500/28 border border-red-300/40 text-red-100 text-sm font-semibold transition-all hover:translate-y-[-1px] active:translate-y-0 ${ex.imageUrl ? 'w-full' : 'w-full md:w-auto'}`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Assistir execução no YouTube
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 to-transparent pt-8">
            <button
              onClick={handleFinish}
              disabled={finishing}
              className="w-full py-4 rounded-2xl bg-gradient-accent text-white font-bold text-lg shadow-strong flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {finishing ? (
                <span className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Finalizar treino
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Player de vídeo dentro do app (modo focado) */}
      {videoPlayer && (
        <div
          className="fixed inset-0 z-[110] flex flex-col bg-black/95 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Player de vídeo"
        >
          <div className="flex items-center justify-between p-3 md:p-4 bg-black/50">
            <p className="text-white font-semibold">Vídeo do exercício</p>
            <button
              type="button"
              onClick={() => setVideoPlayer(null)}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label="Fechar vídeo"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 overflow-auto">
            <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-dark-900 shadow-strong flex-shrink-0">
              <iframe
                src={videoPlayer.embedUrl}
                title="Vídeo do exercício"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <a
              href={videoPlayer.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Não consegue assistir aqui? Abrir no YouTube
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [focusWorkout, setFocusWorkout] = useState<Workout | null>(null);
  const refetchLogsRef = useRef<() => void>(() => {});

  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: Home, path: '/student/dashboard' },
    { id: 'treinos', label: 'Treinos', icon: Dumbbell, path: '/student/treinos' },
    { id: 'perfil', label: 'Perfil', icon: User, path: '/student/perfil' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-50/95 via-white to-primary-50/95 backdrop-blur-xl shadow-soft border-b border-primary-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center shadow-medium">
                <GymCodeIcon size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold bg-gradient-accent bg-clip-text text-transparent">
                  Gym Code
                </h1>
                <p className="text-xs text-slate-500 font-medium">Meus Treinos</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-gradient-accent text-white shadow-medium'
                        : 'text-dark-600 hover:bg-dark-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-dark-900">{user?.name}</p>
                <p className="text-xs text-dark-400">Aluno</p>
              </div>
              <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-dark-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPath === 'dashboard' && (
          <StudentDashboardHome
            onStartFocusMode={setFocusWorkout}
            refetchLogsRef={refetchLogsRef}
          />
        )}
        {currentPath === 'treinos' && (
          <StudentTreinosPage onStartFocusMode={setFocusWorkout} refetchLogsRef={refetchLogsRef} />
        )}
        {currentPath === 'perfil' && <StudentPerfilPage />}
      </main>

      {/* Modo focado: countdown + exercícios */}
      {focusWorkout && (
        <FocusModeWorkout
          workout={focusWorkout}
          onClose={() => setFocusWorkout(null)}
          onFinished={() => refetchLogsRef.current()}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-dark-200 shadow-strong z-50">
        <div className="grid grid-cols-3 gap-0.5 p-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-accent text-white'
                    : 'text-dark-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

interface WorkoutLogItem {
  id: string;
  date: string;
  workoutId?: string;
  workout?: { id: string; name: string; dayOfWeek: string };
}

/** Semana atual: segunda a domingo. Retorna só logs desta semana para "concluído" zerar a cada semana. */
function getLogsFromCurrentWeek(logs: WorkoutLogItem[]): WorkoutLogItem[] {
  const now = new Date();
  const day = now.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  const diff = day === 0 ? 6 : day - 1; // dias para voltar à segunda
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return logs.filter((l) => {
    const d = new Date(l.date);
    return d >= start && d <= end;
  });
}

function StudentDashboardHome({
  onStartFocusMode,
  refetchLogsRef,
}: {
  onStartFocusMode: (w: Workout) => void;
  refetchLogsRef: MutableRefObject<() => void>;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [logs, setLogs] = useState<WorkoutLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedExercise, setFocusedExercise] = useState<Exercise | null>(null);
  const [streakStats, setStreakStats] = useState<{ streak: number; points: number; totalWorkouts: number; missedLast7: number } | null>(null);

  const loadMyLogs = useCallback(async () => {
    try {
      const response = await api.get('/workouts/my-logs');
      setLogs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      setLogs([]);
    }
  }, []);

  const loadStreakStats = useCallback(async () => {
    try {
      const response = await api.get('/workouts/streak-stats');
      setStreakStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar ofensiva/pontos:', error);
      setStreakStats(null);
    }
  }, []);

  useEffect(() => {
    loadTodayWorkout();
    loadMyLogs();
    loadStreakStats();
  }, [loadMyLogs, loadStreakStats]);

  useEffect(() => {
    const refetch = () => {
      loadMyLogs();
      loadStreakStats();
    };
    refetchLogsRef.current = refetch;
    return () => {
      refetchLogsRef.current = () => {};
    };
  }, [refetchLogsRef, loadMyLogs, loadStreakStats]);

  const loadTodayWorkout = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/today');
      setTodayWorkout(response.data);
    } catch (error) {
      console.error('Erro ao carregar treino:', error);
    } finally {
      setLoading(false);
    }
  };

  const logsThisWeek = getLogsFromCurrentWeek(logs);
  const completedWorkoutIds = logsThisWeek.map((l) => l.workout?.id).filter(Boolean) as string[];
  const todayCompleted = todayWorkout?.id && completedWorkoutIds.includes(todayWorkout.id);

  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (!todayCompleted || confettiFiredRef.current || !todayWorkout) return;
    confettiFiredRef.current = true;
    const colors = ['#f97316', '#ea580c', '#22c55e', '#16a34a', '#3b82f6', '#6366f1'];
    const run = () => {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.75 }, colors });
      confetti({ particleCount: 50, spread: 100, origin: { y: 0.6 }, colors, scalar: 0.9 });
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [todayCompleted, todayWorkout]);

  const personalPhone = user?.personalTrainer?.phone;
  const whatsappUrl = personalPhone
    ? (() => {
        const digits = personalPhone.replace(/\D/g, '');
        if (digits.length < 10) return null;
        const number = digits.length <= 11 ? '55' + digits : digits;
        return `https://wa.me/${number}`;
      })()
    : null;

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1.5">
            Bem-vindo, {user?.name?.split(' ')[0] || 'Aluno'}! 👋
          </h2>
          <p className="text-dark-500 text-sm md:text-base">Vamos treinar hoje?</p>
        </div>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20BD5A] shadow-medium transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp do Personal
          </a>
        )}
      </div>

      {/* Today's Info */}
      <div
        className={`card-modern p-5 mb-6 border-2 transition-all duration-300 ${
          todayCompleted
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-medium'
            : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100'
        }`}
      >
        <div className="flex items-center gap-2.5 mb-3">
          {todayCompleted ? (
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          ) : (
            <Clock className="w-5 h-5 text-blue-600" />
          )}
          <h3 className="text-base font-display font-bold text-dark-900">Hoje</h3>
        </div>
        <p className="text-base md:text-lg font-display font-bold text-dark-900 mb-1 capitalize">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {todayCompleted ? (
          <p className="text-emerald-700 font-semibold text-base flex items-center gap-2">
            <span>Treino de hoje concluído!</span>
            <span className="text-xl" aria-hidden>🎉</span>
          </p>
        ) : (
          <p className="text-dark-600 text-sm">
            {todayWorkout ? 'Você tem treino hoje!' : 'Dia de descanso'}
          </p>
        )}
        {streakStats !== null && (
          <div className="mt-4 pt-4 border-t border-dark-200/60 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>🔥</span>
              <div>
                <p className="text-dark-900 font-bold text-lg leading-tight">{streakStats.streak}</p>
                <p className="text-dark-500 text-xs font-medium">dias seguidos</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card-modern p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-dark-500 mt-4">Carregando...</p>
        </div>
      ) : todayWorkout ? (
        <div className="card-modern p-5 md:p-6">
          {todayCompleted && (
            <div className="flex justify-end mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-medium">
                <CheckCircle className="w-3 h-3" />
                Concluído
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 mb-4">
            {!todayCompleted && (
              <div className="flex justify-end">
                <button
                  onClick={() => onStartFocusMode(todayWorkout)}
                  className="btn-primary inline-flex items-center justify-center gap-1.5 text-sm py-2 px-4"
                >
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  Iniciar
                </button>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-display font-bold text-dark-900 mb-0.5 truncate" title={todayWorkout.name}>
                {todayWorkout.name}
              </h3>
              {todayWorkout.description && (
                <p className="text-dark-600 text-sm line-clamp-2" title={todayWorkout.description}>
                  {todayWorkout.description}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-accent-50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 text-dark-700">
              <Dumbbell className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {todayWorkout.exercises?.length || 0} exercício(s)
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {todayWorkout.exercises?.slice(0, 3).map((exercise, idx) => (
              <div
                key={exercise.id ?? idx}
                role="button"
                tabIndex={0}
                onClick={() => setFocusedExercise(exercise)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFocusedExercise(exercise);
                  }
                }}
                className="bg-dark-50 rounded-lg p-3 flex items-center gap-2.5 cursor-pointer hover:bg-dark-100 hover:shadow-soft transition-all border-2 border-transparent hover:border-accent-200"
              >
                <div className="w-7 h-7 bg-gradient-accent text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {exercise.imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-dark-200 bg-dark-100 mb-1.5">
                      <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-auto max-h-28 object-contain" />
                    </div>
                  )}
                  <p className="font-semibold text-sm text-dark-900">{exercise.name}</p>
                  <p className="text-xs text-dark-600">
                    {exercise.sets}x{exercise.reps}
                    {exercise.weight && ` • ${exercise.weight}`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-400 flex-shrink-0" />
              </div>
            ))}
            {todayWorkout.exercises && todayWorkout.exercises.length > 3 && (
              <p className="text-sm text-dark-500 text-center pt-2">
                + {todayWorkout.exercises.length - 3} exercício(s)
              </p>
            )}
          </div>

          {/* Modal focado no exercício (Home) */}
          {focusedExercise && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
              onClick={() => setFocusedExercise(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="exercise-modal-title-home"
            >
              <div
                className="bg-white rounded-2xl shadow-strong max-w-md w-full p-5 md:p-6 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gradient-accent text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {(todayWorkout.exercises?.indexOf(focusedExercise) ?? 0) + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFocusedExercise(null)}
                    className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 id="exercise-modal-title-home" className="text-xl font-display font-bold text-dark-900 mb-3">
                  {focusedExercise.name}
                </h2>
                <div className="space-y-3 text-sm">
                  {focusedExercise.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-dark-200 bg-dark-50">
                      <img
                        src={focusedExercise.imageUrl}
                        alt={focusedExercise.name}
                        className="w-full h-auto max-h-56 object-contain"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-dark-50 rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-0.5">Séries</p>
                      <p className="text-base font-bold text-dark-900">{focusedExercise.sets}</p>
                    </div>
                    <div className="bg-dark-50 rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-0.5">Repetições</p>
                      <p className="text-base font-bold text-dark-900">{focusedExercise.reps}</p>
                    </div>
                    {focusedExercise.rest && (
                      <div className="bg-dark-50 rounded-lg p-3">
                        <p className="text-xs text-dark-500 mb-0.5">Descanso</p>
                        <p className="text-base font-bold text-dark-900">{focusedExercise.rest}</p>
                      </div>
                    )}
                    {focusedExercise.weight && (
                      <div className="bg-dark-50 rounded-lg p-3">
                        <p className="text-xs text-dark-500 mb-0.5">Peso</p>
                        <p className="text-base font-bold text-dark-900">{focusedExercise.weight}</p>
                      </div>
                    )}
                  </div>
                  {focusedExercise.notes && (
                    <div className="bg-accent-50 rounded-lg p-3 border border-accent-100">
                      <p className="text-xs text-dark-600 font-medium mb-0.5">💡 Observações</p>
                      <p className="text-dark-800 text-sm">{focusedExercise.notes}</p>
                    </div>
                  )}
                  {focusedExercise.videoUrl && (
                    <a
                      href={focusedExercise.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-gradient-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity shadow-medium"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Ver vídeo no YouTube
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFocusedExercise(null)}
                  className="w-full mt-4 py-2.5 rounded-xl border-2 border-dark-200 text-dark-700 text-sm font-semibold hover:bg-dark-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card-modern p-12 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-xl font-display font-bold text-dark-900 mb-2">
            Nenhum Treino para Hoje
          </h3>
          <p className="text-dark-500 text-sm mb-4 max-w-md mx-auto">
            Aproveite seu dia de descanso ou veja seus outros treinos!
          </p>
          <button
            onClick={() => navigate('/student/treinos')}
            className="btn-primary inline-flex items-center gap-1.5 text-sm py-2 px-4"
          >
            <Calendar className="w-4 h-4" />
            Ver Todos os Treinos
          </button>
        </div>
      )}
    </div>
  );
}

function StudentTreinosPage({
  onStartFocusMode,
  refetchLogsRef,
}: {
  onStartFocusMode: (w: Workout) => void;
  refetchLogsRef: MutableRefObject<() => void>;
}) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [logs, setLogs] = useState<WorkoutLogItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMyLogs = useCallback(async () => {
    try {
      const response = await api.get('/workouts/my-logs');
      setLogs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      setLogs([]);
    }
  }, []);

  const daysOfWeek = [
    { value: 'MONDAY', label: 'Segunda', short: 'SEG' },
    { value: 'TUESDAY', label: 'Terça', short: 'TER' },
    { value: 'WEDNESDAY', label: 'Quarta', short: 'QUA' },
    { value: 'THURSDAY', label: 'Quinta', short: 'QUI' },
    { value: 'FRIDAY', label: 'Sexta', short: 'SEX' },
    { value: 'SATURDAY', label: 'Sábado', short: 'SÁB' },
    { value: 'SUNDAY', label: 'Domingo', short: 'DOM' },
  ];

  useEffect(() => {
    loadWorkouts();
    loadMyLogs();
  }, [loadMyLogs]);

  useEffect(() => {
    refetchLogsRef.current = loadMyLogs;
    return () => {
      refetchLogsRef.current = () => {};
    };
  }, [refetchLogsRef, loadMyLogs]);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/my-workouts');
      setWorkouts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const workoutsByDay = daysOfWeek.map(day => ({
    ...day,
    workout: (workouts || []).find(w => w.dayOfWeek === day.value)
  }));

  const logsThisWeek = getLogsFromCurrentWeek(logs);
  const completedWorkoutIds = logsThisWeek.map((l) => l.workout?.id ?? l.workoutId).filter(Boolean) as string[];

  if (loading) {
    return (
      <div className="card-modern p-12 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-dark-500 mt-4">Carregando treinos...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1.5">
          Meus Treinos
        </h2>
        <p className="text-dark-500 text-sm md:text-base">Veja seus treinos da semana</p>
      </div>

      {/* Grade de Dias */}
      <div className="card-modern p-4 md:p-6 mb-6">
        <h3 className="text-base font-display font-bold text-dark-900 mb-4">
          Selecione o Dia
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {workoutsByDay.map((day) => {
            const isCompleted = day.workout && completedWorkoutIds.includes(day.workout.id);
            return (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                className={`p-2 rounded-lg transition-all ${
                  selectedDay === day.value
                    ? 'bg-gradient-accent text-white shadow-strong scale-105'
                    : day.workout
                    ? isCompleted
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300'
                      : 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-200'
                    : 'bg-dark-50 hover:bg-dark-100 border-2 border-dashed border-dark-200'
                }`}
              >
                <div className="text-center w-full">
                  <div className={`flex items-center mb-0.5 w-full ${
                    selectedDay === day.value ? 'text-white' : day.workout ? (isCompleted ? 'text-emerald-700' : 'text-blue-700') : 'text-dark-400'
                  }`}>
                    {day.workout && isCompleted ? (
                      <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${selectedDay === day.value ? 'text-white' : 'text-emerald-600'}`} />
                    ) : (
                      <span className="w-3.5 flex-shrink-0" aria-hidden />
                    )}
                    <span className="flex-1 text-center text-sm font-bold">{day.short}</span>
                    <span className="w-3.5 flex-shrink-0" aria-hidden />
                  </div>
                  <div className={`text-[10px] font-semibold ${
                    selectedDay === day.value ? 'text-white' : day.workout ? (isCompleted ? 'text-emerald-600' : 'text-blue-600') : 'text-dark-400'
                  }`}>
                    {day.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhes do Dia Selecionado */}
      {selectedDay && (() => {
        const dayData = workoutsByDay.find(d => d.value === selectedDay);
        if (!dayData) return null;

        return dayData.workout ? (
          <WorkoutDetailCard
            workout={dayData.workout}
            dayLabel={dayData.label}
            onStartFocusMode={onStartFocusMode}
            isCompleted={completedWorkoutIds.includes(dayData.workout.id)}
          />
        ) : (
          <div className="card-modern p-12 text-center">
            <div className="w-12 h-12 bg-dark-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-6 h-6 text-dark-400" />
            </div>
            <h4 className="text-lg font-bold text-dark-900 mb-2">
              Sem Treino para {dayData.label}
            </h4>
            <p className="text-dark-500 text-sm">
              Seu personal ainda não definiu treino para este dia
            </p>
          </div>
        );
      })()}
    </div>
  );
}

function WorkoutDetailCard({
  workout,
  dayLabel,
  onStartFocusMode,
  isCompleted,
}: {
  workout: Workout;
  dayLabel: string;
  onStartFocusMode: (w: Workout) => void;
  isCompleted?: boolean;
}) {
  const [focusedExercise, setFocusedExercise] = useState<Exercise | null>(null);
  const [videoPlayer, setVideoPlayer] = useState<{ embedUrl: string; originalUrl: string } | null>(null);

  return (
    <div className="card-modern p-6 md:p-8">
      {isCompleted && (
        <div className="flex justify-end mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-medium">
            <CheckCircle className="w-3 h-3" />
            Concluído
          </div>
        </div>
      )}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 text-xs text-blue-600 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-semibold truncate">{dayLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => onStartFocusMode(workout)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-xs font-semibold transition-colors shadow-medium"
            >
              Iniciar
            </button>
          </div>
          <h3 className="text-xl font-display font-bold text-dark-900 mb-0.5 truncate" title={workout.name}>
            {workout.name}
          </h3>
          {workout.description && (
            <p className="text-dark-600 text-sm line-clamp-2" title={workout.description}>
              {workout.description}
            </p>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-accent-50 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-2 text-dark-700">
          <Dumbbell className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {workout.exercises?.length || 0} exercício(s)
          </span>
        </div>
      </div>

      {workout.exercises && workout.exercises.length > 0 && (
        <div className="space-y-4">
          <h5 className="text-base font-display font-bold text-dark-900">
            Exercícios
          </h5>
          <div className="space-y-2.5">
            {workout.exercises.map((exercise, idx) => (
              <div
                key={exercise.id ?? idx}
                role="button"
                tabIndex={0}
                onClick={() => setFocusedExercise(exercise)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFocusedExercise(exercise);
                  }
                }}
                className="w-full text-left card-modern p-3 hover:shadow-medium transition-shadow cursor-pointer border-2 border-transparent hover:border-accent-200"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 bg-gradient-accent text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {exercise.imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-dark-200 bg-dark-50 mb-1.5">
                        <img
                          src={exercise.imageUrl}
                          alt={exercise.name}
                          className="w-full h-auto max-h-28 object-contain"
                        />
                      </div>
                    )}
                    <h6 className="font-semibold text-sm text-dark-900 mb-1.5">{exercise.name}</h6>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-dark-500">Séries:</span>
                        <span className="ml-2 font-semibold text-dark-900">{exercise.sets}</span>
                      </div>
                      <div>
                        <span className="text-dark-500">Reps:</span>
                        <span className="ml-2 font-semibold text-dark-900">{exercise.reps}</span>
                      </div>
                      {exercise.rest && (
                        <div>
                          <span className="text-dark-500">Descanso:</span>
                          <span className="ml-2 font-semibold text-dark-900">{exercise.rest}</span>
                        </div>
                      )}
                      {exercise.weight && (
                        <div>
                          <span className="text-dark-500">Peso:</span>
                          <span className="ml-2 font-semibold text-dark-900">{exercise.weight}</span>
                        </div>
                      )}
                    </div>
                    {exercise.notes && (
                      <p className="text-xs text-dark-600 mt-1.5 italic">
                        💡 {exercise.notes}
                      </p>
                    )}
                    {exercise.videoUrl && (
                      <span onClick={(e) => e.stopPropagation()} className="inline-block mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const embed = getYouTubeEmbedUrl(exercise.videoUrl!);
                            if (embed) setVideoPlayer({ embedUrl: embed, originalUrl: exercise.videoUrl! });
                            else window.open(exercise.videoUrl, '_blank');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-accent-600 hover:text-accent-700 font-semibold"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          Ver vídeo no YouTube
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

      {/* Modal focado no exercício */}
      {focusedExercise && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setFocusedExercise(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exercise-modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-strong max-w-md w-full p-5 md:p-6 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-gradient-accent text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                {(workout.exercises?.indexOf(focusedExercise) ?? 0) + 1}
              </div>
              <button
                type="button"
                onClick={() => setFocusedExercise(null)}
                className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 id="exercise-modal-title" className="text-xl font-display font-bold text-dark-900 mb-3">
              {focusedExercise.name}
            </h2>
            <div className="space-y-3 text-sm">
              {focusedExercise.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-dark-200 bg-dark-50">
                  <img
                    src={focusedExercise.imageUrl}
                    alt={focusedExercise.name}
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">Séries</p>
                  <p className="text-base font-bold text-dark-900">{focusedExercise.sets}</p>
                </div>
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">Repetições</p>
                  <p className="text-base font-bold text-dark-900">{focusedExercise.reps}</p>
                </div>
                {focusedExercise.rest && (
                  <div className="bg-dark-50 rounded-lg p-3">
                    <p className="text-xs text-dark-500 mb-0.5">Descanso</p>
                    <p className="text-base font-bold text-dark-900">{focusedExercise.rest}</p>
                  </div>
                )}
                {focusedExercise.weight && (
                  <div className="bg-dark-50 rounded-lg p-3">
                    <p className="text-xs text-dark-500 mb-0.5">Peso</p>
                    <p className="text-base font-bold text-dark-900">{focusedExercise.weight}</p>
                  </div>
                )}
              </div>
              {focusedExercise.notes && (
                <div className="bg-accent-50 rounded-lg p-3 border border-accent-100">
                  <p className="text-xs text-dark-600 font-medium mb-0.5">💡 Observações</p>
                  <p className="text-dark-800 text-sm">{focusedExercise.notes}</p>
                </div>
              )}
              {focusedExercise.videoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const embed = getYouTubeEmbedUrl(focusedExercise.videoUrl!);
                    if (embed) setVideoPlayer({ embedUrl: embed, originalUrl: focusedExercise.videoUrl! });
                    else window.open(focusedExercise.videoUrl, '_blank');
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-gradient-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity shadow-medium"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Ver vídeo no YouTube
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFocusedExercise(null)}
              className="w-full mt-4 py-2.5 rounded-xl border-2 border-dark-200 text-dark-700 text-sm font-semibold hover:bg-dark-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Player de vídeo dentro do app */}
      {videoPlayer && (
        <div
          className="fixed inset-0 z-[110] flex flex-col bg-black/95 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Player de vídeo"
        >
          <div className="flex items-center justify-between p-3 md:p-4 bg-black/50">
            <p className="text-white font-semibold">Vídeo do exercício</p>
            <button
              type="button"
              onClick={() => setVideoPlayer(null)}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label="Fechar vídeo"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 overflow-auto">
            <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-dark-900 shadow-strong flex-shrink-0">
              <iframe
                src={videoPlayer.embedUrl}
                title="Vídeo do exercício"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <a
              href={videoPlayer.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Não consegue assistir aqui? Abrir no YouTube
            </a>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}

/** Converte URL do YouTube (watch ou youtu.be) em URL de embed para iframe */
function getYouTubeEmbedUrl(watchUrl: string): string | null {
  if (!watchUrl || !watchUrl.includes('youtube') && !watchUrl.includes('youtu.be')) return null;
  let videoId: string | null = null;
  let startSec = 0;
  try {
    const url = new URL(watchUrl);
    if (url.hostname === 'www.youtu.be' || url.hostname === 'youtu.be') {
      videoId = url.pathname.slice(1).split('/')[0] || null;
      const t = url.searchParams.get('t');
      if (t) startSec = parseInt(t.replace('s', ''), 10) || 0;
    } else {
      videoId = url.searchParams.get('v');
      const t = url.searchParams.get('t');
      if (t) startSec = parseInt(t.replace('s', ''), 10) || 0;
    }
    if (!videoId) return null;
    const base = `https://www.youtube-nocookie.com/embed/${videoId}`;
    const params = startSec > 0 ? `?start=${startSec}` : '';
    return base + params;
  } catch {
    return null;
  }
}

const DAY_LABELS: { [key: string]: string } = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

interface StudentProfile {
  id: string;
  name: string;
  accessCode: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  weight?: number;
  height?: number;
  trainingDays: string[];
  personalTrainer?: { id: string; name: string; phone?: string; email?: string };
}

function StudentPerfilPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/students/me/profile');
        setProfile(response.data?.student ?? null);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const display = profile ?? user;
  const trainingDaysLabel =
    profile?.trainingDays?.length &&
    profile.trainingDays
      .map((d) => DAY_LABELS[d] || d)
      .join(', ');

  if (loading) {
    return (
      <div className="pb-20 md:pb-0">
        <div className="card-modern p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-dark-500 mt-4">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1.5">
          Meu Perfil
        </h2>
        <p className="text-dark-500 text-sm md:text-base">Suas informações</p>
      </div>

      <div className="card-modern p-5 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-accent rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-medium">
            {(display?.name ?? user?.name)?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-display font-bold text-dark-900 mb-0.5">
              {display?.name ?? user?.name}
            </h3>
            <p className="text-dark-500 text-sm mb-1.5">Aluno</p>
            {profile?.accessCode && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-50 border border-accent-200">
                <span className="text-xs text-dark-600 font-medium">Código de acesso:</span>
                <span className="text-base font-display font-bold text-accent-700 tracking-wider">
                  {profile.accessCode}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h4 className="text-base font-display font-bold text-dark-900 mb-3">
              Informações
            </h4>
            <div className="space-y-2.5">
              <div className="bg-dark-50 rounded-lg p-3">
                <p className="text-xs text-dark-500 mb-0.5">Nome</p>
                <p className="text-dark-900 font-semibold text-sm">{display?.name ?? user?.name}</p>
              </div>
              {(profile?.accessCode || display?.accessCode) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">Código de acesso</p>
                  <p className="text-dark-900 font-semibold text-sm tracking-wider">
                    {profile?.accessCode ?? display?.accessCode}
                  </p>
                </div>
              )}
              {(profile?.email ?? user?.email) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">Email</p>
                  <p className="text-dark-900 font-semibold text-sm">{profile?.email ?? user?.email}</p>
                </div>
              )}
              {(profile?.phone ?? user?.phone) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">Telefone</p>
                  <p className="text-dark-900 font-semibold text-sm">{profile?.phone ?? user?.phone}</p>
                </div>
              )}
              {profile?.birthDate && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">Data de nascimento</p>
                  <p className="text-dark-900 font-semibold text-sm">
                    {new Date(profile.birthDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {(profile?.weight != null && profile?.weight > 0) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">Peso</p>
                  <p className="text-dark-900 font-semibold text-sm">{profile.weight} kg</p>
                </div>
              )}
              {(profile?.height != null && profile?.height > 0) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">Altura</p>
                  <p className="text-dark-900 font-semibold text-sm">{profile.height} cm</p>
                </div>
              )}
              {trainingDaysLabel && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">Dias de treino</p>
                  <p className="text-dark-900 font-semibold text-sm">{trainingDaysLabel}</p>
                </div>
              )}
              {profile?.personalTrainer?.name && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-dark-500 mb-0.5">Personal Trainer</p>
                  <p className="text-dark-900 font-semibold text-sm">{profile.personalTrainer.name}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full md:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 shadow-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

