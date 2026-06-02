#!/usr/bin/env bash
# Remove cloudflared duplicado no macOS (LaunchDaemon) que causa 502 no site.
# Use só o container Docker gymapp-cloudflared.
set -euo pipefail

if [[ -f /Library/LaunchDaemons/com.cloudflare.cloudflared.plist ]]; then
  echo "🛑 Desativando cloudflared do sistema (LaunchDaemon)..."
  sudo launchctl bootout system/com.cloudflare.cloudflared 2>/dev/null || true
  sudo mv /Library/LaunchDaemons/com.cloudflare.cloudflared.plist \
    /Library/LaunchDaemons/com.cloudflare.cloudflared.plist.disabled 2>/dev/null || true
  echo "✅ Serviço do sistema desativado."
else
  echo "ℹ️  LaunchDaemon do cloudflared não encontrado (ok)."
fi

if pgrep -fl cloudflared >/dev/null 2>&1; then
  echo "⚠️  Ainda há processo cloudflared no host:"
  pgrep -fl cloudflared || true
  echo "   Mate manualmente se não for outro uso intencional."
fi

echo ""
echo "Suba só o túnel no Docker:"
echo "  cd ~/gymapp"
echo "  docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared --force-recreate"
