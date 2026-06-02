#!/usr/bin/env bash
# Seleciona Caddyfile correto (LAN ou domínio) com base no .env
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
LAN_FILE="${ROOT_DIR}/infra/caddy/Caddyfile.lan"
TUNNEL_FILE="${ROOT_DIR}/infra/caddy/Caddyfile.tunnel"
DOMAIN_FILE="${ROOT_DIR}/infra/caddy/Caddyfile.domain"
OUT_FILE="${ROOT_DIR}/infra/caddy/Caddyfile"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env não encontrado em $ROOT_DIR"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

DOMAIN="${DOMAIN:-:80}"
USE_TUNNEL="${USE_CLOUDFLARE_TUNNEL:-0}"

if [[ "$USE_TUNNEL" == "1" ]] || [[ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  cp "$TUNNEL_FILE" "$OUT_FILE"
  echo "🚇 Modo Cloudflare Tunnel — Caddy HTTP interno (:80)"
elif [[ "$DOMAIN" == :* ]]; then
  cp "$LAN_FILE" "$OUT_FILE"
  echo "📡 Modo LAN — Caddy escutando em ${DOMAIN}"
else
  cp "$DOMAIN_FILE" "$OUT_FILE"
  echo "🌐 Modo domínio — ${DOMAIN} (+ www.${DOMAIN})"
fi
