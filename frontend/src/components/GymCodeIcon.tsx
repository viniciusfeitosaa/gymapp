/**
 * Ícone personalizado do Gym Code: um haltere (barra com anilhas).
 */
interface GymCodeIconProps {
  className?: string;
  size?: number;
}

export function GymCodeIcon({ className = '', size = 24 }: GymCodeIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Barra */}
      <line x1="6" y1="12" x2="18" y2="12" />
      {/* Anilhas */}
      <circle cx="6" cy="12" r="2.5" fill="currentColor" />
      <circle cx="18" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}
