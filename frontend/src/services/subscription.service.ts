import { api } from './api';

export type SubscriptionStatus = {
  isPro: boolean;
  maxStudentsAllowed: number;
  billingProvider: 'store' | null;
  storeSubscriptionId: string | null;
  manageUrls: {
    ios: string;
    android: string;
    appStoreListing: string;
    playStoreListing: string;
  };
};

export type VerifyPurchasePayload = {
  platform: 'ios' | 'android';
  productId: string;
  receipt?: string;
  purchaseToken?: string;
};

export async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data } = await api.get<SubscriptionStatus>('/subscription/status');
  return data;
}

export async function syncSubscription() {
  const { data } = await api.post('/subscription/sync');
  return data;
}

export async function verifyPurchase(payload: VerifyPurchasePayload) {
  const { data } = await api.post('/subscription/verify-purchase', payload);
  return data;
}

export async function requestCancelInfo() {
  const { data } = await api.post('/subscription/cancel');
  return data as { message: string; manageUrls: SubscriptionStatus['manageUrls'] };
}
