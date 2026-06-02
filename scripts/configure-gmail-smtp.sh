#!/usr/bin/env bash
# Configura envio de e-mail via Gmail (smtp.gmail.com:587) — forma mais simples
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ .env não encontrado"
  exit 1
fi

echo "📧 Configurar envio pelo Gmail (senha de app do Google)"
echo "   Crie em: https://myaccount.google.com/apppasswords"
echo ""

read -r -p "Seu Gmail (ex: nome@gmail.com): " GMAIL_USER
read -r -s -p "Senha de app do Google (16 caracteres, não aparece): " GMAIL_PASS
echo ""

if [[ -z "$GMAIL_USER" || -z "$GMAIL_PASS" ]]; then
  echo "❌ Gmail e senha de app são obrigatórios"
  exit 1
fi

GMAIL_PASS="$(echo -n "$GMAIL_PASS" | tr -d ' ')"

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

update_or_add "SMTP_HOST" "smtp.gmail.com"
update_or_add "SMTP_PORT" "587"
update_or_add "SMTP_USER" "$GMAIL_USER"
update_or_add "SMTP_PASS" "$GMAIL_PASS"
# Nome amigável no inbox — sem precisar de "Enviar como" nem noreply@ no Gmail
update_or_add "SMTP_FROM" "Gym Code <${GMAIL_USER}>"

echo ""
echo "✅ .env atualizado (envio direto pelo Gmail, sem Maddy)"
echo "   Reiniciando backend..."
cd "$ROOT_DIR"
docker compose -f docker-compose.prod.yml up -d backend --force-recreate

echo ""
echo "✅ Pronto! Teste: https://mygymcode.com/login → Esqueci minha senha"
