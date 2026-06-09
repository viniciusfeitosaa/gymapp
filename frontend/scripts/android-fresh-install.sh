#!/usr/bin/env bash
# Rebuild limpo + instala APK debug no dispositivo/emulador (evita versão antiga no WebView).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Build frontend + cap sync android..."
npm run mobile:sync:android

echo "→ Gradle clean + assembleDebug..."
cd android
./gradlew clean assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"
PKG="com.mygymcode.app"

if command -v adb >/dev/null 2>&1; then
  DEVICES=$(adb devices | awk 'NR>1 && $2=="device" {print $1}')
  if [[ -n "$DEVICES" ]]; then
    echo "→ Desinstalando app antigo ($PKG)..."
    adb uninstall "$PKG" 2>/dev/null || true
    echo "→ Instalando APK debug novo..."
    adb install -r "$APK"
    echo "→ Abrindo app..."
    adb shell am start -n "$PKG/.MainActivity"
    echo "✓ Instalado. Versão esperada: 1.0.4 (versionCode 7)"
  else
    echo "⚠ Nenhum dispositivo adb conectado. APK gerado em:"
    echo "  $ROOT/android/$APK"
    echo "No Android Studio: desinstale o app manualmente e Run ▶ de novo."
  fi
else
  echo "⚠ adb não encontrado. APK em: $ROOT/android/$APK"
fi
