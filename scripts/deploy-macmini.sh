#!/usr/bin/env bash
# Deploy de produção no Mac Mini (manual ou via CI)
# Uso: ./scripts/deploy-macmini.sh
#      ./scripts/deploy-macmini.sh --no-git   # após rsync (runner self-hosted)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_GIT=false
for arg in "$@"; do
  case "$arg" in
    --no-git) SKIP_GIT=true ;;
  esac
done

# Permite CI apontar para ~/gymapp
if [[ -n "${DEPLOY_ROOT:-}" ]]; then
  ROOT_DIR="$(cd "$DEPLOY_ROOT" && pwd)"
fi

cd "$ROOT_DIR"

export PATH="/usr/local/bin:/opt/homebrew/bin:${PATH:-/usr/bin:/bin}"

# Runner/serviço não abre o Keychain do macOS (erro ao puxar imagens do Docker Hub)
if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
  CI_DOCKER_CONFIG="${TMPDIR:-/tmp}/gymapp-docker-config"
  rm -rf "$CI_DOCKER_CONFIG"
  mkdir -p "$CI_DOCKER_CONFIG/cli-plugins"
  if [[ -d "$HOME/.docker/cli-plugins" ]]; then
    cp -R "$HOME/.docker/cli-plugins/." "$CI_DOCKER_CONFIG/cli-plugins/"
  fi
  export CI_DOCKER_CONFIG
  python3 - <<'PY'
import json, os, pathlib
src = pathlib.Path(os.path.expanduser("~/.docker/config.json"))
dst = pathlib.Path(os.environ["CI_DOCKER_CONFIG"]) / "config.json"
cfg = json.loads(src.read_text()) if src.is_file() else {}
cfg.pop("credHelpers", None)
cfg["credsStore"] = ""
dst.write_text(json.dumps(cfg, indent=2) + "\n")
PY
  export DOCKER_CONFIG="$CI_DOCKER_CONFIG"
  export DOCKER_HOST="${DOCKER_HOST:-unix://${HOME}/.docker/run/docker.sock}"
fi

LOCK_DIR="${TMPDIR:-/tmp}/gymapp-deploy.lock.d"
_deploy_lock_acquire() {
  local i
  for i in $(seq 1 180); do
    if mkdir "$LOCK_DIR" 2>/dev/null; then
      trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT
      return 0
    fi
    [[ "$i" -eq 180 ]] && return 1
    sleep 5
  done
}
if ! _deploy_lock_acquire; then
  echo "❌ Outro deploy em andamento (aguarde até 15 min e tente de novo)"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker não acessível — abra o Docker Desktop no Mac Mini"
  exit 1
fi

echo "🚀 Gym Code — Deploy produção"
echo "   Diretório: $ROOT_DIR"
echo "================================"

if [[ ! -f .env ]]; then
  echo "❌ Arquivo .env não encontrado."
  echo "   Copie .env.example → .env e configure no Mac Mini (uma vez)."
  exit 1
fi

if [[ "$SKIP_GIT" != true ]]; then
  echo "📥 Atualizando código (git)..."
  git fetch origin main
  git checkout main
  git pull --ff-only origin main
else
  echo "⏭️  Pulando git pull (--no-git)"
fi

# Variáveis do shell não devem sobrescrever .env
unset SMTP_FROM SMTP_HOST SMTP_USER SMTP_PASS BREVO_API_KEY 2>/dev/null || true

echo "📄 Caddyfile..."
./scripts/select-caddyfile.sh

if [[ -x ./scripts/generate-maddy-config.sh ]]; then
  ./scripts/generate-maddy-config.sh 2>/dev/null || true
fi

COMPOSE_PROFILES=""
if grep -qE '^USE_CLOUDFLARE_TUNNEL=1' .env 2>/dev/null; then
  if [[ -f infra/cloudflared/credentials.json ]]; then
    COMPOSE_PROFILES="--profile tunnel"
    echo "🚇 Cloudflare Tunnel ativo"
  else
    echo "⚠️  USE_CLOUDFLARE_TUNNEL=1 mas falta infra/cloudflared/credentials.json"
  fi
fi

echo "🐳 Docker build + up..."
docker compose -f docker-compose.prod.yml $COMPOSE_PROFILES up -d --build

echo "🧹 Limpando imagens antigas..."
docker image prune -f >/dev/null 2>&1 || true

echo "⏳ Aguardando backend..."
for i in $(seq 1 30); do
  if docker compose -f docker-compose.prod.yml exec -T backend node -e \
    "require('http').get('http://127.0.0.1:3001/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" \
    2>/dev/null; then
    echo "✅ Backend healthy"
    break
  fi
  sleep 2
  if [[ "$i" -eq 30 ]]; then
    echo "⚠️  Health check demorou — veja: docker compose -f docker-compose.prod.yml logs backend --tail 30"
    exit 1
  fi
done

echo ""
echo "✅ Deploy concluído — $(date '+%Y-%m-%d %H:%M:%S')"
docker compose -f docker-compose.prod.yml ps --format 'table {{.Name}}\t{{.Status}}' 2>/dev/null | head -8
