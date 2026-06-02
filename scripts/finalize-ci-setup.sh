#!/usr/bin/env bash
# Verifica pré-requisitos do CI self-hosted
set -euo pipefail

echo "🔍 Verificando CI — Mac Mini"
echo "=============================="

OK=true

if [[ ! -f "$HOME/gymapp/.env" ]]; then
  echo "❌ ~/gymapp/.env não encontrado"
  OK=false
else
  echo "✅ .env de produção"
fi

if [[ ! -f "$HOME/gymapp/infra/cloudflared/credentials.json" ]]; then
  echo "⚠️  infra/cloudflared/credentials.json ausente (tunnel pode falhar)"
else
  echo "✅ Cloudflare tunnel credentials"
fi

if [[ ! -f "$HOME/actions-runner/.runner" ]]; then
  echo "❌ Runner NÃO configurado — rode: ./scripts/setup-github-runner.sh"
  OK=false
else
  echo "✅ Runner configurado"
fi

if [[ -f "$HOME/actions-runner/bin/Runner.Listener" ]]; then
  if file "$HOME/actions-runner/bin/Runner.Listener" | grep -q arm64; then
    echo "✅ Runner ARM64 (Apple Silicon)"
  else
    echo "❌ Runner arquitetura errada — rode setup-github-runner.sh de novo"
    OK=false
  fi
fi

if pgrep -f "Runner.Listener" >/dev/null 2>&1; then
  echo "✅ Runner em execução"
else
  echo "⚠️  Runner parado — inicie: sudo ~/actions-runner/svc.sh start"
fi

echo ""
echo "No GitHub (manual):"
echo "  Settings → Actions → Variables → DEPLOY_METHOD = self-hosted"
echo ""

if [[ "$OK" == true ]]; then
  echo "✅ Pronto para receber push na branch main"
else
  exit 1
fi
