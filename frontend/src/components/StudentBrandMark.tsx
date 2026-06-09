import { GymCodeIcon } from './GymCodeIcon';
import { formatPersonalBrandName } from '../lib/formatPersonalBrandName';
import { resolveAssetUrl } from '../lib/resolveAssetUrl';

export type StudentBrandPersonal = {
  name: string;
  logoUrl?: string | null;
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
};

type Props = {
  personal?: StudentBrandPersonal | null;
  subtitle?: string;
  iconSize?: 'sm' | 'md' | 'header';
  titleClassName?: string;
  className?: string;
};

const iconSizes = {
  sm: {
    box: 'w-10 h-10',
    img: 'p-1.5',
    letter: 'text-lg',
    gym: 24,
    gap: 'gap-3',
    round: false,
    vertical: false,
  },
  md: {
    box: 'w-12 h-12',
    img: 'p-2',
    letter: 'text-xl',
    gym: 28,
    gap: 'gap-3',
    round: false,
    vertical: false,
  },
  header: {
    box: 'w-16 h-16 sm:w-[4.25rem] sm:h-[4.25rem] md:w-20 md:h-20',
    img: 'p-2 sm:p-2.5',
    letter: 'text-2xl sm:text-3xl',
    gym: 36,
    gap: 'gap-2 sm:gap-2.5',
    round: true,
    vertical: true,
  },
} as const;

/** Marca exibida ao aluno: logo e nome do personal (white-label). */
export function StudentBrandMark({
  personal,
  subtitle = 'Meus Treinos',
  iconSize = 'sm',
  titleClassName,
  className = '',
}: Props) {
  const sizes = iconSizes[iconSize];
  const logoSrc = resolveAssetUrl(personal?.logoUrl);
  const rawName = personal?.name?.trim() || '';
  const brandName = rawName ? formatPersonalBrandName(rawName) : 'Meu Personal';
  const shape = sizes.round ? 'rounded-full' : 'rounded-xl';
  const defaultTitle =
    iconSize === 'header'
      ? 'text-sm sm:text-base md:text-lg font-display font-bold text-dark-900 leading-snug text-center max-w-[16rem] sm:max-w-xs'
      : 'text-xl font-display font-bold text-dark-900';

  const layout = sizes.vertical
    ? `flex-col items-center text-center ${sizes.gap}`
    : `flex-row items-center ${sizes.gap}`;

  const avatar = logoSrc ? (
    <div
      className={`${sizes.box} shrink-0 ${shape} border-2 border-white bg-white flex items-center justify-center overflow-hidden shadow-medium ring-1 ring-dark-100/80`}
    >
      <img src={logoSrc} alt="" className={`w-full h-full object-contain ${sizes.img}`} />
    </div>
  ) : rawName ? (
    <div
      className={`${sizes.box} shrink-0 student-brand-avatar ${shape} flex items-center justify-center text-white font-bold shadow-medium ${sizes.letter}`}
    >
      {rawName.charAt(0).toUpperCase()}
    </div>
  ) : (
    <div
      className={`${sizes.box} shrink-0 bg-gradient-accent ${shape} flex items-center justify-center shadow-medium`}
    >
      <GymCodeIcon size={sizes.gym} className="text-white" />
    </div>
  );

  return (
    <div className={`flex min-w-0 ${layout} ${className}`}>
      {avatar}
      <div className={`min-w-0 ${sizes.vertical ? 'w-full flex flex-col items-center' : ''}`}>
        <h1 className={`${titleClassName ?? defaultTitle}`}>{brandName}</h1>
        {subtitle ? (
          <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
