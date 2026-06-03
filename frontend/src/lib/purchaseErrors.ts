import { isApiError } from '../services/nativeHttp';

/** Mensagem legível para erros de compra in-app / API. */
export function getPurchaseErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    return err.message;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (typeof err === 'object' && err !== null) {
    const o = err as {
      message?: string;
      error?: string;
      errorMessage?: string;
    };
    return o.errorMessage || o.message || o.error || 'Não foi possível concluir a assinatura.';
  }
  return 'Não foi possível concluir a assinatura.';
}
