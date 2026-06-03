import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isCapacitorApp } from '../lib/capacitorApp';

/**
 * Fallback React: em produção web o Nginx serve a landing estática em `/`.
 * No app Capacitor, HomeRoute redireciona ao login.
 */
export default function LandingPage() {
  useEffect(() => {
    if (isCapacitorApp()) return;
    window.location.replace('/');
  }, []);

  if (isCapacitorApp()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="animate-spin w-10 h-10 border-2 border-accent-500 border-t-transparent rounded-full" />
    </div>
  );
}
