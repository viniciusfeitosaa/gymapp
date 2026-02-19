/**
 * Exibe a landing page estática (em public/landing/) na rota /.
 * Sem necessidade de DNS ou servidor separado.
 */
export default function LandingPage() {
  return (
    <iframe
      src="/landing/index.html"
      title="Gym Code - Página inicial"
      className="fixed inset-0 w-full h-full border-0 block"
      style={{ display: 'block' }}
    />
  );
}
