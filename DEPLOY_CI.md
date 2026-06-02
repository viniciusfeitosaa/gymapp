# Deploy automático — GitHub → Mac Mini

Fluxo: **qualquer PC** → `git push` → **GitHub Actions** → **Mac Mini** atualiza Docker em produção.

```
Seu PC / notebook          GitHub                    Mac Mini (homelab)
     │                        │                              │
     │  git push main         │                              │
     ├───────────────────────►│                              │
     │                        │  CI (SSH ou runner local)    │
     │                        ├─────────────────────────────►│
     │                        │         git pull + docker    │
     │                        │                              │
     │                        │                    mygymcode.com
```

---

## 1. Uma vez no Mac Mini

### 1.1 Clonar o repositório

```bash
cd ~
git clone https://github.com/viniciusfeitosaa/gymapp.git
cd gymapp
```

### 1.2 Criar `.env` de produção (não vai pro GitHub)

```bash
cp .env.example .env
# Edite: POSTGRES_PASSWORD, JWT_SECRET, FRONTEND_URL, BREVO_API_KEY, etc.
nano .env
```

Mantenha também (fora do Git):

- `infra/cloudflared/credentials.json` — túnel Cloudflare
- `~/.cloudflared/cert.pem` — se usar scripts de DNS

### 1.3 Primeiro deploy manual

```bash
chmod +x scripts/*.sh
./scripts/deploy-macmini.sh
```

Confirme: https://mygymcode.com

---

## 2. Opção A — Runner no Mac Mini (recomendado) ✅

O workflow roda **dentro do Mac** — não precisa abrir SSH na internet (ideal com CGNAT).

### Instalação automática

1. Abra (se não abrir sozinho):  
   https://github.com/viniciusfeitosaa/gymapp/settings/actions/runners/new

2. No Terminal do Mac Mini:

```bash
cd ~/gymapp
./scripts/setup-github-runner.sh
```

3. Cole o **token** que o GitHub mostra na página (válido por ~1 hora).

4. Quando perguntar, instale como **serviço** (`s`) para o runner subir com o Mac.

5. No GitHub → **Settings** → **Actions** → **Variables** → **New variable**:

| Name | Value |
|------|--------|
| `DEPLOY_METHOD` | `self-hosted` |

Opcional:

| Name | Value |
|------|--------|
| `MACMINI_DEPLOY_PATH` | `/Users/vinicius/gymapp` |

6. Faça push na `main` — em **Actions** deve aparecer o job verde.

---

## 2b. Opção B — SSH (alternativa)

O GitHub conecta por SSH e roda `git pull` + deploy.

**Requisitos:**

- SSH ativo no Mac: Ajustes → Geral → Compartilhamento → **Acesso remoto**
- Mac acessível por IP local, Tailscale (`100.x.x.x`) ou port forward na porta 22

**Secrets no GitHub** (Settings → Secrets and variables → Actions):

| Secret | Exemplo |
|--------|---------|
| `MACMINI_HOST` | `100.x.x.x` (Tailscale) ou IP local com port forward |
| `MACMINI_USER` | `vinicius` |
| `MACMINI_SSH_KEY` | chave privada SSH (conteúdo completo do `id_ed25519`) |
| `MACMINI_DEPLOY_PATH` | `/Users/vinicius/gymapp` |
| `MACMINI_SSH_PORT` | `22` (opcional) |

**Gerar chave só para CI (no Mac):**

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_actions_deploy -N ""
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
# Copie o conteúdo de ~/.ssh/github_actions_deploy → secret MACMINI_SSH_KEY no GitHub
```

**Variável de repositório** (obrigatória para esta opção): Settings → Actions → Variables

| Name | Value |
|------|--------|
| `DEPLOY_METHOD` | `ssh` |

---

## 3. No dia a dia (qualquer PC)

```bash
git clone https://github.com/viniciusfeitosaa/gymapp.git
cd gymapp
# ... editar código ...
git add .
git commit -m "feat: minha alteração"
git push origin main
```

Em ~3–10 minutos o Actions termina e o site atualiza.

Acompanhe: GitHub → **Actions** → workflow **Deploy produção (Mac Mini)**

---

## 4. Deploy manual (sem CI)

No Mac Mini:

```bash
cd ~/gymapp
./scripts/deploy-macmini.sh
```

---

## 5. O que NÃO vai pro GitHub

Já está no `.gitignore`:

- `.env` (senhas, JWT, Brevo, etc.)
- `infra/cloudflared/credentials.json`
- `node_modules`, volumes Docker

**Nunca** faça commit de secrets.

---

## 6. Solução de problemas

| Problema | O que fazer |
|--------|-------------|
| CI falha no SSH | Teste: `ssh -i ~/.ssh/github_actions_deploy user@HOST` |
| Runner offline | `sudo ./svc.sh status` em `~/actions-runner` |
| Deploy OK mas site 502 | `./scripts/fix-cloudflared-mac.sh` e recrie cloudflared |
| `.env` sumiu | Restaure backup; CI nunca apaga `.env` |
| Build lento | Normal na primeira vez; seguintes são mais rápidas |

---

## 7. Rollback rápido

No Mac Mini:

```bash
cd ~/gymapp
git log --oneline -5
git checkout <commit-anterior>
./scripts/deploy-macmini.sh
# Depois corrija main e push de novo
```
