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
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6E6E73] flex items-center gap-2">
        <MapPin className="w-4 h-4 shrink-0" />
        Todos os campos abaixo são opcionais.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <label className={registerLabelClass}>CEP</label>
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
          {cepLoading && <p className="text-xs text-[#86868B] mt-1">Buscando endereço...</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={registerLabelClass}>Rua / Logradouro</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            className={registerInputClass}
            placeholder="Nome da rua"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={registerLabelClass}>Número</label>
          <input
            type="text"
            name="addressNumber"
            value={formData.addressNumber}
            onChange={onChange}
            className={registerInputClass}
            placeholder="Nº"
          />
        </div>
        <div>
          <label className={registerLabelClass}>Complemento</label>
          <input
            type="text"
            name="complement"
            value={formData.complement}
            onChange={onChange}
            className={registerInputClass}
            placeholder="Apto, bloco..."
          />
        </div>
        <div>
          <label className={registerLabelClass}>Bairro</label>
          <input
            type="text"
            name="province"
            value={formData.province}
            onChange={onChange}
            className={registerInputClass}
            placeholder="Bairro"
          />
        </div>
      </div>
    </div>
  );
}
