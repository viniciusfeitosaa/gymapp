import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LogOut, Users, Dumbbell, Plus, X, Copy, Check, Trash2, AlertTriangle, Home, User as UserIcon, Edit2, CheckCircle } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';

interface Student {
  id: string;
  name: string;
  accessCode: string;
  phone?: string;
  email?: string;
  weight?: number;
  height?: number;
  trainingDays: string[];
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

export default function PersonalDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.split('/').pop() || 'home';

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/personal/home' },
    { id: 'alunos', label: 'Alunos', icon: Users, path: '/personal/alunos' },
    { id: 'treinos', label: 'Treinos', icon: Dumbbell, path: '/personal/treinos' },
    { id: 'perfil', label: 'Perfil', icon: UserIcon, path: '/personal/perfil' },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-dark-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-soft border-b border-dark-100 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-20">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-accent rounded-lg md:rounded-xl flex items-center justify-center shadow-medium">
                <Dumbbell className="w-4 h-4 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-display font-bold bg-gradient-accent bg-clip-text text-transparent">
                  Gym Code
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">Painel do Personal Trainer</p>
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
                title="Sair"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8 pb-20 md:pb-8">
        {currentPath === 'home' && <DashboardHome />}
        {currentPath === 'alunos' && <AlunosPage />}
        {currentPath === 'treinos' && <TreinosPage />}
        {currentPath === 'perfil' && <PerfilPage />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-dark-200 shadow-strong z-50">
        <div className="grid grid-cols-4 h-16">
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

function DashboardHome() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [studentsRes, logsRes] = await Promise.all([
          api.get('/students'),
          api.get('/workouts/recent-logs?days=7').catch(() => ({ data: [] })),
        ]);
        setStudents(studentsRes.data);
        setRecentLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
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
  const totalTreinos = 0; // TODO: Implementar quando tiver endpoint de treinos

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
          Olá, {user?.name?.split(' ')[0]}!
        </h2>
        <p className="text-dark-500 text-sm md:text-lg">Bem-vindo ao seu painel de controle</p>
      </div>

      {/* Gráfico de Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
        {/* Gráfico Principal */}
        <div className="lg:col-span-2 card-modern p-6 md:p-8 relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-display font-bold text-dark-900 mb-1">
                Treinos concluídos por dia
              </h3>
              <p className="text-sm text-dark-500">Últimos 7 dias — alunos que finalizaram o treino</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-600">
              <div className="w-3 h-3 rounded-full bg-gradient-accent"></div>
              <span>Conclusões</span>
            </div>
          </div>
          
          <div className="relative h-64">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-dark-100"></div>
              ))}
            </div>
            
            {/* Bars: últimos 7 dias corridos (uma barra por data) */}
            <div className="relative h-full flex items-end justify-around gap-2 md:gap-4 px-2">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const last7Dates: Date[] = [];
                for (let i = 6; i >= 0; i--) {
                  const d = new Date(today);
                  d.setDate(d.getDate() - i);
                  last7Dates.push(d);
                }

                const dateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                const countByDate: { [key: string]: number } = {};
                last7Dates.forEach((d) => { countByDate[dateKey(d)] = 0; });

                recentLogs.forEach((log) => {
                  const d = new Date(log.date);
                  d.setHours(0, 0, 0, 0);
                  const key = dateKey(d);
                  if (countByDate[key] !== undefined) countByDate[key]++;
                });

                const maxCount = Math.max(...Object.values(countByDate), 1);

                return last7Dates.map((d) => {
                  const key = dateKey(d);
                  const count = countByDate[key] ?? 0;
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const label = d.toLocaleDateString('pt-BR', { day: 'numeric', month: '2-digit' });
                  const isToday = dateKey(d) === dateKey(today);
                  return (
                    <div key={key} className="flex-1 flex flex-col items-center gap-3">
                      <div className="w-full relative group">
                        <div
                          className="w-full bg-gradient-accent rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer"
                          style={{ height: `${Math.max(percentage, 5)}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                            {count} {count === 1 ? 'conclusão' : 'conclusões'}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs md:text-sm font-medium ${isToday ? 'text-accent-600 font-semibold' : 'text-dark-600'}`}>
                        {label}{isToday ? ' (hoje)' : ''}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          
          {recentLogs.length === 0 && (
            <div className="absolute inset-6 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl">
              <div className="text-center">
                <Dumbbell className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500 font-medium">Nenhuma conclusão nos últimos 7 dias</p>
              </div>
            </div>
          )}
        </div>

        {/* Cards de Resumo */}
        <div className="flex flex-col gap-4">
          <div className="card-modern p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1">{totalAlunos}</p>
            <p className="text-sm text-dark-500">Alunos Ativos</p>
          </div>

          <div className="card-modern p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-accent-600" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-1">{totalTreinos}</p>
            <p className="text-sm text-dark-500">Treinos Criados</p>
          </div>

        </div>
      </div>

      <div className="card-modern p-6 md:p-8">
        <h3 className="text-xl md:text-2xl font-display font-bold text-dark-900 mb-4">
          Atividades Recentes
        </h3>
        {(() => {
          const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const logsLast24h = recentLogs.filter((log) => new Date(log.date) >= last24h);
          return logsLast24h.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma conclusão de treino nas últimas 24h</p>
            <p className="text-sm mt-1">Quando seus alunos finalizarem treinos, aparecerão aqui</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {logsLast24h.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark-900">
                    <span className="text-emerald-700">{log.student?.name}</span>
                    {' '}concluiu o treino{' '}
                    <span className="text-dark-800">{log.workout?.name}</span>
                  </p>
                  <p className="text-sm text-dark-500">
                    {new Date(log.date).toLocaleDateString('pt-BR', {
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
        );
        })()}
      </div>
    </div>
  );
}

function AlunosPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Carregar alunos
  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students');
      setStudents(response.data);
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
      alert('Erro ao excluir aluno. Tente novamente.');
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
          Gestão de Alunos
        </h2>
        <p className="text-dark-500 text-sm md:text-lg">
          Cadastre e gerencie seus alunos
        </p>
      </div>

      {/* Lista de Alunos ou Empty State */}
      {loading ? (
        <div className="card-modern p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-dark-500 mt-4">Carregando alunos...</p>
        </div>
      ) : (students?.length || 0) === 0 ? (
        <div className="card-modern p-6 md:p-12 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Users className="w-8 h-8 md:w-10 md:h-10 text-dark-400" />
          </div>
          <h3 className="text-lg md:text-2xl font-display font-bold text-dark-900 mb-2 md:mb-3">
            Comece Adicionando Seus Alunos!
          </h3>
          <p className="text-dark-500 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-lg">
            Cadastre seus alunos e comece a criar fichas de treino personalizadas para cada um deles.
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Adicionar Primeiro Aluno
          </button>
        </div>
      ) : (
        <div className="card-modern p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl font-display font-bold text-dark-900">
              Meus Alunos ({students?.length || 0})
            </h3>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-2 text-sm md:text-base"
            >
              <Plus className="w-4 h-4" />
              Novo Aluno
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <StudentCard 
                key={student.id} 
                student={student} 
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

function StudentCard({ student, onDelete }: { student: Student; onDelete: () => void }) {
  const [codeCopied, setCodeCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(student.accessCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="card-modern p-4 md:p-6 hover:shadow-strong transition-all duration-300 relative">
      <button
        onClick={onDelete}
        className="absolute top-3 right-3 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Excluir aluno"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      
      <div className="flex items-start justify-between mb-4 pr-8">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-accent rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <button 
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-50 text-accent-700 rounded-lg hover:bg-accent-100 transition-colors text-sm font-semibold"
        >
          {codeCopied ? (
            <>
              <Check className="w-4 h-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {student.accessCode}
            </>
          )}
        </button>
      </div>
      <h4 className="text-lg font-bold text-dark-900 mb-2">{student.name}</h4>
      {student.email && (
        <p className="text-sm text-dark-500 mb-1">{student.email}</p>
      )}
      {student.phone && (
        <p className="text-sm text-dark-500 mb-3">{student.phone}</p>
      )}
      {student.trainingDays && student.trainingDays.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {student.trainingDays.map((day) => {
            const dayLabels: { [key: string]: string } = {
              MONDAY: 'Segunda',
              TUESDAY: 'Terça',
              WEDNESDAY: 'Quarta',
              THURSDAY: 'Quinta',
              FRIDAY: 'Sexta',
              SATURDAY: 'Sábado',
              SUNDAY: 'Domingo',
            };
            return (
              <span key={day} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                {dayLabels[day] || day}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddStudentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    weight: '',
    height: '',
    trainingDays: [] as string[],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newStudent, setNewStudent] = useState<Student | null>(null);

  const daysOfWeek = [
    { value: 'MONDAY', label: 'Segunda' },
    { value: 'TUESDAY', label: 'Terça' },
    { value: 'WEDNESDAY', label: 'Quarta' },
    { value: 'THURSDAY', label: 'Quinta' },
    { value: 'FRIDAY', label: 'Sexta' },
    { value: 'SATURDAY', label: 'Sábado' },
    { value: 'SUNDAY', label: 'Domingo' },
  ];

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
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        birthDate: formData.birthDate || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        trainingDays: formData.trainingDays,
      };

      const response = await api.post('/students', payload);
      setNewStudent(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar aluno');
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
              Aluno Criado com Sucesso!
            </h3>
            <p className="text-dark-500 mb-6">
              Compartilhe o código de acesso com <strong>{newStudent.name}</strong>:
            </p>
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-6 mb-6">
              <p className="text-sm text-dark-600 mb-2 font-medium">Código de Acesso:</p>
              <p className="text-4xl font-display font-bold text-accent-600 tracking-wider">
                {newStudent.accessCode}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newStudent.accessCode);
                onSuccess();
              }}
              className="btn-primary w-full mb-3"
            >
              <Copy className="w-5 h-5 mr-2" />
              Copiar Código e Fechar
            </button>
            <button
              onClick={onSuccess}
              className="w-full px-6 py-3 text-dark-600 hover:bg-dark-50 rounded-xl transition-colors"
            >
              Fechar
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
          <h3 className="text-2xl font-display font-bold text-dark-900">Adicionar Novo Aluno</h3>
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
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-modern"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-modern"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Data de Nascimento
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
                Peso (kg)
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
                Altura (cm)
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
            <label className="block text-sm font-semibold text-dark-700 mb-3">
              Dias de Treino
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Aluno'}
            </button>
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
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-strong max-w-md w-full p-8 animate-scaleIn">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-display font-bold text-dark-900 mb-2">
            Excluir Aluno?
          </h3>
          <p className="text-dark-500 mb-2">
            Tem certeza que deseja excluir <strong>{student.name}</strong>?
          </p>
          <p className="text-sm text-dark-400 mb-6">
            Esta ação não pode ser desfeita. Todos os treinos e progresso deste aluno serão perdidos.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreinosPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      setStudents(studentsRes.data);
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
      alert('Erro ao excluir treino. Tente novamente.');
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
          Gestão de Treinos
        </h2>
        <p className="text-dark-500 text-sm md:text-lg">Crie e gerencie fichas de treino personalizadas</p>
      </div>

      {students.length === 0 ? (
        <div className="card-modern p-6 md:p-12 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-dark-100 to-dark-200 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
            <Users className="w-8 h-8 md:w-10 md:h-10 text-dark-400" />
          </div>
          <h3 className="text-lg md:text-2xl font-display font-bold text-dark-900 mb-2 md:mb-3">
            Nenhum Aluno Cadastrado
          </h3>
          <p className="text-dark-500 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-lg">
            Cadastre alunos primeiro para poder criar treinos para eles.
          </p>
        </div>
      ) : (
        <>
          {/* Seletor de Aluno */}
          <div className="card-modern p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Selecione o Aluno
                </label>
                <CustomSelect
                  value={selectedStudent}
                  onChange={setSelectedStudent}
                  options={students.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="Selecione o Aluno"
                  aria-label="Selecione o aluno"
                />
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-primary inline-flex items-center gap-2 self-end"
              >
                <Plus className="w-4 h-4" />
                Novo Treino
              </button>
            </div>
          </div>

          {/* Grade de Dias da Semana - Visão Compacta */}
          <div className="card-modern p-4 md:p-6 mb-6">
            <h3 className="text-lg font-display font-bold text-dark-900 mb-4">
              Selecione o Dia da Semana
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
                    {day.workout && selectedDay !== day.value && (
                      <div className="mt-1 w-1 h-1 bg-green-500 rounded-full mx-auto"></div>
                    )}
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
                        {dayData.workout ? 'Treino configurado' : 'Sem treino definido'}
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
                            title="Editar treino"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setWorkoutToDelete(dayData.workout!)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-medium"
                            title="Excluir treino"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-dark-700 text-sm">
                        <Dumbbell className="w-4 h-4" />
                        <span className="font-semibold">
                          {dayData.workout.exercises?.length || 0} exercício(s)
                        </span>
                      </div>
                    </div>

                    {/* Lista de Exercícios */}
                    {dayData.workout.exercises && dayData.workout.exercises.length > 0 && (
                      <div>
                        <h5 className="text-base font-display font-bold text-dark-900 mb-4">
                          Exercícios
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
                                    <p className="text-sm text-dark-600 mt-2 italic">
                                      💡 {exercise.notes}
                                    </p>
                                  )}
                                  {exercise.videoUrl && (
                                    <a
                                      href={exercise.videoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 mt-3 text-sm text-accent-600 hover:text-accent-700 font-semibold"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                      </svg>
                                      Ver vídeo no YouTube
                                    </a>
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
                      Nenhum Treino Definido
                    </h4>
                    <p className="text-dark-500 mb-6">
                      Crie um treino para {dayData.label} clicando no botão abaixo
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Criar Treino para {dayData.label}
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
          preSelectedStudentId={selectedStudent}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
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

function PerfilPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-dark-900 mb-1 md:mb-2">
          Perfil
        </h2>
        <p className="text-dark-500 text-sm md:text-lg">Gerencie suas informações pessoais</p>
      </div>

      <div className="card-modern p-6 md:p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-accent rounded-2xl flex items-center justify-center text-white font-bold text-3xl md:text-4xl shadow-medium">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold text-dark-900 mb-1">{user?.name}</h3>
            <p className="text-dark-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-display font-bold text-dark-900 mb-4">
              Informações da Conta
            </h4>
            <div className="space-y-3">
              <div className="bg-dark-50 rounded-lg p-4">
                <p className="text-sm text-dark-500 mb-1">Nome</p>
                <p className="text-dark-900 font-semibold">{user?.name}</p>
              </div>
              <div className="bg-dark-50 rounded-lg p-4">
                <p className="text-sm text-dark-500 mb-1">Email</p>
                <p className="text-dark-900 font-semibold">{user?.email}</p>
              </div>
              {user?.phone && (
                <div className="bg-dark-50 rounded-lg p-4">
                  <p className="text-sm text-dark-500 mb-1">Telefone</p>
                  <p className="text-dark-900 font-semibold">{user?.phone}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t">
            <button
              onClick={handleLogout}
              className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-medium"
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
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
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-strong max-w-md w-full p-8 animate-scaleIn">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-display font-bold text-dark-900 mb-2">
            Excluir Treino?
          </h3>
          <p className="text-dark-500 mb-2">
            Tem certeza que deseja excluir o treino <strong>{workout.name}</strong>?
          </p>
          <p className="text-sm text-dark-400 mb-6">
            Esta ação não pode ser desfeita. Todos os exercícios serão perdidos.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddWorkoutModal({ 
  students, 
  preSelectedStudentId,
  onClose, 
  onSuccess 
}: { 
  students: Student[]; 
  preSelectedStudentId?: string;
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    studentId: preSelectedStudentId || '',
    name: '',
    daysOfWeek: [] as string[], // Mudado para array para múltiplos dias
    description: '',
  });
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [savedExercises, setSavedExercises] = useState<Exercise[]>([]);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Carregar exercícios salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedExercises');
    if (saved) {
      setSavedExercises(JSON.parse(saved));
    }
  }, []);

  const daysOfWeek = [
    { value: 'MONDAY', label: 'Segunda' },
    { value: 'TUESDAY', label: 'Terça' },
    { value: 'WEDNESDAY', label: 'Quarta' },
    { value: 'THURSDAY', label: 'Quinta' },
    { value: 'FRIDAY', label: 'Sexta' },
    { value: 'SATURDAY', label: 'Sábado' },
    { value: 'SUNDAY', label: 'Domingo' },
  ];

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

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

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.daysOfWeek.length === 0) {
      setError('Selecione pelo menos um dia da semana');
      return;
    }

    if (exercises.length === 0) {
      setError('Adicione pelo menos um exercício');
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
      setError(err.response?.data?.error || 'Erro ao criar treino');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-strong max-w-4xl w-full p-6 md:p-8 my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-dark-900">Criar Novo Treino</h3>
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
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Aluno *
              </label>
              <CustomSelect
                value={formData.studentId}
                onChange={(studentId) => setFormData({ ...formData, studentId })}
                options={students.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Selecione um aluno"
                aria-label="Aluno"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-3">
                Dias da Semana * (selecione um ou mais)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                      formData.daysOfWeek.includes(day.value)
                        ? 'bg-gradient-accent text-white shadow-medium'
                        : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {formData.daysOfWeek.length === 0 && (
                <p className="text-xs text-red-500 mt-2">Selecione pelo menos um dia</p>
              )}
              {formData.daysOfWeek.length > 1 && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Este treino será replicado para {formData.daysOfWeek.length} dias
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              Nome do Treino *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder="Ex: Treino A - Peito e Tríceps"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-modern"
              rows={2}
              placeholder="Descreva o objetivo deste treino..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-display font-bold text-dark-900">
                Exercícios ({exercises.length})
              </h4>
              <div className="flex gap-2">
                {savedExercises.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowExerciseLibrary(true)}
                    className="px-4 py-2 bg-blue-50 text-blue-700 font-semibold text-sm rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Biblioteca ({savedExercises.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={addExercise}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Exercício
                </button>
              </div>
            </div>

            {exercises.length === 0 ? (
              <div className="bg-dark-50 border-2 border-dashed border-dark-200 rounded-xl p-8 text-center">
                <Dumbbell className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500">Nenhum exercício adicionado</p>
                <p className="text-sm text-dark-400 mt-1">Clique em "Adicionar Exercício" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div key={index} className="bg-dark-50 rounded-xl p-4 relative">
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveExercise(exercise)}
                        disabled={!exercise.name || !exercise.sets || !exercise.reps}
                        className="p-1.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Salvar na biblioteca"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-16">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Nome do Exercício *
                        </label>
                        <input
                          type="text"
                          required
                          value={exercise.name}
                          onChange={(e) => updateExercise(index, 'name', e.target.value)}
                          className="input-modern"
                          placeholder="Ex: Supino Reto"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Séries *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                          className="input-modern"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Repetições *
                        </label>
                        <input
                          type="text"
                          required
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          className="input-modern"
                          placeholder="Ex: 12 ou 10-12"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Descanso
                        </label>
                        <input
                          type="text"
                          value={exercise.rest}
                          onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                          className="input-modern"
                          placeholder="Ex: 60s ou 1min"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Peso
                        </label>
                        <input
                          type="text"
                          value={exercise.weight}
                          onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                          className="input-modern"
                          placeholder="Ex: 20kg"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          URL do Vídeo (YouTube)
                        </label>
                        <input
                          type="url"
                          value={exercise.videoUrl}
                          onChange={(e) => updateExercise(index, 'videoUrl', e.target.value)}
                          className="input-modern"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Foto do exercício (URL)
                        </label>
                        <input
                          type="url"
                          value={exercise.imageUrl}
                          onChange={(e) => updateExercise(index, 'imageUrl', e.target.value)}
                          className="input-modern"
                          placeholder="https://exemplo.com/imagem-exercicio.jpg"
                        />
                        <p className="text-xs text-dark-500 mt-1">Link de uma imagem para o aluno visualizar o movimento</p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Observações
                        </label>
                        <textarea
                          value={exercise.notes}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          className="input-modern"
                          rows={2}
                          placeholder="Dicas de execução..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || exercises.length === 0 || formData.daysOfWeek.length === 0}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : formData.daysOfWeek.length > 1 ? `Criar ${formData.daysOfWeek.length} Treinos` : 'Criar Treino'}
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
                Biblioteca de Exercícios
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
                    <span>{exercise.sets} séries</span>
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
                <p className="text-dark-500">Nenhum exercício salvo ainda</p>
                <p className="text-sm text-dark-400 mt-1">
                  Clique no ícone de salvar ao criar exercícios
                </p>
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
  const [formData, setFormData] = useState({
    studentId: workout.studentId,
    name: workout.name,
    dayOfWeek: workout.dayOfWeek,
    description: workout.description || '',
  });
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

  const daysOfWeek = [
    { value: 'MONDAY', label: 'Segunda' },
    { value: 'TUESDAY', label: 'Terça' },
    { value: 'WEDNESDAY', label: 'Quarta' },
    { value: 'THURSDAY', label: 'Quinta' },
    { value: 'FRIDAY', label: 'Sexta' },
    { value: 'SATURDAY', label: 'Sábado' },
    { value: 'SUNDAY', label: 'Domingo' },
  ];

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
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dayOfWeek) {
      setError('Selecione um dia da semana');
      return;
    }

    if (exercises.length === 0) {
      setError('Adicione pelo menos um exercício');
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
      setError(err.response?.data?.error || 'Erro ao atualizar treino');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-strong max-w-4xl w-full p-6 md:p-8 my-8 max-h-[85vh] overflow-y-auto animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-dark-900">Editar Treino</h3>
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
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-2">
                Aluno *
              </label>
              <CustomSelect
                value={formData.studentId}
                onChange={(studentId) => setFormData({ ...formData, studentId })}
                options={students.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Selecione um aluno"
                aria-label="Aluno"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-3">
                Dia da Semana *
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
              Nome do Treino *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder="Ex: Treino A - Peito e Tríceps"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-modern"
              rows={2}
              placeholder="Descreva o objetivo deste treino..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-display font-bold text-dark-900">
                Exercícios ({exercises.length})
              </h4>
              <button
                type="button"
                onClick={addExercise}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Exercício
              </button>
            </div>

            {exercises.length === 0 ? (
              <div className="bg-dark-50 border-2 border-dashed border-dark-200 rounded-xl p-8 text-center">
                <Dumbbell className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500">Nenhum exercício adicionado</p>
                <p className="text-sm text-dark-400 mt-1">Clique em "Adicionar Exercício" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div key={index} className="bg-dark-50 rounded-xl p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Nome do Exercício *
                        </label>
                        <input
                          type="text"
                          required
                          value={exercise.name}
                          onChange={(e) => updateExercise(index, 'name', e.target.value)}
                          className="input-modern"
                          placeholder="Ex: Supino Reto"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Séries *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                          className="input-modern"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Repetições *
                        </label>
                        <input
                          type="text"
                          required
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          className="input-modern"
                          placeholder="Ex: 12 ou 10-12"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Descanso
                        </label>
                        <input
                          type="text"
                          value={exercise.rest}
                          onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                          className="input-modern"
                          placeholder="Ex: 60s ou 1min"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Peso
                        </label>
                        <input
                          type="text"
                          value={exercise.weight}
                          onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                          className="input-modern"
                          placeholder="Ex: 20kg"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          URL do Vídeo (YouTube)
                        </label>
                        <input
                          type="url"
                          value={exercise.videoUrl}
                          onChange={(e) => updateExercise(index, 'videoUrl', e.target.value)}
                          className="input-modern"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Foto do exercício (URL)
                        </label>
                        <input
                          type="url"
                          value={exercise.imageUrl}
                          onChange={(e) => updateExercise(index, 'imageUrl', e.target.value)}
                          className="input-modern"
                          placeholder="https://exemplo.com/imagem-exercicio.jpg"
                        />
                        <p className="text-xs text-dark-500 mt-1">Link de uma imagem para o aluno visualizar o movimento</p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-dark-700 mb-2">
                          Observações
                        </label>
                        <textarea
                          value={exercise.notes}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          className="input-modern"
                          rows={2}
                          placeholder="Dicas de execução..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-dark-200 text-dark-700 font-semibold rounded-xl hover:bg-dark-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || exercises.length === 0 || !formData.dayOfWeek}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

