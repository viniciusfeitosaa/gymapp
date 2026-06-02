# 🏠 Gym Code — Homelab no Mac Mini

Guia para rodar **frontend + backend + PostgreSQL** inteiramente no seu Mac Mini M1, com Docker, de forma profissional e gratuita.

## Status rápido

```bash
make status    # containers
make health    # testa localhost
make health-lan # testa IP da rede (192.168.18.142)
make logs      # se algo falhar
```

- **Local:** http://localhost
- **Rede (LAN):** http://192.168.18.142

## Arquitetura

```
                    ┌─────────────────────────────────────┐
                    │           Mac Mini M1               │
                    │                                     │
  Browser/App  ───► │  Caddy (:80/:443)                   │
                    │    ├── /api/*  → Backend (:3001)    │
                    │    └── /*      → Frontend (Nginx)   │
                    │                                     │
                    │  PostgreSQL (volume persistente)    │
                    └─────────────────────────────────────┘
```

| Serviço    | Container          | Função                          |
|------------|--------------------|---------------------------------|
| Caddy      | `gymapp-caddy`     | Proxy reverso + HTTPS automático |
| Frontend   | `gymapp-frontend`  | React build + Nginx             |
| Backend    | `gymapp-backend`   | Node.js + Express + Prisma      |
| PostgreSQL | `gymapp-postgres`  | Banco de dados local            |

---

## Pré-requisitos

1. **Docker Desktop** para Mac (Apple Silicon):
   ```bash
   brew install --cask docker
   ```
   Abra o Docker Desktop e aguarde o ícone ficar verde.

2. **Git** (já vem no macOS ou via Xcode CLI).

---

## Setup rápido (primeira vez)

```bash
cd ~/gymapp
cp .env.example .env
# Edite .env se quiser (opcional no primeiro teste)

make setup
```

O script `setup.sh`:
- Verifica se o Docker está rodando
- Gera `JWT_SECRET` e `POSTGRES_PASSWORD` automaticamente
- Sobe toda a stack de produção

Acesse: **http://localhost** (ou `http://IP_DO_MAC_NA_REDE` de outro dispositivo)

---

## Comandos do dia a dia

| Comando          | O que faz                              |
|------------------|----------------------------------------|
| `make prod`      | Sobe/reinicia produção                 |
| `make stop`      | Para a stack                           |
| `make logs`      | Logs em tempo real                     |
| `make status`    | Status dos containers                  |
| `make backup`    | Backup do PostgreSQL (gzip)            |
| `make update`    | `git pull` + rebuild                   |
| `make dev`       | Modo desenvolvimento (hot reload)      |

---

## Acesso na rede local (LAN)

No `.env`, use:

```env
DOMAIN=:80
FRONTEND_URL=http://192.168.x.x
VITE_APP_URL=http://192.168.x.x
```

Descubra o IP do Mac:
```bash
ipconfig getifaddr en0
```

Outros dispositivos na mesma Wi‑Fi acessam `http://192.168.x.x`.

---

## Domínio próprio com HTTPS (mygymcode.com)

1. Aponte o DNS do domínio para o IP público da sua internet (registro A).
2. No roteador, faça **port forwarding**: 80 → Mac e 443 → Mac.
3. No `.env`:

```env
DOMAIN=mygymcode.com
ACME_EMAIL=seu@email.com
FRONTEND_URL=https://mygymcode.com
VITE_APP_URL=https://mygymcode.com
CORS_ORIGINS=https://letsgym.netlify.app
```

4. Rebuild:
   ```bash
   make prod
   ```

O Caddy obtém certificado SSL automaticamente (Let's Encrypt).

> **Dica:** Para testar antes de desligar Netlify/Render, use um subdomínio como `homelab.mygymcode.com`.

---

## Migrar dados do Neon (PostgreSQL na nuvem)

### 1. Exportar do Neon

```bash
pg_dump "postgresql://USER:PASS@HOST/neondb?sslmode=require" | gzip > neon_backup.sql.gz
```

(Use a `DATABASE_URL` que está no painel do Render/Neon.)

### 2. Subir o homelab

```bash
make setup
```

### 3. Importar no PostgreSQL local

```bash
gunzip -c neon_backup.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U gymapp -d gymapp
```

---

## Assinaturas (App Store / Google Play)

Quando publicar o app nas lojas, configure os webhooks:

```
POST /api/webhooks/apple   — App Store Server Notifications
POST /api/webhooks/google  — Google Play Real-time Developer Notifications
POST /api/subscription/verify-purchase — validação de recibo pelo app
```

Variáveis futuras no `.env`: `APPLE_APP_SHARED_SECRET`, `GOOGLE_PLAY_PACKAGE_NAME`.

---

## Backups automáticos (cron)

Edite o crontab do Mac:

```bash
crontab -e
```

Adicione backup diário às 3h:

```
0 3 * * * /Users/vinicius/gymapp/scripts/backup-db.sh >> /Users/vinicius/gymapp/backups/backup.log 2>&1
```

Backups ficam em `~/gymapp/backups/`.

---

## Modo desenvolvimento

Para codar com hot reload (Vite + ts-node-dev):

```bash
make dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3001  
- Postgres: localhost:5432  

---

## Manter o Mac acordado (servidor 24/7)

Em **Ajustes do Sistema → Bateria/Energia** (ou **Desktop e Dock** em versões antigas):
- Desative "Colocar discos rígidos em repouso quando possível"
- Ative "Impedir repouso automático quando o display estiver desligado" (se disponível)

Ou via terminal:
```bash
sudo pmset -a sleep 0 disksleep 0 displaysleep 10
```

---

## Troubleshooting

### Docker não encontrado
```bash
brew install --cask docker
# Abra Docker Desktop
```

### Porta 80 em uso
Altere no `.env`: `HTTP_PORT=8080` e acesse `http://localhost:8080`.

### Backend não conecta ao banco
```bash
make logs-backend
docker compose -f docker-compose.prod.yml ps
```

### CORS error
Confirme que `FRONTEND_URL` no `.env` bate com a URL que você usa no browser.

### Reset completo (apaga banco!)
```bash
make clean
make setup
```

---

## Comparativo: antes vs agora

| Antes              | Agora (Homelab)        |
|--------------------|------------------------|
| Netlify (front)    | Nginx no Docker        |
| Render (back)      | Node no Docker         |
| Neon (DB)          | PostgreSQL no Docker   |
| Hiberna / cold start | Sempre ligado        |
| $0 mas limitado    | $0, só energia elétrica |

Quando tiver clientes, você pode migrar para VPS/cloud mantendo a mesma stack Docker.
