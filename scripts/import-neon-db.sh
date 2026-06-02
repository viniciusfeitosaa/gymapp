#!/usr/bin/env bash
# Importa um banco do Neon para o Postgres local do projeto (Docker).
# - Faz dump no Neon e salva em backups/neon/
# - Antes, cria backup do banco local atual (scripts/backup-db.sh)
# - Restaura sobrescrevendo o schema/data local
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NEON_DATABASE_URL="${NEON_DATABASE_URL:-}"
if [[ -z "$NEON_DATABASE_URL" ]]; then
  echo "❌ Defina NEON_DATABASE_URL no comando, por exemplo:"
  echo "   NEON_DATABASE_URL='postgresql://user:pass@host/db?sslmode=require&channel_binding=require' \\"
  echo "     ./scripts/import-neon-db.sh"
  exit 1
fi

if [[ ! -f ".env" ]]; then
  echo "❌ .env não encontrado no projeto."
  exit 1
fi

# shellcheck disable=SC1090
source .env 2>/dev/null || true

POSTGRES_USER="${POSTGRES_USER:-gymapp}"
POSTGRES_DB="${POSTGRES_DB:-gymapp}"

BACKUP_DIR="${ROOT_DIR}/backups/neon"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
NEON_DUMP_FILE="${BACKUP_DIR}/gymapp_neon_${TIMESTAMP}.sql.gz"

echo "🔐 Dump do Neon -> ${NEON_DUMP_FILE}"
echo "⚠️  Isso vai SOBRESCREVER o banco local (${POSTGRES_DB}) após restaurar."

echo "📦 Backup do banco local atual (antes de sobrescrever)..."
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh >/dev/null
echo "✅ Backup local criado em: ${ROOT_DIR}/backups/"

echo "⏸️  Parando backend durante restore..."
docker compose -f docker-compose.prod.yml stop backend >/dev/null 2>&1 || true

echo "📤 Criando dump do Neon..."
docker run --rm \
  -e NEON_DATABASE_URL="$NEON_DATABASE_URL" \
  -e NEON_DUMP_FILE="/out/$(basename "$NEON_DUMP_FILE")" \
  -e DUMP_TMP_FILE="/tmp/neon_dump.sql" \
  -v "${BACKUP_DIR}:/out" \
  postgres:17-alpine \
  sh -c 'set -eu; pg_dump "$NEON_DATABASE_URL" --format=plain --no-owner --no-privileges --clean --if-exists > "$DUMP_TMP_FILE"; gzip -c "$DUMP_TMP_FILE" > "$NEON_DUMP_FILE"; rm -f "$DUMP_TMP_FILE"'

echo "✅ Dump criado."

echo "🔄 Restaurando no Postgres local..."
echo "🧹 Limpando schema public antes de restaurar..."
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
gunzip -c "$NEON_DUMP_FILE" | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "✅ Restauração concluída."

echo "▶️  Reiniciando backend..."
docker compose -f docker-compose.prod.yml start backend >/dev/null 2>&1 || true

echo "🧪 Healthcheck (http://localhost)..."
chmod +x scripts/healthcheck.sh
./scripts/healthcheck.sh

