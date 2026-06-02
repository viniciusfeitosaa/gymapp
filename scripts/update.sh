#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔄 Atualizando Gym Code..."

git pull origin main

docker compose -f docker-compose.prod.yml up -d --build

echo "✅ Atualização concluída."
