import type { RegisterFormData } from './registerTypes';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateIdentity(data: RegisterFormData): string | null {
  if (!data.name.trim()) return 'Informe seu nome completo.';
  if (!data.email.trim()) return 'Informe seu e-mail.';
  if (!EMAIL_RE.test(data.email.trim())) return 'E-mail inválido.';
  return null;
}

export function validateAccess(data: RegisterFormData): string | null {
  if (data.password.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
  if (data.password !== data.confirmPassword) return 'As senhas não coincidem.';
  return null;
}
