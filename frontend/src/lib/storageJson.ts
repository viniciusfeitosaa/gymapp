/** Parse seguro de JSON vindo do localStorage (evita crash com "undefined"). */
export function parseStoredJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userType');
}
