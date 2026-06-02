#!/usr/bin/env bash
# Cria registros MX + SPF do Email Routing no DNS Cloudflare
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EMAIL_DOMAIN="${1:-mygymcode.com}"
ENV_FILE="${ROOT_DIR}/.env"

if [[ -f "$ENV_FILE" ]]; then
  CLOUDFLARE_API_TOKEN="$(grep -E '^CLOUDFLARE_API_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d ' "'\''')" || true
  export CLOUDFLARE_API_TOKEN
fi

exec python3 - "$EMAIL_DOMAIN" << 'PY'
import base64, json, re, sys, urllib.request, urllib.error
from pathlib import Path

domain = sys.argv[1]

def get_token():
    if __import__("os").environ.get("CLOUDFLARE_API_TOKEN"):
        return __import__("os").environ["CLOUDFLARE_API_TOKEN"]
    cert = Path.home() / ".cloudflared/cert.pem"
    text = cert.read_text()
    m = re.search(r"-----BEGIN ARGO TUNNEL TOKEN-----\n(.+)\n-----END", text, re.S)
    if not m:
        raise SystemExit("❌ Sem token. Rode: cloudflared tunnel login")
    return json.loads(base64.b64decode(m.group(1)))["apiToken"]

def api(token, method, path, body=None):
    url = f"https://api.cloudflare.com/client/v4{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

token = get_token()
print(f"📧 Email Routing DNS — {domain}")
print("=" * 40)

zones = api(token, "GET", f"/zones?name={domain}")
if not zones.get("success") or not zones.get("result"):
    print("❌ Zona não encontrada:", zones.get("errors"))
    sys.exit(1)

zone_id = zones["result"][0]["id"]
print(f"✅ Zone ID: {zone_id}")

records = [
    ("MX", "@", "route1.mx.cloudflare.net", 5),
    ("MX", "@", "route2.mx.cloudflare.net", 79),
    ("MX", "@", "route3.mx.cloudflare.net", 4),
    ("TXT", "@", "v=spf1 include:_spf.mx.cloudflare.net ~all", None),
]

listed = api(token, "GET", f"/zones/{zone_id}/dns_records?per_page=200")
existing = listed.get("result", [])

for typ, name, content, priority in records:
    dup = False
    for r in existing:
        if r["type"] != typ:
            continue
        if not r["name"].endswith(domain.replace("@", "")) and r["name"] not in (domain, "@", name):
            continue
        if r.get("content", "").rstrip(".") != content.rstrip("."):
            continue
        if typ == "MX" and r.get("priority") != priority:
            continue
        dup = True
        break
    if dup:
        print(f"   ⏭️  já existe: {typ} {content}")
        continue
    body = {"type": typ, "name": name, "content": content, "ttl": 1}
    if typ == "MX":
        body["priority"] = priority
    res = api(token, "POST", f"/zones/{zone_id}/dns_records", body)
    if res.get("success"):
        print(f"   ✅ criado: {typ} {content}")
    else:
        print(f"   ❌ {typ} {content}: {res.get('errors')}")
        sys.exit(1)

print("\n⚠️  Só MX no DNS NÃO ativa o encaminhamento.")
print("   Rode também: ./scripts/enable-email-routing.sh")
print("   Ou no painel: Email Routing → Enable Email Routing")
print(f"\n⏳ Teste MX: dig @1.1.1.1 +short {domain} MX")
PY
