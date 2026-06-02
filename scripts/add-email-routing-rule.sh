#!/usr/bin/env bash
# Adiciona regra Email Routing (ex: noreply@mygymcode.com → Gmail)
# Uso: ./scripts/add-email-routing-rule.sh noreply viniciusalves919@gmail.com
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
LOCAL="${1:-noreply}"
DOMAIN="${2:-mygymcode.com}"
DEST="${3:-}"

if [[ -f "$ENV_FILE" ]]; then
  CLOUDFLARE_API_TOKEN="$(grep -E '^CLOUDFLARE_API_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d ' "'\''')" || true
  DEST="${DEST:-$(grep -E '^ACME_EMAIL=' "$ENV_FILE" | cut -d= -f2- | tr -d ' "'\''')}"
fi

if [[ -z "$DEST" ]]; then
  read -r -p "E-mail de destino (Gmail): " DEST
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "❌ Defina CLOUDFLARE_API_TOKEN no .env (permissão Email Routing Rules Edit)"
  echo "   Ou adicione manualmente no painel:"
  echo "   Email Routing → Routing rules → Create address"
  echo "   Custom: ${LOCAL}  →  Send to: ${DEST}"
  exit 1
fi

TO_ADDR="${LOCAL}@${DOMAIN}"
export CLOUDFLARE_API_TOKEN DOMAIN TO_ADDR DEST

python3 << 'PY'
import json, os, urllib.request, urllib.error

token = os.environ["CLOUDFLARE_API_TOKEN"]
domain = os.environ["DOMAIN"]
to_addr = os.environ["TO_ADDR"]
dest = os.environ["DEST"]

def api(method, path, body=None):
    url = f"https://api.cloudflare.com/client/v4" + path
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

zones = api("GET", f"/zones?name={domain}")
zone_id = zones["result"][0]["id"]

rules = api("GET", f"/zones/{zone_id}/email/routing/rules")
for x in rules.get("result") or []:
    for m in x.get("matchers") or []:
        if m.get("value") in (to_addr, to_addr.split("@")[0]):
            print(f"✅ Regra já existe para {to_addr}")
            raise SystemExit(0)

res = api("POST", f"/zones/{zone_id}/email/routing/rules", {
    "name": f"{to_addr} → {dest}",
    "enabled": True,
    "matchers": [{"type": "literal", "field": "to", "value": to_addr}],
    "actions": [{"type": "forward", "value": [dest]}],
})
if res.get("success"):
    print(f"✅ Criada: {to_addr} → {dest}")
else:
    print(f"❌ {res.get('errors')}")
    raise SystemExit(1)
PY

echo ""
echo "Teste de outra conta para: ${TO_ADDR}"
