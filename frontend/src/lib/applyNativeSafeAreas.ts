import { Capacitor } from '@capacitor/core';

/** Altura mínima da barra de navegação Android (3 botões), em px. */
const ANDROID_NAV_MIN_PX = 48;

function readCssSafeBottom(): number {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;bottom:0;left:0;width:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return value;
}

function measureVisualBottomInset(): number {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
}

function resolveAndroidBottomInset(): number {
  const fromEnv = readCssSafeBottom();
  const fromViewport = measureVisualBottomInset();
  // WebView Android costuma reportar 0 — garantimos sempre o mínimo da barra do sistema.
  return Math.max(ANDROID_NAV_MIN_PX, fromEnv, fromViewport);
}

function applyInsets(): void {
  if (Capacitor.getPlatform() !== 'android') return;

  const bottom = resolveAndroidBottomInset();
  document.documentElement.style.setProperty('--safe-bottom-env', `${bottom}px`);
}

function scheduleAndroidInsetUpdates(): void {
  applyInsets();
  requestAnimationFrame(applyInsets);
  window.setTimeout(applyInsets, 50);
  window.setTimeout(applyInsets, 250);
  window.setTimeout(applyInsets, 1000);
}

export function applyNativeSafeAreas(): void {
  if (!Capacitor.isNativePlatform()) return;

  if (Capacitor.getPlatform() === 'android') {
    scheduleAndroidInsetUpdates();
  } else {
    applyInsets();
  }

  if (Capacitor.getPlatform() !== 'android') return;

  const vv = window.visualViewport;
  vv?.addEventListener('resize', applyInsets);
  vv?.addEventListener('scroll', applyInsets);
  window.addEventListener('resize', applyInsets);
  window.addEventListener('orientationchange', scheduleAndroidInsetUpdates);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleAndroidInsetUpdates();
    }
  });
}
