# 💪 Gym Code

Sistema profissional para Personal Trainers gerenciarem alunos, treinos e acompanhamento de evolução.

## 🚀 Tecnologias

### Frontend
- React.js + TypeScript
- Vite
- TailwindCSS
- Axios
- React Router DOM

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL (Neon Database)
- JWT Authentication
- Bcrypt

### DevOps
- Docker + Docker Compose

## 📦 Instalação

### Requisitos
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (ou usar Neon Database)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker (Homelab — Mac Mini)

```bash
# Setup completo (primeira vez)
make setup

# Ou manualmente:
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build
```

**Guia completo:** [HOMELAB_SETUP.md](./HOMELAB_SETUP.md)

### Docker (Desenvolvimento)

```bash
make dev
# ou: docker compose -f docker-compose.dev.yml up --build
```

## 🔧 Configuração

1. Copie `.env.example` para `.env` na raiz do projeto
2. Configure as variáveis de ambiente:
   - `DATABASE_URL`: String de conexão PostgreSQL
   - `JWT_SECRET`: Chave secreta para JWT
3. Execute as migrações do Prisma

## 📱 Funcionalidades

### Para Personal Trainers
- Dashboard com lista de alunos
- Criar e gerenciar alunos
- Criar fichas de treino personalizadas
- Acompanhar evolução e progresso
- Sistema de mensagens
- Relatórios

### Para Alunos
- Login com código de 5 dígitos
- Visualizar treino do dia
- Marcar exercícios como concluídos
- Registrar evolução (peso, medidas)
- Enviar mensagens ao Personal

## 🌐 Acesso

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **Prisma Studio:** `npx prisma studio`

## 📄 Licença

Projeto privado - Todos os direitos reservados
