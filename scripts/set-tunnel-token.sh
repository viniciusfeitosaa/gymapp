#!/usr/bin/env bash
# Cola o token do Cloudflare no .env a partir da área de transferência (macOS: pbpaste)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env não encontrado em $ROOT_DIR"
  exit 1
fi

echo "📋 Cole o token no Cloudflare (Docker → --token eyJ...)"
echo "   Depois copie (Cmd+C) e pressione Enter aqui."
echo ""
read -r -p "Ou pressione Enter para usar o clipboard (pbpaste): " MANUAL

if [[ -n "$MANUAL" ]]; then
  TOKEN="$MANUAL"
elif command -v pbpaste >/dev/null 2>&1; then
  TOKEN="$(pbpaste | tr -d '[:space:]')"
else
  echo "❌ pbpaste não disponível. Cole o token na linha acima."
  exit 1
fi

# Extrair token se colou o comando docker inteiro
if [[ "$TOKEN" == *"--token"* ]]; then
  TOKEN="${TOKEN##*--token }"
  TOKEN="${TOKEN%% *}"
fi

TOKEN="$(echo -n "$TOKEN" | tr -d ' "'\''')"

if [[ -z "$TOKEN" ]]; then
  echo "❌ Token vazio"
  exit 1
fi

if [[ "$TOKEN" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  echo "❌ Isso é Tunnel ID (UUID), não o token eyJ..."
  exit 1
fi

if [[ "${TOKEN:0:3}" != "eyJ" ]]; then
  echo "❌ Token deve começar com eyJ"
  exit 1
fi

if grep -q '^CLOUDFLARE_TUNNEL_TOKEN=' "$ENV_FILE"; then
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s|^CLOUDFLARE_TUNNEL_TOKEN=.*|CLOUDFLARE_TUNNEL_TOKEN=${TOKEN}|" "$ENV_FILE"
  else
    sed -i "s|^CLOUDFLARE_TUNNEL_TOKEN=.*|CLOUDFLARE_TUNNEL_TOKEN=${TOKEN}|" "$ENV_FILE"
  fi
else
  echo "CLOUDFLARE_TUNNEL_TOKEN=${TOKEN}" >> "$ENV_FILE"
fi

echo "✅ Token gravado (${#TOKEN} caracteres)"
echo ""
"${ROOT_DIR}/scripts/validate-tunnel-token.sh"
