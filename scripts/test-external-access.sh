#!/usr/bin/env bash
# Testa se portas 80/443 estão acessíveis externamente
set -euo pipefail

PUBLIC_IP="${1:-$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "201.148.122.166")}"

echo "🌐 Teste de acesso externo — Gym Code"
echo "======================================"
echo "IP público: ${PUBLIC_IP}"
echo ""

echo "1. App local (Mac Mini):"
LOCAL=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://192.168.18.142/ 2>/dev/null || echo "000")
if [[ "$LOCAL" =~ ^(200|301|302|308)$ ]]; then
  echo "   ✅ http://192.168.18.142 → HTTP ${LOCAL}"
else
  echo "   ❌ http://192.168.18.142 → HTTP ${LOCAL} (app não responde localmente)"
fi

echo ""
echo "2. DNS:"
DNS_IP=$(dig @1.1.1.1 +short mygymcode.com A 2>/dev/null | head -1)
echo "   mygymcode.com → ${DNS_IP:-?}"
if [[ "$DNS_IP" == "$PUBLIC_IP" ]]; then
  echo "   ✅ DNS bate com IP público"
else
  echo "   ⚠️  DNS (${DNS_IP}) ≠ IP público (${PUBLIC_IP}) — pode ser CGNAT"
fi

echo ""
echo "3. Portas abertas (teste online recomendado):"
echo "   Abra no browser:"
echo "   https://www.yougetsignal.com/tools/open-ports/"
echo "   IP: ${PUBLIC_IP}  |  Portas: 80, 443"
echo ""

echo "4. Caddy (certificado SSL):"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q gymapp-caddy; then
  ERRORS=$(docker logs gymapp-caddy 2>&1 | grep -c "Timeout during connect" || true)
  if [[ "$ERRORS" -gt 0 ]]; then
    echo "   ⚠️  ${ERRORS} tentativas falharam — portas provavelmente fechadas no roteador"
    echo "   → Configure port forwarding (veja HUAWEI_PORT_FORWARD.md)"
  else
    echo "   ✅ Sem erros de timeout recentes"
  fi
else
  echo "   ❌ Container gymapp-caddy não está rodando"
fi

echo ""
echo "5. Teste final (celular no 4G, Wi-Fi OFF):"
echo "   http://mygymcode.com"
echo ""
