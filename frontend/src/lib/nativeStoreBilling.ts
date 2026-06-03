/**
 * Ponte para compras in-app no app nativo (Capacitor + plugin de billing).
 * No navegador web, retorna null — use links das lojas.
 */

import { Capacitor } from '@capacitor/core';
import { isCapacitorApp } from './capacitorApp';

export type NativePurchaseResult = {
  platform: 'ios' | 'android';
  productId: string;
  receipt?: string;
  purchaseToken?: string;
};

/** Capacitor injeta window.Capacitor no WebView remoto antes do bundle web carregar. */
function capacitorBridge() {
  if (typeof Capacitor !== 'undefined' && Capacitor?.isNativePlatform?.()) return Capacitor;
  return window.Capacitor;
}

export function isNativeApp(): boolean {
  return isCapacitorApp() || Boolean(capacitorBridge()?.isNativePlatform?.());
}

export function nativePlatform(): 'ios' | 'android' | 'web' {
  const p = capacitorBridge()?.getPlatform?.();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return 'web';
}

/** Tenta compra via plugin nativo (quando o app Capacitor expõe window.GymCodeBilling). */
export async function purchaseProNative(productId: string): Promise<NativePurchaseResult | null> {
  if (!isNativeApp() || !window.GymCodeBilling?.purchaseSubscription) {
    return null;
  }
  return window.GymCodeBilling.purchaseSubscription(productId);
}

declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    GymCodeBilling?: {
      purchaseSubscription: (productId: string) => Promise<NativePurchaseResult>;
      openManageSubscriptions?: () => Promise<boolean>;
      restorePurchases?: () => Promise<void>;
    };
  }
}

export {};
