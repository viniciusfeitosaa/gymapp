#!/usr/bin/env bash
# Envio direto via Brevo (smtp-relay.brevo.com) — ~300 e-mails/dia no plano grátis
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env não encontrado"
  exit 1
fi

echo "📧 Configurar Brevo (SMTP)"
echo "   Painel: https://app.brevo.com/settings/keys/smtp"
echo "   Remetente verificado: https://app.brevo.com/senders"
echo ""

read -r -p "E-mail da conta Brevo (login SMTP): " BREVO_LOGIN
read -r -s -p "Chave SMTP do Brevo (xsmtpsib-...): " BREVO_KEY
echo ""
read -r -p "Remetente (deve estar verificado no Brevo) [noreply@mygymcode.com]: " BREVO_FROM
BREVO_FROM="${BREVO_FROM:-noreply@mygymcode.com}"

if [[ -z "$BREVO_LOGIN" || -z "$BREVO_KEY" ]]; then
  echo "❌ Login e chave SMTP são obrigatórios"
  exit 1
fi

update_or_add() {
  local key="$1" val="$2"
  local line="${key}=${val}"
  if [[ "$val" == *" "* ]]; then
    line="${key}=\"${val}\""
  fi
  if grep -q "^${key}=" "$ENV_FILE"; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${line}|" "$ENV_FILE"
    else
      sed -i "s|^${key}=.*|${line}|" "$ENV_FILE"
    fi
  else
    echo "$line" >> "$ENV_FILE"
  fi
}

update_or_add "SMTP_HOST" "smtp-relay.sendinblue.com"
update_or_add "SMTP_PORT" "587"
update_or_add "SMTP_USER" "$BREVO_LOGIN"
update_or_add "SMTP_PASS" "$BREVO_KEY"
update_or_add "SMTP_FROM" "Gym Code <${BREVO_FROM}>"

echo ""
echo "✅ .env atualizado (backend → Brevo direto, sem Maddy)"
echo "   Reiniciando backend..."
cd "$ROOT_DIR"
docker compose -f docker-compose.prod.yml up -d backend --force-recreate

echo ""
echo "✅ Pronto! Teste: https://mygymcode.com/login → Esqueci minha senha"
