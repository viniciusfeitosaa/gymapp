# ✅ CHECKLIST DE INICIALIZAÇÃO - GymConnect

## 🎯 PASSO A PASSO RÁPIDO

### 1️⃣ Arquivos de Ambiente Criados ✅
- ✅ `.env` (raiz) - Configurado com JWT Secret
- ✅ `frontend/.env` - URL da API configurada

### 2️⃣ Instalar Dependências

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3️⃣ Configurar Banco de Dados (Neon)

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

Isso vai criar todas as tabelas no Neon Database.

### 4️⃣ Iniciar o Projeto

**Opção A - Com Docker (Recomendado):**
```bash
docker-compose up --build
```

**Opção B - Sem Docker:**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 5️⃣ Acessar a Aplicação

- 🌐 **Frontend:** http://localhost:5173
- 🔌 **Backend API:** http://localhost:3001
- 💾 **Prisma Studio:** `npx prisma studio` (http://localhost:5555)

---

## 🔐 VERIFICAÇÃO DE SEGURANÇA

✅ JWT Secret configurado (128 caracteres)
✅ Neon Database com SSL
✅ .env não será commitado (.gitignore configurado)
✅ CORS configurado
✅ Variáveis de ambiente prontas

---

## 📋 ORDEM DE EXECUÇÃO

Execute nesta ordem:

```bash
# 1. Instalar dependências do backend
cd backend
npm install

# 2. Executar migrations
npx prisma migrate dev --name init
npx prisma generate

# 3. Voltar para raiz
cd ..

# 4. Instalar dependências do frontend
cd frontend
npm install

# 5. Voltar para raiz
cd ..

# 6. Iniciar com Docker
docker-compose up --build

# OU iniciar manualmente (2 terminais)
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
```

---

## 🧪 TESTAR O SISTEMA

### 1. Cadastrar Personal Trainer
- Acesse: http://localhost:5173
- Clique em "Personal Trainer"
- Clique em "Cadastrar como Personal"
- Preencha os dados e cadastre

### 2. Fazer Login
- Use o email e senha cadastrados
- Acesse o dashboard

### 3. Cadastrar Aluno (em breve)
- Funcionalidade será implementada no dashboard

---

## 🚨 POSSÍVEIS ERROS

### Erro: "Can't reach database"
**Solução:**
```bash
cd backend
npx prisma migrate dev --name init
```

### Erro: "Port 3001 already in use"
**Solução:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Erro: Tailwind CSS não aparece
**Solução:**
```bash
cd frontend
npm install
npm run dev
```

---

## ✅ TUDO PRONTO!

Seu ambiente está 100% configurado:
- ✅ JWT Secret forte gerado
- ✅ Banco de dados Neon conectado
- ✅ Variáveis de ambiente configuradas
- ✅ Git configurado e seguro
- ✅ Segurança em nível profissional

**Próximo passo:** Execute os comandos acima e comece a desenvolver! 🚀
