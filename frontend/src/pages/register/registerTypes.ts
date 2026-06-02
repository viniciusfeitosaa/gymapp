export type RegisterStep = 'welcome' | 'identity' | 'access' | 'address' | 'celebration';

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  cref: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  postalCode: string;
}

export const createInitialFormData = (): RegisterFormData => ({
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

/** Etapa 1–4 para barra de progresso (welcome = 0) */
export function progressIndex(step: RegisterStep): number {
  switch (step) {
    case 'welcome':
      return 0;
    case 'identity':
      return 1;
    case 'access':
      return 2;
    case 'address':
      return 3;
    case 'celebration':
      return 4;
    default:
      return 0;
  }
}
