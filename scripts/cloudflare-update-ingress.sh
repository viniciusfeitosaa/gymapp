#!/usr/bin/env bash
# Atualiza rotas ingress do túnel GYMCODE (remotely-managed) via API Cloudflare.
# Requer CLOUDFLARE_API_TOKEN no .env com permissão Cloudflare Tunnel Write.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-e74bbfe39f2c7d54e214eddcdcd2d3a0}"
TUNNEL_ID="${CLOUDFLARE_TUNNEL_ID:-a1a7da43-11ca-42ba-8f1c-fda18998fb43}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE" 2>/dev/null || true
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "❌ Defina CLOUDFLARE_API_TOKEN no .env"
  echo "   Permissões: Account → Cloudflare Tunnel → Edit"
  echo "   Crie em: https://dash.cloudflare.com/profile/api-tokens"
  exit 1
fi

PAYLOAD=$(cat <<'EOF'
{
  "config": {
    "ingress": [
      {
        "hostname": "mygymcode.com",
        "service": "http://caddy:80",
        "originRequest": {}
      },
      {
        "hostname": "www.mygymcode.com",
        "service": "http://caddy:80",
        "originRequest": {}
      },
      {
        "service": "http_status:404"
      }
    ]
  }
}
EOF
)

RESP=$(curl -sS -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

if echo "$RESP" | grep -q '"success":true'; then
  echo "✅ Ingress atualizado (mygymcode.com + www → http://caddy:80)"
else
  echo "❌ Falha na API:"
  echo "$RESP" | head -c 500
  exit 1
fi
