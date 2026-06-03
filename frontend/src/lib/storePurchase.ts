import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { getPurchaseErrorMessage } from './purchaseErrors';
import { verifyPurchase } from '../services/subscription.service';
import type { NativePurchaseResult } from './nativeStoreBilling';
import { isNativeApp, nativePlatform } from './nativeStoreBilling';

const PRODUCT_ID = import.meta.env.VITE_SUBSCRIPTION_PRODUCT_ID || 'gymcode_pro_monthly';
const PLAN_ID = import.meta.env.VITE_SUBSCRIPTION_PLAN_ID || 'monthly';

export async function purchaseProSubscription(): Promise<void> {
  if (!isNativeApp()) {
    throw new Error('Compras in-app disponíveis apenas no app móvel.');
  }

  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      throw new Error('Compras não suportadas neste dispositivo (iOS 15+ necessário).');
    }

    const platform = nativePlatform();
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.SUBS,
    });
    if (!products?.length) {
      throw new Error(
        `Produto "${PRODUCT_ID}" não encontrado. No Xcode: Product → Scheme → Edit Scheme → Run → Options → StoreKit Configuration = GymCode.storekit`
      );
    }

    const tx = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.SUBS,
      ...(platform === 'android' ? { planIdentifier: PLAN_ID } : {}),
    });

    const transactionId = String(tx?.transactionId ?? '').trim();
    if (!transactionId) {
      throw new Error('Compra concluída, mas a loja não retornou o ID da transação.');
    }

    const payload: NativePurchaseResult = {
      platform: platform === 'ios' ? 'ios' : 'android',
      productId: PRODUCT_ID,
      ...(platform === 'android'
        ? { purchaseToken: transactionId }
        : { receipt: transactionId }),
    };

    await verifyPurchase(payload);
  } catch (err) {
    const msg = getPurchaseErrorMessage(err);
    if (/cancel/i.test(msg)) {
      throw new Error('Compra cancelada.');
    }
    if (/cannot find product/i.test(msg)) {
      throw new Error(
        `Produto "${PRODUCT_ID}" não encontrado na App Store. Confira o ID em App Store Connect e o StoreKit Configuration no Xcode.`
      );
    }
    throw new Error(msg);
  }
}

/** URL padrão da App Store / Play para gerenciar assinaturas (não bloqueia como restorePurchases). */
export async function openNativeSubscriptionManagement(): Promise<boolean> {
  if (!isNativeApp()) return false;
  // Sempre delegar à URL da loja via SubscriptionPanel + openExternalUrl (evita hang no restorePurchases).
  return false;
}

export async function restoreProSubscription(): Promise<void> {
  if (!isNativeApp()) return;

  const { customerInfo } = await NativePurchases.restorePurchases();
  const active = customerInfo.activeSubscriptions?.[0];
  if (!active) {
    throw new Error('Nenhuma assinatura ativa encontrada para restaurar.');
  }

  const platform = Capacitor.getPlatform();
  await verifyPurchase({
    platform: platform === 'ios' ? 'ios' : 'android',
    productId: active,
    ...(platform === 'android'
      ? { purchaseToken: customerInfo.originalAppUserId }
      : { receipt: active }),
  });
}
