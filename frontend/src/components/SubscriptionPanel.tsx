import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, ExternalLink, Loader2, Smartphone } from 'lucide-react';
import {
  fetchSubscriptionStatus,
  requestCancelInfo,
  type SubscriptionStatus,
} from '../services/subscription.service';
import { isNativeApp, nativePlatform } from '../lib/nativeStoreBilling';
import { getPurchaseErrorMessage } from '../lib/purchaseErrors';
import { openExternalUrl } from '../lib/openExternalUrl';
import { openNativeSubscriptionManagement, purchaseProSubscription } from '../lib/storePurchase';
import { SubscriptionLegalDisclosure } from './SubscriptionLegalDisclosure';

type Props = {
  isPro: boolean;
  onProActivated?: () => void;
};

function detectManagePlatform(): 'ios' | 'android' {
  if (isNativeApp()) {
    const p = nativePlatform();
    if (p === 'ios' || p === 'android') return p;
  }
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'android';
}

export function SubscriptionPanel({ isPro, onProActivated }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSubscriptionStatus();
      setStatus(data);
    } catch {
      setError(t('subscription.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus, isPro]);

  const openManageSubscriptions = async () => {
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      await openNativeSubscriptionManagement();
      const info = await requestCancelInfo();
      const platform = detectManagePlatform();
      const url = platform === 'ios' ? info.manageUrls.ios : info.manageUrls.android;
      await openExternalUrl(url);
      setMessage(info.message);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { error?: string; manageUrls?: SubscriptionStatus['manageUrls'] } };
      };
      const urls = apiErr.response?.data?.manageUrls;
      if (urls) {
        const platform = detectManagePlatform();
        try {
          await openExternalUrl(platform === 'ios' ? urls.ios : urls.android);
          setMessage(t('subscription.cancelHint'));
        } catch {
          setError(t('subscription.openSettingsError'));
        }
      } else {
        setError(apiErr.response?.data?.error || t('subscription.openDeviceSettings'));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      if (isNativeApp()) {
        await purchaseProSubscription();
        setMessage(t('subscription.activated'));
        await loadStatus();
        onProActivated?.();
        return;
      }

      const urls = status?.manageUrls;
      const platform = detectManagePlatform();
      const listing =
        platform === 'ios'
          ? urls?.appStoreListing || import.meta.env.VITE_APP_STORE_URL
          : urls?.playStoreListing || import.meta.env.VITE_PLAY_STORE_URL;

      if (listing) {
        window.open(listing, '_blank', 'noopener,noreferrer');
        setMessage(t('subscription.storeMessage'));
      } else {
        setMessage(t('subscription.downloadAppMessage'));
      }
    } catch (err: unknown) {
      setError(getPurchaseErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-dark-500 text-sm py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('subscription.loadingPlan')}
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600">
            <Crown className="w-4 h-4" />
          </span>
          <span className="font-display font-bold text-amber-800">{t('subscription.proActive')}</span>
        </div>
        <p className="text-amber-700/90 text-sm">{t('subscription.proActiveDesc')}</p>
        {status?.storeSubscriptionId && (
          <p className="text-xs text-dark-400">{t('subscription.linkedToStore')}</p>
        )}
        <button
          type="button"
          onClick={openManageSubscriptions}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-amber-900 text-sm font-semibold hover:bg-amber-50 transition-colors disabled:opacity-60"
        >
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          {t('subscription.manageOrCancel')}
        </button>
        <p className="text-xs text-dark-500">{t('subscription.cancelNote')}</p>
        <SubscriptionLegalDisclosure />
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-accent-200 bg-gradient-to-br from-accent-50 to-white p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h5 className="font-display font-bold text-dark-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              {t('subscription.proPlan')}
            </h5>
            <p className="text-sm text-dark-500 mt-1">{t('subscription.proSubtitle')}</p>
          </div>
          <span className="text-xs font-medium text-accent-700 bg-accent-100 px-2 py-1 rounded-full">
            {t('subscription.storeBadge')}
          </span>
        </div>
        <div className="rounded-lg bg-white/80 border border-accent-100 p-3 mb-4 text-sm text-dark-700 space-y-1">
          <p>
            <strong>{t('subscription.productName')}</strong>
          </p>
          <p>{t('subscription.autoRenew')}</p>
          <p className="text-dark-500 text-xs">{t('subscription.priceNote')}</p>
        </div>
        <ul className="space-y-1.5 text-sm text-dark-600 mb-4">
          <li className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> {t('subscription.benefitUnlimited')}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> {t('subscription.benefitAllFeatures')}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span> {t('subscription.benefitSecurePay')}
          </li>
        </ul>
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={actionLoading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-accent text-white font-semibold shadow-medium hover:opacity-95 transition-opacity disabled:opacity-60"
        >
          {actionLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Smartphone className="w-5 h-5" />
              {isNativeApp() ? t('subscription.subscribeNow') : t('subscription.subscribeViaStore')}
            </>
          )}
        </button>
        <SubscriptionLegalDisclosure className="mt-4" />
      </div>
      {!isNativeApp() && (
        <p className="text-xs text-dark-500 flex items-start gap-2">
          <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
          {t('subscription.browserNote')}
        </p>
      )}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
