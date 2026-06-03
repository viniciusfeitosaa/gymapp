import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/** Abre URL externa (App Store, assinaturas, etc.) no app nativo ou no navegador. */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url?.trim()) return;

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: url.trim() });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
