# Onde copiar o token CORRETO no Cloudflare

## ❌ O que NÃO é o token

| Onde aparece | Exemplo | Usar no .env? |
|--------------|---------|---------------|
| **Tunnel ID** (lista de túneis) | `d5d1a76c-7985-49a3-ad95-acb0d6cbaa52` | **NÃO** |
| **Connector ID** | UUID curto na tabela | **NÃO** |
| **Account ID** | na URL ou sidebar | **NÃO** |

Seu `.env` hoje tem o **Tunnel ID** — por isso não funciona.

---

## ✅ O que É o token (copiar isto)

1. Abra: **https://one.dash.cloudflare.com/**
2. Menu esquerdo: **Networks** → **Connectors**
3. Clique em **Cloudflare Tunnels**
4. Clique no nome do túnel: **GYMCODE** (não copie o ID da lista)
5. Você entra na página do túnel. Abas no topo:
   - **Overview** / Visão geral
6. Role até a seção **Install connector** / **Instalar conector**
7. Clique na aba **Docker**
8. Você verá um comando parecido com:

```bash
docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoiXXXXXXXX...
```

9. Copie **SOMENTE** o que vem depois de `--token ` (tudo, uma linha longa)

10. Cole no `.env`:

```env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...cole_aqui_sem_aspas
```

---

## Se não aparecer "Install connector"

- Aba **Configure** → **Install connector**
- Ou botão **Edit** / **Configure** no túnel
- Ou **⋯** (três pontos) → **Configure** → Docker

### Gerar token novo

Na mesma tela Docker, procure:
- **Refresh token**
- **Create token**
- **Regenerate token**

Gere um novo e copie o `eyJ...` completo.

---

## Validar antes de subir

```bash
cd ~/gymapp
./scripts/validate-tunnel-token.sh
```

Se passar:

```bash
docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared --force-recreate
docker compose -f docker-compose.prod.yml logs cloudflared --tail 5
```

Deve mostrar: `Registered tunnel connection`

---

## Checklist no painel (o que deve existir)

### Published routes (rotas)
| Hostname | Service |
|----------|---------|
| `mygymcode.com` | `http://caddy:80` (sem espaço no final) |
| `www.mygymcode.com` | `http://caddy:80` (sem espaço no final) |

### DNS (Records)
| Tipo | Nome | Destino |
|------|------|---------|
| CNAME | `@` | `....cfargotunnel.com` (proxied) |
| CNAME | `www` | `....cfargotunnel.com` (proxied) |

**Sem** registro A para `201.148.122.166`.

### Connector status
Na página do túnel, status do conector deve ficar **Healthy** / **Conectado** depois do token certo.

---

## Comparativo visual

```
Tunnel ID (ERRADO):     d5d1a76c-7985-49a3-ad95-acb0d6cbaa52
                        ↑ 36 caracteres, com hífens

Token (CERTO):          eyJhIjoiN2JkMzE4NGYtYjRkMy00...
                        ↑ ~180–250 caracteres, UMA linha, começa com eyJ
                        (não tem pontos — não é JWT de 3 partes)
```

---

## Erro: `Invalid tunnel secret`

O token **parece** certo (começa com `eyJ`) mas o Cloudflare rejeita o segredo.

**Causa:** token antigo, regenerado no painel, ou copiado incompleto.

**Solução:**

1. **one.dash.cloudflare.com** → **Tunnels** → **GYMCODE**
2. **Install connector** → **Docker** → **Refresh token** (ou **Regenerate**)
3. Copie o `eyJ...` **inteiro** após `--token`
4. No Mac:

```bash
cd ~/gymapp
chmod +x scripts/set-tunnel-token.sh
./scripts/set-tunnel-token.sh
# Enter → usa o que está no clipboard (Cmd+V antes)
```

5. Recrie o container:

```bash
docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared --force-recreate
docker compose -f docker-compose.prod.yml logs cloudflared --tail 8
```

Sucesso: `Registered tunnel connection` (sem `Invalid tunnel secret`).
