import { User, Mail } from 'lucide-react';
import type { RegisterFormData } from '../registerTypes';

const inputClass =
  'w-full pl-11 pr-4 py-3.5 bg-white border border-[#D2D2D7] rounded-xl text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15 outline-none transition-all text-base';

type Props = {
  formData: RegisterFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function IdentityStep({ formData, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">Nome completo</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            className={inputClass}
            placeholder="Seu nome completo"
            autoComplete="name"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">E-mail</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            className={inputClass}
            placeholder="seu@email.com"
            autoComplete="email"
            required
          />
        </div>
      </div>
    </div>
  );
}
