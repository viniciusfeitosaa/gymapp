import { useTranslation } from 'react-i18next';
import { CheckCircle2, Sparkles } from 'lucide-react';

type Props = {
  name: string;
};

export default function CelebrationStep({ name }: Props) {
  const { t } = useTranslation();
  const firstName = name.trim().split(/\s+/)[0] || t('register.defaultTrainerName');

  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-500/10 rounded-full mb-6">
        <CheckCircle2 className="w-10 h-10 text-accent-600" strokeWidth={2} />
      </div>
      <p className="text-sm font-medium text-[#6E6E73] flex items-center justify-center gap-1.5 mb-2">
        <Sparkles className="w-4 h-4 text-accent-500" />
        {t('register.accountCreated')}
      </p>
      <p className="text-lg text-[#1D1D1F] font-medium leading-relaxed max-w-sm mx-auto">
        {t('register.journeyStarts', { name: firstName })}
      </p>
    </div>
  );
}
