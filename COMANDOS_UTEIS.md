# 🚀 Comandos Úteis - GymConnect

## 📦 INSTALAÇÃO INICIAL

```bash
# Execute o script automático
.\setup-project.bat

# OU manualmente:
cd backend && npm install
cd ../frontend && npm install
cd backend && npx prisma migrate dev --name init
```

---

## 🏃 INICIAR O PROJETO

### Com Docker (Recomendado):
```bash
docker-compose up --build
```

### Manualmente:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Script Automático:
```bash
.\start-project.bat
```

---

## 🗄️ COMANDOS DO PRISMA

```bash
cd backend

# Ver banco de dados visualmente
npx prisma studio

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Gerar Prisma Client
npx prisma generate

# Resetar banco (CUIDADO: apaga todos os dados!)
npx prisma migrate reset

# Ver estrutura do banco
npx prisma db pull

# Formatar schema.prisma
npx prisma format
```

---

## 🐳 COMANDOS DO DOCKER

```bash
# Iniciar
docker-compose up

# Iniciar e rebuild
docker-compose up --build

# Parar
docker-compose down

# Ver logs
docker-compose logs -f

# Reiniciar apenas um serviço
docker-compose restart backend
docker-compose restart frontend

# Remover tudo e começar limpo
docker-compose down -v
docker-compose up --build
```

---

## 🔍 DEBUG E LOGS

```bash
# Ver logs do backend
cd backend
npm run dev

# Ver logs do frontend
cd frontend
npm run dev

# Ver logs do Docker
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🧪 TESTES E VALIDAÇÃO

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades automáticas
npm audit fix

# Backend
cd backend
npm audit

# Frontend
cd frontend
npm audit
```

---

## 📝 GIT

```bash
# Ver status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "Mensagem do commit"

# Ver histórico
git log --oneline

# Criar branch
git checkout -b nome-da-branch

# Ver branches
git branch
```

---

## 🔧 MANUTENÇÃO

```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules
npm install

# Atualizar dependências
npm update

# Ver dependências desatualizadas
npm outdated
```

---

## 🌐 ACESSOS RÁPIDOS

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Prisma Studio:** http://localhost:5555 (após `npx prisma studio`)

---

## 🔐 SEGURANÇA

```bash
# Gerar novo JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Verificar se .env está no .gitignore
git check-ignore .env

# Ver o que vai ser commitado
git diff --cached
```

---

## 📊 MONITORAMENTO

```bash
# Ver processos rodando na porta 3001
netstat -ano | findstr :3001

# Ver processos rodando na porta 5173
netstat -ano | findstr :5173

# Matar processo por PID
taskkill /PID <PID> /F
```

---

## 🚨 RESOLUÇÃO DE PROBLEMAS

### Porta em uso:
```bash
# Encontrar e matar processo
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Banco não conecta:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Tailwind não aparece:
```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npm run dev
```

### Docker não inicia:
```bash
docker-compose down
docker-compose up --build --force-recreate
```

---

## 📚 DOCUMENTAÇÃO

- **README.md** - Visão geral do projeto
- **START_HERE.md** - Guia de início rápido
- **SECURITY.md** - Checklist de segurança
- **SECURITY_SETUP.md** - Configuração de segurança
- **SETUP_NEON.md** - Setup com Neon Database

---

## 🎯 SCRIPTS ÚTEIS

```bash
# Setup completo
.\setup-project.bat

# Iniciar projeto
.\start-project.bat

# Configurar Git
.\setup-git.bat

# Iniciar frontend
.\start-frontend.bat
```

---

💡 **Dica:** Salve este arquivo nos favoritos para acesso rápido aos comandos!
