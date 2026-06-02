# E-mail no Gym Code — Maddy (grátis, Docker)

O app envia e-mails pelo **Maddy** no Docker. O backend fala com `maddy:587`; o Maddy entrega para o Gmail/outros.

**Cloudflare Email Routing** = só **receber** (`contato@` → Gmail). Não envia.

---

## Problema comum: porta 25 bloqueada

Se nos logs aparecer:

```text
remote: cannot use MX ... dial tcp ...:25: connect: connection refused
```

A **operadora bloqueou a porta 25 de saída** (comum no Brasil / CGNAT). O Maddy aceita o e-mail, mas não consegue falar com `gmail-smtp-in.l.google.com:25`.

**Solução:** relay SMTP na **porta 587** (Brevo grátis ou Gmail com senha de app). O Maddy continua no meio; só muda a saída.

---

## Setup completo

### 1. Credenciais Maddy (app → Maddy)

No `.env`:

```env
MADDY_SMTP_PASS=senha_interna_noreply
SMTP_HOST=maddy
SMTP_PORT=587
SMTP_USER=noreply@mygymcode.com
SMTP_PASS=senha_interna_noreply
SMTP_FROM=noreply@mygymcode.com
FRONTEND_URL=https://mygymcode.com
```

### 2. Relay de saída (Maddy → internet) — **obrigatório se porta 25 bloqueada**

#### Opção A — Brevo (grátis, ~300 e-mails/dia)

1. Crie conta em [brevo.com](https://www.brevo.com)
2. **SMTP & API** → gere chave SMTP
3. Verifique o domínio `mygymcode.com` (para `From: noreply@mygymcode.com`)
4. No `.env`:

```env
SMTP_RELAY_HOST=smtp-relay.brevo.com
SMTP_RELAY_PORT=587
SMTP_RELAY_USER=seu_login_smtp_brevo
SMTP_RELAY_PASS=sua_chave_smtp_brevo
```

#### Opção B — Gmail (teste rápido)

1. Google Account → Segurança → **Senha de app**
2. No `.env`:

```env
SMTP_RELAY_HOST=smtp.gmail.com
SMTP_RELAY_PORT=587
SMTP_RELAY_USER=seu@gmail.com
SMTP_RELAY_PASS=senha_de_app_16_caracteres
```

> O Gmail pode alterar o remetente ou ir para spam se `From:` for `@mygymcode.com` sem configurar “Enviar como”.

### 3. Gerar config e subir

```bash
cd ~/gymapp
chmod +x scripts/*.sh
./scripts/generate-maddy-config.sh   # usa relay se SMTP_RELAY_* estiver no .env
./scripts/setup-maddy-email.sh
docker compose -f docker-compose.prod.yml up -d --build backend
```

### 4. Testar

Login → Personal → **Esqueci minha senha**

```bash
docker compose -f docker-compose.prod.yml logs maddy --tail 20
```

Sucesso no relay: sem `cannot use MX` / `connection refused` na porta 25.

---

## Fluxo

```
App (backend) → maddy:587 → [relay 587] → Gmail do usuário
```

Sem relay (só funciona se porta 25 liberada):

```
App → maddy:587 → MX direto :25 → Gmail
```

---

## Erro 503 no forgot-password

- Falta `MADDY_SMTP_PASS` / `SMTP_PASS` no `.env`
- Maddy parado: `docker compose ps maddy`
- Relay não configurado com porta 25 bloqueada

---

## Cloudflare Tunnel + site fora do ar

**Não rode** `sudo cloudflared service install` **e** o container ao mesmo tempo — causa **502**.

```bash
./scripts/fix-cloudflared-mac.sh
docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared --force-recreate
```

Use `infra/cloudflared/credentials.json` (não dependa só de `CLOUDFLARE_TUNNEL_TOKEN` no `.env`).

---

## Comandos úteis

```bash
make maddy-setup
docker compose -f docker-compose.prod.yml logs maddy -f
docker exec gymapp-maddy maddy creds list
```
