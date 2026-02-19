import { useEffect } from 'react';

/**
 * Redireciona para a landing estática em tela cheia.
 * Evita iframe para não conflitar com X-Frame-Options (ex.: Cloudflare) que bloqueia exibição em frame.
 */
export default function LandingPage() {
  useEffect(() => {
    window.location.replace('/landing/index.html');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="animate-spin w-10 h-10 border-2 border-accent-500 border-t-transparent rounded-full" />
    </div>
  );
}
