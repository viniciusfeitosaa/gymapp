#!/usr/bin/env bash
# Valida Brevo API (envio por HTTPS — sem bloqueio de IP do SMTP)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
LOGIN="${1:-viniciusalves919@gmail.com}"

echo "🔑 Brevo — configurar envio por API (recomendado)"
echo "   Evita bloqueio de IP do SMTP no homelab."
echo "   Chave: https://app.brevo.com/settings/keys/api"
echo ""

read -r -p "E-mail da conta Brevo [${LOGIN}]: " IN_LOGIN
LOGIN="${IN_LOGIN:-$LOGIN}"

read -r -s -p "Chave API (xkeysib-...): " API_KEY
echo ""

API_KEY="$(printf '%s' "$API_KEY" | tr -d '[:space:]')"

if [[ -z "$API_KEY" ]] && [[ -f "$ENV_FILE" ]]; then
  API_KEY="$(grep -E '^BREVO_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d ' "'\''"')"
fi

if [[ ! "$API_KEY" =~ ^xkeysib- ]]; then
  echo "❌ Chave API deve começar com xkeysib-"
  exit 1
fi

echo ""
echo "⏳ Testando API Brevo..."
export API_KEY
python3 << 'PY'
import json, os, sys, urllib.request, urllib.error

api = os.environ["API_KEY"]
req = urllib.request.Request("https://api.brevo.com/v3/account", headers={"api-key": api})
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        acc = json.loads(r.read())
        print(f"✅ API OK — conta: {acc.get('email', '?')}")
except urllib.error.HTTPError as e:
    print(f"❌ API inválida ({e.code})")
    sys.exit(1)
PY

update_env() {
  local k="$1" v="$2"
  if grep -q "^${k}=" "$ENV_FILE"; then
    sed -i '' "s|^${k}=.*|${k}=${v}|" "$ENV_FILE"
  else
    echo "${k}=${v}" >> "$ENV_FILE"
  fi
}

update_env "BREVO_API_KEY" "$API_KEY"
update_env "SMTP_FROM" "\"Gym Code <viniciusalves919@gmail.com>\""

echo ""
echo "ℹ️  SMTP (xsmtpsib) não é obrigatório — o app usa a API quando BREVO_API_KEY está no .env."
echo "   Se o remetente noreply@ falhar, verifique o domínio em Brevo → Senders."
echo ""
echo "🚀 Rebuild + reinício do backend..."
cd "$ROOT_DIR"
docker compose -f docker-compose.prod.yml up -d backend --build --force-recreate

echo ""
echo "✅ Pronto. Teste: https://mygymcode.com/login → Esqueci minha senha"
