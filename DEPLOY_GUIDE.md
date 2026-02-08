# 🚀 Deploy no Render (Backend) e Netlify (Frontend)

## 📦 Arquitetura de Deploy

- **Backend (API):** Render com Docker
- **Frontend (React):** Netlify com Docker
- **Database:** Neon Database (PostgreSQL)

---

## 🔧 PARTE 1: Deploy do Backend no Render

### 1️⃣ Preparar Variáveis de Ambiente

Você vai precisar:
- `DATABASE_URL` - Seu Neon Database URL
- `JWT_SECRET` - Sua chave JWT atual
- `FRONTEND_URL` - URL do Netlify (adicionar depois)

### 2️⃣ Deploy no Render

1. Acesse: https://dashboard.render.com/
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub: `viniciusfeitosaa/gymapp`
4. Configure:
   - **Name:** `gymapp-backend`
   - **Region:** Oregon (Free)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Environment:** `Docker`
   - **Dockerfile Path:** `./Dockerfile.production`
   - **Plan:** Free

5. **Environment Variables** (clique em "Advanced"):
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://neondb_owner:npg_KURekdY30qnG@ep-still-credit-ai86ff0v-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=9d3293df8b34c86dc6ac73a5dde5a1702e725dedd37b4d0f57026b475e64b3c5e79341da0849f2bb4a8eadb0e625181edb2364b48c65b3768f26dbf8f9513376
   FRONTEND_URL=https://seu-app.netlify.app
   ```

6. Clique em **"Create Web Service"**

7. **Aguarde o deploy** (5-10 minutos na primeira vez)

8. **Anote a URL do backend:** `https://gymapp-backend.onrender.com`

### ⚠️ Importante sobre o Render Free Tier:
- O serviço "hiberna" após 15 minutos de inatividade
- Primeira requisição pode levar 30-60 segundos para "acordar"
- Para manter sempre ativo, considere o plano pago ($7/mês)

---

## 🌐 PARTE 2: Deploy do Frontend no Netlify

### 1️⃣ Criar arquivo de configuração do Netlify

O arquivo `netlify.toml` já está pronto no projeto.

### 2️⃣ Atualizar variável de ambiente do Frontend

Antes de fazer deploy, atualize o arquivo `frontend/.env.production`:

```env
VITE_API_URL=https://gymapp-backend.onrender.com
```

### 3️⃣ Deploy no Netlify

#### Opção A: Deploy via GitHub (Recomendado)

1. Acesse: https://app.netlify.com/
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Conecte com GitHub
4. Selecione o repositório: `viniciusfeitosaa/gymapp`
5. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
6. **Environment variables:**
   ```
   VITE_API_URL=https://gymapp-backend.onrender.com
   ```
7. Clique em **"Deploy"**

#### Opção B: Deploy com Docker (Alternativa)

Se quiser usar Docker no Netlify, você precisará do Netlify Pro. Para Free tier, use a Opção A.

### 4️⃣ Configurar domínio customizado (Opcional)

1. No painel do Netlify, vá em **"Domain settings"**
2. Clique em **"Add custom domain"**
3. Configure seu domínio

---

## 🔄 PARTE 3: Atualizar URLs cruzadas

### Backend (Render)

1. Acesse o painel do Render
2. Vá em **Environment** do seu serviço
3. Atualize `FRONTEND_URL` com a URL do Netlify
4. O Render vai fazer redeploy automaticamente

### Frontend (Netlify)

1. Acesse o painel do Netlify
2. Vá em **Site configuration** → **Environment variables**
3. Confirme que `VITE_API_URL` está com a URL correta do Render
4. Faça um redeploy se necessário

---

## ✅ Checklist de Deploy

### Backend (Render)
- [ ] Serviço criado e rodando
- [ ] Health check respondendo em `/health`
- [ ] Migrations do Prisma executadas
- [ ] Variáveis de ambiente configuradas
- [ ] URL anotada: `https://__________.onrender.com`

### Frontend (Netlify)
- [ ] Build executado com sucesso
- [ ] Site publicado
- [ ] VITE_API_URL apontando para Render
- [ ] Rotas do React funcionando (SPA)
- [ ] URL anotada: `https://__________.netlify.app`

### Integração
- [ ] Backend aceita requisições do frontend (CORS)
- [ ] Login funcionando
- [ ] Cadastro funcionando
- [ ] APIs respondendo corretamente

---

## 🧪 Testar Deploy

### Teste o Backend:
```bash
# Health check
curl https://gymapp-backend.onrender.com/health

# Teste de registro
curl -X POST https://gymapp-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456","name":"Teste"}'
```

### Teste o Frontend:
1. Acesse a URL do Netlify
2. Tente fazer login
3. Tente se cadastrar
4. Navegue pelas rotas

---

## 🔥 Troubleshooting

### Backend não inicia:
- Verifique logs no Render Dashboard
- Confirme que DATABASE_URL está correta
- Verifique se migrations rodaram

### Frontend não carrega API:
- Verifique VITE_API_URL no Netlify
- Abra DevTools (F12) e veja erros de CORS
- Confirme que backend está rodando

### CORS Error:
- Verifique FRONTEND_URL no backend
- Confirme que backend aceita requisições do Netlify

---

## 💰 Custos

- **Backend (Render Free):** $0/mês
  - 750 horas/mês
  - Hiberna após inatividade
  - Upgrade para $7/mês para manter sempre ativo

- **Frontend (Netlify Free):** $0/mês
  - 100GB bandwidth
  - Deploy ilimitado
  - SSL grátis

- **Database (Neon Free):** $0/mês
  - 0.5GB storage
  - 1 projeto

**Total:** $0/mês (Free tier completo!)

---

## 🚀 Comandos Úteis

### Forçar redeploy no Render:
```bash
git commit --allow-empty -m "Trigger Render deploy"
git push origin main
```

### Forçar redeploy no Netlify:
No painel do Netlify → **Deploys** → **Trigger deploy** → **Deploy site**

### Ver logs do Render:
No dashboard do Render → Seu serviço → **Logs**

### Ver logs do Netlify:
No dashboard do Netlify → **Deploys** → Clique no deploy → **Deploy log**

---

## 📚 Links Úteis

- **Render Dashboard:** https://dashboard.render.com/
- **Netlify Dashboard:** https://app.netlify.com/
- **Neon Dashboard:** https://console.neon.tech/

---

## 🆘 Precisa de Ajuda?

Se algo não funcionar, me avise e eu ajudo a resolver!
