#!/usr/bin/env bash
# Gera infra/maddy/maddy.active.conf (direto MX ou relay SMTP 587)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${ROOT_DIR}/infra/maddy/maddy.active.conf"
TEMPLATE_RELAY="${ROOT_DIR}/infra/maddy/maddy-relay.conf.template"
DIRECT="${ROOT_DIR}/infra/maddy/maddy.conf"

# shellcheck disable=SC1090
source "${ROOT_DIR}/.env" 2>/dev/null || true

RELAY_HOST="${SMTP_RELAY_HOST:-}"
RELAY_PORT="${SMTP_RELAY_PORT:-587}"
RELAY_USER="${SMTP_RELAY_USER:-}"
RELAY_PASS="${SMTP_RELAY_PASS:-}"

if [[ -n "$RELAY_HOST" && -n "$RELAY_USER" && -n "$RELAY_PASS" ]]; then
  echo "📧 Maddy: modo relay → ${RELAY_HOST}:${RELAY_PORT}"
  sed \
    -e "s|__SMTP_RELAY_HOST__|${RELAY_HOST}|g" \
    -e "s|__SMTP_RELAY_PORT__|${RELAY_PORT}|g" \
    -e "s|__SMTP_RELAY_USER__|${RELAY_USER}|g" \
    -e "s|__SMTP_RELAY_PASS__|${RELAY_PASS}|g" \
    "$TEMPLATE_RELAY" > "$OUT"
else
  echo "📧 Maddy: modo direto (MX porta 25) — pode falhar se a operadora bloquear saída na 25"
  cp "$DIRECT" "$OUT"
fi

echo "✅ Config gravado: infra/maddy/maddy.active.conf"
