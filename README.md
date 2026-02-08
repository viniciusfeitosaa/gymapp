# 💪 GymConnect - Sistema para Personal Trainers

Conectando Personal Trainers e Alunos através de tecnologia moderna.

## 🚀 Tecnologias

### Frontend
- React.js 18
- TypeScript
- Vite
- TailwindCSS
- Axios
- React Router DOM

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT Authentication
- Bcrypt

### Database
- PostgreSQL (rodando fora do container)

### DevOps
- Docker
- Docker Compose

## 📋 Funcionalidades

### Personal Trainer
- ✅ Cadastro e Login (email + senha)
- ✅ Dashboard com lista de alunos
- ✅ Cadastro de alunos com geração de código de acesso (5 dígitos)
- ✅ Criação e edição de fichas de treino por dia
- ✅ Definir dias da semana de treino
- ✅ Acompanhamento de presença e evolução
- ✅ Sistema de mensagens
- ✅ Relatórios

### Aluno
- ✅ Acesso com código de 5 dígitos
- ✅ Visualizar treino do dia
- ✅ Marcar exercícios como concluídos
- ✅ Histórico de treinos
- ✅ Registro de evolução (peso, medidas)
- ✅ Enviar mensagens ao Personal

## 🛠️ Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL instalado localmente (rodando fora do container)

## 📦 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd GymApp
```

### 2. Configure o PostgreSQL Local

Certifique-se de que o PostgreSQL está rodando localmente:

```sql
-- Criar o banco de dados
CREATE DATABASE gymapp;
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do PostgreSQL:

```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@host.docker.internal:5432/gymapp?schema=public"
JWT_SECRET=sua_chave_secreta_aqui
```

### 4. Instale as dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Execute as migrations do Prisma

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 6. Inicie os containers Docker

```bash
# Na raiz do projeto
docker-compose up --build
```

## 🌐 Acessando a aplicação

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## 📱 Fluxo de Uso

1. **Personal Trainer:**
   - Acesse a tela de login
   - Clique em "Cadastrar como Personal"
   - Faça login com email e senha
   - Cadastre alunos e gere códigos de acesso
   - Crie treinos por dia da semana

2. **Aluno:**
   - Acesse a tela de login
   - Escolha "Sou Aluno"
   - Digite o código de 5 dígitos
   - Acesse o treino do dia

## 🗂️ Estrutura do Projeto

```
GymApp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔧 Scripts Úteis

```bash
# Desenvolvimento (sem Docker)
cd backend && npm run dev
cd frontend && npm run dev

# Docker
docker-compose up          # Iniciar
docker-compose down        # Parar
docker-compose logs -f     # Ver logs

# Prisma
npx prisma studio          # Interface visual do banco
npx prisma migrate dev     # Criar migration
npx prisma generate        # Gerar client
```

## 📝 Licença

MIT
