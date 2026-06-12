import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { getPurchaseErrorMessage } from './purchaseErrors';
import { verifyPurchase } from '../services/subscription.service';
import type { NativePurchaseResult } from './nativeStoreBilling';
import { isNativeApp, nativePlatform } from './nativeStoreBilling';

const PRODUCT_ID = import.meta.env.VITE_SUBSCRIPTION_PRODUCT_ID || 'gymcode_pro_monthly';
const PLAN_ID = import.meta.env.VITE_SUBSCRIPTION_PLAN_ID || 'monthly';

type PurchasePluginResult = {
  transactionId?: string | number;
  originalTransactionId?: string | number;
  receipt?: string;
};

function normalizeTransactionId(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (Number.isSafeInteger(raw)) return String(raw);
    return raw.toFixed(0);
  }
  return '';
}

async function verifyPurchaseWithRetry(payload: NativePurchaseResult, attempts = 3): Promise<void> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await verifyPurchase(payload);
      return;
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => window.setTimeout(r, 800 * (i + 1)));
      }
    }
  }
  throw lastError;
}

async function assertBillingSupported(): Promise<void> {
  const platform = nativePlatform();
  try {
    const result = await NativePurchases.isBillingSupported();
    if (result?.isBillingSupported === false) {
      throw new Error(
        platform === 'ios'
          ? 'Compras não suportadas neste dispositivo (iOS 15+ necessário).'
          : 'Compras não suportadas neste dispositivo.'
      );
    }
  } catch (err) {
    const msg = getPurchaseErrorMessage(err);
    if (platform === 'android' && /not implemented/i.test(msg)) {
      return;
    }
    throw err instanceof Error ? err : new Error(msg);
  }
}

export async function purchaseProSubscription(): Promise<void> {
  if (!isNativeApp()) {
    throw new Error('Compras in-app disponíveis apenas no app móvel.');
  }

  const platform = nativePlatform();

  try {
    await assertBillingSupported();

    if (platform === 'android') {
      const { products } = await NativePurchases.getProducts({
        productIdentifiers: [PRODUCT_ID],
        productType: PURCHASE_TYPE.SUBS,
      });
      if (!products?.length) {
        throw new Error(
          `Assinatura "${PRODUCT_ID}" não encontrada na Google Play. Confira se o produto e o plano "${PLAN_ID}" estão ativos no Play Console.`
        );
      }
    }

    const tx = (await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.SUBS,
      ...(platform === 'android' ? { planIdentifier: PLAN_ID } : {}),
    })) as PurchasePluginResult;

    const transactionId =
      normalizeTransactionId(tx?.transactionId) ||
      normalizeTransactionId(tx?.originalTransactionId);
    const jwsReceipt = typeof tx?.receipt === 'string' ? tx.receipt.trim() : '';

    if (!transactionId && !jwsReceipt) {
      throw new Error('Compra concluída, mas a loja não retornou os dados da transação.');
    }

    const payload: NativePurchaseResult = {
      platform: platform === 'ios' ? 'ios' : 'android',
      productId: PRODUCT_ID,
      ...(platform === 'android'
        ? { purchaseToken: transactionId }
        : { receipt: jwsReceipt || transactionId }),
    };

    await verifyPurchaseWithRetry(payload);
  } catch (err) {
    const msg = getPurchaseErrorMessage(err);
    if (/cancel/i.test(msg)) {
      throw new Error('Compra cancelada.');
    }
    if (platform === 'ios' && /cannot find product/i.test(msg)) {
      throw new Error(
        `Assinatura "${PRODUCT_ID}" indisponível na App Store. Verifique se o produto está ativo em App Store Connect e se o Acordo de Apps Pagos foi aceito.`
      );
    }
    if (platform === 'android' && /cannot find product/i.test(msg)) {
      throw new Error(
        `Assinatura "${PRODUCT_ID}" não encontrada na Google Play. Confira o Play Console.`
      );
    }
    if (/token|401|403|network|conectar|internet/i.test(msg)) {
      throw new Error(
        'Não foi possível confirmar a assinatura com o servidor. Verifique sua conexão e tente novamente.'
      );
    }
    throw new Error(msg);
  }
}

/** URL padrão da App Store / Play para gerenciar assinaturas (não bloqueia como restorePurchases). */
export async function openNativeSubscriptionManagement(): Promise<boolean> {
  if (!isNativeApp()) return false;
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
  await verifyPurchaseWithRetry({
    platform: platform === 'ios' ? 'ios' : 'android',
    productId: active,
    ...(platform === 'android'
      ? { purchaseToken: customerInfo.originalAppUserId }
      : { receipt: active }),
  });
}
