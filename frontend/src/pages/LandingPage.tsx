import { useEffect } from 'react';

/**
 * Fallback React: em produção o Nginx serve a landing em `/`.
 * Se o usuário cair nesta rota via SPA, recarrega a raiz.
 */
export default function LandingPage() {
  useEffect(() => {
    window.location.replace('/');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="animate-spin w-10 h-10 border-2 border-accent-500 border-t-transparent rounded-full" />
    </div>
  );
}
