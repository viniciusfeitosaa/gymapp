# 🚀 Guia de Setup - GymApp com Neon Database

## ✅ CONFIGURAÇÃO ATUAL

- **Backend:** Node.js + Express + TypeScript + Prisma
- **Frontend:** React + TypeScript + Vite + TailwindCSS  
- **Banco de Dados:** Neon PostgreSQL (na nuvem) ✅ Já configurado!
- **Docker:** Frontend e Backend em containers

## 📋 Pré-requisitos

1. ✅ **Docker Desktop** instalado
2. ✅ **Node.js** 18+ instalado
3. ✅ **Neon Database** - Já configurado!

## 🗄️ Banco de Dados Neon

**Status:** ✅ Connection string já configurada no projeto!

```
postgresql://neondb_owner:npg_KURekdY30qnG@ep-still-credit-ai86ff0v-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Não precisa instalar PostgreSQL local - tudo roda na nuvem!

## 🚀 INSTALAÇÃO RÁPIDA

### Passo 1: Instalar Dependências

```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### Passo 2: Configurar Variáveis de Ambiente

O arquivo `.env` já está criado e configurado! ✅

Verifique se existe o arquivo `.env` na raiz do projeto.

### Passo 3: Executar Migrations do Prisma

**IMPORTANTE:** Execute isso primeiro para criar as tabelas no Neon!

```bash
cd backend
npx prisma migrate dev --name init
```

Isso vai criar todas as 8 tabelas no seu banco Neon:
- ✅ personal_trainers
- ✅ students  
- ✅ workouts
- ✅ exercises
- ✅ workout_logs
- ✅ exercise_logs
- ✅ progress_records
- ✅ messages

### Passo 4: Gerar Prisma Client

```bash
npx prisma generate
```

### Passo 5: Subir os Containers Docker

Volte para a raiz do projeto:

```bash
cd ..
docker-compose up --build
```

Aguarde até ver:
- ✅ `Server is running on http://localhost:3001`
- ✅ Frontend rodando em `http://localhost:5173`

### Passo 6: Acessar o App

Abra o navegador:

```
http://localhost:5173
```

## 🧪 TESTANDO O APP

### 1️⃣ Cadastrar Personal Trainer

1. Acesse http://localhost:5173
2. Clique em **"Personal Trainer"**
3. Clique em **"Cadastrar como Personal"**
4. Preencha:
   - Nome: Seu nome
   - Email: seu@email.com  
   - Senha: 123456 (ou outra)
   - Telefone: (opcional)
   - CREF: (opcional)
5. Clique em **"Cadastrar"**

### 2️⃣ Fazer Login como Personal

1. Volte para a tela de login
2. Clique em **"Personal Trainer"**
3. Digite email e senha
4. Acesse o dashboard!

### 3️⃣ Criar um Aluno (EM BREVE)

A tela de criação de alunos será implementada no dashboard.

## 🛠️ COMANDOS ÚTEIS

### Ver o banco de dados visualmente:

```bash
cd backend
npx prisma studio
```

Abre em: http://localhost:5555

### Ver logs dos containers:

```bash
docker-compose logs -f
```

### Reiniciar containers:

```bash
docker-compose restart
```

### Parar containers:

```bash
docker-compose down
```

### Rodar sem Docker (desenvolvimento):

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
```

## 🌐 URLs do Projeto

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **API Health Check:** http://localhost:3001/health
- **Prisma Studio:** http://localhost:5555

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/personal/register` - Cadastrar Personal
- `POST /api/auth/personal/login` - Login Personal
- `POST /api/auth/student/login` - Login Aluno

### Alunos (requer autenticação Personal)
- `POST /api/students` - Criar aluno
- `GET /api/students` - Listar alunos
- `GET /api/students/:id` - Buscar aluno
- `PUT /api/students/:id` - Atualizar aluno
- `DELETE /api/students/:id` - Deletar aluno
- `POST /api/students/:id/generate-code` - Gerar código de acesso

### Treinos
- `POST /api/workouts` - Criar treino
- `GET /api/workouts/student/:studentId` - Treinos de um aluno
- `GET /api/workouts/my-workouts` - Meus treinos (aluno)
- `GET /api/workouts/today` - Treino de hoje (aluno)

### Mensagens
- `POST /api/messages` - Enviar mensagem
- `GET /api/messages/:studentId` - Ver mensagens

### Evolução
- `POST /api/progress/student/:studentId` - Registrar evolução
- `GET /api/progress/student/:studentId` - Ver evolução
- `GET /api/progress/my-progress` - Minha evolução (aluno)

## 🐛 Troubleshooting

### Erro ao conectar no banco:

```bash
# Teste a conexão
cd backend
npx prisma db pull
```

Se der erro, verifique:
- ✅ Connection string está correta no `.env`
- ✅ Neon Database está ativo
- ✅ Não há firewall bloqueando

### Erro "Port 3001 already in use":

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Depois reinicie
docker-compose up
```

### Frontend não conecta no backend:

1. Verifique se o backend está rodando:
   ```
   http://localhost:3001/health
   ```

2. Deve retornar:
   ```json
   {"status":"ok","message":"GymApp API is running!"}
   ```

### Migrations dão erro:

```bash
cd backend

# Resetar migrações (CUIDADO: apaga dados!)
npx prisma migrate reset

# Criar novamente
npx prisma migrate dev --name init
npx prisma generate
```

## 📊 Estrutura do Banco (Neon)

Após executar as migrations, você terá:

```
neondb/
├── personal_trainers     (Personals cadastrados)
├── students              (Alunos com código de 5 dígitos)  
├── workouts              (Fichas de treino por dia)
├── exercises             (Exercícios de cada treino)
├── workout_logs          (Registro de treinos feitos)
├── exercise_logs         (Registro de exercícios completados)
├── progress_records      (Evolução: peso, medidas)
└── messages              (Chat Personal ↔ Aluno)
```

## ✅ PRÓXIMOS PASSOS

Agora que a estrutura está pronta, podemos implementar:

1. ✅ **Tela de listagem de alunos** no dashboard do Personal
2. ✅ **Modal/página para adicionar aluno**
3. ✅ **Botão "Gerar Código"** para cada aluno
4. ✅ **Tela de criação de treinos** com seleção de dias
5. ✅ **Interface do aluno** para ver treino do dia
6. ✅ **Sistema de chat** entre Personal e Aluno
7. ✅ **Gráficos de evolução**

## 🎯 STATUS DO PROJETO

**✅ Backend completo e funcional**
**✅ Frontend com estrutura e autenticação**
**✅ Banco de dados Neon configurado**
**✅ Docker configurado**
**🔨 Próximo: Implementar interfaces completas**

---

**Pronto para começar! 🚀**

Execute os passos acima e me avise se tiver algum problema!
