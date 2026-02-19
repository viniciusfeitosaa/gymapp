import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { User, Mail, Lock, Phone, FileText, CheckCircle2, MapPin, ChevronRight } from 'lucide-react';
import { GymCodeIcon } from '../components/GymCodeIcon';

const formatCep = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

const fetchAddressByCep = async (cep: string): Promise<{ logradouro?: string; bairro?: string } | null> => {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return { logradouro: data.logradouro || '', bairro: data.bairro || '' };
  } catch {
    return null;
  }
};

export default function RegisterPage() {
  const [step, setStep] = useState<0 | 1>(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cref: '',
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    postalCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const navigate = useNavigate();

  const handleCepBlur = async () => {
    const digits = formData.postalCode.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await fetchAddressByCep(digits);
      if (data) {
        setFormData((prev) => ({
          ...prev,
          address: data.logradouro ?? prev.address,
          province: data.bairro ?? prev.province,
        }));
      }
    } finally {
      setCepLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/personal/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        cref: formData.cref || undefined,
        address: formData.address.trim() || undefined,
        addressNumber: formData.addressNumber.trim() || undefined,
        complement: formData.complement.trim() || undefined,
        province: formData.province.trim() || undefined,
        postalCode: formData.postalCode.replace(/\D/g, '') || undefined,
      });

      alert('Cadastro realizado com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative">
        <div className="glass-effect rounded-3xl shadow-strong p-10 border border-white/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-accent rounded-2xl mb-5 shadow-medium">
              <GymCodeIcon size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Cadastro Personal</h1>
            <p className="text-slate-300">{step === 0 ? 'Crie sua conta no Gym Code' : 'Seu endereço (para futuras cobranças)'}</p>
          </div>

        <form onSubmit={step === 0 ? handleStep1 : handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-2">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                placeholder="Seu nome completo"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark-200 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Confirmar *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-200 mb-2">
                CREF
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  name="cref"
                  value={formData.cref}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                  placeholder="000000-G/UF"
                />
              </div>
            </div>
          </div>

          {step === 1 && (
            <>
              <div className="border-t border-dark-600/50 pt-5 mt-2">
                <p className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-semibold text-dark-200 mb-2">CEP</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formatCep(formData.postalCode)}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, '') })}
                        onBlur={handleCepBlur}
                        className="w-full px-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      {cepLoading && <p className="text-xs text-slate-400 mt-1">Buscando endereço...</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-dark-200 mb-2">Rua / Logradouro</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                        placeholder="Nome da rua"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-dark-200 mb-2">Número</label>
                      <input
                        type="text"
                        name="addressNumber"
                        value={formData.addressNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                        placeholder="Nº"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-200 mb-2">Complemento</label>
                      <input
                        type="text"
                        name="complement"
                        value={formData.complement}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                        placeholder="Apto, bloco..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-200 mb-2">Bairro</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-dark-800/50 border-2 border-dark-700 rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/20 outline-none transition-all text-white placeholder:text-slate-500"
                        placeholder="Bairro"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Voltar
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Cadastrando...
              </span>
            ) : step === 0 ? (
              <span className="flex items-center justify-center gap-2">
                Continuar
                <ChevronRight className="w-5 h-5" />
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Criar Conta
              </span>
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-slate-300">
              Já tem cadastro?{' '}
              <Link to="/login" className="text-accent-400 hover:text-accent-300 font-semibold transition-colors">
                Faça login
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
