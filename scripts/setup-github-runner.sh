#!/usr/bin/env bash
# Instala GitHub Actions self-hosted runner no Mac Mini (Opção A — deploy local)
# Uso: ./scripts/setup-github-runner.sh
set -euo pipefail

RUNNER_VERSION="${RUNNER_VERSION:-2.321.0}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"

# Corrige instalação x64 em Mac Apple Silicon
if [[ -f "$RUNNER_DIR/bin/Runner.Listener" ]] && file "$RUNNER_DIR/bin/Runner.Listener" | grep -q x86_64; then
  echo "⚠️  Runner x64 detectado em Mac ARM — será substituído pelo ARM64."
  rm -rf "$RUNNER_DIR/bin" "$RUNNER_DIR/externals"
fi
REPO="${GITHUB_REPO:-viniciusfeitosaa/gymapp}"
DEPLOY_PATH="${MACMINI_DEPLOY_PATH:-$HOME/gymapp}"

ARCH="$(uname -m)"
case "$ARCH" in
  arm64) RUNNER_ARCH="osx-arm64" ;;
  x86_64) RUNNER_ARCH="osx-x64" ;;
  *)
    echo "❌ Arquitetura não suportada: $ARCH"
    exit 1
    ;;
esac

RUNNER_TAR="actions-runner-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
RUNNER_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_TAR}"

echo "🤖 GitHub Actions Runner — Mac Mini"
echo "   Repositório: $REPO"
echo "   Pasta runner: $RUNNER_DIR"
echo "   Deploy app: $DEPLOY_PATH"
echo "================================"
echo ""

if [[ -z "${RUNNER_TOKEN:-}" ]]; then
  echo "1. Abra: https://github.com/${REPO}/settings/actions/runners/new"
  echo "2. macOS → ${ARCH} → copie só o TOKEN (não rode ./config.sh manualmente)"
  echo ""
  read -r -p "Cole o token aqui: " RUNNER_TOKEN
  echo ""
fi

if [[ -z "$RUNNER_TOKEN" ]]; then
  echo "❌ Token obrigatório"
  exit 1
fi

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [[ ! -f "$RUNNER_TAR" ]]; then
  echo "📥 Baixando runner ${RUNNER_VERSION} (${RUNNER_ARCH})..."
  curl -fsSL -o "$RUNNER_TAR" "$RUNNER_URL"
fi

if [[ ! -d bin ]]; then
  echo "📦 Extraindo..."
  tar xzf "$RUNNER_TAR"
fi

echo "⚙️  Configurando runner (nome: macmini-gymapp)..."
./config.sh remove 2>/dev/null || true
./config.sh \
  --url "https://github.com/${REPO}" \
  --token "$RUNNER_TOKEN" \
  --name "macmini-gymapp" \
  --labels "self-hosted,macOS,ARM64,production" \
  --work "_work" \
  --unattended \
  --replace

if [[ ! -f .runner ]]; then
  echo "❌ Configuração falhou. Gere um token NOVO e rode o script de novo."
  exit 1
fi

echo ""
echo "📌 Instalar como serviço (inicia com o Mac)? [s/N]"
read -r -p "> " INSTALL_SVC
if [[ "$INSTALL_SVC" =~ ^[sS]$ ]]; then
  echo "   Pode pedir senha de administrador..."
  sudo ./svc.sh install
  sudo ./svc.sh start
  sudo ./svc.sh status
else
  echo "   Para rodar manualmente: cd $RUNNER_DIR && ./run.sh"
fi

echo ""
echo "✅ Runner instalado!"
echo ""
echo "Próximo passo no GitHub (navegador):"
echo "   Settings → Actions → Variables → New variable"
echo "   Nome:  DEPLOY_METHOD"
echo "   Valor: self-hosted"
echo ""
echo "Opcional:"
echo "   MACMINI_DEPLOY_PATH = $DEPLOY_PATH"
echo ""
echo "Depois: git push origin main → Actions faz deploy automático"
