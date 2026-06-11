import axios from 'axios';
import { notifyUnauthorized } from '../lib/authSession';
import { isCapacitorApp } from '../lib/capacitorApp';
import { resolveApiBaseUrl } from '../config/api.config';
import {
  ApiError,
  isApiError,
  nativeHttp,
  type ApiRequestConfig,
  type ApiResponse,
} from './nativeHttp';

export { ApiError, isApiError, type ApiRequestConfig, type ApiResponse };

/** Cliente web (axios) — só usado fora do Capacitor. */
const webAxios = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

webAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

webAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginAttempt = error.config?.url?.includes('login');
    const data = error.response?.data;
    if (shouldForceLogout(error.response?.status ?? 0, error.config?.url ?? '', data) && !isLoginAttempt) {
      notifyUnauthorized();
    }
    return Promise.reject(error);
  }
);

async function webRequest<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  body?: unknown,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await webAxios.request<T>({
      method,
      url: path,
      data: body ?? config?.data,
      params: config?.params,
      validateStatus: config?.validateStatus,
    });
    return { data: response.data, status: response.status };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw new ApiError(
        (err.response.data as { error?: string })?.error || err.message,
        err.response.status,
        err.response.data,
        path
      );
    }
    throw err;
  }
}

function shouldForceLogout(status: number, path: string, data: unknown): boolean {
  if (path.includes('login')) return false;
  if (status === 401) return true;
  if (status === 403 && data && typeof data === 'object' && 'error' in data) {
    return (data as { error?: string }).error === 'Token inválido';
  }
  return false;
}

function useNativeHttp(): boolean {
  return isCapacitorApp();
}

/**
 * Cliente HTTP unificado.
 * - Web: axios (mesma origem / CORS ok)
 * - App Capacitor: CapacitorHttp com URL absoluta https://mygymcode.com/api/...
 */
export const api = {
  get: <T = any>(path: string, config?: ApiRequestConfig) =>
    useNativeHttp()
      ? nativeHttp.get<T>(path, config)
      : webRequest<T>('get', path, undefined, config),

  post: <T = any>(path: string, body?: unknown, config?: ApiRequestConfig) =>
    useNativeHttp()
      ? nativeHttp.post<T>(path, body, config)
      : webRequest<T>('post', path, body, config),

  put: <T = any>(path: string, body?: unknown, config?: ApiRequestConfig) =>
    useNativeHttp()
      ? nativeHttp.put<T>(path, body, config)
      : webRequest<T>('put', path, body, config),

  patch: <T = any>(path: string, body?: unknown, config?: ApiRequestConfig) =>
    useNativeHttp()
      ? nativeHttp.patch<T>(path, body, config)
      : webRequest<T>('patch', path, body, config),

  delete: <T = any>(path: string, config?: ApiRequestConfig) =>
    useNativeHttp()
      ? nativeHttp.delete<T>(path, config)
      : webRequest<T>('delete', path, undefined, config),
};
