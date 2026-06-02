import { Lock, Phone, FileText } from 'lucide-react';
import type { RegisterFormData } from '../registerTypes';

const inputClass =
  'w-full pl-11 pr-4 py-3.5 bg-white border border-[#D2D2D7] rounded-xl text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15 outline-none transition-all text-base';

type Props = {
  formData: RegisterFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function AccessStep({ formData, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              className={inputClass}
              placeholder="••••••"
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">Confirmar senha</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={onChange}
              className={inputClass}
              placeholder="••••••"
              autoComplete="new-password"
              required
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">
            Telefone <span className="font-normal text-[#86868B]">(opcional)</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              className={inputClass}
              placeholder="(00) 00000-0000"
              autoComplete="tel"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">
            CREF <span className="font-normal text-[#86868B]">(opcional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input
              type="text"
              name="cref"
              value={formData.cref}
              onChange={onChange}
              className={inputClass}
              placeholder="000000-G/UF"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
