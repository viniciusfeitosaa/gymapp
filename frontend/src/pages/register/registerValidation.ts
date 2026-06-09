import i18n from '../../i18n';
import type { RegisterFormData } from './registerTypes';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateIdentity(data: RegisterFormData): string | null {
  if (!data.name.trim()) return i18n.t('register.validation.nameRequired');
  if (!data.email.trim()) return i18n.t('register.validation.emailRequired');
  if (!EMAIL_RE.test(data.email.trim())) return i18n.t('register.validation.emailInvalid');
  return null;
}

export function validateAccess(data: RegisterFormData): string | null {
  if (data.password.length < 6) return i18n.t('register.validation.passwordMin');
  if (data.password !== data.confirmPassword) return i18n.t('register.validation.passwordMismatch');
  return null;
}
