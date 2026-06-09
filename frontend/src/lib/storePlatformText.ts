import { isNativeApp, nativePlatform } from './nativeStoreBilling';

export type StorePlatformScope = 'ios' | 'android' | 'web';

/** Escopo de cópia da loja — evita mencionar Google Play no app iOS (Guideline 2.3.10). */
export function storePlatformScope(): StorePlatformScope {
  if (isNativeApp()) {
    const platform = nativePlatform();
    if (platform === 'ios' || platform === 'android') return platform;
  }
  return 'web';
}

/** Chave i18n com sufixo `.ios` | `.android` | `.web`. */
export function storePlatformKey(baseKey: string, scope?: StorePlatformScope): string {
  return `${baseKey}.${scope ?? storePlatformScope()}`;
}
