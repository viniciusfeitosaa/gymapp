/** Origem da API em produção (app Capacitor sempre precisa de URL absoluta). */
export const DEFAULT_API_ORIGIN = 'https://mygymcode.com';

export function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';

  if (trimmed) {
    return `${trimmed.replace(/\/$/, '')}/api`;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api';
  }

  return '/api';
}

/** Base URL absoluta obrigatória para CapacitorHttp (iOS rejeita `/api/...`). */
export function resolveNativeApiBaseUrl(): string {
  const base = resolveApiBaseUrl();
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return base;
  }
  return `${DEFAULT_API_ORIGIN}/api`;
}
