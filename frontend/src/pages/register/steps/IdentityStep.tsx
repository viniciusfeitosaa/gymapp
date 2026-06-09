import { useTranslation } from 'react-i18next';
import { User, Mail } from 'lucide-react';
import type { RegisterFormData } from '../registerTypes';
import { registerInputWithIconClass, registerLabelClass } from '../registerStyles';

type Props = {
  formData: RegisterFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function IdentityStep({ formData, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div>
        <label className={registerLabelClass}>{t('register.fullName')}</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            className={registerInputWithIconClass}
            placeholder={t('register.fullNamePlaceholder')}
            autoComplete="name"
            required
          />
        </div>
      </div>
      <div>
        <label className={registerLabelClass}>{t('login.email')}</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            className={registerInputWithIconClass}
            placeholder={t('login.emailPlaceholder')}
            autoComplete="email"
            required
          />
        </div>
      </div>
    </div>
  );
}
