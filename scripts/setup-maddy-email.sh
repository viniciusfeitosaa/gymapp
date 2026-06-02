#!/usr/bin/env bash
# Configura usuário SMTP do Maddy para o backend (redefinição de senha, etc.)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck disable=SC1090
source .env 2>/dev/null || true

SMTP_USER="${SMTP_USER:-noreply@mygymcode.com}"
MADDY_PASS="${MADDY_SMTP_PASS:-${SMTP_PASS:-}}"

if [[ -z "$MADDY_PASS" ]]; then
  echo "❌ Defina MADDY_SMTP_PASS no .env (senha do noreply@mygymcode.com no Maddy)"
  exit 1
fi

chmod +x "${ROOT_DIR}/scripts/generate-maddy-config.sh"
"${ROOT_DIR}/scripts/generate-maddy-config.sh"

echo "📧 Subindo Maddy..."
docker compose -f docker-compose.prod.yml up -d maddy --force-recreate

echo "⏳ Aguardando Maddy iniciar..."
sleep 3

if ! docker compose -f docker-compose.prod.yml ps maddy | grep -q "Up"; then
  echo "❌ Container gymapp-maddy não está rodando. Logs:"
  docker compose -f docker-compose.prod.yml logs maddy --tail 30
  exit 1
fi

echo "🔐 Criando/atualizando credencial ${SMTP_USER}..."
if docker exec gymapp-maddy maddy creds create -p "$MADDY_PASS" "$SMTP_USER" 2>/dev/null; then
  echo "✅ Usuário criado."
else
  docker exec gymapp-maddy maddy creds password -p "$MADDY_PASS" "$SMTP_USER"
  echo "✅ Senha atualizada."
fi

echo ""
echo "✅ Maddy pronto. Confirme no .env:"
echo "   SMTP_HOST=maddy"
echo "   SMTP_PORT=587"
echo "   SMTP_USER=${SMTP_USER}"
echo "   SMTP_PASS=<mesmo valor de MADDY_SMTP_PASS>"
echo "   SMTP_FROM=${SMTP_FROM:-noreply@mygymcode.com}"
echo ""
echo "   Reinicie o backend:"
echo "   docker compose -f docker-compose.prod.yml up -d backend"
