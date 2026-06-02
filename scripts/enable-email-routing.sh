#!/usr/bin/env bash
# Liga o Email Routing de verdade (DNS sozinho não basta) + regra noreply → Gmail
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EMAIL_DOMAIN="${1:-mygymcode.com}"
ENV_FILE="${ROOT_DIR}/.env"
DEST_EMAIL="${2:-}"

if [[ -f "$ENV_FILE" ]]; then
  CLOUDFLARE_API_TOKEN="$(grep -E '^CLOUDFLARE_API_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d ' "'\''')" || true
  export CLOUDFLARE_API_TOKEN
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "📋 Cole no .env um API Token com permissões:"
  echo "   Zone → Email Routing Rules → Edit"
  echo "   Zone → Email Routing Addresses → Edit"
  echo "   Zone → DNS → Edit"
  echo ""
  echo "   Crie em: https://dash.cloudflare.com/profile/api-tokens"
  echo ""
  if [[ "$(uname)" == "Darwin" ]] && pbpaste &>/dev/null; then
    read -r -p "Cole o token e Enter (ou só Enter para cancelar): " TOKEN_IN
    if [[ -n "$TOKEN_IN" ]]; then
      if grep -q '^CLOUDFLARE_API_TOKEN=' "$ENV_FILE" 2>/dev/null; then
        sed -i '' "s|^CLOUDFLARE_API_TOKEN=.*|CLOUDFLARE_API_TOKEN=${TOKEN_IN}|" "$ENV_FILE"
      else
        echo "CLOUDFLARE_API_TOKEN=${TOKEN_IN}" >> "$ENV_FILE"
      fi
      export CLOUDFLARE_API_TOKEN="$TOKEN_IN"
    fi
  fi
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "❌ CLOUDFLARE_API_TOKEN obrigatório no .env"
  exit 1
fi

if [[ -z "$DEST_EMAIL" ]]; then
  read -r -p "Gmail de destino (encaminhar noreply@): " DEST_EMAIL
fi

export EMAIL_DOMAIN DEST_EMAIL CLOUDFLARE_API_TOKEN
exec python3 << 'PY'
import json, os, urllib.request, urllib.error

token = os.environ["CLOUDFLARE_API_TOKEN"]
domain = os.environ["EMAIL_DOMAIN"]
dest = os.environ["DEST_EMAIL"]

def api(method, path, body=None):
    url = f"https://api.cloudflare.com/client/v4{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

print(f"📧 Ativando Email Routing — {domain} → {dest}")
print("=" * 50)

zones = api("GET", f"/zones?name={domain}")
if not zones.get("success") or not zones["result"]:
    raise SystemExit(f"❌ Zona: {zones.get('errors')}")
zone_id = zones["result"][0]["id"]
print(f"✅ Zone: {zone_id}")

# 1) Habilita serviço + trava MX/SPF oficiais
en = api("POST", f"/zones/{zone_id}/email/routing/dns")
if not en.get("success"):
    raise SystemExit(f"❌ Ativar Email Routing: {en.get('errors')}")
r = en.get("result") or {}
print(f"✅ Email Routing: enabled={r.get('enabled')} status={r.get('status')}")

# 2) Destino (Gmail)
addrs = api("GET", f"/zones/{zone_id}/email/routing/addresses")
dest_ok = any(a.get("email") == dest and a.get("verified") for a in (addrs.get("result") or []))
if not dest_ok:
    created = api("POST", f"/zones/{zone_id}/email/routing/addresses", {"email": dest})
    if created.get("success"):
        print(f"📬 Confirme no Gmail o convite para: {dest}")
    else:
        print(f"⚠️  Destino: {created.get('errors')} — verifique manualmente no painel")

# 3) Regra noreply@
rules = api("GET", f"/zones/{zone_id}/email/routing/rules")
existing = rules.get("result") or []
has_noreply = any(
    (x.get("matchers") or [{}])[0].get("value") in ("noreply", "noreply@" + domain)
    for x in existing
)
if not has_noreply:
    rule = api("POST", f"/zones/{zone_id}/email/routing/rules", {
        "name": "noreply to gmail",
        "enabled": True,
        "matchers": [{"type": "literal", "field": "to", "value": "noreply@" + domain}],
        "actions": [{"type": "forward", "value": [dest]}],
    })
    if rule.get("success"):
        print("✅ Regra criada: noreply@" + domain + f" → {dest}")
    else:
        print(f"⚠️  Regra: {rule.get('errors')}")
else:
    print("✅ Regra noreply já existe")

print("\n⏳ Aguarde 2 min e teste de OUTRA conta para noreply@" + domain)
print("   Painel: Email Routing → Overview → Enabled")
PY
