# 🚀 Guia de Instalação e Setup - GymApp

## ✅ Estrutura Criada

```
GymApp/
├── backend/                      ✅ Backend Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/              ✅ Configuração do banco
│   │   ├── controllers/         ✅ Controllers (Auth, Student, Workout, Message, Progress)
│   │   ├── middlewares/         ✅ Autenticação JWT
│   │   ├── routes/              ✅ Rotas da API
│   │   └── server.ts            ✅ Servidor Express
│   ├── prisma/
│   │   └── schema.prisma        ✅ Schema completo do banco
│   ├── Dockerfile               ✅ Container do backend
│   └── package.json             ✅ Dependências
│
├── frontend/                     ✅ Frontend React + TypeScript + Vite
│   ├── src/
│   │   ├── components/          ✅ Componentes reutilizáveis
│   │   ├── contexts/            ✅ Context de autenticação
│   │   ├── pages/               ✅ Páginas (Login, Register, Dashboards)
│   │   ├── services/            ✅ API client (Axios)
│   │   ├── types/               ✅ TypeScript types
│   │   └── App.tsx              ✅ App principal
│   ├── Dockerfile               ✅ Container do frontend
│   └── package.json             ✅ Dependências
│
├── docker-compose.yml            ✅ Orquestração dos containers
├── .env.example                  ✅ Exemplo de variáveis de ambiente
└── README.md                     ✅ Documentação completa
```

## 📋 Pré-requisitos

1. **PostgreSQL** instalado e rodando localmente
2. **Docker Desktop** instalado
3. **Node.js** 18+ (para desenvolvimento local sem Docker)

## 🗄️ Passo 1: Configurar PostgreSQL Local

### No Windows (usando PostgreSQL instalado):

1. Abra o **pgAdmin** ou **SQL Shell (psql)**

2. Conecte ao PostgreSQL e crie o banco:

```sql
CREATE DATABASE gymapp;
```

3. Verifique se o PostgreSQL está rodando na porta padrão **5432**

4. Anote suas credenciais:
   - Usuário: `postgres` (geralmente)
   - Senha: (a senha que você definiu na instalação)

## 🔧 Passo 2: Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e ajuste as credenciais do PostgreSQL:

```env
DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@host.docker.internal:5432/gymapp?schema=public"
JWT_SECRET=sua_chave_secreta_super_segura_aqui
```

**Importante:** Mantenha `host.docker.internal` no lugar do `localhost` para que o container consiga acessar o PostgreSQL da sua máquina.

## 📦 Passo 3: Instalar Dependências (Desenvolvimento Local)

### Backend:

```bash
cd backend
npm install
```

### Frontend:

```bash
cd frontend
npm install
```

## 🗃️ Passo 4: Executar Migrations do Prisma

**Importante:** Execute isso ANTES de subir os containers!

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

Isso vai criar todas as tabelas no banco PostgreSQL.

## 🐳 Passo 5: Subir os Containers Docker

Na raiz do projeto:

```bash
docker-compose up --build
```

Aguarde até ver as mensagens:
- ✅ Backend: `Server is running on http://localhost:3001`
- ✅ Frontend: `Local: http://localhost:5173`

## 🌐 Passo 6: Acessar o App

Abra o navegador e acesse:

```
http://localhost:5173
```

## 🧪 Passo 7: Testar o App

### 1. Cadastrar um Personal Trainer:

1. Na tela inicial, clique em "Personal Trainer"
2. Clique em "Cadastrar como Personal"
3. Preencha os dados e cadastre
4. Faça login com email e senha

### 2. Cadastrar um Aluno:

1. No dashboard do Personal, clique em "Adicionar Aluno"
2. Preencha os dados do aluno
3. Clique em "Gerar Código" para criar o código de 5 dígitos
4. Anote o código gerado

### 3. Login como Aluno:

1. Abra uma aba anônima ou outro navegador
2. Na tela inicial, clique em "Aluno"
3. Digite o código de 5 dígitos
4. Acesse o dashboard do aluno

## 🛠️ Comandos Úteis

### Parar os containers:

```bash
docker-compose down
```

### Ver logs:

```bash
docker-compose logs -f
```

### Reiniciar apenas um serviço:

```bash
docker-compose restart backend
docker-compose restart frontend
```

### Executar Prisma Studio (visualizar banco):

```bash
cd backend
npx prisma studio
```

Abre em: http://localhost:5555

### Desenvolvimento sem Docker:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## 📊 Estrutura do Banco de Dados

### Tabelas Criadas:

- ✅ **personal_trainers** - Personals cadastrados
- ✅ **students** - Alunos (com código de acesso)
- ✅ **workouts** - Fichas de treino
- ✅ **exercises** - Exercícios do treino
- ✅ **workout_logs** - Registro de treinos completados
- ✅ **exercise_logs** - Registro de exercícios completados
- ✅ **progress_records** - Evolução física (peso, medidas)
- ✅ **messages** - Sistema de mensagens

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Autenticação
- Login Personal (email + senha)
- Login Aluno (código 5 dígitos)
- Cadastro de Personal
- JWT Token
- Rotas protegidas

### ✅ Backend - API REST
- CRUD completo de alunos
- Geração de código único de 5 dígitos
- CRUD de treinos por dia da semana
- Sistema de mensagens
- Registro de evolução física
- Middleware de autenticação

### ✅ Frontend - Interface
- Tela de login dual (Personal/Aluno)
- Tela de cadastro Personal
- Dashboard Personal
- Dashboard Aluno
- Design moderno com TailwindCSS
- Responsivo

## 🔜 Próximos Passos para Implementar

1. **Tela de gerenciamento de alunos** (listar, editar, deletar)
2. **Tela de criação de treinos** (com exercícios)
3. **Seleção de dias da semana** para cada aluno
4. **Visualização do treino do dia** (aluno)
5. **Marcar exercícios como concluídos**
6. **Sistema de mensagens** (interface de chat)
7. **Gráficos de evolução**
8. **Relatórios**

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Certifique-se de usar `host.docker.internal` na DATABASE_URL

### Erro: "Port 3001 already in use"

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Frontend não carrega:

- Verifique se o backend está rodando em http://localhost:3001
- Teste acessar: http://localhost:3001/health

### Containers não sobem:

```bash
docker-compose down
docker-compose up --build --force-recreate
```

## 📞 Contato e Suporte

Este é um projeto base profissional pronto para ser expandido com todas as funcionalidades planejadas!

**Status Atual:** ✅ **Estrutura completa criada e pronta para uso!**
