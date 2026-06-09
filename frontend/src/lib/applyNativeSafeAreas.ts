import { Capacitor } from '@capacitor/core';

/** Fallback só quando o sistema não reporta inset (≈48dp). */
const ANDROID_NAV_FALLBACK_PX = 48;

declare global {
  interface Window {
    /** Chamado pelo MainActivity.java com insets reais do sistema. */
    gymCodeApplySafeArea?: (topPx: number, bottomPx: number) => void;
  }
}

let envBottomProbe: HTMLDivElement | null = null;

function readCssSafeBottom(): number {
  if (!envBottomProbe) {
    envBottomProbe = document.createElement('div');
    envBottomProbe.style.cssText =
      'position:fixed;bottom:0;left:0;width:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;';
    document.documentElement.appendChild(envBottomProbe);
  }
  return parseFloat(getComputedStyle(envBottomProbe).paddingBottom) || 0;
}

function measureVisualBottomInset(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
}

function resolveBottomInset(nativeBottomPx?: number): number {
  if (nativeBottomPx != null && nativeBottomPx > 0) {
    return nativeBottomPx;
  }
  const fromViewport = measureVisualBottomInset();
  if (fromViewport > 0) return fromViewport;
  const fromEnv = readCssSafeBottom();
  if (fromEnv > 0) return fromEnv;
  return ANDROID_NAV_FALLBACK_PX;
}

let applyingInsets = false;

function applyInsets(nativeTopPx?: number, nativeBottomPx?: number): void {
  if (Capacitor.getPlatform() !== 'android' || applyingInsets) return;

  applyingInsets = true;
  try {
    const bottom = resolveBottomInset(nativeBottomPx);

    document.documentElement.style.setProperty('--safe-bottom-env', `${bottom}px`);
    if (nativeTopPx != null && nativeTopPx > 0) {
      document.documentElement.style.setProperty('--safe-top-env', `${nativeTopPx}px`);
    }

    // CSS controla o padding — remove inline de testes anteriores
    document.querySelectorAll<HTMLElement>('.native-bottom-nav').forEach((el) => {
      el.style.removeProperty('padding-bottom');
    });
  } finally {
    applyingInsets = false;
  }
}

function scheduleAndroidInsetUpdates(): void {
  applyInsets();
  requestAnimationFrame(() => applyInsets());
  window.setTimeout(() => applyInsets(), 100);
  window.setTimeout(() => applyInsets(), 400);
}

let navObserver: MutationObserver | null = null;

function watchBottomNavMount(): void {
  if (navObserver || Capacitor.getPlatform() !== 'android') return;

  const tryApply = () => {
    if (!document.querySelector('.native-bottom-nav')) return false;
    applyInsets();
    navObserver?.disconnect();
    navObserver = null;
    return true;
  };

  if (tryApply()) return;

  navObserver = new MutationObserver(() => {
    tryApply();
  });
  navObserver.observe(document.body, { childList: true, subtree: true });
}

export function applyNativeSafeAreas(): void {
  if (!Capacitor.isNativePlatform()) return;

  if (Capacitor.getPlatform() === 'android') {
    window.gymCodeApplySafeArea = (topPx, bottomPx) => applyInsets(topPx, bottomPx);
    watchBottomNavMount();
    scheduleAndroidInsetUpdates();
  }

  if (Capacitor.getPlatform() !== 'android') return;

  const vv = window.visualViewport;
  vv?.addEventListener('resize', () => applyInsets());
  window.addEventListener('resize', () => applyInsets());
  window.addEventListener('orientationchange', scheduleAndroidInsetUpdates);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleAndroidInsetUpdates();
    }
  });
}
