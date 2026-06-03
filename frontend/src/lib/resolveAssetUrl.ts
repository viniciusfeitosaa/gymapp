import { resolveApiBaseUrl, DEFAULT_API_ORIGIN } from '../config/api.config';

/** URL absoluta para arquivos em /api/uploads/... */
export function resolveAssetUrl(path?: string | null): string | null {
  if (!path?.trim()) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const apiBase = resolveApiBaseUrl();
  const origin = apiBase.startsWith('http')
    ? apiBase.replace(/\/api\/?$/, '')
    : DEFAULT_API_ORIGIN;

  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
