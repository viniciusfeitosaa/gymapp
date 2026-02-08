# 🚀 Quick Start - Deploy

## 📋 Checklist Rápido

### 1. Backend no Render
- [ ] Criar conta no Render: https://dashboard.render.com/
- [ ] New Web Service → Conectar GitHub
- [ ] Selecionar repositório `gymapp`
- [ ] Root Directory: `backend`
- [ ] Environment: `Docker`
- [ ] Dockerfile: `./Dockerfile.production`
- [ ] Adicionar variáveis de ambiente (ver DEPLOY_GUIDE.md)
- [ ] Deploy!

### 2. Frontend no Netlify
- [ ] Criar conta no Netlify: https://app.netlify.com/
- [ ] New site from Git → Conectar GitHub
- [ ] Selecionar repositório `gymapp`
- [ ] Base directory: `frontend`
- [ ] Build command: `npm run build`
- [ ] Publish directory: `frontend/dist`
- [ ] Adicionar: `VITE_API_URL` com URL do Render
- [ ] Deploy!

### 3. Configurar URLs cruzadas
- [ ] Backend: Atualizar `FRONTEND_URL` com URL do Netlify
- [ ] Frontend: Atualizar `VITE_API_URL` com URL do Render

## 📖 Guia Completo

Ver arquivo: **DEPLOY_GUIDE.md**

## ⚡ Comandos Úteis

```bash
# Testar build local do backend
cd backend
npm run build
node dist/server.js

# Testar build local do frontend
cd frontend
npm run build
npm run preview

# Build Docker local (backend)
cd backend
docker build -f Dockerfile.production -t gymapp-backend .
docker run -p 3001:3001 --env-file ../.env gymapp-backend

# Build Docker local (frontend)
cd frontend
docker build -f Dockerfile.production -t gymapp-frontend .
docker run -p 80:80 gymapp-frontend
```

## 🎯 URLs após Deploy

- Backend: `https://gymapp-backend.onrender.com`
- Frontend: `https://seu-app.netlify.app`
- Neon DB: `console.neon.tech`

## 💡 Dicas

1. **Render Free**: Primeiro request pode demorar 30-60s (cold start)
2. **Netlify**: Deploy instantâneo em cada push
3. **Logs**: Sempre verifique os logs se algo não funcionar
4. **CORS**: Se tiver erro, verifique FRONTEND_URL no backend

## 🆘 Problemas Comuns

### Build falha no Render
→ Verifique Dockerfile.production
→ Confirme que `npm run build` funciona localmente

### Frontend não conecta no backend
→ Verifique VITE_API_URL no Netlify
→ Confirme CORS no backend

### Migrations não rodam
→ DATABASE_URL está correta?
→ Verifique logs do Render

---

**🎉 Boa sorte com o deploy!**
