import { MapPin } from 'lucide-react';
import type { RegisterFormData } from '../registerTypes';
import { formatCep } from '../registerCep';

const inputClass =
  'w-full px-4 py-3.5 bg-white border border-[#D2D2D7] rounded-xl text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15 outline-none transition-all text-base';

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
          <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">CEP</label>
          <input
            type="text"
            name="postalCode"
            value={formatCep(formData.postalCode)}
            onChange={(e) => onPostalCodeChange(e.target.value.replace(/\D/g, ''))}
            onBlur={onCepBlur}
            className={inputClass}
            placeholder="00000-000"
            maxLength={9}
          />
          {cepLoading && <p className="text-xs text-[#86868B] mt-1">Buscando endereço...</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">Rua / Logradouro</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            className={inputClass}
            placeholder="Nome da rua"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">Número</label>
          <input
            type="text"
            name="addressNumber"
            value={formData.addressNumber}
            onChange={onChange}
            className={inputClass}
            placeholder="Nº"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">Complemento</label>
          <input
            type="text"
            name="complement"
            value={formData.complement}
            onChange={onChange}
            className={inputClass}
            placeholder="Apto, bloco..."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">Bairro</label>
          <input
            type="text"
            name="province"
            value={formData.province}
            onChange={onChange}
            className={inputClass}
            placeholder="Bairro"
          />
        </div>
      </div>
    </div>
  );
}
