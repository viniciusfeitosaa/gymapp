#!/usr/bin/env bash
# Configura validação de assinaturas Google Play no backend Docker.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_DIR="$ROOT/secrets"
JSON_FILE="$SECRETS_DIR/google-play-service-account.json"
ENV_FILE="$ROOT/.env"

echo "→ Google Play Billing — Gym Code"
echo ""

if [[ -n "${1:-}" ]]; then
  SRC="$1"
  if [[ ! -f "$SRC" ]]; then
    echo "❌ Arquivo não encontrado: $SRC"
    exit 1
  fi
  mkdir -p "$SECRETS_DIR"
  cp "$SRC" "$JSON_FILE"
  chmod 600 "$JSON_FILE"
  echo "✓ JSON copiado para secrets/google-play-service-account.json"
fi

if [[ ! -f "$JSON_FILE" ]]; then
  echo "❌ Falta o JSON da service account."
  echo ""
  echo "Crie no Google Cloud + Play Console:"
  echo "  1. https://console.cloud.google.com → IAM → Contas de serviço → Criar"
  echo "  2. Baixe a chave JSON"
  echo "  3. Play Console → Configurações → Acesso à API → vincule o projeto"
  echo "  4. Convide o e-mail da service account (Gerenciar pedidos e assinaturas)"
  echo ""
  echo "Depois rode:"
  echo "  ./scripts/setup-google-play-billing.sh /caminho/para/chave.json"
  exit 1
fi

python3 << 'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
data = json.loads(p.read_text())
for key in ("client_email", "private_key", "project_id"):
    if not data.get(key):
        print(f"❌ JSON inválido: falta '{key}'")
        sys.exit(1)
print(f"✓ Service account: {data['client_email']}")
print(f"✓ Projeto: {data['project_id']}")
PY
"$JSON_FILE"

touch "$ENV_FILE"
grep -q '^GOOGLE_PLAY_PACKAGE_NAME=' "$ENV_FILE" && \
  sed -i '' 's|^GOOGLE_PLAY_PACKAGE_NAME=.*|GOOGLE_PLAY_PACKAGE_NAME=com.mygymcode.app|' "$ENV_FILE" || \
  echo 'GOOGLE_PLAY_PACKAGE_NAME=com.mygymcode.app' >> "$ENV_FILE"

grep -q '^GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=' "$ENV_FILE" && \
  sed -i '' 's|^GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=.*|GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/run/secrets/google-play-service-account.json|' "$ENV_FILE" || \
  echo 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/run/secrets/google-play-service-account.json' >> "$ENV_FILE"

grep -q '^SUBSCRIPTION_PRODUCT_ID=' "$ENV_FILE" && \
  sed -i '' 's|^SUBSCRIPTION_PRODUCT_ID=.*|SUBSCRIPTION_PRODUCT_ID=gymcode_pro_monthly|' "$ENV_FILE" || \
  echo 'SUBSCRIPTION_PRODUCT_ID=gymcode_pro_monthly' >> "$ENV_FILE"

echo ""
echo "→ Reiniciando backend..."
cd "$ROOT"
docker compose -f docker-compose.prod.yml up -d backend --build --force-recreate

echo ""
echo "→ Verificando variáveis no container..."
docker exec gymapp-backend node -e "
const fs = require('fs');
const pkg = process.env.GOOGLE_PLAY_PACKAGE_NAME;
const path = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
const product = process.env.SUBSCRIPTION_PRODUCT_ID;
console.log('GOOGLE_PLAY_PACKAGE_NAME=', pkg);
console.log('SUBSCRIPTION_PRODUCT_ID=', product);
console.log('JSON montado=', path, fs.existsSync(path) ? 'sim' : 'não');
"

echo ""
echo "✓ Pronto. Teste uma compra Pro no app Android (conta licença de teste)."
