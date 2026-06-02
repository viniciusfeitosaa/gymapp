#!/usr/bin/env bash
# Ativa mygymcode.com no homelab (edita .env + rebuild)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

EMAIL="${1:-}"

if [[ -z "$EMAIL" ]]; then
  echo "Uso: $0 seu@gmail.com"
  echo ""
  echo "Pode ser QUALQUER e-mail seu (Gmail, iCloud, etc.)."
  echo "Não precisa ser @mygymcode.com — só para avisos do Let's Encrypt."
  echo ""
  echo "Para e-mail no domínio depois, veja EMAIL.md"
  exit 1
fi

ENV_FILE=".env"
if [[ ! -f "$ENV_FILE" ]]; then
  cp .env.example "$ENV_FILE"
fi

update_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    fi
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

update_env "DOMAIN" "mygymcode.com"
update_env "ACME_EMAIL" "$EMAIL"
update_env "FRONTEND_URL" "https://mygymcode.com"
update_env "VITE_API_URL" ""
update_env "VITE_APP_URL" "https://mygymcode.com"

if grep -q "^CORS_ORIGINS=" "$ENV_FILE"; then
  update_env "CORS_ORIGINS" "https://www.mygymcode.com,https://letsgym.netlify.app"
else
  echo "CORS_ORIGINS=https://www.mygymcode.com,https://letsgym.netlify.app" >> "$ENV_FILE"
fi

./scripts/select-caddyfile.sh

echo ""
echo "🚀 Rebuild e deploy..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "✅ Configurado para https://mygymcode.com"
echo ""
echo "Próximo passo: configure DNS no Cloudflare (veja CLOUDFLARE_SETUP.md)"
echo "  A  @   → 201.148.122.166  (DNS only)"
echo "  A  www → 201.148.122.166  (DNS only)"
