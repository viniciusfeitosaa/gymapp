/** Callback registrado pelo AuthProvider para logout centralizado (ex.: 401). */
import { parseStoredJson } from './storageJson';

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}

export function readStoredSession(): { user: unknown; userType: string | null; token: string | null } {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  const user = parseStoredJson(localStorage.getItem('user'));
  return { user, userType, token };
}
