#!/usr/bin/env bash
# Diagnóstico de e-mail — Cloudflare Email Routing
set -euo pipefail

DOMAIN="${1:-mygymcode.com}"

echo "📧 Diagnóstico Email Routing — ${DOMAIN}"
echo "========================================"

echo ""
echo "1. MX (DNS público Cloudflare 1.1.1.1):"
MX=$(dig @1.1.1.1 +short "${DOMAIN}" MX 2>/dev/null | sort -n)
if [[ -n "$MX" ]]; then
  echo "$MX" | sed 's/^/   ✅ /'
else
  echo "   ❌ Nenhum MX — Email Routing não ativo ou DNS errado"
fi

echo ""
echo "2. SPF (TXT):"
dig @1.1.1.1 +short "${DOMAIN}" TXT 2>/dev/null | grep -i spf | sed 's/^/   /' || echo "   ⚠️  SPF não encontrado"

echo ""
echo "3. DNS local (roteador — pode estar desatualizado):"
LOCAL_MX=$(dig +short "${DOMAIN}" MX 2>/dev/null)
if [[ -n "$LOCAL_MX" ]]; then
  echo "$LOCAL_MX" | sed 's/^/   ✅ /'
else
  echo "   ⚠️  Vazio — normal se roteador usa DNS lento. Use 1.1.1.1 no Mac."
fi

echo ""
echo "4. Site (A record):"
dig @1.1.1.1 +short "${DOMAIN}" A | sed 's/^/   /'

echo ""
echo "========================================"
echo "Checklist Cloudflare (painel):"
echo "  [ ] Email Routing → Destination = Verified"
echo "  [ ] Routing rule criada (ex: contato → Gmail)"
echo "  [ ] Teste enviado de OUTRA conta (não o mesmo Gmail)"
echo "  [ ] Conferiu Spam e Promoções no Gmail"
echo "  [ ] Email Routing → Logs mostra entrega"
echo ""
echo "Teste de envio:"
echo "  De: outra conta (Outlook/iCloud)"
echo "  Para: contato@${DOMAIN}"
echo ""
echo "Corrigir DNS local do Mac:"
echo "  Ajustes → Wi-Fi → DNS → 1.1.1.1, 8.8.8.8"
