import { Lock, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  personalPhone?: string;
};

export function StudentTrainingBlocked({ personalPhone }: Props) {
  const { t } = useTranslation();

  const whatsappUrl = personalPhone
    ? (() => {
        const digits = personalPhone.replace(/\D/g, '');
        if (digits.length < 10) return null;
        const number = digits.length <= 11 ? `55${digits}` : digits;
        const text = encodeURIComponent(t('blocked.whatsappMessage'));
        return `https://wa.me/${number}?text=${text}`;
      })()
    : null;

  return (
    <div className="pb-20 md:pb-0">
      <div className="card-modern p-6 md:p-8 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl md:text-2xl font-display font-bold text-dark-900 mb-2">
          {t('blocked.title')}
        </h2>
        <p className="text-dark-500 text-sm md:text-base mb-2">{t('blocked.message1')}</p>
        <p className="text-dark-500 text-sm md:text-base mb-6">{t('blocked.message2')}</p>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {t('blocked.regularize')}
          </a>
        )}
      </div>
    </div>
  );
}
