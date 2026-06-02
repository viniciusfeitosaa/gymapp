import { User, Mail } from 'lucide-react';
import type { RegisterFormData } from '../registerTypes';

import { registerInputWithIconClass, registerLabelClass } from '../registerStyles';

type Props = {
  formData: RegisterFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function IdentityStep({ formData, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className={registerLabelClass}>Nome completo</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            className={registerInputWithIconClass}
            placeholder="Seu nome completo"
            autoComplete="name"
            required
          />
        </div>
      </div>
      <div>
        <label className={registerLabelClass}>E-mail</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            className={registerInputWithIconClass}
            placeholder="seu@email.com"
            autoComplete="email"
            required
          />
        </div>
      </div>
    </div>
  );
}
