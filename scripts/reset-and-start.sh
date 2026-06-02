#!/usr/bin/env bash
# Reseta banco e sobe stack do zero (homelab — apaga todos os dados!)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "⚠️  Isso apaga TODOS os dados do banco local."
read -r -p "Continuar? (s/N) " confirm
if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
  echo "Cancelado."
  exit 0
fi

docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Aguardando serviços..."
sleep 15
./scripts/healthcheck.sh
