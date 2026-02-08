import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Users, Dumbbell, MessageSquare, TrendingUp, BarChart3, Plus } from 'lucide-react';

export default function PersonalDashboard() {
  const { user, logout } = useAuth();

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
                  GymConnect
                </h1>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">Painel do Personal Trainer</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right hidden md:block">
                <p className="text-xs md:text-sm font-semibold text-dark-900">{user?.name}</p>
                <p className="text-[10px] md:text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-accent rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base">
                {user?.name?.charAt(0)}
              </div>
              <button
                onClick={logout}
                className="p-1.5 md:p-2.5 text-dark-600 hover:text-red-600 hover:bg-red-50 rounded-lg md:rounded-xl transition-all duration-200"
                title="Sair"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <Routes>
          <Route path="dashboard" element={<DashboardHome />} />
        </Routes>
      </main>
    </div>
  );
}

function DashboardHome() {
  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-display font-bold text-dark-900 mb-1 md:mb-2">
          Dashboard
        </h2>
        <p className="text-dark-500 text-sm md:text-lg">Gerencie seus alunos e treinos de forma profissional</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <StatCard
          icon={<Users className="w-4 h-4 md:w-6 md:h-6" />}
          title="Total de Alunos"
          value="0"
          subtitle="ativos"
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<Dumbbell className="w-4 h-4 md:w-6 md:h-6" />}
          title="Treinos Criados"
          value="0"
          subtitle="fichas"
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          icon={<MessageSquare className="w-4 h-4 md:w-6 md:h-6" />}
          title="Mensagens"
          value="0"
          subtitle="não lidas"
          gradient="from-purple-500 to-purple-600"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 md:w-6 md:h-6" />}
          title="Progresso"
          value="0"
          subtitle="registros"
          gradient="from-orange-500 to-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <QuickActionCard
          icon={<Plus className="w-5 h-5 md:w-6 md:h-6" />}
          title="Novo Aluno"
          description="Cadastre um novo aluno"
          gradient="from-accent-500 to-accent-600"
        />
        <QuickActionCard
          icon={<Dumbbell className="w-5 h-5 md:w-6 md:h-6" />}
          title="Criar Treino"
          description="Monte uma nova ficha"
          gradient="from-blue-500 to-blue-600"
        />
        <QuickActionCard
          icon={<BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
          title="Ver Relatórios"
          description="Análises e estatísticas"
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Empty State */}
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
        <button className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          Adicionar Primeiro Aluno
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, gradient }: any) {
  return (
    <div className="card-modern p-3 md:p-6 group hover:scale-105 transition-transform duration-300">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div>
          <p className="text-[10px] md:text-sm text-dark-500 font-medium mb-0.5 md:mb-1">{title}</p>
          <p className="text-2xl md:text-4xl font-display font-bold text-dark-900">{value}</p>
          <p className="text-[10px] md:text-xs text-dark-400 mt-0.5 md:mt-1">{subtitle}</p>
        </div>
        <div className={`bg-gradient-to-br ${gradient} text-white p-2 md:p-3 rounded-lg md:rounded-xl shadow-medium group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <div className="h-0.5 md:h-1 bg-gradient-to-r from-dark-100 to-transparent rounded-full"></div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, gradient }: any) {
  return (
    <button className="card-modern p-4 md:p-6 text-left group hover:scale-105 transition-all duration-300 w-full">
      <div className={`bg-gradient-to-br ${gradient} text-white p-2.5 md:p-3.5 rounded-lg md:rounded-xl inline-flex mb-3 md:mb-4 shadow-medium group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-sm md:text-lg font-display font-bold text-dark-900 mb-1 md:mb-2">{title}</h3>
      <p className="text-xs md:text-sm text-dark-500">{description}</p>
    </button>
  );
}
