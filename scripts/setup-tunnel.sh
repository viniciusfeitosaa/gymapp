#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🚇 Gym Code — Setup Cloudflare Tunnel"
echo "===================================="

if ! docker info &>/dev/null; then
  echo "❌ Docker não está rodando. Abra o Docker Desktop."
  exit 1
fi

CREDS="${ROOT_DIR}/infra/cloudflared/credentials.json"
CONFIG="${ROOT_DIR}/infra/cloudflared/config.yml"

if [[ ! -f "$CREDS" ]]; then
  echo ""
  echo "❌ Credenciais não encontradas: infra/cloudflared/credentials.json"
  echo ""
  echo "1. Rode: cloudflared tunnel login"
  echo "2. Rode: cloudflared tunnel create gymapp-homelab"
  echo "3. Copie o JSON gerado:"
  echo "   cp ~/.cloudflared/<tunnel-id>.json infra/cloudflared/credentials.json"
  echo "4. Edite infra/cloudflared/config.yml com o tunnel ID"
  echo ""
  echo "Veja: CLOUDFLARE_TUNNEL.md"
  exit 1
fi

if [[ ! -f "$CONFIG" ]]; then
  echo "❌ Config não encontrado: infra/cloudflared/config.yml"
  exit 1
fi

if ! cloudflared tunnel --config "$CONFIG" ingress validate &>/dev/null; then
  echo "❌ Ingress inválido em infra/cloudflared/config.yml"
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "📝 .env criado a partir do exemplo."
fi

update_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env 2>/dev/null; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${key}=${val}|" .env
    else
      sed -i "s|^${key}=.*|${key}=${val}|" .env
    fi
  else
    echo "${key}=${val}" >> .env
  fi
}

# shellcheck disable=SC1090
source .env 2>/dev/null || true

update_env "USE_CLOUDFLARE_TUNNEL" "1"
update_env "DOMAIN" ":80"
update_env "FRONTEND_URL" "https://mygymcode.com"
update_env "VITE_API_URL" ""
update_env "VITE_APP_URL" "https://mygymcode.com"

if ! grep -q "^CORS_ORIGINS=" .env; then
  echo "CORS_ORIGINS=https://www.mygymcode.com" >> .env
fi

# Desativa cloudflared do sistema (causa 502 se rodar fora do Docker)
if [[ -f /Library/LaunchDaemons/com.cloudflare.cloudflared.plist ]]; then
  echo ""
  echo "⚠️  Detectado cloudflared como serviço do macOS (LaunchDaemon)."
  echo "   Desative para evitar conflito com o Docker:"
  echo "   sudo launchctl bootout system/com.cloudflare.cloudflared"
  echo "   sudo mv /Library/LaunchDaemons/com.cloudflare.cloudflared.plist /Library/LaunchDaemons/com.cloudflare.cloudflared.plist.disabled"
fi

./scripts/select-caddyfile.sh

echo ""
echo "🚀 Subindo stack com Cloudflare Tunnel..."
docker compose -f docker-compose.prod.yml --profile tunnel up -d --build

if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo ""
  echo "🔧 Atualizando ingress (mygymcode.com + www) via API..."
  ./scripts/cloudflare-update-ingress.sh || true
fi

echo ""
echo "✅ Stack no ar!"
echo ""
echo "   Teste: curl -sI https://mygymcode.com"
echo "   Logs: docker compose -f docker-compose.prod.yml logs cloudflared --tail 20"
echo ""
echo "   Se www retornar 404, rode (com API token no .env):"
echo "   ./scripts/cloudflare-update-ingress.sh"
