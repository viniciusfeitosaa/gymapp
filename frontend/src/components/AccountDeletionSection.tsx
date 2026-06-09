import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  userType: 'personal' | 'student';
  onDelete: () => void;
};

export function AccountDeletionSection({ userType, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <div className="card-modern p-5 md:p-6 border border-red-100">
      <h4 className="text-base font-display font-bold text-dark-900 mb-1">
        {t('account.deleteTitle')}
      </h4>
      <p className="text-sm text-dark-500 mb-4">
        {userType === 'personal' ? t('account.deletePersonalDesc') : t('account.deleteStudentDesc')}
      </p>
      <button
        type="button"
        onClick={onDelete}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-red-400 bg-red-50 text-red-800 text-sm font-bold hover:bg-red-100 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        {t('account.deleteButton')}
      </button>
    </div>
  );
}
