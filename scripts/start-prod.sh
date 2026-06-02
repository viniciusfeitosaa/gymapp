#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Variáveis exportadas no shell sobrescrevem o .env — limpa SMTP/Brevo
unset SMTP_FROM SMTP_HOST SMTP_USER SMTP_PASS BREVO_API_KEY 2>/dev/null || true

COMPOSE_PROFILES=""
if grep -qE '^USE_CLOUDFLARE_TUNNEL=1' .env 2>/dev/null && [[ -f infra/cloudflared/credentials.json ]]; then
  COMPOSE_PROFILES="--profile tunnel"
fi
docker compose -f docker-compose.prod.yml $COMPOSE_PROFILES up -d --build "$@"

echo "✅ Produção rodando em http://localhost"
