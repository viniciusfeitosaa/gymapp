# ✅ Checklist de Deploy - GymApp

## 🎯 Resumo Executivo

```
Backend:  Render (Docker) + Neon PostgreSQL
Frontend: Netlify (Build estático)
Custo:    $0/mês (Free tier completo)
```

---

## 📦 PREPARAÇÃO (Você já fez!)

- [x] Código no GitHub: https://github.com/viniciusfeitosaa/gymapp
- [x] Dockerfiles de produção criados
- [x] Configurações do Render e Netlify prontas
- [x] Guias de deploy criados
- [x] Push para GitHub concluído

---

## 🔧 PASSO 1: BACKEND NO RENDER

### Configuração Inicial
- [ ] Acessar https://dashboard.render.com/
- [ ] Criar conta (usar GitHub para login)
- [ ] Clicar em "New +" → "Web Service"

### Conectar Repositório
- [ ] Conectar com GitHub
- [ ] Selecionar repositório: `viniciusfeitosaa/gymapp`
- [ ] Autorizar acesso se necessário

### Configurar Serviço
- [ ] **Name**: `gymapp-backend`
- [ ] **Region**: Oregon (US West)
- [ ] **Branch**: `main`
- [ ] **Root Directory**: `backend`
- [ ] **Environment**: Docker
- [ ] **Dockerfile Path**: `./Dockerfile.production`
- [ ] **Docker Context**: `./`
- [ ] **Plan**: Free

### Variáveis de Ambiente
Clicar em "Advanced" e adicionar:

```
NODE_ENV = production
PORT = 3001
DATABASE_URL = postgresql://neondb_owner:npg_KURekdY30qnG@ep-still-credit-ai86ff0v-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET = 9d3293df8b34c86dc6ac73a5dde5a1702e725dedd37b4d0f57026b475e64b3c5e79341da0849f2bb4a8eadb0e625181edb2364b48c65b3768f26dbf8f9513376
FRONTEND_URL = https://seu-app.netlify.app
```

**⚠️ Atenção**: Você vai atualizar `FRONTEND_URL` depois que o Netlify gerar a URL

### Deploy
- [ ] Clicar em "Create Web Service"
- [ ] Aguardar build (5-10 minutos)
- [ ] Verificar logs (deve aparecer "Server is running")
- [ ] Testar health check: `https://seu-app.onrender.com/health`

### Anotar URL do Backend
```
Backend URL: https://_____________________.onrender.com
```

---

## 🌐 PASSO 2: FRONTEND NO NETLIFY

### Configuração Inicial
- [ ] Acessar https://app.netlify.com/
- [ ] Criar conta (usar GitHub para login)
- [ ] Clicar em "Add new site" → "Import an existing project"

### Conectar Repositório
- [ ] Conectar com GitHub
- [ ] Selecionar repositório: `viniciusfeitosaa/gymapp`
- [ ] Autorizar acesso se necessário

### Configurar Build
- [ ] **Site name**: `gymapp` (ou nome disponível)
- [ ] **Branch to deploy**: `main`
- [ ] **Base directory**: `frontend`
- [ ] **Build command**: `npm run build`
- [ ] **Publish directory**: `frontend/dist`

### Variáveis de Ambiente
Clicar em "Show advanced" → "New variable":

```
VITE_API_URL = https://SEU-BACKEND.onrender.com
```

**⚠️ Usar a URL do backend que você anotou no Passo 1**

### Deploy
- [ ] Clicar em "Deploy site"
- [ ] Aguardar build (2-5 minutos)
- [ ] Verificar se site está no ar

### Anotar URL do Frontend
```
Frontend URL: https://_____________________.netlify.app
```

---

## 🔄 PASSO 3: ATUALIZAR URLs CRUZADAS

### Atualizar Backend (Render)
- [ ] Voltar ao Render Dashboard
- [ ] Acessar seu serviço `gymapp-backend`
- [ ] Ir em "Environment"
- [ ] Atualizar `FRONTEND_URL` com a URL do Netlify
- [ ] Salvar (vai fazer redeploy automático)

### Verificar Frontend (Netlify)
- [ ] Voltar ao Netlify Dashboard
- [ ] Verificar que `VITE_API_URL` está com URL correta do Render
- [ ] Se mudou algo, fazer redeploy manual

---

## 🧪 PASSO 4: TESTAR APLICAÇÃO

### Teste Backend
```bash
# Health check
curl https://SEU-BACKEND.onrender.com/health

# Deve retornar: {"status":"ok","message":"GymConnect API is running!"}
```

### Teste Frontend
- [ ] Abrir URL do Netlify no navegador
- [ ] Verificar se página carrega
- [ ] Abrir DevTools (F12) → Console (verificar erros)
- [ ] Abrir DevTools → Network (verificar chamadas API)

### Teste Integração
- [ ] Tentar fazer cadastro de novo Personal Trainer
- [ ] Tentar fazer login
- [ ] Criar um aluno
- [ ] Criar um treino
- [ ] Fazer logout

### Checklist de Funcionalidades
- [ ] Cadastro funciona
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar aluno funciona
- [ ] Código de 5 dígitos é gerado
- [ ] Login de aluno funciona
- [ ] Criar treino funciona

---

## 🐛 TROUBLESHOOTING

### Backend não inicia
```bash
# Verificar logs no Render:
Dashboard → Seu serviço → Logs

# Problemas comuns:
- DATABASE_URL incorreta
- Migrations não rodaram
- JWT_SECRET faltando
```

### Frontend carrega mas não conecta API
```bash
# Abrir DevTools (F12) → Console
# Procurar por:
- CORS errors → Verificar FRONTEND_URL no backend
- Network failed → Backend pode estar hibernando (aguardar 30s)
- 404 errors → VITE_API_URL está errada
```

### Build falha no Render
```bash
# Testar build localmente:
cd backend
npm install
npm run build

# Se falhar, corrigir erros antes de fazer deploy
```

### Build falha no Netlify
```bash
# Testar build localmente:
cd frontend
npm install
npm run build

# Se falhar, corrigir erros antes de fazer deploy
```

---

## 📊 MONITORAMENTO

### Render (Backend)
```
Dashboard URL: https://dashboard.render.com/
Logs: Real-time
Metrics: CPU, Memory, Requests
Uptime: 99.99% (Free tier hiberna após 15min)
```

### Netlify (Frontend)
```
Dashboard URL: https://app.netlify.com/
Deploy previews: Automático em cada PR
Analytics: Visitors, bandwidth
Uptime: 99.99%
```

### Neon Database
```
Dashboard URL: https://console.neon.tech/
Storage: Até 0.5GB (free)
Queries: Ilimitadas
Connections: Pooling automático
```

---

## 💰 CUSTOS E LIMITES

### Render Free Tier
- ✅ 750 horas/mês
- ✅ 512MB RAM
- ✅ 0.1 CPU
- ⚠️ Hiberna após 15min inatividade
- ⚠️ Cold start: 30-60 segundos

### Netlify Free Tier
- ✅ 100GB bandwidth/mês
- ✅ 300 build minutes/mês
- ✅ Deploy ilimitados
- ✅ SSL grátis
- ✅ CDN global

### Neon Free Tier
- ✅ 0.5GB storage
- ✅ 1 projeto
- ✅ Branches ilimitadas
- ✅ Pooling de conexões

**💵 Total: $0/mês**

---

## 🚀 UPGRADES (Se necessário)

### Render Starter ($7/mês)
- Sem hibernação
- 512MB RAM
- Vale a pena se:
  - App precisa estar sempre disponível
  - Cold start é inaceitável
  - Muitos usuários simultâneos

### Netlify Pro ($19/mês)
- 400GB bandwidth
- Role-based access
- Vale a pena se:
  - Tráfego > 100GB/mês
  - Precisa de múltiplos ambientes
  - Analytics avançado

### Neon Pro ($19/mês)
- 10GB storage
- Projetos ilimitados
- Vale a pena se:
  - Banco cresce > 0.5GB
  - Precisa de múltiplos projetos
  - Backups automáticos

---

## ✅ DEPLOY CONCLUÍDO!

Quando tudo estiver funcionando:

```
✅ Backend no ar: https://_____.onrender.com
✅ Frontend no ar: https://_____.netlify.app
✅ Database: Neon PostgreSQL
✅ HTTPS: SSL grátis em ambos
✅ CI/CD: Deploy automático em cada push
✅ Custo: $0/mês
```

**🎉 PARABÉNS! Seu GymApp está no ar!**

---

## 📚 PRÓXIMOS PASSOS (Opcional)

- [ ] Configurar domínio personalizado
- [ ] Configurar monitoramento (UptimeRobot)
- [ ] Configurar backups do banco
- [ ] Adicionar Google Analytics
- [ ] Adicionar Sentry para error tracking
- [ ] Configurar CI/CD com testes automáticos
- [ ] Adicionar preview deploys no Netlify

---

**📝 Dicas Finais:**

1. Mantenha as URLs anotadas em lugar seguro
2. Monitore os limites do free tier
3. Teste sempre antes de fazer push
4. Use branches para features novas
5. Documente mudanças importantes

**🆘 Precisa de ajuda? Me chame!**
