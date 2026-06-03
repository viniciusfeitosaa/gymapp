import { isCapacitorApp } from './capacitorApp';
import type { NativePurchaseResult } from './nativeStoreBilling';

/**
 * Registra ponte de billing nativo via @capgo/native-purchases (import dinâmico).
 */
export function registerGymCodeBilling(): void {
  if (!isCapacitorApp()) return;
  if (window.GymCodeBilling) return;

  window.GymCodeBilling = {
    async purchaseSubscription(productId: string): Promise<NativePurchaseResult> {
      const { purchaseProSubscription } = await import('./storePurchase');
      await purchaseProSubscription();
      const platform = window.Capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android';
      return { platform, productId };
    },
    async openManageSubscriptions() {
      const { openNativeSubscriptionManagement } = await import('./storePurchase');
      return openNativeSubscriptionManagement();
    },
    async restorePurchases() {
      const { restoreProSubscription } = await import('./storePurchase');
      await restoreProSubscription();
    },
  };
}

export {};
