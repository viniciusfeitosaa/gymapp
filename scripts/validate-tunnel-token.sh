#!/usr/bin/env bash
# Valida CLOUDFLARE_TUNNEL_TOKEN no .env (formato eyJ... do painel Cloudflare)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env não encontrado"
  exit 1
fi

TOKEN=$(grep '^CLOUDFLARE_TUNNEL_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d ' "'\''')

echo "🔍 Validação do token Cloudflare Tunnel"
echo "======================================"

if [[ -z "$TOKEN" ]]; then
  echo "❌ CLOUDFLARE_TUNNEL_TOKEN está vazio"
  exit 1
fi

LEN=${#TOKEN}
echo "Tamanho: ${LEN} caracteres"

if [[ "$TOKEN" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  echo "❌ ERRADO: isso é o Tunnel ID (UUID), não o token de instalação"
  echo ""
  echo "   Painel: one.dash.cloudflare.com → Tunnels → GYMCODE"
  echo "   → Install connector → Docker → copie após --token"
  exit 1
fi

if [[ "${TOKEN:0:3}" != "eyJ" ]]; then
  echo "❌ Token não parece válido (deveria começar com eyJ)"
  exit 1
fi

if [[ "$LEN" -lt 120 ]]; then
  echo "❌ Token muito curto (${LEN} chars). Copie a linha inteira após --token"
  exit 1
fi

# Token Cloudflare = base64(JSON) com campos a, t, s — geralmente SEM pontos (não é JWT de 3 partes)
PAYLOAD=$(echo -n "$TOKEN" | tr '_-' '/+' | base64 -d 2>/dev/null || true)
if [[ -z "$PAYLOAD" ]]; then
  echo "❌ Não foi possível decodificar o token (base64 inválido ou truncado)"
  exit 1
fi

if ! echo "$PAYLOAD" | grep -q '"t"'; then
  echo "❌ Token decodificado não contém tunnel id (campo \"t\")"
  echo "   Conteúdo parcial: ${PAYLOAD:0:80}..."
  exit 1
fi

TUNNEL_ID=$(echo "$PAYLOAD" | sed -n 's/.*"t":"\([^"]*\)".*/\1/p')
echo "Tunnel ID no token: ${TUNNEL_ID:-?}"
echo "✅ Formato do token parece correto (${LEN} chars)"
echo ""
echo "   Se o container ainda falhar com 'Invalid tunnel secret':"
echo "   → No painel: Refresh token / Regenerate token e rode:"
echo "   → ./scripts/set-tunnel-token.sh"
echo ""
echo "   Subir: docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared --force-recreate"
