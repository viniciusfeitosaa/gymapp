#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_FILE="${1:-}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Uso: $0 <arquivo.sql.gz>"
  echo ""
  echo "Backups disponíveis:"
  ls -lh "${ROOT_DIR}/backups/"*.sql.gz 2>/dev/null || echo "  (nenhum backup encontrado)"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "❌ Arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

source .env 2>/dev/null || true
POSTGRES_USER="${POSTGRES_USER:-gymapp}"
POSTGRES_DB="${POSTGRES_DB:-gymapp}"

echo "⚠️  Isso vai SOBRESCREVER o banco atual. Continuar? (s/N)"
read -r confirm
if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
  echo "Cancelado."
  exit 0
fi

echo "📥 Restaurando backup..."
gunzip -c "$BACKUP_FILE" | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "✅ Backup restaurado."
