# Cloudflare Tunnel — Gym Code no ar (sem port forwarding)

Funciona com **CGNAT**. Não precisa abrir portas 80/443 no roteador.

## Como funciona

```
Usuário → Cloudflare (HTTPS) → Tunnel → cloudflared (Docker) → Caddy → App
```

Arquivos locais:

- [`infra/cloudflared/config.yml`](infra/cloudflared/config.yml) — rotas ingress
- [`infra/cloudflared/credentials.json`](infra/cloudflared/credentials.json) — segredo do túnel (não commitar)

---

## Setup recomendado (CLI + Docker)

### 1. Login no Cloudflare (uma vez)

```bash
cloudflared tunnel login
```

Confirme: `~/.cloudflared/cert.pem` existe.

### 2. Túnel e credenciais

Se já existe o túnel **GYMCODE** no painel, exporte credenciais:

```bash
cloudflared tunnel token GYMCODE
```

Monte `infra/cloudflared/credentials.json`:

```json
{
  "AccountTag": "SEU_ACCOUNT_TAG",
  "TunnelID": "SEU_TUNNEL_UUID",
  "TunnelSecret": "SEU_SECRET"
}
```

(O `TunnelSecret` corresponde ao campo `s` do token decodificado.)

Ou crie túnel novo:

```bash
cloudflared tunnel create gymapp-homelab
cp ~/.cloudflared/<tunnel-id>.json infra/cloudflared/credentials.json
```

Edite `infra/cloudflared/config.yml` com o `tunnel:` ID correto.

Valide:

```bash
cloudflared tunnel --config infra/cloudflared/config.yml ingress validate
```

### 3. DNS

```bash
cloudflared tunnel route dns -f GYMCODE mygymcode.com
cloudflared tunnel route dns -f GYMCODE www.mygymcode.com
```

Se falhar (registro já existe), apague registros **A** antigos no painel DNS ou use CNAME para o túnel.

### 4. Ingress com www (túnel remotely-managed)

Túneis criados no painel Zero Trust ignoram `config.yml` para rotas — use a API:

1. Crie API Token: **Cloudflare Tunnel → Edit**
2. No `.env`: `CLOUDFLARE_API_TOKEN=...`
3. Rode:

```bash
./scripts/cloudflare-update-ingress.sh
```

Ou adicione manualmente no painel: **www.mygymcode.com** → `http://caddy:80` (sem espaço no final).

### 5. Subir stack

```bash
cd ~/gymapp
./scripts/setup-tunnel.sh
```

---

## Importante: não rode cloudflared fora do Docker

Se existir `/Library/LaunchDaemons/com.cloudflare.cloudflared.plist`, ele compete com o container e causa **502** (host não resolve `caddy`).

Desative:

```bash
sudo launchctl bootout system/com.cloudflare.cloudflared
sudo mv /Library/LaunchDaemons/com.cloudflare.cloudflared.plist /Library/LaunchDaemons/com.cloudflare.cloudflared.plist.disabled
```

---

## Variáveis `.env`

```env
USE_CLOUDFLARE_TUNNEL=1
DOMAIN=:80
FRONTEND_URL=https://mygymcode.com
VITE_API_URL=
VITE_APP_URL=https://mygymcode.com
CORS_ORIGINS=https://www.mygymcode.com

# Opcional — atualizar ingress (www) via API
# CLOUDFLARE_API_TOKEN=
# CLOUDFLARE_ACCOUNT_ID=e74bbfe39f2c7d54e214eddcdcd2d3a0
# CLOUDFLARE_TUNNEL_ID=a1a7da43-11ca-42ba-8f1c-fda18998fb43
```

`CLOUDFLARE_TUNNEL_TOKEN` não é mais necessário com `credentials.json`.

---

## Testar

```bash
curl -sI https://mygymcode.com
curl -sI https://www.mygymcode.com
docker compose -f docker-compose.prod.yml logs cloudflared --tail 15
```

Sucesso: `HTTP/2 200` e log `Registered tunnel connection`.

Rede local: **http://192.168.18.142**

---

## Troubleshooting

### 502 Bad Gateway

- `cloudflared` rodando no Mac **fora** do Docker → desative LaunchDaemon (acima).
- Caddy parado: `docker compose ps`.

### `invalid port ":80 " after host`

- Espaço no fim da URL no painel. Use exatamente `http://caddy:80`.

### www retorna 404

- Falta rota ingress para `www` no túnel remoto → `./scripts/cloudflare-update-ingress.sh` ou painel.

### DNS local aponta para IP da operadora

- Roteador/DNS local pode resolver `mygymcode.com` para `201.148.122.166`.
- Teste com: `curl --resolve mygymcode.com:443:104.21.18.245 -sI https://mygymcode.com`
- Use DNS público (1.1.1.1) no Mac ou aguarde propagação.

### Tunnel não conecta

- Regenerar credenciais: `cloudflared tunnel token GYMCODE` e atualizar `credentials.json`.
