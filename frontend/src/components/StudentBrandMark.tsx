import { GymCodeIcon } from './GymCodeIcon';
import { resolveAssetUrl } from '../lib/resolveAssetUrl';

export type StudentBrandPersonal = {
  name: string;
  logoUrl?: string | null;
};

type Props = {
  personal?: StudentBrandPersonal | null;
  subtitle?: string;
  iconSize?: 'sm' | 'md';
  titleClassName?: string;
};

const iconSizes = {
  sm: { box: 'w-10 h-10', img: 'p-1.5', letter: 'text-lg', gym: 24 },
  md: { box: 'w-12 h-12', img: 'p-2', letter: 'text-xl', gym: 28 },
} as const;

/** Marca exibida ao aluno: logo e nome do personal (white-label). */
export function StudentBrandMark({
  personal,
  subtitle = 'Meus Treinos',
  iconSize = 'sm',
  titleClassName = 'text-xl font-display font-bold text-dark-900',
}: Props) {
  const sizes = iconSizes[iconSize];
  const logoSrc = resolveAssetUrl(personal?.logoUrl);
  const brandName = personal?.name?.trim() || 'Meu Personal';

  return (
    <div className="flex items-center gap-3 min-w-0">
      {logoSrc ? (
        <div
          className={`${sizes.box} shrink-0 rounded-xl border border-dark-100 bg-white flex items-center justify-center overflow-hidden shadow-medium`}
        >
          <img src={logoSrc} alt="" className={`w-full h-full object-contain ${sizes.img}`} />
        </div>
      ) : personal?.name ? (
        <div
          className={`${sizes.box} shrink-0 bg-gradient-accent rounded-xl flex items-center justify-center text-white font-bold shadow-medium ${sizes.letter}`}
        >
          {brandName.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div
          className={`${sizes.box} shrink-0 bg-gradient-accent rounded-lg flex items-center justify-center shadow-medium`}
        >
          <GymCodeIcon size={sizes.gym} className="text-white" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className={`${titleClassName} truncate`}>{brandName}</h1>
        {subtitle ? (
          <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
