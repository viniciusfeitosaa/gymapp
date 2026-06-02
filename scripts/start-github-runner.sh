#!/usr/bin/env bash
# Inicia o runner (foreground) — use serviço com: sudo ~/actions-runner/svc.sh start
set -euo pipefail
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"
cd "$RUNNER_DIR"
if [[ ! -f .runner ]]; then
  echo "❌ Runner não configurado. Rode: cd ~/gymapp && ./scripts/setup-github-runner.sh"
  exit 1
fi
exec ./run.sh
