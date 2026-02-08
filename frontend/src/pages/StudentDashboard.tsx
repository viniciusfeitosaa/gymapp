import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Dumbbell, Calendar, TrendingUp, MessageSquare, Activity, Clock } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-soft border-b border-dark-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-medium">
                <Dumbbell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-accent bg-clip-text text-transparent">
                  GymConnect
                </h1>
                <p className="text-xs text-slate-500 font-medium">Meus Treinos</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-dark-900">{user?.name}</p>
                <p className="text-xs text-dark-400">Aluno</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)}
              </div>
              <button
                onClick={logout}
                className="p-2.5 text-dark-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
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
        <Routes>
          <Route path="dashboard" element={<StudentDashboardHome />} />
        </Routes>
      </main>
    </div>
  );
}

function StudentDashboardHome() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-display font-bold text-dark-900 mb-2">
          Meu Dashboard
        </h2>
        <p className="text-dark-500 text-lg">Acompanhe seu progresso e evolução</p>
      </div>

      {/* Today's Info */}
      <div className="card-modern p-6 mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-display font-bold text-dark-900">Hoje</h3>
        </div>
        <p className="text-3xl font-display font-bold text-dark-900 mb-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <p className="text-dark-600">Pronto para treinar?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <QuickActionCard
          icon={<Calendar className="w-6 h-6" />}
          title="Treino de Hoje"
          description="Veja seu treino do dia"
          gradient="from-blue-500 to-blue-600"
        />
        <QuickActionCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Minha Evolução"
          description="Acompanhe seu progresso"
          gradient="from-green-500 to-green-600"
        />
        <QuickActionCard
          icon={<MessageSquare className="w-6 h-6" />}
          title="Mensagens"
          description="Fale com seu Personal"
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Empty State */}
      <div className="card-modern p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Activity className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-2xl font-display font-bold text-dark-900 mb-3">
          Nenhum Treino para Hoje
        </h3>
        <p className="text-dark-500 text-lg mb-6 max-w-md mx-auto">
          Aproveite seu dia de descanso ou aguarde seu Personal criar novos treinos!
        </p>
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-dark-100 text-dark-600 rounded-xl font-semibold">
          <Calendar className="w-5 h-5" />
          Ver Próximos Treinos
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, gradient }: any) {
  return (
    <button className="card-modern p-6 text-left group hover:scale-105 transition-all duration-300 w-full">
      <div className={`bg-gradient-to-br ${gradient} text-white p-3.5 rounded-xl inline-flex mb-4 shadow-medium group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-lg font-display font-bold text-dark-900 mb-2">{title}</h3>
      <p className="text-sm text-dark-500">{description}</p>
    </button>
  );
}
