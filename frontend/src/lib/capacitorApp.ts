import { Capacitor } from '@capacitor/core';

/** Detecta app nativo Capacitor (inclui quando o bridge ainda não injetou). */
export function isCapacitorApp(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  const { protocol, hostname } = window.location;
  return protocol === 'capacitor:' || protocol === 'ionic:' || hostname === 'localhost';
}
