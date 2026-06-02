#!/usr/bin/env bash
# Solução final Brevo: domínio via DNS (sem e-mail no noreply) + SMTP + Cloudflare DNS
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
DOMAIN="${1:-mygymcode.com}"
BREVO_LOGIN="${2:-viniciusalves919@gmail.com}"

cd "$ROOT_DIR"

get_cf_token() {
  if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo "$CLOUDFLARE_API_TOKEN"
    return
  fi
  python3 << 'PY'
import base64, json, re
from pathlib import Path
cert = Path.home() / ".cloudflared/cert.pem"
if not cert.exists():
    raise SystemExit("")
text = cert.read_text()
m = re.search(r"-----BEGIN ARGO TUNNEL TOKEN-----\n(.+)\n-----END", text, re.S)
if not m:
    raise SystemExit("")
print(json.loads(base64.b64decode(m.group(1)))["apiToken"])
PY
}

load_env_key() {
  grep -E "^${1}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d "\"'" || true
}

echo "📧 Gym Code — Setup final Brevo (${DOMAIN})"
echo "=============================================="
echo ""
echo "ℹ️  O Brevo NÃO manda verificação para noreply@ (por isso não aparece no Activity Log)."
echo "   Autenticação do domínio = registros DNS no Cloudflare."
echo ""

# --- Chaves Brevo ---
BREVO_API_KEY="$(load_env_key BREVO_API_KEY)"
SMTP_PASS_RAW="$(load_env_key SMTP_PASS)"

if [[ -z "$BREVO_API_KEY" ]]; then
  echo "Cole a chave API do Brevo (xkeysib-...) — Settings → SMTP & API → API keys"
  if [[ "$(uname)" == "Darwin" ]]; then
    read -r -p "Ou Enter para usar área de transferência: " IN
    [[ -z "$IN" ]] && IN="$(pbpaste 2>/dev/null || true)"
  else
    read -r -p "Chave API: " IN
  fi
  BREVO_API_KEY="$IN"
fi

if [[ -z "$BREVO_API_KEY" ]]; then
  echo "❌ BREVO_API_KEY obrigatória. Crie em https://app.brevo.com/settings/keys/api"
  exit 1
fi

if [[ -z "$SMTP_PASS_RAW" ]] || [[ "$(echo "$SMTP_PASS_RAW" | grep -c 'xsmtpsib-')" -gt 1 ]]; then
  echo ""
  echo "Cole a chave SMTP (xsmtpsib-...) — mesma página, aba SMTP"
  read -r -s -p "Chave SMTP: " SMTP_PASS_NEW
  echo ""
  SMTP_PASS_RAW="$SMTP_PASS_NEW"
fi

if [[ -z "$SMTP_PASS_RAW" ]]; then
  echo "❌ Chave SMTP obrigatória"
  exit 1
fi

# Limpa chave duplicada / espaços acidentais
SMTP_PASS_CLEAN="$(printf '%s' "$SMTP_PASS_RAW" | tr -d '[:space:]' | grep -oE 'xsmtpsib-[a-f0-9]+-[A-Za-z0-9]+' | head -1)"
[[ -z "$SMTP_PASS_CLEAN" ]] && SMTP_PASS_CLEAN="$(printf '%s' "$SMTP_PASS_RAW" | tr -d '[:space:]')"
BREVO_API_KEY="$(printf '%s' "$BREVO_API_KEY" | tr -d '[:space:]')"

update_env() {
  local k="$1" v="$2"
  local line="${k}=${v}"
  [[ "$v" == *" "* ]] && line="${k}=\"${v}\""
  if grep -q "^${k}=" "$ENV_FILE"; then
    sed -i '' "s|^${k}=.*|${line}|" "$ENV_FILE"
  else
    echo "$line" >> "$ENV_FILE"
  fi
}

update_env "BREVO_API_KEY" "$BREVO_API_KEY"
update_env "SMTP_HOST" "smtp-relay.sendinblue.com"
update_env "SMTP_PORT" "587"
update_env "SMTP_USER" "$BREVO_LOGIN"
update_env "SMTP_PASS" "$SMTP_PASS_CLEAN"
update_env "SMTP_FROM" "Gym Code <noreply@${DOMAIN}>"

export BREVO_API_KEY DOMAIN BREVO_LOGIN
CF_TOKEN="$(get_cf_token || true)"
export CF_TOKEN

echo ""
echo "🔧 Configurando domínio no Brevo + DNS Cloudflare..."

python3 << 'PY'
import json, os, re, urllib.request, urllib.error

api_key = os.environ["BREVO_API_KEY"]
domain = os.environ["DOMAIN"]
cf_token = os.environ.get("CF_TOKEN", "")

def brevo(method, path, body=None):
    url = "https://api.brevo.com/v3" + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "api-key": api_key,
        "accept": "application/json",
        "content-type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

def cf_api(method, path, body=None):
    if not cf_token:
        return {"success": False, "errors": [{"message": "no cf token"}]}
    url = "https://api.cloudflare.com/client/v4" + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {cf_token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

# Domínio no Brevo
info = brevo("GET", f"/senders/domains/{domain}")
if not info.get("domain") and info.get("code") == "domain_not_found":
    created = brevo("POST", "/senders/domains", {"name": domain})
    if not created.get("id") and not created.get("domain_name"):
        print("❌ Criar domínio:", created)
        raise SystemExit(1)
    info = created
    dns = created.get("dns_records") or {}
else:
    dns = (info.get("dns_records") or {})

print(f"✅ Domínio Brevo: {domain}")

if not cf_token:
    print("⚠️  Sem token Cloudflare — adicione DNS manualmente no painel:")
    print(json.dumps(dns, indent=2)[:800])
else:
    zones = cf_api("GET", f"/zones?name={domain}")
    zone_id = zones["result"][0]["id"]
    listed = cf_api("GET", f"/zones/{zone_id}/dns_records?per_page=200")
    existing = listed.get("result", [])

    def upsert_txt(name, content):
        for r in existing:
            if r["type"] == "TXT" and r["name"] == f"{name}.{domain}" and content in r.get("content", ""):
                return False
        body = {"type": "TXT", "name": name, "content": content, "ttl": 1}
        res = cf_api("POST", f"/zones/{zone_id}/dns_records", body)
        return res.get("success")

    def upsert_cname(name, target):
        fqdn = f"{name}.{domain}"
        for r in existing:
            if r["type"] == "CNAME" and r["name"] == fqdn:
                return False
        body = {"type": "CNAME", "name": name, "content": target, "ttl": 1}
        res = cf_api("POST", f"/zones/{zone_id}/dns_records", body)
        return res.get("success")

    for key, rec in dns.items():
        if not isinstance(rec, dict):
            continue
        host = rec.get("host_name") or rec.get("hostname") or "@"
        val = rec.get("value") or ""
        typ = (rec.get("type") or "TXT").upper()
        if not val:
            continue
        name = "@" if host in ("", "@", domain) else host.replace(f".{domain}", "").rstrip(".")
        if typ == "TXT":
            ok = upsert_txt(name, val)
            print(f"   {'✅' if ok else '⏭️ '} TXT {name}: {val[:50]}...")
        elif typ == "CNAME":
            ok = upsert_cname(name, val)
            print(f"   {'✅' if ok else '⏭️ '} CNAME {name} → {val}")

    print("⏳ Aguardando DNS (30s)...")
    import time
    time.sleep(30)
    auth = brevo("POST", f"/senders/domains/{domain}/authenticate")
    print("🔐 Autenticar:", auth.get("message") or auth)

    check = brevo("GET", f"/senders/domains/{domain}")
    print(f"   authenticated={check.get('authenticated')} verified={check.get('verified')}")

print("\n✅ .env atualizado (SMTP → Brevo, From: noreply@" + domain + ")")
PY

echo ""
echo "🚀 Reiniciando backend..."
docker compose -f docker-compose.prod.yml up -d backend --force-recreate

echo ""
echo "✅ Próximo: https://mygymcode.com/login → Esqueci minha senha"
echo "   (Não depende mais de receber e-mail do Brevo no noreply@)"
