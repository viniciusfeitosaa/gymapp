import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import type { RegisterFormData } from '../registerTypes';
import { formatCep } from '../registerCep';
import { registerInputClass, registerLabelClass } from '../registerStyles';

type Props = {
  formData: RegisterFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPostalCodeChange: (digits: string) => void;
  onCepBlur: () => void;
  cepLoading: boolean;
};

export default function AddressStep({
  formData,
  onChange,
  onPostalCodeChange,
  onCepBlur,
  cepLoading,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6E6E73] flex items-center gap-2">
        <MapPin className="w-4 h-4 shrink-0" />
        {t('register.addressOptionalHint')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <label className={registerLabelClass}>{t('register.postalCode')}</label>
          <input
            type="text"
            name="postalCode"
            value={formatCep(formData.postalCode)}
            onChange={(e) => onPostalCodeChange(e.target.value.replace(/\D/g, ''))}
            onBlur={onCepBlur}
            className={registerInputClass}
            placeholder="00000-000"
            maxLength={9}
          />
          {cepLoading && (
            <p className="text-xs text-[#86868B] mt-1">{t('register.searchingAddress')}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className={registerLabelClass}>{t('register.street')}</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            className={registerInputClass}
            placeholder={t('register.streetPlaceholder')}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={registerLabelClass}>{t('register.number')}</label>
          <input
            type="text"
            name="addressNumber"
            value={formData.addressNumber}
            onChange={onChange}
            className={registerInputClass}
            placeholder={t('register.numberPlaceholder')}
          />
        </div>
        <div>
          <label className={registerLabelClass}>{t('register.complement')}</label>
          <input
            type="text"
            name="complement"
            value={formData.complement}
            onChange={onChange}
            className={registerInputClass}
            placeholder={t('register.complementPlaceholder')}
          />
        </div>
        <div>
          <label className={registerLabelClass}>{t('register.district')}</label>
          <input
            type="text"
            name="province"
            value={formData.province}
            onChange={onChange}
            className={registerInputClass}
            placeholder={t('register.districtPlaceholder')}
          />
        </div>
      </div>
    </div>
  );
}
