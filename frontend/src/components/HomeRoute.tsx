import { isCapacitorApp } from '../lib/capacitorApp';
import { Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

/** Na web, `/` é a landing estática (nginx). No app nativo, vai direto ao login. */
export function HomeRoute() {
  if (isCapacitorApp()) {
    return <Navigate to="/login" replace />;
  }
  return <LandingPage />;
}
