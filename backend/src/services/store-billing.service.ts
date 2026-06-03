/**
 * Validação de assinaturas App Store / Google Play.
 * Configure APPLE_APP_SHARED_SECRET e GOOGLE_PLAY_* no .env para produção.
 */

const APPLE_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';

export type StorePlatform = 'ios' | 'android';

export interface VerifyPurchaseInput {
  platform: StorePlatform;
  productId: string;
  /** iOS: receipt base64 (app receipt ou transaction) */
  receipt?: string;
  /** Android: purchase token da Play Billing Library */
  purchaseToken?: string;
}

export interface VerifyPurchaseResult {
  valid: boolean;
  subscriptionId?: string;
  error?: string;
}

async function verifyAppleReceipt(receipt: string, sandbox: boolean): Promise<VerifyPurchaseResult> {
  const secret = process.env.APPLE_APP_SHARED_SECRET?.trim();
  if (!secret) {
    return { valid: false, error: 'APPLE_APP_SHARED_SECRET não configurado no servidor.' };
  }

  const url = sandbox ? APPLE_SANDBOX : APPLE_PRODUCTION;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receipt,
      password: secret,
      'exclude-old-transactions': true,
    }),
  });

  if (!res.ok) {
    return { valid: false, error: `Apple verifyReceipt HTTP ${res.status}` };
  }

  const data = (await res.json()) as {
    status: number;
    latest_receipt_info?: Array<{ product_id?: string; expires_date_ms?: string }>;
  };

  // 21007 = receipt é sandbox, reenviar para sandbox
  if (data.status === 21007 && !sandbox) {
    return verifyAppleReceipt(receipt, true);
  }

  if (data.status !== 0) {
    return { valid: false, error: `Recibo Apple inválido (status ${data.status})` };
  }

  const latest = data.latest_receipt_info?.[0];
  if (latest?.expires_date_ms) {
    const expires = Number(latest.expires_date_ms);
    if (expires < Date.now()) {
      return { valid: false, error: 'Assinatura Apple expirada.' };
    }
  }

  const subId =
    (latest as { original_transaction_id?: string })?.original_transaction_id ||
    latest?.product_id ||
    'apple-subscription';
  return { valid: true, subscriptionId: subId };
}

async function getGoogleAccessToken(): Promise<string | null> {
  const jsonPath = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!jsonPath) return null;

  let sa: { client_email?: string; private_key?: string };
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(jsonPath, 'utf8');
    sa = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!sa.client_email || !sa.private_key) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url');

  const crypto = await import('crypto');
  const signInput = `${header}.${claim}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(signInput)
    .sign(sa.private_key)
    .toString('base64url');

  const jwt = `${signInput}.${signature}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) return null;
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  return tokenData.access_token ?? null;
}

async function verifyGooglePurchase(
  productId: string,
  purchaseToken: string
): Promise<VerifyPurchaseResult> {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim();
  if (!packageName) {
    return { valid: false, error: 'GOOGLE_PLAY_PACKAGE_NAME não configurado.' };
  }

  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    return { valid: false, error: 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON inválido ou ausente.' };
  }

  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return { valid: false, error: `Google Play API HTTP ${res.status}` };
  }

  const data = (await res.json()) as {
    paymentState?: number;
    expiryTimeMillis?: string;
    orderId?: string;
  };

  // paymentState: 1 = received, 2 = free trial
  if (data.paymentState !== 1 && data.paymentState !== 2) {
    return { valid: false, error: 'Pagamento Google Play não confirmado.' };
  }

  if (data.expiryTimeMillis && Number(data.expiryTimeMillis) < Date.now()) {
    return { valid: false, error: 'Assinatura Google Play expirada.' };
  }

  return {
    valid: true,
    subscriptionId: data.orderId || purchaseToken.slice(0, 64),
  };
}

function isStoreKit2TransactionId(value: string): boolean {
  return /^\d+$/.test(value);
}

function looksLikeBase64Receipt(value: string): boolean {
  return value.length > 80 && /^[A-Za-z0-9+/=]+$/.test(value);
}

function sandboxTrustEnabled(): boolean {
  return (
    process.env.APPLE_SANDBOX === '1' || process.env.STORE_BILLING_SANDBOX_TRUST === '1'
  );
}

export async function verifyStorePurchase(input: VerifyPurchaseInput): Promise<VerifyPurchaseResult> {
  const expectedProduct = process.env.SUBSCRIPTION_PRODUCT_ID?.trim();
  if (expectedProduct && input.productId !== expectedProduct) {
    return { valid: false, error: 'Produto de assinatura não reconhecido.' };
  }

  if (input.platform === 'ios') {
    const token = input.receipt?.trim();
    if (!token) {
      return { valid: false, error: 'Recibo Apple (receipt) obrigatório.' };
    }

    // StoreKit 2 (@capgo/native-purchases) envia transaction.id numérico, não recibo base64.
    if (isStoreKit2TransactionId(token)) {
      if (sandboxTrustEnabled()) {
        console.warn(
          `[Store] iOS sandbox: transação StoreKit aceita para testes (${token.slice(0, 12)}…)`
        );
        return { valid: true, subscriptionId: token };
      }
      const secret = process.env.APPLE_APP_SHARED_SECRET?.trim();
      if (!secret) {
        return {
          valid: false,
          error:
            'Servidor sem validação Apple. Defina APPLE_SANDBOX=1 para testes ou APPLE_APP_SHARED_SECRET em produção.',
        };
      }
      // Recibo legado não aceita transaction id; orientar configuração sandbox.
      return {
        valid: false,
        error:
          'Transação StoreKit 2: ative APPLE_SANDBOX=1 no servidor para testes no simulador/dispositivo.',
      };
    }

    if (looksLikeBase64Receipt(token)) {
      const secret = process.env.APPLE_APP_SHARED_SECRET?.trim();
      if (!secret) {
        if (sandboxTrustEnabled()) {
          return { valid: true, subscriptionId: 'apple-sandbox-receipt' };
        }
        return { valid: false, error: 'APPLE_APP_SHARED_SECRET não configurado no servidor.' };
      }
      return verifyAppleReceipt(token, process.env.APPLE_SANDBOX === '1');
    }

    if (sandboxTrustEnabled()) {
      return { valid: true, subscriptionId: token };
    }
    return { valid: false, error: 'Formato de recibo Apple não reconhecido.' };
  }

  if (!input.purchaseToken?.trim()) {
    return { valid: false, error: 'Token de compra Google (purchaseToken) obrigatório.' };
  }
  return verifyGooglePurchase(input.productId, input.purchaseToken.trim());
}

export function getStoreManageUrls() {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || 'com.gymcode.app';
  return {
    ios: 'https://apps.apple.com/account/subscriptions',
    android: `https://play.google.com/store/account/subscriptions?package=${encodeURIComponent(packageName)}`,
    appStoreListing:
      process.env.APP_STORE_URL?.trim() || process.env.VITE_APP_STORE_URL?.trim() || '',
    playStoreListing:
      process.env.PLAY_STORE_URL?.trim() || process.env.VITE_PLAY_STORE_URL?.trim() || '',
  };
}
