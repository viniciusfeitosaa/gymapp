#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BASE_URL="${1:-http://localhost}"
API="${BASE_URL}/api"

echo "🏋️  Gym Code — Health check"
echo "=========================="

fail=0

check() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  if [[ "$code" =~ ^(200|301|302)$ ]]; then
    echo "✅ $name ($code) — $url"
  else
    echo "❌ $name ($code) — $url"
    fail=1
  fi
}

check "Frontend" "${BASE_URL}/"
check "Frontend health" "${BASE_URL}/health"
check "Backend health" "${BASE_URL}/health"
check "API root" "${BASE_URL}/"

echo ""
docker compose -f docker-compose.prod.yml ps

if [[ "$fail" -eq 0 ]]; then
  echo ""
  echo "✅ Stack operacional em ${BASE_URL}"
  echo "   Cadastro: ${BASE_URL}/register"
  echo "   Login:    ${BASE_URL}/login"
else
  echo ""
  echo "❌ Alguns checks falharam. Rode: make logs"
  exit 1
fi
