import { isCapacitorApp } from '../lib/capacitorApp';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardPathForUserType } from '../lib/authRedirect';
import LandingPage from '../pages/LandingPage';

/** Na web, `/` é a landing estática (nginx). No app nativo, vai direto ao login ou dashboard se já autenticado. */
export function HomeRoute() {
  const { isAuthenticated, userType, loading } = useAuth();

  if (isCapacitorApp()) {
    if (loading) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      );
    }

    if (isAuthenticated && userType) {
      return <Navigate to={dashboardPathForUserType(userType)} replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <LandingPage />;
}
