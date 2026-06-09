import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LogOut, Users, Dumbbell, Plus, X, Copy, Check, Trash2, AlertTriangle, Home, User as UserIcon, Edit2, Pen, CheckCircle, TrendingUp, TrendingDown, MessageCircle, Crown, Share2, Lock, Unlock, Calendar, Loader2 } from 'lucide-react';
import { formatPaymentDueDay, isPaymentLikelyOverdue } from '../lib/paymentDueDay';
import { CustomSelect } from '../components/CustomSelect';
import { GymCodeIcon } from '../components/GymCodeIcon';
import { AccountDeletionSection } from '../components/AccountDeletionSection';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { SubscriptionPanel } from '../components/SubscriptionPanel';
import { PersonalBrandSettings } from '../components/PersonalBrandSettings';
import { PersonalLogoUpload } from '../components/PersonalLogoUpload';
import { resolveAssetUrl } from '../lib/resolveAssetUrl';
import { parseStoredJson } from '../lib/storageJson';
import { appLocaleToDateLocale } from '../i18n/dateLocale';
import { useWeekdayOptions, useWeekdayShortMap } from '../i18n/useWeekdayOptions';
import { applyNativeSafeAreas } from '../lib/applyNativeSafeAreas';

interface Student {
  id: string;
  name: string;
  accessCode: string;
  phone?: string;
  email?: string;
  weight?: number;
  height?: number;
  trainingDays: string[];
  paymentDueDay?: number | null;
  isTrainingBlocked?: boolean;
}

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
  isActive: boolean;
  studentId: string;
  student?: {
    name: string;
  };
  exercises: Exercise[];
  createdAt: string;
}

type SuggestedExerciseImage = {
  id: string;
  title: string;
  imageUrl: string;
  thumbUrl: string;
  source: string;
  author?: string;
};

type SuggestedExerciseVideo = {
  id: string;
  title: string;
  channelTitle: string;
  videoUrl: string;
  embedUrl: string;
  thumbUrl: string;
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const IMAGE_SUGGESTIONS_CACHE = new Map<string, SuggestedExerciseImage[]>();

const buildImageSearchTerm = (exerciseName: string) => {
  // Para imagem, priorizamos o nome cru do exercício para evitar resultados genéricos.
  return exerciseName.replace(/[–—]/g, '-').trim();
};

const YOUTUBE_SUGGESTIONS_CACHE = new Map<string, SuggestedExerciseVideo[]>();

const buildYoutubeSearchTerm = (exerciseName: string) => {
  const normalized = exerciseName.replace(/[–—]/g, '-').trim();
  return `${normalized} como fazer execução correta`;
};

const getYoutubeVideoId = (url?: string) => {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || null;
};

function ExerciseVideoSuggestions({
  exerciseName,
  selectedVideoUrl,
  onSelect,
}: {
  exerciseName: string;
  selectedVideoUrl?: string;
  onSelect: (url: string) => void;
}) {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<SuggestedExerciseVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const trimmed = exerciseName.trim();
    if (!trimmed) {
      setVideos([]);
      setError('');
      return;
    }

    const query = buildYoutubeSearchTerm(trimmed);
    const cacheKey = normalizeText(query);
    const cached = YOUTUBE_SUGGESTIONS_CACHE.get(cacheKey);
    if (cached) {
      setVideos(cached);
      setError('');
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/workouts/youtube/suggestions', {
          params: { q: query, maxResults: 8 },
        });
        const list = Array.isArray(data?.videos) ? data.videos : [];
        const mapped: SuggestedExerciseVideo[] = list.map((item: any) => ({
          id: String(item.id),
          title: String(item.title || t('common.video')),
          channelTitle: String(item.channelTitle || t('common.channel')),
          videoUrl: String(item.watchUrl || ''),
          embedUrl: String(item.embedUrl || ''),
          thumbUrl: String(item.thumbnailUrl || ''),
        }));
        YOUTUBE_SUGGESTIONS_CACHE.set(cacheKey, mapped);
        setVideos(mapped);
      } catch (err) {
        setVideos([]);
        setError(t('errors.youtubeLoad'));
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [exerciseName]);

  if (!exerciseName.trim()) return null;

  return (
    <div className="mt-2">
      <p className="text-xs text-dark-500 mb-2">{t('personal.suggestions.youtubeTitle')}</p>
      {loading && <p className="text-xs text-dark-400 mb-2">{t('personal.suggestions.youtubeLoading')}</p>}
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      {!loading && videos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
          {videos.map((item) => {
            const isSelected = selectedVideoUrl === item.videoUrl;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.videoUrl)}
                className={`min-w-[180px] rounded-xl border-2 bg-white overflow-hidden text-left snap-start transition-all ${
                  isSelected
                    ? 'border-accent-500 shadow-medium'
                    : 'border-dark-200 hover:border-accent-300'
                }`}
              >
                <img
                  src={item.thumbUrl}
                  alt={item.title}
                  className="w-full h-24 object-cover"
                  loading="lazy"
                />
                <div className="px-2 py-1.5">
                  <p className="text-[11px] font-semibold text-dark-700 leading-tight">{item.title}</p>
                  <p className="text-[10px] text-dark-500 mt-0.5 truncate">{item.channelTitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {!loading && !error && videos.length === 0 && (
        <p className="text-[11px] text-dark-400">{t('personal.suggestions.youtubeEmpty')}</p>
      )}
      <p className="text-[11px] text-dark-400 mt-2">
        {t('personal.suggestions.youtubeHint')}
      </p>
    </div>
  );
}

function ExerciseImageSuggestions({
  exerciseName,
  selectedImageUrl,
  onSelect,
}: {
  exerciseName: string;
  selectedImageUrl?: string;
  onSelect: (url: string) => void;
}) {
  const { t } = useTranslation();
  const [images, setImages] = useState<SuggestedExerciseImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const trimmed = exerciseName.trim();
    if (!trimmed || trimmed.length < 3) {
      setImages([]);
      setError('');
      return;
    }

    const query = buildImageSearchTerm(trimmed);
    const cacheKey = normalizeText(query);
    const cached = IMAGE_SUGGESTIONS_CACHE.get(cacheKey);
    if (cached) {
      setImages(cached);
      setError('');
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/workouts/image/suggestions', {
          params: { q: query, maxResults: 8 },
        });
        const list = Array.isArray(data?.images) ? data.images : [];
        const mapped: SuggestedExerciseImage[] = list.map((item: any) => ({
          id: String(item.id),
          title: String(item.title || t('common.image')),
          imageUrl: String(item.imageUrl || ''),
          thumbUrl: String(item.thumbUrl || ''),
          source: String(item.source || 'source'),
          author: String(item.author || ''),
        })).filter((i: SuggestedExerciseImage) => i.imageUrl && i.thumbUrl);
        IMAGE_SUGGESTIONS_CACHE.set(cacheKey, mapped);
        setImages(mapped);
      } catch (err) {
        setImages([]);
        setError(t('errors.imagesLoad'));
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [exerciseName]);

  if (!exerciseName.trim()) return null;

  return (
    <div className="mt-2">
      <p className="text-xs text-dark-500 mb-2">{t('personal.suggestions.imagesTitle')}</p>
      {loading && <p className="text-xs text-dark-400 mb-2">{t('common.loading')}</p>}
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      {!loading && images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
          {images.map((item) => {
            const isSelected = selectedImageUrl === item.imageUrl;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.imageUrl)}
                className={`min-w-[180px] rounded-xl border-2 bg-white overflow-hidden text-left snap-start transition-all ${
                  isSelected
                    ? 'border-accent-500 shadow-medium'
                    : 'border-dark-200 hover:border-accent-300'
                }`}
              >
                <img
                  src={item.thumbUrl}
                  alt={item.title}
                  className="w-full h-24 object-cover"
                  loading="lazy"
                />
                <div className="px-2 py-1.5">
                  <p className="text-[11px] font-semibold text-dark-700 leading-tight">{item.title}</p>
                  <p className="text-[10px] text-dark-500 mt-0.5 truncate">
                    {item.author ? `${item.author} · ${item.source}` : item.source}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {!loading && !error && images.length === 0 && (
        <p className="text-[11px] text-dark-400">{t('personal.suggestions.imagesEmpty')}</p>
      )}
      <p className="text-[11px] text-dark-400 mt-2">
        {t('personal.suggestions.imagesHint')}
      </p>
    </div>
  );
}

export default function PersonalDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.split('/').pop() || 'home';

  useEffect(() => {
    applyNativeSafeAreas();
  }, []);

  const menuItems = useMemo(
    () => [
      { id: 'home', label: t('nav.personal.home'), icon: Home, path: '/personal/home' },
      { id: 'alunos', label: t('nav.personal.students'), icon: Users, path: '/personal/alunos' },
      { id: 'treinos', label: t('nav.personal.workouts'), icon: Dumbbell, path: '/personal/treinos' },
      { id: 'perfil', label: t('nav.personal.profile'), icon: UserIcon, path: '/personal/perfil' },
    ],
    [t]
  );

  return (
    <div className="native-app-layout min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gradient-to-br from-dark-50 via-white to-primary-50">
      {/* Header */}
      <header className="native-app-header bg-white/80 backdrop-blur-xl shadow-soft border-b border-dark-100 z-50">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-20">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-accent rounded-lg md:rounded-xl flex items-center justify-center shadow-medium">
                <GymCodeIcon size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-display font-bold bg-gradient-accent bg-clip-text text-transparent">
                  Gym Code
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">{t('personal.panelTitle')}</p>
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-accent text-white shadow-medium'
                        : 'text-dark-600 hover:bg-dark-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right hidden lg:block">
                <p className="text-xs md:text-sm font-semibold text-dark-900">{user?.name}</p>
                <p className="text-[10px] md:text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-accent rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base">
                {user?.name?.charAt(0)}
              </div>
              <button
                onClick={logout}
                className="hidden md:block p-1.5 md:p-2.5 text-dark-600 hover:text-red-600 hover:bg-red-50 rounded-lg md:rounded-xl transition-all duration-200"
                title={t('personal.logout')}
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="native-app-main w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {currentPath === 'home' && <DashboardHome />}
        {currentPath === 'alunos' && <AlunosPage />}
        {currentPath === 'treinos' && <TreinosPage />}
        {currentPath === 'perfil' && <PerfilPage />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="native-bottom-nav md:hidden bg-white border-t border-dark-200 shadow-strong z-50 box-border">
        <div className="native-bottom-nav-inner grid grid-cols-4 min-h-[3.5rem]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive ? 'text-accent-600' : 'text-dark-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

interface RecentLogItem {
  id: string;
  date: string;
  completed: boolean;
  workout: { id: string; name: string; dayOfWeek: string };
  student: { id: string; name: string };
}

const TZ_BR = 'America/Sao_Paulo';
function toDateKeyBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ_BR, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function ResumoSemanaCard({ thisWeekCount, diff }: { thisWeekCount: number; diff: number }) {
  const { t } = useTranslation();

  return (
    <div className="card-modern p-6 md:p-8 bg-gradient-to-br from-emerald-50 to-teal-50/80 border border-emerald-100/80 shadow-sm">
        <h3 className="text-lg font-display font-bold text-dark-900 mb-1">{t('personal.weekSummary')}</h3>
        <p className="text-sm text-dark-500 mb-4">{t('personal.weekSummaryDesc')}</p>
        <p className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-2">{thisWeekCount}</p>
        <p className="text-sm text-dark-600 mb-1">
          {t('personal.vsLastWeek', { diff: diff >= 0 ? `+${diff}` : `${diff}` })}
        </p>
        {diff !== 0 && (
          <span className={`inline-flex items-center gap-1 text-sm font-medium ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {diff > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {diff > 0 ? t('common.trendUp') : t('common.trendDown')}
          </span>
        )}
    </div>
  );
}

function DashboardHome() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isPro = (user?.maxStudentsAllowed ?? 2) > 2;
  const [students, setStudents] = useState<Student[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTreinos, setTotalTreinos] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [studentsRes, logsRes, workoutsRes] = await Promise.all([
          api.get('/students'),
          api.get('/workouts/recent-logs?days=14').catch(() => ({ data: [] })),
          api.get('/workouts').catch(() => ({ data: [] })),
        ]);
        const studentsData = studentsRes.data;
        setStudents(Array.isArray(studentsData) ? studentsData : (studentsData?.students ?? []));
        setRecentLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
        const workoutsList = Array.isArray(workoutsRes.data) ? workoutsRes.data : [];
        setWorkouts(workoutsList);
        setTotalTreinos(workoutsList.length);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calcular estatísticas
  const totalAlunos = students.length;

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-dark-900 mb-1 md:mb-2 flex items-center gap-2">
          {t('personal.hello', { name: user?.name?.split(' ')[0] || '' })}
          {isPro && <span className="text-amber-500" aria-hidden><Crown className="w-6 h-6 md:w-8 md:h-8" /></span>}
        </h2>
        <p className="text-dark-500 text-sm md:text-lg">{t('personal.welcomePanel')}</p>
      </div>

      {/* Resumo da semana, Quem treina hoje, Top 3 */}
      {(() => {
        const now = new Date();
        const todayKey = toDateKeyBR(now);
        const thisWeekKeys: string[] = [];
        const lastWeekKeys: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          thisWeekKeys.push(toDateKeyBR(d));
        }
        for (let i = 13; i >= 7; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          lastWeekKeys.push(toDateKeyBR(d));
        }
        const keyToLog = (log: RecentLogItem) =>
          typeof log.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(log.date.trim()) ? log.date.trim() : toDateKeyBR(log.date);
        const thisWeekCount = recentLogs.filter((l) => thisWeekKeys.includes(keyToLog(l))).length;
        const lastWeekCount = recentLogs.filter((l) => lastWeekKeys.includes(keyToLog(l))).length;
        const diff = thisWeekCount - lastWeekCount;
        const todayDayOfWeek = DAYS_OF_WEEK[new Date(todayKey + 'T12:00:00').getDay()];
        const workoutsToday = workouts.filter((w) => w.dayOfWeek === todayDayOfWeek);
        const studentIdsToday = [...new Set(workoutsToday.map((w) => w.studentId))];
        const workoutIdsToday = new Set(workoutsToday.map((w) => w.id));
        const completedTodayByStudent = new Set<string>();
        recentLogs.forEach((log) => {
          if (keyToLog(log) === todayKey && workoutIdsToday.has(log.workout.id)) completedTodayByStudent.add(log.student.id);
        });
        const whoTrainsToday = studentIdsToday.map((id) => {
          const student = students.find((s) => s.id === id);
          return { id, name: student?.name ?? t('common.student'), phone: student?.phone, completed: completedTodayByStudent.has(id) };
        });
        const thisWeekByStudent: { [id: string]: number } = {};
        recentLogs.forEach((log) => {
          if (!thisWeekKeys.includes(keyToLog(log))) return;
          const id = log.student.id;
          thisWeekByStudent[id] = (thisWeekByStudent[id] ?? 0) + 1;
        });
        const top3 = Object.entries(thisWeekByStudent)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id, count]) => ({ id, count, name: students.find((s) => s.id === id)?.name ?? recentLogs.find((l) => l.student.id === id)?.student?.name ?? t('common.student') }));
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
            {/* 1. Resumo da semana + comparação */}
            <ResumoSemanaCard thisWeekCount={thisWeekCount} diff={diff} />

            {/* 2. Quem treina hoje */}
            <div className="card-modern p-6 md:p-8 bg-gradient-to-br from-sky-50 to-blue-50/80 border border-sky-100/80 shadow-sm">
              <h3 className="text-lg font-display font-bold text-dark-900 mb-1">{t('personal.whoTrainsToday')}</h3>
              <p className="text-sm text-dark-500 mb-4">{t('personal.whoTrainsTodayDesc')}</p>
              {whoTrainsToday.length === 0 ? (
                <p className="text-dark-500 text-sm">{t('personal.noWorkoutToday')}</p>
              ) : (
                <ul className="space-y-3">
                  {whoTrainsToday.map(({ id, name, phone, completed }) => (
                    <li key={id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/70 backdrop-blur-sm border border-sky-200/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${completed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="font-medium text-dark-900 truncate">{name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-medium ${completed ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {completed ? t('common.completed') : t('common.pending')}
                        </span>
                        {!completed && phone && (
                          <a
                            href={`https://wa.me/55${phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                            title={t('personal.whatsappReminder')}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 3. Top 3 alunos em destaque */}
            <div className="card-modern p-6 md:p-8 bg-gradient-to-br from-amber-50 to-orange-50/80 border border-amber-100/80 shadow-sm">
              <h3 className="text-lg font-display font-bold text-dark-900 mb-1">{t('personal.topStudents')}</h3>
              <p className="text-sm text-dark-500 mb-4">{t('personal.topStudentsDesc')}</p>
              {top3.length === 0 ? (
                <p className="text-dark-500 text-sm">{t('personal.noCompletionsWeek')}</p>
              ) : (
                <ul className="space-y-3">
                  {top3.map(({ id, name, count }, i) => (
                    <li key={id} className="flex items-center gap-3 p-3 rounded-xl bg-white/70 backdrop-blur-sm border border-amber-200/60">
                      <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="font-medium text-dark-900 truncate flex-1">{name}</span>
                      <span className="text-sm font-semibold text-accent-600 flex-shrink-0">
                        {count}{' '}
                        {t(count === 1 ? 'personal.workout_one' : 'personal.workout_other')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })()}

      {/* Cards de Resumo */}
        <div className="flex flex-col gap-4">
          <div className="card-modern p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1">{totalAlunos}</p>
            <p className="text-sm text-dark-500">{t('personal.activeStudents')}</p>
          </div>

          <div className="card-modern p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-accent-600" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1">{totalTreinos}</p>
            <p className="text-sm text-dark-500">{t('personal.workoutsCreated')}</p>
          </div>

        </div>

      <div className="card-modern p-8 md:p-10 mt-8">
        <h3 className="text-xl md:text-2xl font-display font-bold text-dark-900 mb-6">
          {t('personal.recentActivity')}
        </h3>
        {(() => {
          const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const logsLast24h = recentLogs.filter((log) => new Date(log.date) >= last24h);
          return logsLast24h.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('personal.noActivity24h')}</p>
            <p className="text-sm mt-1">{t('personal.noActivityHint')}</p>
          </div>
        ) : (
          <div className="max-h-[52vh] overflow-y-auto pr-1">
            <ul className="space-y-4">
            {logsLast24h.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark-900">
                    {t('personal.completedWorkout', {
                      name: log.student?.name,
                      workout: log.workout?.name,
                    })}
                  </p>
                  <p className="text-sm text-dark-500">
                    {new Date(log.date).toLocaleDateString(appLocaleToDateLocale(i18n.language), {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </li>
            ))}
            </ul>
          </div>
        );
        })()}
      </div>
    </div>
  );
}

type SubscriptionInfo = {
  maxStudentsAllowed: number;
  currentCount: number;
  atLimit: boolean;
  canAddMore: boolean;
};

function AlunosPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingBlockId, setTogglingBlockId] = useState<string | null>(null);

  const handleToggleTrainingBlock = async (student: Student, blocked: boolean) => {
    try {
      setTogglingBlockId(student.id);
      await api.patch(`/students/${student.id}/training-block`, { isTrainingBlocked: blocked });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, isTrainingBlocked: blocked } : s))
      );
    } catch (error) {
      console.error('Erro ao alterar bloqueio:', error);
      alert(t('errors.updateBlock'));
    } finally {
      setTogglingBlockId(null);
    }
  };

  // Carregar alunos
  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students');
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.students ?? []);
      setStudents(list);
      if (data?.subscription) setSubscription(data.subscription);
      else setSubscription({ maxStudentsAllowed: 2, currentCount: list.length, atLimit: list.length >= 2, canAddMore: list.length < 2 });
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Deletar aluno
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/students/${studentToDelete.id}`);
      setStudentToDelete(null);
      loadStudents();
    } catch (error) {
      console.error('Erro ao deletar aluno:', error);
      alert(t('errors.deleteStudent'));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-dark-900 mb-1 md:mb-2">
          {t('personal.studentsTitle')}
        </h2>
        <p className="text-dark-500 text-sm md:text-lg">{t('personal.studentsSubtitle')}</p>
      </div>

      {/* Lista de Alunos ou Empty State */}
      {loading ? (
        <div className="card-modern p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-dark-500 mt-4">{t('personal.loadingStudents')}</p>
        </div>
      ) : (students?.length || 0) === 0 ? (
        <div className="card-modern p-6 md:p-12 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Users className="w-8 h-8 md:w-10 md:h-10 text-dark-400" />
          </div>
          <h3 className="text-lg md:text-2xl font-display font-bold text-dark-900 mb-2 md:mb-3">
            {t('personal.emptyStudentsTitle')}
          </h3>
          <p className="text-dark-500 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-lg">
            {t('personal.emptyStudentsDesc')}
          </p>
          {subscription?.atLimit && (
            <p className="text-amber-600 text-sm mb-3">{t('personal.freeLimitBanner')}</p>
          )}
          <button 
            onClick={() => !subscription?.atLimit && setShowAddModal(true)}
            disabled={subscription?.atLimit}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            {t('personal.addFirstStudent')}
          </button>
        </div>
      ) : (
        <div className="card-modern p-4 md:p-6">
          {subscription?.atLimit && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              {t('personal.freeLimitInfo', { count: subscription.maxStudentsAllowed })}
            </div>
          )}
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl font-display font-bold text-dark-900">
              {t('personal.myStudents', { count: students?.length || 0 })}
            </h3>
            <button 
              onClick={() => !subscription?.atLimit && setShowAddModal(true)}
              disabled={subscription?.atLimit}
              className="btn-primary inline-flex items-center gap-2 text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed"
              title={subscription?.atLimit ? t('errors.studentLimitTooltip') : undefined}
            >
              <Plus className="w-4 h-4" />
              {t('personal.newStudent')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <StudentCard 
                key={student.id} 
                student={student}
                togglingBlock={togglingBlockId === student.id}
                onToggleTrainingBlock={(blocked) => handleToggleTrainingBlock(student, blocked)}
                onEdit={() => setStudentToEdit(student)}
                onDelete={() => setStudentToDelete(student)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal de Adicionar Aluno */}
      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadStudents();
          }}
        />
      )}

      {/* Modal de Editar Aluno */}
      {studentToEdit && (
        <EditStudentModal
          student={studentToEdit}
          onClose={() => setStudentToEdit(null)}
          onSuccess={() => {
            setStudentToEdit(null);
            loadStudents();
          }}
        />
      )}

      {/* Modal de Confirmar Exclusão */}
      {studentToDelete && (
        <DeleteConfirmModal
          student={studentToDelete}
          onClose={() => setStudentToDelete(null)}
          onConfirm={handleDeleteStudent}
          deleting={deleting}
        />
      )}
    </div>
  );
}

function StudentCard({
  student,
  onEdit,
  onDelete,
  onToggleTrainingBlock,
  togglingBlock,
}: {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
  onToggleTrainingBlock: (blocked: boolean) => void;
  togglingBlock: boolean;
}) {
  const { t } = useTranslation();
  const dayShortMap = useWeekdayShortMap();
  const [codeCopied, setCodeCopied] = useState(false);
  const paymentLabel = formatPaymentDueDay(student.paymentDueDay);
  const paymentOverdue = isPaymentLikelyOverdue(student.paymentDueDay) && !student.isTrainingBlocked;

  const copyCode = () => {
    navigator.clipboard.writeText(student.accessCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareLoginLink = () => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const url = `${baseUrl.replace(/\/$/, '')}/login?code=${encodeURIComponent(student.accessCode)}&tipo=aluno`;
    const text = t('personal.studentCard.shareMessage', {
      name: student.name.split(' ')[0],
      url,
    });
    const onlyDigits = student.phone?.replace(/\D/g, '') ?? '';
    const phoneWithCountry = onlyDigits.startsWith('55') ? onlyDigits : `55${onlyDigits}`;
    const hasValidPhone = phoneWithCountry.length >= 12; // 55 + DDD + número
    const whatsappUrl = hasValidPhone
      ? `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="card-modern p-4 md:p-6 hover:shadow-strong transition-all duration-300 flex flex-col">
      {/* Avatar + ações em uma barra compacta */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-dark-100">
        <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-accent rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base shrink-0">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-2 py-1 bg-accent-50 text-accent-700 rounded-md hover:bg-accent-100 transition-colors text-xs font-semibold"
            title={t('personal.studentCard.copyAccessCode')}
          >
            {codeCopied ? (
              <>
                <Check className="w-3 h-3" />
                {t('common.copied')}
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                {student.accessCode}
              </>
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title={t('personal.studentCard.editStudent')}
          >
            <Pen className="w-3 h-3" />
          </button>
          <button
            onClick={shareLoginLink}
            className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
            title={t('personal.studentCard.shareWhatsapp')}
          >
            <Share2 className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title={t('personal.studentCard.deleteStudent')}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Dados do aluno */}
      <h4 className="text-base font-bold text-dark-900 mb-2 truncate" title={student.name}>{student.name}</h4>
      {student.email && (
        <p className="text-sm text-dark-500 mb-1">{student.email}</p>
      )}
      {student.phone && (
        <p className="text-sm text-dark-500 mb-3">{student.phone}</p>
      )}
      {student.trainingDays && student.trainingDays.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {student.trainingDays.map((day) => (
              <span key={day} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded leading-tight">
                {dayShortMap[day as keyof typeof dayShortMap] || day}
              </span>
            ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-dark-100 space-y-2">
        {paymentLabel && (
          <div className="flex items-center gap-1.5 text-xs text-dark-600">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{t('personal.studentCard.payment', { label: paymentLabel })}</span>
            {paymentOverdue && (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                {t('personal.studentCard.paymentPending')}
              </span>
            )}
          </div>
        )}
        {student.isTrainingBlocked && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            {t('personal.studentCard.workoutBlocked')}
          </div>
        )}
        <button
          type="button"
          onClick={() => onToggleTrainingBlock(!student.isTrainingBlocked)}
          disabled={togglingBlock}
          className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
            student.isTrainingBlocked
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          }`}
        >
          {togglingBlock ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : student.isTrainingBlocked ? (
            <Unlock className="w-4 h-4" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          {student.isTrainingBlocked ? t('common.unblockWorkout') : t('common.blockWorkout')}
        </button>
      </div>
    </div>
  );
}

function AddStudentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const daysOfWeek = useWeekdayOptions();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    weight: '',
    height: '',
    trainingDays: [] as string[],
    paymentDueDay: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newStudent, setNewStudent] = useState<Student | null>(null);

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(day)
        ? prev.trainingDays.filter(d => d !== day)
        : [...prev.trainingDays, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const paymentDueDay = formData.paymentDueDay ? parseInt(formData.paymentDueDay, 10) : undefined;
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        birthDate: formData.birthDate || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        trainingDays: formData.trainingDays,
        paymentDueDay: paymentDueDay && paymentDueDay >= 1 && paymentDueDay <= 31 ? paymentDueDay : undefined,
      };

      const response = await api.post('/students', payload);
      setNewStudent(response.data);
    } catch (err: any) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.code === 'SUBSCRIPTION_LIMIT') {
        setError(data?.error || t('errors.subscriptionLimit'));
      } else {
        setError(data?.error || t('errors.createStudent'));
      }
      setLoading(false);
    }
  };

  if (newStudent) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-strong max-w-md w-full p-8 animate-scaleIn">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-display font-bold text-dark-900 mb-2">
              {t('personal.addStudent.successTitle')}
            </h3>
            <p className="text-dark-500 mb-6">
              {t('personal.addStudent.successDesc', { name: newStudent.name })}
            </p>
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-6 mb-6">
              <p className="text-sm text-dark-600 mb-2 font-medium">{t('personal.addStudent.accessCodeLabel')}</p>
              <p className="text-4xl font-display font-bold text-accent-600 tracking-wider">
                {newStudent.accessCode}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newStudent.accessCode);
                onSuccess();
              }}
              className="btn-primary w-full mb-3 inline-flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5 shrink-0" />
              {t('personal.addStudent.copyAndClose')}
            </button>
            <button
              onClick={onSuccess}
              className="w-full px-6 py-3 text-dark-600 hover:bg-dark-50 rounded-xl transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-strong max-w-2xl w-full p-6 md:p-8 my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-dark-900">{t('personal.addStudent.title')}</h3>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              {t('personal.studentForm.fullName')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder={t('personal.studentForm.fullNamePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                {t('personal.studentForm.email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-modern"
                placeholder={t('personal.studentForm.emailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                {t('personal.studentForm.phone')}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-modern"
                placeholder={t('personal.studentForm.phonePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                {t('personal.studentForm.birthDate')}
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                {t('personal.studentForm.weight')}
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="input-modern"
                placeholder="75.5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                {t('personal.studentForm.height')}
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="input-modern"
                placeholder="175"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              {t('personal.studentForm.paymentDueDay')}
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={formData.paymentDueDay}
              onChange={(e) => setFormData({ ...formData, paymentDueDay: e.target.value })}
              className="input-modern max-w-[10rem]"
              placeholder={t('personal.studentForm.paymentDueDayPlaceholder')}
            />
            <p className="text-xs text-dark-500 mt-1.5">
              {t('personal.studentForm.paymentDueDayHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-3">
              {t('personal.studentForm.trainingDays')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    formData.trainingDays.includes(day.value)
                      ? 'bg-gradient-accent text-white shadow-medium'
                      : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.creating') : t('personal.createStudent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStudentModal({ student, onClose, onSuccess }: { student: Student; onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const daysOfWeek = useWeekdayOptions();
  const [formData, setFormData] = useState({
    name: student.name,
    email: student.email || '',
    phone: student.phone || '',
    birthDate: '',
    weight: student.weight != null ? String(student.weight) : '',
    height: student.height != null ? String(student.height) : '',
    trainingDays: student.trainingDays || [],
    paymentDueDay: student.paymentDueDay != null ? String(student.paymentDueDay) : '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(day)
        ? prev.trainingDays.filter(d => d !== day)
        : [...prev.trainingDays, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const paymentDueDay = formData.paymentDueDay ? parseInt(formData.paymentDueDay, 10) : null;
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        birthDate: formData.birthDate || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        trainingDays: formData.trainingDays,
        paymentDueDay:
          paymentDueDay && paymentDueDay >= 1 && paymentDueDay <= 31 ? paymentDueDay : null,
      };
      await api.put(`/students/${student.id}`, payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.updateStudent'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-strong max-w-2xl w-full p-6 md:p-8 my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-dark-900">{t('personal.editStudent.title')}</h3>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>
          )}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.studentForm.fullName')}</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-modern" placeholder={t('personal.studentForm.fullNamePlaceholder')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.studentForm.email')}</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-modern" placeholder={t('personal.studentForm.emailPlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.studentForm.phone')}</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-modern" placeholder={t('personal.studentForm.phonePlaceholder')} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.studentForm.birthDate')}</label>
              <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className="input-modern" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.studentForm.weight')}</label>
              <input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="input-modern" placeholder="75.5" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.studentForm.height')}</label>
              <input type="number" step="0.1" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} className="input-modern" placeholder="175" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.studentForm.paymentDueDay')}</label>
            <input
              type="number"
              min={1}
              max={31}
              value={formData.paymentDueDay}
              onChange={(e) => setFormData({ ...formData, paymentDueDay: e.target.value })}
              className="input-modern max-w-[10rem]"
              placeholder={t('personal.studentForm.paymentDueDayPlaceholder')}
            />
            <p className="text-xs text-dark-500 mt-1.5">{t('personal.studentForm.paymentDueDayHintShort')}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-3">{t('personal.studentForm.trainingDays')}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {daysOfWeek.map((day) => (
                <button key={day.value} type="button" onClick={() => toggleDay(day.value)} className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${formData.trainingDays.includes(day.value) ? 'bg-gradient-accent text-white shadow-medium' : 'bg-dark-50 text-dark-600 hover:bg-dark-100'}`}>
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors">{t('common.cancel')}</button>
            <button type="submit" disabled={loading || !formData.name} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{loading ? t('common.saving') : t('common.saveChanges')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ 
  student, 
  onClose, 
  onConfirm, 
  deleting 
}: { 
  student: Student; 
  onClose: () => void; 
  onConfirm: () => void; 
  deleting: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-strong max-w-md w-full p-8 animate-scaleIn">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-display font-bold text-dark-900 mb-2">
            {t('personal.deleteStudent.title')}
          </h3>
          <p className="text-dark-500 mb-2">
            {t('personal.deleteStudent.confirm', { name: student.name })}
          </p>
          <p className="text-sm text-dark-400 mb-6">
            {t('personal.deleteStudent.warning')}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? t('common.deleting') : t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreinosPage() {
  const { t } = useTranslation();
  const daysOfWeek = useWeekdayOptions(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalPreselectedDay, setAddModalPreselectedDay] = useState<string | null>(null);
  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Selecionar automaticamente o primeiro aluno quando carregado
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0].id);
    }
  }, [students]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workoutsRes, studentsRes] = await Promise.all([
        api.get('/workouts'),
        api.get('/students')
      ]);
      setWorkouts(workoutsRes.data);
      const studentsData = studentsRes.data;
      setStudents(Array.isArray(studentsData) ? studentsData : (studentsData?.students ?? []));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/workouts/${workoutToDelete.id}`);
      setWorkoutToDelete(null);
      loadData();
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      alert(t('errors.deleteWorkout'));
    } finally {
      setDeleting(false);
    }
  };

  // Filtrar treinos do aluno selecionado
  const studentWorkouts = workouts.filter(w => w.studentId === selectedStudent);

  // Agrupar treinos por dia da semana
  const workoutsByDay = daysOfWeek.map(day => ({
    ...day,
    workout: studentWorkouts.find(w => w.dayOfWeek === day.value)
  }));

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-dark-900 mb-1 md:mb-2">
          {t('personal.workouts.title')}
        </h2>
        <p className="text-dark-500 text-sm md:text-lg">{t('personal.workouts.subtitle')}</p>
      </div>

      {students.length === 0 ? (
        <div className="card-modern p-6 md:p-12 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Users className="w-8 h-8 md:w-10 md:h-10 text-dark-400" />
          </div>
          <h3 className="text-lg md:text-2xl font-display font-bold text-dark-900 mb-2 md:mb-3">
            {t('personal.workouts.emptyStudentsTitle')}
          </h3>
          <p className="text-dark-500 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-lg">
            {t('personal.workouts.emptyStudentsDesc')}
          </p>
        </div>
      ) : (
        <>
          {/* Seletor de Aluno */}
          <div className="card-modern p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  {t('personal.workouts.selectStudent')}
                </label>
                <CustomSelect
                  value={selectedStudent}
                  onChange={setSelectedStudent}
                  options={students.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder={t('personal.workouts.selectStudent')}
                  aria-label={t('personal.workouts.selectStudent')}
                />
              </div>
              <button 
                onClick={() => {
                  setAddModalPreselectedDay(null);
                  setShowAddModal(true);
                }}
                className="btn-primary inline-flex items-center gap-2 self-end"
              >
                <Plus className="w-4 h-4" />
                {t('personal.workouts.newWorkout')}
              </button>
            </div>
          </div>

          {/* Grade de Dias da Semana - Visão Compacta */}
          <div className="card-modern p-4 md:p-6 mb-6">
            <h3 className="text-lg font-display font-bold text-dark-900 mb-4">
              {t('personal.workouts.selectWeekday')}
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {workoutsByDay.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`p-2 rounded-lg transition-all ${
                    selectedDay === day.value
                      ? 'bg-gradient-accent text-white shadow-strong scale-105'
                      : day.workout
                      ? 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-200'
                      : 'bg-dark-50 hover:bg-dark-100 border-2 border-dashed border-dark-200'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-sm font-bold mb-0.5 ${
                      selectedDay === day.value ? 'text-white' : day.workout ? 'text-blue-700' : 'text-dark-400'
                    }`}>
                      {day.short}
                    </div>
                    <div className={`text-[10px] font-semibold ${
                      selectedDay === day.value ? 'text-white' : day.workout ? 'text-blue-600' : 'text-dark-400'
                    }`}>
                      {day.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card do Dia Selecionado */}
          {selectedDay && (() => {
            const dayData = workoutsByDay.find(d => d.value === selectedDay);
            if (!dayData) return null;

            return (
              <div className="card-modern p-6 md:p-8 animate-scaleIn">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-accent text-white flex items-center justify-center font-bold text-lg shadow-medium">
                      {dayData.short}
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold text-dark-900">
                        {dayData.label}
                      </h3>
                      <p className="text-dark-500 text-sm">
                        {dayData.workout ? t('common.workoutConfigured') : t('common.noWorkoutDefined')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {dayData.workout ? (
                  <div className="space-y-6">
                    {/* Informações do Treino */}
                    <div className="bg-gradient-to-br from-blue-50 to-accent-50 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-dark-900 mb-2">
                            {dayData.workout.name}
                          </h4>
                          {dayData.workout.description && (
                            <p className="text-dark-600 text-sm">
                              {dayData.workout.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => setWorkoutToEdit(dayData.workout!)}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-medium"
                            title={t('common.edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setWorkoutToDelete(dayData.workout!)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-medium"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-dark-700 text-sm">
                        <Dumbbell className="w-4 h-4" />
                        <span className="font-semibold">
                          {t('personal.workouts.exerciseCount', { count: dayData.workout.exercises?.length || 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Lista de Exercícios */}
                    {dayData.workout.exercises && dayData.workout.exercises.length > 0 && (
                      <div>
                        <h5 className="text-base font-display font-bold text-dark-900 mb-4">
                          {t('personal.workouts.exercisesTitle')}
                        </h5>
                        <div className="space-y-3">
                          {dayData.workout.exercises.map((exercise, idx) => (
                            <div key={idx} className="card-modern p-4 hover:shadow-medium transition-all">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-gradient-accent text-white rounded-lg flex items-center justify-center font-bold text-base shadow-soft flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {exercise.imageUrl && (
                                    <div className="rounded-xl overflow-hidden border border-dark-200 bg-dark-50 mb-3">
                                      <img
                                        src={exercise.imageUrl}
                                        alt={exercise.name}
                                        className="w-full h-auto max-h-48 object-contain"
                                      />
                                    </div>
                                  )}
                                  <h6 className="font-bold text-dark-900 mb-2">
                                    {exercise.name}
                                  </h6>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <span className="text-dark-500">{t('personal.workouts.setsLabel')}</span>
                                      <span className="ml-2 font-semibold text-dark-900">{exercise.sets}</span>
                                    </div>
                                    <div>
                                      <span className="text-dark-500">{t('personal.workouts.repsLabel')}</span>
                                      <span className="ml-2 font-semibold text-dark-900">{exercise.reps}</span>
                                    </div>
                                    {exercise.rest && (
                                      <div>
                                        <span className="text-dark-500">{t('personal.workouts.restLabel')}</span>
                                        <span className="ml-2 font-semibold text-dark-900">{exercise.rest}</span>
                                      </div>
                                    )}
                                    {exercise.weight && (
                                      <div>
                                        <span className="text-dark-500">{t('personal.workouts.weightLabel')}</span>
                                        <span className="ml-2 font-semibold text-dark-900">{exercise.weight}</span>
                                      </div>
                                    )}
                                  </div>
                                  {exercise.notes && (
                                    <p className="text-sm text-dark-600 mt-2 italic">
                                      💡 {exercise.notes}
                                    </p>
                                  )}
                                  {exercise.videoUrl && (
                                    <>
                                      {getYoutubeVideoId(exercise.videoUrl) ? (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-dark-200 bg-white">
                                          <div className="aspect-video">
                                            <iframe
                                              src={`https://www.youtube.com/embed/${getYoutubeVideoId(exercise.videoUrl)}`}
                                              title={t('personal.suggestions.demoTitle', { name: exercise.name })}
                                              className="w-full h-full"
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                              referrerPolicy="strict-origin-when-cross-origin"
                                              allowFullScreen
                                            />
                                          </div>
                                          <a
                                            href={exercise.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:text-accent-700 font-semibold"
                                          >
                                            {t('personal.suggestions.viewOnYoutube')}
                                          </a>
                                        </div>
                                      ) : (
                                        <a
                                          href={exercise.videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 mt-3 text-sm text-accent-600 hover:text-accent-700 font-semibold"
                                        >
                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                          </svg>
                                          {t('personal.suggestions.viewVideoOnYoutube')}
                                        </a>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-dark-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Dumbbell className="w-10 h-10 text-dark-400" />
                    </div>
                    <h4 className="text-xl font-bold text-dark-900 mb-2">
                      {t('personal.workouts.noWorkoutForDayTitle')}
                    </h4>
                    <p className="text-dark-500 mb-6">
                      {t('personal.workouts.noWorkoutForDayDesc', { day: dayData.label })}
                    </p>
                    <button
                      onClick={() => {
                        setAddModalPreselectedDay(dayData.value);
                        setShowAddModal(true);
                      }}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {t('personal.workouts.createWorkoutForDay', { day: dayData.label })}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {showAddModal && (
        <AddWorkoutModal
          students={students}
          workouts={workouts}
          preSelectedStudentId={selectedStudent}
          preSelectedDayOfWeek={addModalPreselectedDay ?? undefined}
          onClose={() => {
            setShowAddModal(false);
            setAddModalPreselectedDay(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setAddModalPreselectedDay(null);
            loadData();
          }}
        />
      )}

      {workoutToEdit && (
        <EditWorkoutModal
          workout={workoutToEdit}
          students={students}
          onClose={() => setWorkoutToEdit(null)}
          onSuccess={() => {
            setWorkoutToEdit(null);
            loadData();
          }}
        />
      )}

      {workoutToDelete && (
        <DeleteWorkoutModal
          workout={workoutToDelete}
          onClose={() => setWorkoutToDelete(null)}
          onConfirm={handleDeleteWorkout}
          deleting={deleting}
        />
      )}
    </div>
  );
}

function formatCpfDisplay(value: string | undefined): string {
  if (!value) return '';
  const d = value.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function formatCepDisplay(value: string | undefined): string {
  if (!value) return '';
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function PerfilPage() {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showPlans, setShowPlans] = useState(false);
  const [editing, setEditing] = useState(false);
  const isPro = (user?.maxStudentsAllowed ?? 2) > 2;
  const supportWhatsappNumber = (import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER || '5585992654339').replace(/\D/g, '');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    taxId: user?.taxId ? formatCpfDisplay(user.taxId) : '',
    address: user?.address ?? '',
    addressNumber: user?.addressNumber ?? '',
    complement: user?.complement ?? '',
    province: user?.province ?? '',
    postalCode: user?.postalCode ? formatCepDisplay(user.postalCode) : '',
  });
  useEffect(() => {
    setForm({
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      taxId: user?.taxId ? formatCpfDisplay(user.taxId) : '',
      address: user?.address ?? '',
      addressNumber: user?.addressNumber ?? '',
      complement: user?.complement ?? '',
      province: user?.province ?? '',
      postalCode: user?.postalCode ? formatCepDisplay(user.postalCode) : '',
    });
  }, [user?.name, user?.phone, user?.taxId, user?.address, user?.addressNumber, user?.complement, user?.province, user?.postalCode]);

  const handleSaveProfile = async () => {
    setProfileError('');
    setSaving(true);
    try {
      const res = await api.patch('/personal/me', {
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || null,
        taxId: form.taxId.replace(/\D/g, '') || null,
        address: form.address.trim() || null,
        addressNumber: form.addressNumber.trim() || null,
        complement: form.complement.trim() || null,
        province: form.province.trim() || null,
        postalCode: form.postalCode.replace(/\D/g, '') || null,
      });
      updateUser(res.data);
      setEditing(false);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || t('errors.saveProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenSupport = () => {
    if (!supportWhatsappNumber) return;
    const message = `${t('personal.workouts.supportMessage')}${user?.name ? `\n\n${t('personal.profile.supportName', { name: user.name })}` : ''}`;
    const whatsappUrl = `https://wa.me/${supportWhatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-dark-900 mb-1 md:mb-2">
          {t('personal.profileTitle')}
        </h2>
        <p className="text-dark-500 text-sm md:text-lg">{t('personal.profileSubtitle')}</p>
      </div>

      {/* Área Assinatura - clicável para expandir planos */}
      <div className="card-modern p-6 md:p-8 mb-6">
        <button
          type="button"
          onClick={() => setShowPlans((v) => !v)}
          className="w-full flex items-center justify-between gap-4 text-left hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <h4 className="text-lg font-display font-bold text-dark-900">{t('personal.subscriptionSection')}</h4>
              <p className="text-dark-500 text-sm">{t('personal.subscriptionSectionDesc')}</p>
            </div>
          </div>
          <span className={`text-2xl text-dark-400 transition-transform ${showPlans ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showPlans && (
          <div className="mt-6 pt-6 border-t border-dark-100">
            <p className="text-dark-600 text-sm mb-4">
              {isPro ? t('subscription.manageTitle') : t('subscription.compareTitle')}
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-xl border-2 border-dark-200 bg-dark-50/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-display font-bold text-dark-900">
                    {isPro ? t('subscription.proPlan') : t('subscription.freePlan')}
                  </h5>
                  <span className="text-lg font-display font-bold text-dark-900">
                    {isPro ? t('subscription.active') : t('subscription.freePrice')}
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-dark-600 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    {isPro
                      ? t('subscription.unlimitedStudents')
                      : t('subscription.studentsLimit', { count: user?.maxStudentsAllowed ?? 2 })}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> {t('personal.benefitWorkouts')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> {t('personal.benefitEvolution')}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> {t('personal.benefitMessages')}
                  </li>
                </ul>
                {!isPro && (
                  <SubscriptionPanel
                    isPro={false}
                    onProActivated={() => updateUser({ maxStudentsAllowed: 999 })}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isPro && (
        <div className="card-modern p-6 md:p-8 mb-6">
          <SubscriptionPanel
            isPro
            onProActivated={() => updateUser({ maxStudentsAllowed: 999 })}
          />
        </div>
      )}

      <div className="mb-6 space-y-6">
        <PersonalLogoUpload user={user} onUpdated={updateUser} />
        <PersonalBrandSettings user={user} onUpdated={updateUser} />
      </div>

      <div className="mb-6">
        <AccountDeletionSection userType="personal" onDelete={() => setShowDeleteAccount(true)} />
      </div>

      <div className="card-modern p-5 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {resolveAssetUrl(user?.logoUrl) ? (
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl border border-dark-100 bg-white flex items-center justify-center overflow-hidden shadow-medium">
                <img
                  src={resolveAssetUrl(user?.logoUrl)!}
                  alt=""
                  className="w-full h-full object-contain p-1"
                />
              </div>
            ) : (
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-accent rounded-xl flex items-center justify-center text-white font-bold text-2xl md:text-3xl shadow-medium">
                {user?.name?.charAt(0)}
              </div>
            )}
            {isPro && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-amber-400 text-amber-900 shadow-medium ring-2 ring-white" title={t('personal.profile.proPlanTitle')}>
                <Crown className="w-3 h-3 md:w-4 md:h-4" />
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-dark-900 mb-0.5 flex items-center gap-2">
              {user?.name}
              {isPro && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">{t('personal.profile.proBadge')}</span>}
            </h3>
            <p className="text-dark-500 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h4 className="text-base font-display font-bold text-dark-900 mb-3">
              {t('personal.accountInfo')}
            </h4>
            {profileError && (
              <p className="text-red-600 text-sm mb-3">{profileError}</p>
            )}
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-dark-500 mb-1 block">{t('personal.profile.name')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-500 mb-1 block">{t('personal.profile.email')}</label>
                  <p className="text-dark-600 py-2">{user?.email}</p>
                  <p className="text-xs text-dark-400">{t('personal.profile.emailReadonly')}</p>
                </div>
                <div>
                  <label className="text-sm text-dark-500 mb-1 block">{t('personal.profile.phone')}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder={t('personal.profile.phonePlaceholder')}
                    className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-500 mb-1 block">{t('personal.profile.taxId')}</label>
                  <input
                    type="text"
                    value={form.taxId}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setForm((f) => ({ ...f, taxId: formatCpfDisplay(v) }));
                    }}
                    placeholder={t('personal.profile.taxIdPlaceholder')}
                    className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900"
                  />
                </div>
                <div className="border-t border-dark-100 pt-4 mt-4">
                  <p className="text-sm font-semibold text-dark-700 mb-3">{t('personal.profile.addressOptional')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-sm text-dark-500 mb-1 block">{t('personal.profile.cep')}</label>
                      <input
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setForm((f) => ({ ...f, postalCode: formatCepDisplay(v) }));
                        }}
                        placeholder={t('personal.profile.cepPlaceholder')}
                        className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-dark-500 mb-1 block">{t('personal.profile.street')}</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder={t('personal.profile.streetPlaceholder')}
                        className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-dark-500 mb-1 block">{t('personal.profile.number')}</label>
                      <input
                        type="text"
                        value={form.addressNumber}
                        onChange={(e) => setForm((f) => ({ ...f, addressNumber: e.target.value }))}
                        placeholder={t('personal.profile.numberPlaceholder')}
                        className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-dark-500 mb-1 block">{t('personal.profile.complement')}</label>
                      <input
                        type="text"
                        value={form.complement}
                        onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))}
                        placeholder={t('personal.profile.complementPlaceholder')}
                        className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-dark-500 mb-1 block">{t('personal.profile.district')}</label>
                      <input
                        type="text"
                        value={form.province}
                        onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                        placeholder={t('personal.profile.districtPlaceholder')}
                        className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-dark-900"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl bg-accent-500 text-white font-semibold text-sm disabled:opacity-70"
                  >
                    {saving ? t('common.saving') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setForm({ name: user?.name ?? '', phone: user?.phone ?? '', taxId: user?.taxId ? formatCpfDisplay(user.taxId) : '', address: user?.address ?? '', addressNumber: user?.addressNumber ?? '', complement: user?.complement ?? '', province: user?.province ?? '', postalCode: user?.postalCode ? formatCepDisplay(user.postalCode) : '' }); }}
                    className="px-4 py-2.5 rounded-xl border border-dark-200 text-dark-700 font-medium text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-dark-50 rounded-lg p-4">
                  <p className="text-sm text-dark-500 mb-1">{t('personal.profile.name')}</p>
                  <p className="text-dark-900 font-semibold">{user?.name}</p>
                </div>
                <div className="bg-dark-50 rounded-lg p-4">
                  <p className="text-sm text-dark-500 mb-1">{t('personal.profile.email')}</p>
                  <p className="text-dark-900 font-semibold">{user?.email}</p>
                </div>
                {(user?.phone || user?.taxId) && (
                  <>
                    {user?.phone && (
                      <div className="bg-dark-50 rounded-lg p-4">
                        <p className="text-sm text-dark-500 mb-1">{t('personal.profile.phone')}</p>
                        <p className="text-dark-900 font-semibold">{user.phone}</p>
                      </div>
                    )}
                    {user?.taxId && (
                      <div className="bg-dark-50 rounded-lg p-4">
                        <p className="text-sm text-dark-500 mb-1">{t('personal.profile.taxIdLabel')}</p>
                        <p className="text-dark-900 font-semibold">{formatCpfDisplay(user.taxId)}</p>
                      </div>
                    )}
                  </>
                )}
                {(user?.address || user?.postalCode) && (
                  <div className="bg-dark-50 rounded-lg p-4">
                    <p className="text-sm text-dark-500 mb-1">{t('personal.profile.address')}</p>
                    <p className="text-dark-900 font-semibold">
                      {[user.address, user.addressNumber && `nº ${user.addressNumber}`, user.complement, user.province].filter(Boolean).join(', ')}
                      {user.postalCode && ` — ${t('personal.profile.postalCodeInline', { code: formatCepDisplay(user.postalCode) })}`}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dark-200 text-dark-700 font-medium text-sm hover:bg-dark-50"
                >
                  <Edit2 className="w-3 h-3" />
                  {t('personal.profile.editProfile')}
                </button>
              </div>
            )}
          </div>

          <div className="pt-5 border-t">
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              {isPro && supportWhatsappNumber && (
                <button
                  type="button"
                  onClick={handleOpenSupport}
                  className="w-full md:w-auto px-4 py-2.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold text-sm rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('personal.profile.contactSupport')}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full md:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-medium"
              >
                <LogOut className="w-4 h-4" />
                {t('personal.profile.logoutAccount')}
              </button>
            </div>
          </div>

        </div>
      </div>

      {showDeleteAccount && (
        <DeleteAccountModal
          userType="personal"
          userEmail={user?.email}
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

function DeleteWorkoutModal({ 
  workout, 
  onClose, 
  onConfirm, 
  deleting 
}: { 
  workout: Workout; 
  onClose: () => void; 
  onConfirm: () => void; 
  deleting: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-strong max-w-md w-full p-8 animate-scaleIn">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-display font-bold text-dark-900 mb-2">
            {t('personal.workouts.deleteTitle')}
          </h3>
          <p className="text-dark-500 mb-2">
            {t('personal.workouts.deleteConfirm', { name: workout.name })}
          </p>
          <p className="text-sm text-dark-400 mb-6">
            {t('personal.workouts.deleteWarning')}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? t('common.deleting') : t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddWorkoutModal({ 
  students, 
  workouts,
  preSelectedStudentId,
  preSelectedDayOfWeek,
  onClose, 
  onSuccess 
}: { 
  students: Student[]; 
  workouts: Workout[];
  preSelectedStudentId?: string;
  preSelectedDayOfWeek?: string;
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const daysOfWeek = useWeekdayOptions();
  const [formData, setFormData] = useState({
    studentId: preSelectedStudentId || '',
    name: '',
    daysOfWeek: (preSelectedDayOfWeek ? [preSelectedDayOfWeek] : []) as string[],
    description: '',
  });

  // Dias que já têm treino para o aluno selecionado (para indicar no grid)
  const daysWithExistingWorkout = formData.studentId
    ? workouts
        .filter((w) => w.studentId === formData.studentId)
        .map((w) => w.dayOfWeek)
    : [];
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);
  const [exerciseToDeleteIndex, setExerciseToDeleteIndex] = useState<number | null>(null);
  const [savedExercises, setSavedExercises] = useState<Exercise[]>([]);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [showWorkoutLibrary, setShowWorkoutLibrary] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Carregar exercícios salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedExercises');
    const parsed = parseStoredJson<typeof savedExercises>(saved);
    if (parsed) setSavedExercises(parsed);
  }, []);

  const dayLabelByValue = Object.fromEntries(daysOfWeek.map((d) => [d.value, d.label])) as Record<string, string>;

  const toggleDay = (day: string) => {
    const alreadyAllocated = daysWithExistingWorkout.includes(day);
    setFormData(prev => {
      if (prev.daysOfWeek.includes(day)) {
        return { ...prev, daysOfWeek: prev.daysOfWeek.filter(d => d !== day) };
      }
      if (alreadyAllocated) return prev; // não permite selecionar dia já alocado
      return { ...prev, daysOfWeek: [...prev.daysOfWeek, day] };
    });
  };

  // Ao trocar de aluno, remove da seleção os dias que já têm treino para o novo aluno
  useEffect(() => {
    if (!formData.studentId) return;
    const allocated = workouts
      .filter((w) => w.studentId === formData.studentId)
      .map((w) => w.dayOfWeek);
    if (allocated.length === 0) return;
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.filter(d => !allocated.includes(d)),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- só reagir à troca de aluno
  }, [formData.studentId]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: '',
        sets: 3,
        reps: '12',
        rest: '60s',
        weight: '',
        notes: '',
        videoUrl: '',
        imageUrl: '',
        order: exercises.length,
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
    setExerciseToDeleteIndex(null);
    if (expandedExerciseIndex === index) setExpandedExerciseIndex(null);
    else if (expandedExerciseIndex !== null && expandedExerciseIndex > index) setExpandedExerciseIndex(expandedExerciseIndex - 1);
  };

  const saveExercise = (exercise: Exercise) => {
    const updated = [...savedExercises, { ...exercise, id: Date.now().toString() }];
    setSavedExercises(updated);
    localStorage.setItem('savedExercises', JSON.stringify(updated));
  };

  const addFromLibrary = (exercise: Exercise) => {
    setExercises([
      ...exercises,
      {
        ...exercise,
        order: exercises.length,
      },
    ]);
    setShowExerciseLibrary(false);
  };

  const workoutTemplates = workouts
    .filter((w) => w.exercises && w.exercises.length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const applyWorkoutTemplate = (template: Workout) => {
    setFormData((prev) => ({
      ...prev,
      name: template.name || prev.name,
      description: template.description || '',
    }));

    setExercises(
      (template.exercises || []).map((ex, index) => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest || '',
        weight: ex.weight || '',
        notes: ex.notes || '',
        videoUrl: ex.videoUrl || '',
        imageUrl: ex.imageUrl || '',
        order: index,
      }))
    );

    setExpandedExerciseIndex(null);
    setExerciseToDeleteIndex(null);
    setShowWorkoutLibrary(false);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.daysOfWeek.length === 0) {
      setError(t('errors.selectOneDayRequired'));
      return;
    }

    if (exercises.length === 0) {
      setError(t('errors.addOneExercise'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Criar um treino para cada dia selecionado
      const promises = formData.daysOfWeek.map(day =>
        api.post('/workouts', {
          studentId: formData.studentId,
          name: formData.name,
          dayOfWeek: day,
          description: formData.description,
          exercises: exercises.map((ex, index) => ({ ...ex, order: index })),
        })
      );

      await Promise.all(promises);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.createWorkout'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-strong max-w-4xl w-full p-6 md:p-8 my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-dark-900">{t('personal.workouts.createTitle')}</h3>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={preSelectedStudentId ? 'hidden' : ''} aria-hidden={preSelectedStudentId ? true : undefined}>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                {t('common.student')} *
              </label>
              <CustomSelect
                value={formData.studentId}
                onChange={(studentId) => setFormData({ ...formData, studentId })}
                options={students.map((s) => ({ value: s.id, label: s.name }))}
                placeholder={t('personal.workouts.selectStudentPlaceholder')}
                aria-label={t('common.student')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-3">
                {t('personal.workouts.weekdaysMulti')}
              </label>
              {formData.studentId && daysWithExistingWorkout.length > 0 && (
                <p className="text-xs text-dark-500 mb-2">
                  {t('personal.workouts.daysAlreadyAllocated')}
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => {
                  const hasExisting = daysWithExistingWorkout.includes(day.value);
                  const isSelected = formData.daysOfWeek.includes(day.value);
                  const disabled = hasExisting;
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      disabled={disabled}
                      title={disabled ? t('personal.workouts.dayAlreadyAllocated') : undefined}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all flex flex-col items-center gap-0.5 ${
                        disabled
                          ? 'bg-blue-50 text-blue-600 border-2 border-blue-200 cursor-not-allowed opacity-90'
                          : isSelected
                            ? 'bg-gradient-accent text-white shadow-medium'
                            : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                      }`}
                    >
                      <span>{day.label}</span>
                      {hasExisting && (
                        <span className="text-[10px] font-medium opacity-90">{t('personal.workouts.alreadyAllocated')}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {formData.daysOfWeek.length === 0 && (
                <p className="text-xs text-red-500 mt-2">{t('personal.workouts.selectOneDayError')}</p>
              )}
              {formData.daysOfWeek.length > 1 && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ {t('personal.workouts.replicateDays', { count: formData.daysOfWeek.length })}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              {t('personal.workouts.workoutName')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder={t('personal.workouts.workoutNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              {t('personal.workouts.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-modern"
              rows={2}
              placeholder={t('personal.workouts.descriptionPlaceholder')}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-display font-bold text-dark-900">
                {t('personal.workouts.exercisesTitle')} ({exercises.length})
              </h4>
              <div className="flex gap-2">
                {workoutTemplates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowWorkoutLibrary(true)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold text-sm rounded-lg hover:bg-indigo-100 transition-colors inline-flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {t('personal.workouts.workoutLibrary', { count: workoutTemplates.length })}
                  </button>
                )}
                {savedExercises.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowExerciseLibrary(true)}
                    className="hidden px-4 py-2 bg-blue-50 text-blue-700 font-semibold text-sm rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {t('personal.workouts.exerciseLibrary', { count: savedExercises.length })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={addExercise}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('personal.workouts.newExercise')}
                </button>
              </div>
            </div>

            {exercises.length === 0 ? (
              <div className="bg-dark-50 border-2 border-dashed border-dark-200 rounded-xl p-8 text-center">
                <Dumbbell className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500">{t('personal.workouts.noExercisesAdded')}</p>
                <p className="text-sm text-dark-400 mt-1">{t('personal.workouts.noExercisesHint')}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[38vh] overflow-y-auto pr-1">
                {exercises.map((exercise, index) => {
                  const isExpanded = expandedExerciseIndex === index;
                  const isConfirmingDelete = exerciseToDeleteIndex === index;
                  return (
                    <div key={index} className="bg-dark-50 rounded-xl p-4 relative border-2 border-transparent">
                      {isConfirmingDelete ? (
                        <div className="py-2">
                          <p className="text-dark-700 font-medium mb-4">
                            {t('personal.workouts.deleteExerciseConfirm', {
                              name: exercise.name || t('personal.exercise.defaultName', { number: index + 1 }),
                            })}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setExerciseToDeleteIndex(null)}
                              className="px-4 py-2 rounded-lg border-2 border-dark-200 text-dark-700 font-semibold hover:bg-dark-50 transition-colors"
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExercise(index)}
                              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow-medium"
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        </div>
                      ) : !isExpanded ? (
                        <>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2 shrink-0 self-end">
                              <button
                                type="button"
                                onClick={() => saveExercise(exercise)}
                                disabled={!exercise.name || !exercise.sets || !exercise.reps}
                                className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                title={t('personal.workouts.saveToLibrary')}
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedExerciseIndex(index)}
                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-medium"
                                title={t('personal.workouts.editExercise')}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExerciseToDeleteIndex(index)}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-medium"
                                title={t('personal.workouts.deleteExercise')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-dark-900 truncate">
                                {exercise.name || t('personal.exercise.defaultName', { number: index + 1 })}
                              </p>
                              <p className="text-sm text-dark-500 mt-0.5">
                                {t('personal.workouts.setsRepsSummary', { sets: exercise.sets, reps: exercise.reps })}
                                {exercise.rest ? ` · ${t('personal.workouts.restSummary', { rest: exercise.rest })}` : ''}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedExerciseIndex(null)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors"
                            >
                              {t('common.save')}
                            </button>
                            <button
                              type="button"
                              onClick={() => saveExercise(exercise)}
                              disabled={!exercise.name || !exercise.sets || !exercise.reps}
                              className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t('personal.workouts.saveToLibrary')}
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExerciseToDeleteIndex(index)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-medium"
                              title={t('personal.workouts.deleteExercise')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-32">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.name')}</label>
                              <input
                                type="text"
                                required
                                value={exercise.name}
                                onChange={(e) => updateExercise(index, 'name', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.namePlaceholder')}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.sets')}</label>
                              <input
                                type="number"
                                required
                                min={1}
                                value={exercise.sets}
                                onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                                className="input-modern"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.reps')}</label>
                              <input
                                type="text"
                                required
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.repsPlaceholder')}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.rest')}</label>
                              <input
                                type="text"
                                value={exercise.rest}
                                onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.restPlaceholder')}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.weight')}</label>
                              <input
                                type="text"
                                value={exercise.weight}
                                onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.weightPlaceholder')}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.videoUrl')}</label>
                              <input
                                type="url"
                                value={exercise.videoUrl}
                                onChange={(e) => updateExercise(index, 'videoUrl', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.videoPlaceholder')}
                              />
                              <ExerciseVideoSuggestions
                                exerciseName={exercise.name}
                                selectedVideoUrl={exercise.videoUrl}
                                onSelect={(url) => updateExercise(index, 'videoUrl', url)}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.imageUrl')}</label>
                              <input
                                type="url"
                                value={exercise.imageUrl}
                                onChange={(e) => updateExercise(index, 'imageUrl', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.imagePlaceholder')}
                              />
                              <p className="text-xs text-dark-500 mt-1">{t('personal.exercise.imageHint')}</p>
                              <ExerciseImageSuggestions
                                exerciseName={exercise.name}
                                selectedImageUrl={exercise.imageUrl}
                                onSelect={(url) => updateExercise(index, 'imageUrl', url)}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.notes')}</label>
                              <textarea
                                value={exercise.notes}
                                onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                                className="input-modern"
                                rows={2}
                                placeholder={t('personal.exercise.notesPlaceholder')}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || exercises.length === 0 || formData.daysOfWeek.length === 0}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t('common.creating')
                : formData.daysOfWeek.length > 1
                  ? t('personal.createWorkouts', { count: formData.daysOfWeek.length })
                  : t('personal.createWorkout')}
            </button>
          </div>
        </form>
      </div>

      {/* Modal da Biblioteca de Exercícios */}
      {showExerciseLibrary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-strong max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-display font-bold text-dark-900">
                {t('personal.workouts.exerciseLibraryTitle')}
              </h3>
              <button
                onClick={() => setShowExerciseLibrary(false)}
                className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {savedExercises.map((exercise, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-dark-50 to-dark-100 rounded-lg p-4 hover:shadow-medium transition-all cursor-pointer border-2 border-transparent hover:border-accent-500"
                  onClick={() => addFromLibrary(exercise)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-dark-900">{exercise.name}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = savedExercises.filter((_, i) => i !== index);
                        setSavedExercises(updated);
                        localStorage.setItem('savedExercises', JSON.stringify(updated));
                      }}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-3 text-sm text-dark-600">
                    <span>{t('personal.workouts.librarySets', { sets: exercise.sets })}</span>
                    <span>•</span>
                    <span>{exercise.reps} reps</span>
                    {exercise.weight && (
                      <>
                        <span>•</span>
                        <span>{exercise.weight}</span>
                      </>
                    )}
                  </div>
                  {exercise.notes && (
                    <p className="text-xs text-dark-500 mt-2">{exercise.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {savedExercises.length === 0 && (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500">{t('personal.workouts.noSavedExercises')}</p>
                <p className="text-sm text-dark-400 mt-1">
                  Clique no ícone de salvar ao criar exercícios
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal da Biblioteca de Treinos */}
      {showWorkoutLibrary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-strong max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-display font-bold text-dark-900">
                {t('personal.workouts.libraryTitle')}
              </h3>
              <button
                onClick={() => setShowWorkoutLibrary(false)}
                className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-dark-500 mb-4">
              {t('personal.workouts.librarySelectHint')}
            </p>

            <div className="space-y-3">
              {workoutTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyWorkoutTemplate(template)}
                  className="w-full text-left bg-gradient-to-br from-dark-50 to-dark-100 rounded-lg p-4 hover:shadow-medium transition-all border-2 border-transparent hover:border-accent-500"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-dark-900 truncate">{template.name}</h4>
                      <p className="text-xs text-dark-500 mt-1">
                        {t('personal.workouts.libraryExerciseDay', {
                          count: template.exercises.length,
                          day: dayLabelByValue[template.dayOfWeek] || template.dayOfWeek,
                        })}
                      </p>
                      {template.student?.name && (
                        <p className="text-xs text-dark-500 mt-1 truncate">
                          {t('personal.workouts.studentLabel', { name: template.student.name })}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-accent-600 shrink-0">{t('personal.workouts.useWorkout')}</span>
                  </div>
                </button>
              ))}
            </div>

            {workoutTemplates.length === 0 && (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500">{t('personal.workouts.noWorkoutsAvailable')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EditWorkoutModal({ 
  workout,
  students,
  onClose, 
  onSuccess 
}: { 
  workout: Workout;
  students: Student[];
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const daysOfWeek = useWeekdayOptions();
  const [formData, setFormData] = useState({
    studentId: workout.studentId,
    name: workout.name,
    dayOfWeek: workout.dayOfWeek,
    description: workout.description || '',
  });
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);
  const [exerciseToDeleteIndex, setExerciseToDeleteIndex] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>(
    workout.exercises?.map(ex => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest: ex.rest || '',
      weight: ex.weight || '',
      notes: ex.notes || '',
      videoUrl: ex.videoUrl || '',
      imageUrl: ex.imageUrl || '',
      order: ex.order,
    })) || []
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: '',
        sets: 3,
        reps: '12',
        rest: '60s',
        weight: '',
        notes: '',
        videoUrl: '',
        imageUrl: '',
        order: exercises.length,
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
    setExerciseToDeleteIndex(null);
    if (expandedExerciseIndex === index) setExpandedExerciseIndex(null);
    else if (expandedExerciseIndex !== null && expandedExerciseIndex > index) setExpandedExerciseIndex(expandedExerciseIndex - 1);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dayOfWeek) {
      setError(t('errors.selectDayRequired'));
      return;
    }

    if (exercises.length === 0) {
      setError(t('errors.addOneExercise'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.put(`/workouts/${workout.id}`, {
        ...formData,
        exercises: exercises.map((ex, index) => ({ ...ex, order: index })),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.updateWorkout'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-strong max-w-4xl w-full p-6 md:p-8 my-8 max-h-[85vh] overflow-y-auto animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-dark-900">{t('personal.workouts.editTitle')}</h3>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-dark-900 hover:bg-dark-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="hidden" aria-hidden="true">
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                {t('personal.workouts.selectStudent')} *
              </label>
              <CustomSelect
                value={formData.studentId}
                onChange={(studentId) => setFormData({ ...formData, studentId })}
                options={students.map((s) => ({ value: s.id, label: s.name }))}
                placeholder={t('personal.workouts.selectStudentPlaceholder')}
                aria-label={t('common.student')}
              />
            </div>

            <div className="hidden" aria-hidden="true">
              <label className="block text-sm font-semibold text-dark-700 mb-3">
                {t('personal.workouts.weekdaySingle')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, dayOfWeek: day.value })}
                    className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                      formData.dayOfWeek === day.value
                        ? 'bg-gradient-accent text-white shadow-medium'
                        : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              {t('personal.workouts.workoutName')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder={t('personal.workouts.workoutNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              {t('personal.workouts.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-modern"
              rows={2}
              placeholder={t('personal.workouts.descriptionPlaceholder')}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-display font-bold text-dark-900">
                {t('personal.workouts.exercisesTitle')} ({exercises.length})
              </h4>
              <button
                type="button"
                onClick={addExercise}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('personal.workouts.addExercise')}
              </button>
            </div>

            {exercises.length === 0 ? (
              <div className="bg-dark-50 border-2 border-dashed border-dark-200 rounded-xl p-8 text-center">
                <Dumbbell className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500">{t('personal.workouts.noExercisesAdded')}</p>
                <p className="text-sm text-dark-400 mt-1">{t('personal.workouts.noExercisesHint')}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[38vh] overflow-y-auto pr-1">
                {exercises.map((exercise, index) => {
                  const isExpanded = expandedExerciseIndex === index;
                  const isConfirmingDelete = exerciseToDeleteIndex === index;
                  return (
                    <div key={index} className="bg-dark-50 rounded-xl p-4 relative border-2 border-transparent">
                      {isConfirmingDelete ? (
                        <div className="py-2">
                          <p className="text-dark-700 font-medium mb-4">
                            {t('personal.workouts.deleteExerciseConfirm', {
                              name: exercise.name || t('personal.exercise.defaultName', { number: index + 1 }),
                            })}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setExerciseToDeleteIndex(null)}
                              className="px-4 py-2 rounded-lg border-2 border-dark-200 text-dark-700 font-semibold hover:bg-dark-50 transition-colors"
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExercise(index)}
                              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow-medium"
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        </div>
                      ) : !isExpanded ? (
                        <>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2 shrink-0 self-end">
                              <button
                                type="button"
                                onClick={() => setExpandedExerciseIndex(index)}
                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-medium"
                                title={t('personal.workouts.editExercise')}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExerciseToDeleteIndex(index)}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-medium"
                                title={t('personal.workouts.deleteExercise')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-dark-900 truncate">
                                {exercise.name || t('personal.exercise.defaultName', { number: index + 1 })}
                              </p>
                              <p className="text-sm text-dark-500 mt-0.5">
                                {t('personal.workouts.setsRepsSummary', { sets: exercise.sets, reps: exercise.reps })}
                                {exercise.rest ? ` · ${t('personal.workouts.restSummary', { rest: exercise.rest })}` : ''}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedExerciseIndex(null)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors"
                            >
                              {t('common.save')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setExerciseToDeleteIndex(index)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-medium"
                              title={t('personal.workouts.deleteExercise')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-24">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.name')}</label>
                              <input
                                type="text"
                                required
                                value={exercise.name}
                                onChange={(e) => updateExercise(index, 'name', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.namePlaceholder')}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.sets')}</label>
                              <input
                                type="number"
                                required
                                min={1}
                                value={exercise.sets}
                                onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                                className="input-modern"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.reps')}</label>
                              <input
                                type="text"
                                required
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.repsPlaceholder')}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.rest')}</label>
                              <input
                                type="text"
                                value={exercise.rest}
                                onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.restPlaceholder')}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.weight')}</label>
                              <input
                                type="text"
                                value={exercise.weight}
                                onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.weightPlaceholder')}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.videoUrl')}</label>
                              <input
                                type="url"
                                value={exercise.videoUrl}
                                onChange={(e) => updateExercise(index, 'videoUrl', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.videoPlaceholder')}
                              />
                              <ExerciseVideoSuggestions
                                exerciseName={exercise.name}
                                selectedVideoUrl={exercise.videoUrl}
                                onSelect={(url) => updateExercise(index, 'videoUrl', url)}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.imageUrl')}</label>
                              <input
                                type="url"
                                value={exercise.imageUrl}
                                onChange={(e) => updateExercise(index, 'imageUrl', e.target.value)}
                                className="input-modern"
                                placeholder={t('personal.exercise.imagePlaceholder')}
                              />
                              <p className="text-xs text-dark-500 mt-1">{t('personal.exercise.imageHint')}</p>
                              <ExerciseImageSuggestions
                                exerciseName={exercise.name}
                                selectedImageUrl={exercise.imageUrl}
                                onSelect={(url) => updateExercise(index, 'imageUrl', url)}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-semibold text-dark-700 mb-2">{t('personal.exercise.notes')}</label>
                              <textarea
                                value={exercise.notes}
                                onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                                className="input-modern"
                                rows={2}
                                placeholder={t('personal.exercise.notesPlaceholder')}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || exercises.length === 0 || !formData.dayOfWeek}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.saving') : t('common.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

