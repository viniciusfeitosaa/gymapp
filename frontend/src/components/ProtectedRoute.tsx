import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserType } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType: UserType;
}

export default function ProtectedRoute({ children, userType }: ProtectedRouteProps) {
  const { user, userType: currentUserType, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || currentUserType !== userType) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
