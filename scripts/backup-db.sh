#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP_DIR="${ROOT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/gymapp_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

source .env 2>/dev/null || true
POSTGRES_USER="${POSTGRES_USER:-gymapp}"
POSTGRES_DB="${POSTGRES_DB:-gymapp}"

echo "📦 Criando backup do banco..."
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"

echo "✅ Backup salvo em: $BACKUP_FILE"

# Manter apenas os 10 backups mais recentes
ls -t "$BACKUP_DIR"/gymapp_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f 2>/dev/null || \
  ls -t "$BACKUP_DIR"/gymapp_*.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
