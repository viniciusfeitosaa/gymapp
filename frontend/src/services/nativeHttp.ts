import { CapacitorHttp } from '@capacitor/core';
import { notifyUnauthorized } from '../lib/authSession';
import { resolveNativeApiBaseUrl } from '../config/api.config';

export type ApiResponse<T = unknown> = {
  data: T;
  status: number;
};

export type ApiRequestConfig = {
  params?: Record<string, string | number | boolean | undefined | null>;
  data?: unknown;
  validateStatus?: (status: number) => boolean;
};

/** Erro compatível com o formato axios (`error.response.status/data`). */
export class ApiError extends Error {
  readonly response: { status: number; data: unknown };
  readonly config: { url: string };

  constructor(message: string, status: number, data: unknown, url: string) {
    super(message);
    this.name = 'ApiError';
    this.response = { status, data };
    this.config = { url };
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

function parseBody(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data) {
    const msg = (data as { error?: unknown }).error;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

/** Monta URL absoluta https://... para o CapacitorHttp. */
export function buildNativeApiUrl(path: string, params?: ApiRequestConfig['params']): string {
  const base = resolveNativeApiBaseUrl().replace(/\/$/, '');
  const pathPart = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${pathPart}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function nativeRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  const url = buildNativeApiUrl(path, config?.params);

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new ApiError(
      `URL da API inválida no app: ${url}. Rebuild com VITE_API_URL=https://mygymcode.com`,
      0,
      null,
      path
    );
  }

  const validateStatus = config?.validateStatus ?? ((s) => s >= 200 && s < 300);
  const payload = body !== undefined ? body : config?.data;

  let res;
  try {
    res = await CapacitorHttp.request({
      url,
      method: method.toUpperCase(),
      headers: authHeaders(),
      data: payload,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha de rede';
    throw new ApiError(
      msg.toLowerCase().includes('unsupported url')
        ? 'URL da API inválida. Atualize o app ou contate o suporte.'
        : msg.includes('network') || msg.includes('Network')
          ? 'Sem conexão com o servidor. Verifique sua internet.'
          : `Não foi possível conectar: ${msg}`,
      0,
      null,
      path
    );
  }

  const status = res.status;
  const data = parseBody(res.data) as T;

  if (status === 401 && !path.includes('login')) {
    notifyUnauthorized();
  }

  if (!validateStatus(status)) {
    throw new ApiError(errorMessage(data, `Erro HTTP ${status}`), status, data, path);
  }

  return { data, status };
}

export const nativeHttp = {
  get: <T = any>(path: string, config?: ApiRequestConfig) => nativeRequest<T>('GET', path, undefined, config),
  post: <T = any>(path: string, body?: unknown, config?: ApiRequestConfig) =>
    nativeRequest<T>('POST', path, body, config),
  put: <T = any>(path: string, body?: unknown, config?: ApiRequestConfig) =>
    nativeRequest<T>('PUT', path, body, config),
  patch: <T = any>(path: string, body?: unknown, config?: ApiRequestConfig) =>
    nativeRequest<T>('PATCH', path, body, config),
  delete: <T = any>(path: string, config?: ApiRequestConfig) =>
    nativeRequest<T>('DELETE', path, undefined, config),
};
