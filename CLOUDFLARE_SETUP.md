# 🌐 Migrar mygymcode.com para o Mac Mini (Cloudflare)

Seu IP público detectado: **201.148.122.166**  
IP local do Mac: **192.168.18.142**

---

## Visão geral

```
Usuário → Cloudflare DNS → Seu roteador (80/443) → Mac Mini → Caddy → App
```

O Cloudflare continua gerenciando o DNS. O app passa a rodar no Mac Mini em vez de Netlify/Render.

---

## Passo 1 — Port forwarding no roteador

No painel do roteador, encaminhe para **192.168.18.142**:

| Porta externa | Porta interna | IP destino      |
|---------------|--------------|-----------------|
| 80 (TCP)      | 80           | 192.168.18.142  |
| 443 (TCP)     | 443          | 192.168.18.142  |
| 443 (UDP)     | 443          | 192.168.18.142  |

> UDP 443 é usado pelo HTTP/3 (QUIC). TCP 443 é obrigatório.

---

## Passo 2 — DNS no Cloudflare

Acesse: [dash.cloudflare.com](https://dash.cloudflare.com) → **mygymcode.com** → **DNS** → **Records**

### Remova ou desative registros antigos

- CNAME/A apontando para **Netlify** (`*.netlify.app`, etc.)
- CNAME/A apontando para **Render**

### Adicione/atualize

| Tipo | Nome | Conteúdo           | Proxy     | TTL  |
|------|------|--------------------|-----------|------|
| A    | `@`  | `201.148.122.166`  | DNS only  | Auto |
| A    | `www`| `201.148.122.166`  | DNS only  | Auto |

**Importante:** use **DNS only** (nuvem cinza) na primeira configuração.  
Isso permite ao Caddy obter certificado Let's Encrypt sem conflito com o proxy Cloudflare.

Depois que estiver estável, você pode ativar o proxy (nuvem laranja) com SSL mode **Full (strict)**.

---

## Passo 3 — Configurar o Mac Mini

Edite `~/gymapp/.env`:

```env
DOMAIN=mygymcode.com
ACME_EMAIL=seu@gmail.com          # qualquer e-mail seu — NÃO precisa ser @mygymcode.com

FRONTEND_URL=https://mygymcode.com
CORS_ORIGINS=https://www.mygymcode.com,https://letsgym.netlify.app

VITE_API_URL=
VITE_APP_URL=https://mygymcode.com
```

Ative o domínio:

```bash
cd ~/gymapp
./scripts/enable-domain.sh seu@gmail.com
```

Ou manualmente:

```bash
./scripts/select-caddyfile.sh
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Passo 4 — Verificar

Aguarde 2–5 min (propagação DNS + certificado SSL):

```bash
make health-domain   # testa https://mygymcode.com
curl -I https://mygymcode.com/health
```

No browser: **https://mygymcode.com**

---

## Passo 5 — Desligar serviços antigos (opcional)

Quando confirmar que tudo funciona:

1. **Netlify** — pause ou remova o site
2. **Render** — suspenda o backend
3. **Neon** — mantenha backup se migrou dados; depois pode desativar

---

## IP dinâmico (se mudar)

Se seu provedor troca o IP, use uma das opções:

1. **Cloudflare DDNS** — script no Mac atualiza o registro A automaticamente
2. **Cloudflare Tunnel** (`cloudflared`) — não precisa abrir portas no roteador

---

## Cloudflare SSL (depois de estabilizar)

Em **SSL/TLS** → **Overview**:

- Durante setup: **Full** ou deixe DNS only
- Com proxy laranja + cert Caddy: **Full (strict)**

---

## Troubleshooting

### Certificado não emite
- Confirme port forwarding 80/443
- Confirme DNS only (cinza) no Cloudflare
- `make logs` e veja logs do Caddy

### Site abre no Netlify ainda
- DNS demora até 48h (geralmente minutos)
- Limpe cache DNS: `sudo dscacheutil -flushcache`

### Funciona fora de casa mas não dentro (NAT hairpin)
- Acesse pelo IP local: http://192.168.18.142
- Ou configure split DNS no roteador

### Erro CORS
- Confirme `FRONTEND_URL=https://mygymcode.com` no `.env`
- Rebuild backend: `docker compose -f docker-compose.prod.yml up -d --build backend`

---

## Rollback rápido

Se algo der errado, volte o DNS no Cloudflare para Netlify/Render enquanto corrige o Mac.
