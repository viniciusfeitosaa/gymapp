import { useState, useEffect, useRef, useCallback, MutableRefObject, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LogOut, Dumbbell, Calendar, Activity, Clock, Home, User, ChevronRight, Play, CheckCircle, X, Timer } from 'lucide-react';
import { StudentBrandMark } from '../components/StudentBrandMark';
import { useStudentBrand } from '../hooks/useStudentBrand';
import { AccountDeletionSection } from '../components/AccountDeletionSection';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { StudentTrainingBlocked } from '../components/StudentTrainingBlocked';
import { appLocaleToDateLocale } from '../i18n/dateLocale';
import { useWeekdayShortMap, type WeekdayValue } from '../i18n/useWeekdayOptions';
import { applyNativeSafeAreas } from '../lib/applyNativeSafeAreas';
import { resolveAssetUrl } from '../lib/resolveAssetUrl';

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

function parseRestToSeconds(rest: string): number | null {
  const trimmed = rest.trim().toLowerCase();
  if (!trimmed) return null;

  const colonMatch = trimmed.match(/^(\d+)\s*:\s*(\d+)$/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }

  const minMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(?:min|minutos?|m)$/);
  if (minMatch) {
    return Math.round(parseFloat(minMatch[1].replace(',', '.')) * 60);
  }

  const secMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(?:s|seg|segs|segundos?)?$/);
  if (secMatch) {
    return Math.round(parseFloat(secMatch[1].replace(',', '.')));
  }

  return null;
}

function formatRestCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}:${secs.toString().padStart(2, '0')}`;
  return `${secs}s`;
}

function FocusModeRestTimer({
  rest,
  timerId,
  activeTimer,
  doneFlashId,
  onStart,
  onStop,
  fullWidth = false,
}: {
  rest: string;
  timerId: string;
  activeTimer: { id: string; remaining: number; total: number } | null;
  doneFlashId: string | null;
  onStart: (id: string, seconds: number) => void;
  onStop: () => void;
  fullWidth?: boolean;
}) {
  const { t } = useTranslation();
  const totalSeconds = parseRestToSeconds(rest);
  const isActive = activeTimer?.id === timerId;
  const isRunning = isActive && activeTimer.remaining > 0;
  const isDone = doneFlashId === timerId;

  if (totalSeconds === null) {
    return (
      <div
        className={`rounded-xl bg-white/10 border border-white/15 px-3 py-2 ${fullWidth ? 'w-full py-3' : ''}`}
      >
        <p className="text-[10px] uppercase tracking-wide text-white/60">{t('student.rest')}</p>
        <p className="text-sm font-bold text-white">{rest}</p>
      </div>
    );
  }

  const progress =
    isRunning && activeTimer.total > 0
      ? ((activeTimer.total - activeTimer.remaining) / activeTimer.total) * 100
      : isDone
        ? 100
        : 0;

  return (
    <button
      type="button"
      onClick={() => (isRunning ? onStop() : onStart(timerId, totalSeconds))}
      className={`relative overflow-hidden rounded-xl border text-left transition-all active:scale-[0.98] ${
        fullWidth ? 'w-full px-4 py-3' : 'px-3 py-2'
      } ${
        isDone
          ? 'border-emerald-400/60 bg-emerald-500/25'
          : isRunning
            ? 'border-emerald-400/50 bg-emerald-500/20 ring-2 ring-emerald-400/30'
            : 'border-white/15 bg-white/10 hover:bg-white/20'
      }`}
      aria-label={isRunning ? t('student.stopRestTimer') : t('student.startRestTimer')}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-emerald-400/15 transition-[width] duration-1000 ease-linear"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-white/60">{t('student.rest')}</p>
          <p className={`text-sm font-bold ${isDone ? 'text-emerald-100' : 'text-white'}`}>
            {isDone
              ? t('student.restTimerDone')
              : isRunning
                ? formatRestCountdown(activeTimer.remaining)
                : rest}
          </p>
          {!isRunning && !isDone && (
            <p className="mt-0.5 text-[10px] font-medium text-white/45">{t('student.startRestTimer')}</p>
          )}
        </div>
        <Timer className={`h-4 w-4 shrink-0 ${isRunning || isDone ? 'text-emerald-300' : 'text-white/40'}`} />
      </div>
    </button>
  );
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
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'countdown' | 'workout'>('countdown');
  const [count, setCount] = useState(3);
  const [finishing, setFinishing] = useState(false);
  const [videoPlayer, setVideoPlayer] = useState<{ embedUrl: string; originalUrl: string } | null>(null);
  const [restTimer, setRestTimer] = useState<{ id: string; remaining: number; total: number } | null>(null);
  const [restDoneFlash, setRestDoneFlash] = useState<string | null>(null);
  const restDoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (restDoneTimeoutRef.current) clearTimeout(restDoneTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count <= 0) {
      const timer = setTimeout(() => setPhase('workout'), 800);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, count]);

  useEffect(() => {
    if (!restTimer || restTimer.remaining <= 0) return;
    const tick = setTimeout(() => {
      setRestTimer((prev) => {
        if (!prev) return null;
        if (prev.remaining <= 1) {
          setRestDoneFlash(prev.id);
          if (restDoneTimeoutRef.current) clearTimeout(restDoneTimeoutRef.current);
          restDoneTimeoutRef.current = setTimeout(() => setRestDoneFlash(null), 2500);
          return null;
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearTimeout(tick);
  }, [restTimer]);

  const startRestTimer = (id: string, seconds: number) => {
    if (restDoneTimeoutRef.current) clearTimeout(restDoneTimeoutRef.current);
    setRestDoneFlash(null);
    setRestTimer({ id, remaining: seconds, total: seconds });
  };

  const stopRestTimer = () => setRestTimer(null);

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
              {t('student.prepare')}
            </p>
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-accent flex items-center justify-center shadow-strong animate-pulse">
              <span className="text-6xl md:text-7xl font-display font-bold text-white">
                {count > 0 ? count : t('student.go')}
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
                aria-label={t('student.exit')}
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
            {(workout.exercises || []).map((ex, idx) => {
              const timerId = `${idx}-${ex.id ?? ex.name}`;

              return (
              <div key={ex.id ?? idx} className="space-y-3">
              <div
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
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/55 font-semibold">{t('student.exercise')}</p>
                      <h3 className="text-lg md:text-xl font-display font-bold text-white mt-0.5 leading-tight">
                        {ex.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-white/60">{t('student.sets')}</p>
                      <p className="text-sm font-bold text-white">{ex.sets}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-white/60">{t('student.reps')}</p>
                      <p className="text-sm font-bold text-white">{ex.reps}</p>
                    </div>
                    {ex.weight && (
                      <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-white/60">{t('student.weight')}</p>
                        <p className="text-sm font-bold text-white">{ex.weight}</p>
                      </div>
                    )}
                  </div>

                  {ex.notes && (
                    <div className="mt-4 rounded-2xl border border-amber-200/35 bg-gradient-to-r from-amber-400/12 to-orange-400/8 px-4 py-3 ring-1 ring-white/10">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100/90">{t('student.execution')}</p>
                      <p className="mt-1.5 text-sm leading-relaxed font-medium text-amber-50 whitespace-pre-line">{ex.notes}</p>
                    </div>
                  )}
                </div>

                {ex.imageUrl && (
                  <div className="relative z-10 mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/55 text-[11px] font-semibold uppercase tracking-[0.12em] mb-2">{t('student.visualReference')}</p>
                    <div className="rounded-2xl overflow-hidden border border-white/20 bg-black/30 shadow-inner ring-1 ring-white/10">
                      <img
                        src={resolveAssetUrl(ex.imageUrl) || ex.imageUrl}
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
                    {t('student.watchOnYoutube')}
                  </button>
                )}
              </div>

              {ex.rest && (
                <FocusModeRestTimer
                  rest={ex.rest}
                  timerId={timerId}
                  activeTimer={restTimer}
                  doneFlashId={restDoneFlash}
                  onStart={startRestTimer}
                  onStop={stopRestTimer}
                  fullWidth
                />
              )}
              </div>
              );
            })}
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
                  {t('student.finishWorkout')}
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
          aria-label={t('student.videoPlayer')}
        >
          <div className="flex items-center justify-between p-3 md:p-4 bg-black/50">
            <p className="text-white font-semibold">{t('student.exerciseVideo')}</p>
            <button
              type="button"
              onClick={() => setVideoPlayer(null)}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label={t('student.closeVideo')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 overflow-auto">
            <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-dark-900 shadow-strong flex-shrink-0">
              <iframe
                src={videoPlayer.embedUrl}
                title={t('student.exerciseVideo')}
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
              {t('student.openOnYoutube')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { personal: brandPersonal, themeStyle } = useStudentBrand();
  const navigate = useNavigate();
  const location = useLocation();
  const [focusWorkout, setFocusWorkout] = useState<Workout | null>(null);
  const [trainingBlocked, setTrainingBlocked] = useState(!!user?.isTrainingBlocked);
  const refetchLogsRef = useRef<() => void>(() => {});

  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  useEffect(() => {
    applyNativeSafeAreas();
  }, []);

  useEffect(() => {
    setTrainingBlocked(!!user?.isTrainingBlocked);
  }, [user?.isTrainingBlocked]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get('/students/me/profile');
        const student = response.data?.student;
        if (!cancelled && student) {
          setTrainingBlocked(!!student.isTrainingBlocked);
          updateUser({
            isTrainingBlocked: student.isTrainingBlocked,
            paymentDueDay: student.paymentDueDay,
          });
        }
      } catch {
        // mantém estado do login
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const menuItems = useMemo(
    () => [
      { id: 'dashboard', label: t('nav.student.home'), icon: Home, path: '/student/dashboard' },
      { id: 'treinos', label: t('nav.student.workouts'), icon: Dumbbell, path: '/student/treinos' },
      { id: 'perfil', label: t('nav.student.profile'), icon: User, path: '/student/perfil' },
    ],
    [t]
  );

  return (
    <div
      className="native-app-layout student-app-layout min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gradient-to-br from-dark-50 via-white to-primary-50"
      style={themeStyle}
    >
      {/* Header — só marca do personal (white-label) */}
      <header className="native-app-header student-brand-header backdrop-blur-xl border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3">
          <div className="flex items-center justify-center min-h-[5.25rem] sm:min-h-[5.75rem] md:min-h-[6.25rem]">
            <StudentBrandMark
              personal={brandPersonal}
              iconSize="header"
              subtitle=""
              className="justify-center"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="native-app-main w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {currentPath === 'dashboard' && trainingBlocked && (
          <StudentTrainingBlocked personalPhone={user?.personalTrainer?.phone} />
        )}
        {currentPath === 'dashboard' && !trainingBlocked && (
          <StudentDashboardHome
            onStartFocusMode={setFocusWorkout}
            refetchLogsRef={refetchLogsRef}
          />
        )}
        {currentPath === 'treinos' && trainingBlocked && (
          <StudentTrainingBlocked personalPhone={user?.personalTrainer?.phone} />
        )}
        {currentPath === 'treinos' && !trainingBlocked && (
          <StudentTreinosPage onStartFocusMode={setFocusWorkout} refetchLogsRef={refetchLogsRef} />
        )}
        {currentPath === 'perfil' && <StudentPerfilPage />}
      </main>

      {/* Modo focado: countdown + exercícios */}
      {focusWorkout && !trainingBlocked && (
        <FocusModeWorkout
          workout={focusWorkout}
          onClose={() => setFocusWorkout(null)}
          onFinished={() => refetchLogsRef.current()}
        />
      )}

      {/* Navegação inferior (mobile e desktop) */}
      <nav className="native-bottom-nav student-bottom-nav z-50 box-border">
        <div className="student-bottom-nav-inner">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={`student-bottom-nav-btn ${
                  isActive ? 'student-bottom-nav-btn--active' : ''
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="student-bottom-nav-btn__icon-wrap">
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                </span>
                <span className="student-bottom-nav-btn__label">{item.label}</span>
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
  const { t, i18n } = useTranslation();
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
          <h2 className="text-xl md:text-2xl font-display font-bold text-dark-900 mb-1.5">
            {t('student.welcome', {
              name: user?.name?.split(' ')[0] || t('student.defaultName'),
            })}
          </h2>
          <p className="text-dark-500 text-sm md:text-base">{t('student.trainToday')}</p>
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
            {t('student.personalWhatsapp')}
          </a>
        )}
      </div>

      {/* Today's Info */}
      <div
        className={`student-today-animated card-modern relative overflow-hidden p-5 mb-6 border-2 transition-all duration-300 ${
          todayCompleted
            ? 'student-today-animated--done border-emerald-200 shadow-medium'
            : 'border-blue-100'
        }`}
      >
        <div className="student-today-animated__bg" aria-hidden />
        <div className="student-today-animated__blob student-today-animated__blob--a" aria-hidden />
        <div className="student-today-animated__blob student-today-animated__blob--b" aria-hidden />

        <div className="student-today-animated__content">
        <div className="flex items-center gap-2.5 mb-3">
          {todayCompleted ? (
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          ) : (
            <Clock className="w-5 h-5 text-blue-600" />
          )}
          <h3 className="text-base font-display font-bold text-dark-900">{t('student.today')}</h3>
        </div>
        <p className="text-base md:text-lg font-display font-bold text-dark-900 mb-1 capitalize">
          {new Date().toLocaleDateString(appLocaleToDateLocale(i18n.language), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        {todayCompleted ? (
          <p className="text-emerald-700 font-semibold text-base flex items-center gap-2">
            <span>{t('student.todayWorkoutDone')}</span>
            <span className="text-xl" aria-hidden>🎉</span>
          </p>
        ) : (
          <p className="text-dark-600 text-sm">
            {todayWorkout ? t('student.workoutToday') : t('student.restDay')}
          </p>
        )}
        {streakStats !== null && (
          <div className="mt-4 pt-4 border-t border-dark-200/60 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>🔥</span>
              <div>
                <p className="text-dark-900 font-bold text-lg leading-tight">{streakStats.streak}</p>
                <p className="text-dark-500 text-xs font-medium">{t('student.streakDays')}</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {loading ? (
        <div className="card-modern p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-dark-500 mt-4">{t('common.loading')}</p>
        </div>
      ) : todayWorkout ? (
        <div className="card-modern p-5 md:p-6">
          {todayCompleted && (
            <div className="flex justify-end mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-medium">
                <CheckCircle className="w-3 h-3" />
                {t('common.completed')}
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
                  {t('student.start')}
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
                {t('student.exerciseCount', { count: todayWorkout.exercises?.length || 0 })}
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
                      <img src={resolveAssetUrl(exercise.imageUrl) || exercise.imageUrl} alt={exercise.name} className="w-full h-auto max-h-28 object-contain" />
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
                + {t('student.moreExercises', { count: todayWorkout.exercises.length - 3 })}
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
                    aria-label={t('common.close')}
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
                        src={resolveAssetUrl(focusedExercise.imageUrl) || focusedExercise.imageUrl}
                        alt={focusedExercise.name}
                        className="w-full h-auto max-h-56 object-contain"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-dark-50 rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-0.5">{t('student.sets')}</p>
                      <p className="text-base font-bold text-dark-900">{focusedExercise.sets}</p>
                    </div>
                    <div className="bg-dark-50 rounded-lg p-3">
                      <p className="text-xs text-dark-500 mb-0.5">{t('student.repetitions')}</p>
                      <p className="text-base font-bold text-dark-900">{focusedExercise.reps}</p>
                    </div>
                    {focusedExercise.rest && (
                      <div className="bg-dark-50 rounded-lg p-3">
                        <p className="text-xs text-dark-500 mb-0.5">{t('student.rest')}</p>
                        <p className="text-base font-bold text-dark-900">{focusedExercise.rest}</p>
                      </div>
                    )}
                    {focusedExercise.weight && (
                      <div className="bg-dark-50 rounded-lg p-3">
                        <p className="text-xs text-dark-500 mb-0.5">{t('student.weight')}</p>
                        <p className="text-base font-bold text-dark-900">{focusedExercise.weight}</p>
                      </div>
                    )}
                  </div>
                  {focusedExercise.notes && (
                    <div className="bg-accent-50 rounded-lg p-3 border border-accent-100">
                      <p className="text-xs text-dark-600 font-medium mb-0.5">💡 {t('student.notes')}</p>
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
                      {t('student.viewVideoYoutube')}
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFocusedExercise(null)}
                  className="w-full mt-4 py-2.5 rounded-xl border-2 border-dark-200 text-dark-700 text-sm font-semibold hover:bg-dark-50 transition-colors"
                >
                  {t('common.close')}
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
            {t('student.noWorkoutTodayTitle')}
          </h3>
          <p className="text-dark-500 text-sm mb-4 max-w-md mx-auto">
            {t('student.noWorkoutTodayDesc')}
          </p>
          <button
            onClick={() => navigate('/student/treinos')}
            className="btn-primary inline-flex items-center gap-1.5 text-sm py-2 px-4"
          >
            <Calendar className="w-4 h-4" />
            {t('student.viewAllWorkouts')}
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
  const { t } = useTranslation();
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
        <p className="text-dark-500 mt-4">{t('student.loadingWorkouts')}</p>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1.5">
          {t('student.myWorkouts')}
        </h2>
        <p className="text-dark-500 text-sm md:text-base">{t('student.weeklyWorkoutsHint')}</p>
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
              {t('student.noWorkoutForDay', { day: dayData.label })}
            </h4>
            <p className="text-dark-500 text-sm">
              {t('student.noWorkoutForDayDesc')}
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
  const { t } = useTranslation();
  const [focusedExercise, setFocusedExercise] = useState<Exercise | null>(null);
  const [videoPlayer, setVideoPlayer] = useState<{ embedUrl: string; originalUrl: string } | null>(null);
  const exerciseCount = workout.exercises?.length || 0;

  return (
    <div className="card-modern overflow-hidden p-0 shadow-medium">
      <div className="relative overflow-hidden student-workout-card-hero px-5 pt-5 pb-6 text-white">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-accent-800 shadow-soft">
              <Calendar className="h-3.5 w-3.5 text-accent-600" />
              {dayLabel}
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold">
                <CheckCircle className="h-3.5 w-3.5" />
                {t('common.completed')}
              </span>
            )}
          </div>
        </div>

        <h3 className="relative text-2xl font-display font-bold leading-tight">{workout.name}</h3>
        {workout.description && (
          <p className="relative mt-1.5 text-sm leading-relaxed text-white/80 line-clamp-2">{workout.description}</p>
        )}

        <div className="relative mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/90 px-3 py-2.5 text-accent-900 shadow-soft">
          <div className="flex items-center gap-2 min-w-0">
            <Dumbbell className="h-4 w-4 shrink-0 text-accent-600" />
            <span className="text-sm font-semibold truncate">
              {t('student.exerciseCount', { count: exerciseCount })}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStartFocusMode(workout)}
          className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-accent-700 shadow-strong transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <Play className="h-4 w-4 fill-current" />
          {t('student.start')}
        </button>
      </div>

      {workout.exercises && workout.exercises.length > 0 && (
        <div className="p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h5 className="text-base font-display font-bold text-dark-900">{t('student.exercisesTitle')}</h5>
            <span className="text-xs font-semibold text-dark-400">
              {t('student.exerciseCount', { count: exerciseCount })}
            </span>
          </div>

          <div className="space-y-3">
            {workout.exercises.map((exercise, idx) => {
              const imageSrc = exercise.imageUrl
                ? resolveAssetUrl(exercise.imageUrl) || exercise.imageUrl
                : null;

              return (
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
                  className="group flex gap-3 rounded-2xl border border-dark-100 bg-white p-3 shadow-soft transition-all hover:border-accent-200 hover:shadow-medium cursor-pointer"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-dark-100 bg-dark-50">
                    {imageSrc ? (
                      <img src={imageSrc} alt={exercise.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-accent-50">
                        <span className="text-lg font-display font-bold text-accent-600">{idx + 1}</span>
                        <Dumbbell className="mt-1 h-4 w-4 text-accent-400" />
                      </div>
                    )}
                    <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-accent-500 text-xs font-bold text-white shadow-medium">
                      {idx + 1}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h6 className="font-display text-base font-bold leading-snug text-dark-900">{exercise.name}</h6>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-dark-300 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-500" />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <div className="rounded-xl border border-dark-100 bg-dark-50 px-2.5 py-1.5 text-center min-w-[3.5rem]">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">{t('student.sets')}</p>
                        <p className="text-sm font-bold text-dark-900">{exercise.sets}</p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-dark-50 px-2.5 py-1.5 text-center min-w-[3.5rem]">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">{t('student.reps')}</p>
                        <p className="text-sm font-bold text-dark-900">{exercise.reps}</p>
                      </div>
                      {exercise.rest && (
                        <div className="rounded-xl border border-dark-100 bg-dark-50 px-2.5 py-1.5 text-center min-w-[3.5rem]">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">{t('student.rest')}</p>
                          <p className="text-sm font-bold text-dark-900">{exercise.rest}</p>
                        </div>
                      )}
                      {exercise.weight && (
                        <div className="rounded-xl border border-dark-100 bg-dark-50 px-2.5 py-1.5 text-center min-w-[3.5rem]">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">{t('student.weight')}</p>
                          <p className="text-sm font-bold text-dark-900">{exercise.weight}</p>
                        </div>
                      )}
                    </div>

                    {exercise.notes && (
                      <p className="mt-2 line-clamp-2 text-xs italic text-dark-500">💡 {exercise.notes}</p>
                    )}

                    {exercise.videoUrl && (
                      <span onClick={(e) => e.stopPropagation()} className="mt-2 inline-block">
                        <button
                          type="button"
                          onClick={() => {
                            const embed = getYouTubeEmbedUrl(exercise.videoUrl!);
                            if (embed) setVideoPlayer({ embedUrl: embed, originalUrl: exercise.videoUrl! });
                            else window.open(exercise.videoUrl, '_blank');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-50 px-2 py-1 text-xs font-semibold text-accent-700 hover:bg-accent-100"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          {t('student.viewVideoYoutube')}
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                aria-label={t('common.close')}
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
                    src={resolveAssetUrl(focusedExercise.imageUrl) || focusedExercise.imageUrl}
                    alt={focusedExercise.name}
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">{t('student.sets')}</p>
                  <p className="text-base font-bold text-dark-900">{focusedExercise.sets}</p>
                </div>
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">{t('student.repetitions')}</p>
                  <p className="text-base font-bold text-dark-900">{focusedExercise.reps}</p>
                </div>
                {focusedExercise.rest && (
                  <div className="bg-dark-50 rounded-lg p-3">
                    <p className="text-xs text-dark-500 mb-0.5">{t('student.rest')}</p>
                    <p className="text-base font-bold text-dark-900">{focusedExercise.rest}</p>
                  </div>
                )}
                {focusedExercise.weight && (
                  <div className="bg-dark-50 rounded-lg p-3">
                    <p className="text-xs text-dark-500 mb-0.5">{t('student.weight')}</p>
                    <p className="text-base font-bold text-dark-900">{focusedExercise.weight}</p>
                  </div>
                )}
              </div>
              {focusedExercise.notes && (
                <div className="bg-accent-50 rounded-lg p-3 border border-accent-100">
                  <p className="text-xs text-dark-600 font-medium mb-0.5">💡 {t('student.notes')}</p>
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
                  {t('student.viewVideoYoutube')}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFocusedExercise(null)}
              className="w-full mt-4 py-2.5 rounded-xl border-2 border-dark-200 text-dark-700 text-sm font-semibold hover:bg-dark-50 transition-colors"
            >
              {t('common.close')}
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
          aria-label={t('student.videoPlayer')}
        >
          <div className="flex items-center justify-between p-3 md:p-4 bg-black/50">
            <p className="text-white font-semibold">{t('student.exerciseVideo')}</p>
            <button
              type="button"
              onClick={() => setVideoPlayer(null)}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label={t('student.closeVideo')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 overflow-auto">
            <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-dark-900 shadow-strong flex-shrink-0">
              <iframe
                src={videoPlayer.embedUrl}
                title={t('student.exerciseVideo')}
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
              {t('student.openOnYoutube')}
            </a>
          </div>
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
  paymentDueDay?: number | null;
  isTrainingBlocked?: boolean;
  personalTrainer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    logoUrl?: string | null;
    brandPrimaryColor?: string | null;
    brandSecondaryColor?: string | null;
  };
}

function StudentPerfilPage() {
  const { t, i18n } = useTranslation();
  const weekdayShort = useWeekdayShortMap();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

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
      .map((d) => weekdayShort[d as WeekdayValue] || d)
      .join(', ');

  if (loading) {
    return (
      <div className="pb-20 md:pb-0">
        <div className="card-modern p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-dark-500 mt-4">{t('student.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1.5">
          {t('student.myProfile')}
        </h2>
        <p className="text-dark-500 text-sm md:text-base">{t('student.profileSubtitle')}</p>
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
            <p className="text-dark-500 text-sm mb-1.5">{t('student.studentRole')}</p>
            {profile?.accessCode && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-50 border border-accent-200">
                <span className="text-xs text-dark-600 font-medium">{t('student.accessCodeLabel')}</span>
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
              {t('student.infoSection')}
            </h4>
            <div className="space-y-2.5">
              <div className="bg-dark-50 rounded-lg p-3">
                <p className="text-xs text-dark-500 mb-0.5">{t('personal.profile.name')}</p>
                <p className="text-dark-900 font-semibold text-sm">{display?.name ?? user?.name}</p>
              </div>
              {(profile?.accessCode || display?.accessCode) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">{t('student.accessCode')}</p>
                  <p className="text-dark-900 font-semibold text-sm tracking-wider">
                    {profile?.accessCode ?? display?.accessCode}
                  </p>
                </div>
              )}
              {(profile?.email ?? user?.email) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">{t('personal.profile.email')}</p>
                  <p className="text-dark-900 font-semibold text-sm">{profile?.email ?? user?.email}</p>
                </div>
              )}
              {(profile?.phone ?? user?.phone) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">{t('personal.profile.phone')}</p>
                  <p className="text-dark-900 font-semibold text-sm">{profile?.phone ?? user?.phone}</p>
                </div>
              )}
              {profile?.birthDate && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">{t('student.birthDate')}</p>
                  <p className="text-dark-900 font-semibold text-sm">
                    {new Date(profile.birthDate).toLocaleDateString(appLocaleToDateLocale(i18n.language))}
                  </p>
                </div>
              )}
              {(profile?.weight != null && profile?.weight > 0) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">{t('student.weight')}</p>
                  <p className="text-dark-900 font-semibold text-sm">{profile.weight} kg</p>
                </div>
              )}
              {(profile?.height != null && profile?.height > 0) && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">{t('student.height')}</p>
                  <p className="text-dark-900 font-semibold text-sm">{profile.height} cm</p>
                </div>
              )}
              {trainingDaysLabel && (
                <div className="bg-dark-50 rounded-lg p-3">
                  <p className="text-xs text-dark-500 mb-0.5">{t('student.trainingDays')}</p>
                  <p className="text-dark-900 font-semibold text-sm">{trainingDaysLabel}</p>
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
              {t('student.logoutAccount')}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <AccountDeletionSection userType="student" onDelete={() => setShowDeleteAccount(true)} />
      </div>

      {showDeleteAccount && (
        <DeleteAccountModal
          userType="student"
          onClose={() => setShowDeleteAccount(false)}
          onDeleted={() => {
            setShowDeleteAccount(false);
            logout();
            navigate('/login');
          }}
        />
      )}
    </div>
  );
}

