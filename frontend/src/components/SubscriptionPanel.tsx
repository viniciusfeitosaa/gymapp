import { useCallback, useEffect, useState } from 'react';
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
      setError('Não foi possível carregar o status da assinatura.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      const apiErr = err as { response?: { data?: { error?: string; manageUrls?: SubscriptionStatus['manageUrls'] } } };
      const urls = apiErr.response?.data?.manageUrls;
      if (urls) {
        const platform = detectManagePlatform();
        try {
          await openExternalUrl(platform === 'ios' ? urls.ios : urls.android);
          setMessage(
            'Para cancelar, abra as configurações de assinatura da App Store ou Google Play.'
          );
        } catch {
          setError('Não foi possível abrir as configurações de assinatura.');
        }
      } else {
        setError(apiErr.response?.data?.error || 'Abra as configurações de assinatura do seu dispositivo.');
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
        setMessage('Assinatura Pro ativada com sucesso!');
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
        setMessage(
          'Abra o app Gym Code na loja e assine o plano Pro. Sua conta será atualizada automaticamente após a compra.'
        );
      } else {
        setMessage(
          'Baixe o app Gym Code na App Store (iPhone) ou Google Play (Android) para assinar o plano Pro com pagamento seguro das lojas.'
        );
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
        Carregando assinatura…
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
          <span className="font-display font-bold text-amber-800">Plano Pro ativo</span>
        </div>
        <p className="text-amber-700/90 text-sm">
          Você tem acesso a alunos ilimitados e todos os benefícios do plano.
        </p>
        {status?.storeSubscriptionId && (
          <p className="text-xs text-dark-400">Assinatura vinculada à sua conta nas lojas.</p>
        )}
        <button
          type="button"
          onClick={openManageSubscriptions}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-white text-amber-900 text-sm font-semibold hover:bg-amber-50 transition-colors disabled:opacity-60"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          Gerenciar ou cancelar assinatura
        </button>
        <p className="text-xs text-dark-500">
          O cancelamento é feito nas configurações da App Store ou Google Play. Você mantém o Pro até o fim do período pago.
        </p>
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
              Plano Pro
            </h5>
            <p className="text-sm text-dark-500 mt-1">Alunos ilimitados e suporte prioritário</p>
          </div>
          <span className="text-xs font-medium text-accent-700 bg-accent-100 px-2 py-1 rounded-full">
            App Store / Google Play
          </span>
        </div>
        <ul className="space-y-1.5 text-sm text-dark-600 mb-4">
          <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Alunos ilimitados</li>
          <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Todos os recursos do app</li>
          <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Pagamento seguro via Apple ou Google</li>
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
              {isNativeApp() ? 'Assinar Pro agora' : 'Assinar via App Store / Google Play'}
            </>
          )}
        </button>
      </div>
      {!isNativeApp() && (
        <p className="text-xs text-dark-500 flex items-start gap-2">
          <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
          No navegador, você será direcionado à loja do seu celular. A assinatura só funciona no app móvel Gym Code.
        </p>
      )}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
