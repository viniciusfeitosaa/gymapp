#!/usr/bin/env bash
# Primeira configuração: Capacitor + iOS + Android com WebView remota (CAPACITOR_SERVER_URL).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm não encontrado. Instale Node.js 18+ (brew install node)."
  exit 1
fi

if [[ ! -f .env ]] && [[ -z "${CAPACITOR_SERVER_URL:-}" ]]; then
  echo "Crie frontend/.env com CAPACITOR_SERVER_URL=https://mygymcode.com/login"
  echo "Ou exporte: export CAPACITOR_SERVER_URL=https://mygymcode.com/login"
  exit 1
fi

echo "→ Instalando dependências..."
# NODE_ENV=production omite devDependencies (@capacitor/cli, ios, android)
npm install --include=dev

echo "→ Build web (dist mínimo para Capacitor)..."
CAPACITOR_BUILD=1 VITE_API_URL=https://mygymcode.com npm run build

echo "→ Gerando capacitor.config.json..."
npm run mobile:config

if [[ ! -d ios ]]; then
  echo "→ Adicionando plataforma iOS..."
  npx cap add ios
fi
if [[ ! -d android ]]; then
  echo "→ Adicionando plataforma Android..."
  npx cap add android
fi

echo "→ Sincronizando projetos nativos..."
npx cap sync

echo ""
echo "✓ Pronto!"
echo "  Xcode:         cd frontend && npm run mobile:open:ios"
echo "  Android Studio: cd frontend && npm run mobile:open:android"
