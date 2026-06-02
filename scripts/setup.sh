#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🏋️  Gym Code — Setup do homelab"
echo "================================"

# Verificar Docker
if ! command -v docker &>/dev/null; then
  echo "❌ Docker não encontrado."
  echo "   Instale com: brew install --cask docker"
  echo "   Depois abra o Docker Desktop e rode este script novamente."
  exit 1
fi

if ! docker info &>/dev/null; then
  echo "❌ Docker está instalado mas não está rodando."
  echo "   Abra o Docker Desktop e aguarde iniciar."
  exit 1
fi

# Criar .env se não existir
if [[ ! -f .env ]]; then
  echo "📝 Criando arquivo .env..."
  cp .env.example .env

  # Gerar secrets
  JWT_SECRET=$(openssl rand -hex 64)
  POSTGRES_PASSWORD=$(openssl rand -hex 24)

  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
    sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
  else
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
  fi

  echo "✅ .env criado com JWT_SECRET e POSTGRES_PASSWORD gerados automaticamente."
  echo "   Edite .env para configurar DOMAIN, chaves de API, etc."
else
  echo "ℹ️  .env já existe — mantendo configuração atual."
fi

echo ""
echo "🚀 Subindo stack de produção..."
./scripts/select-caddyfile.sh
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "✅ Setup concluído!"
echo ""
echo "   App:     http://localhost  (ou http://SEU_IP_NA_REDE)"
echo "   API:     http://localhost/api"
echo "   Health:  http://localhost/health"
echo ""
echo "   Comandos úteis:"
echo "   make logs      — ver logs"
echo "   make stop      — parar tudo"
echo "   make backup    — backup do banco"
echo "   make dev       — modo desenvolvimento"
