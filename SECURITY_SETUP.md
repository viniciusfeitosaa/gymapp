# 🔐 Configuração de Segurança - GymConnect

## 📝 PASSO A PASSO PARA MÁXIMA SEGURANÇA

### 1️⃣ Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com valores REAIS e FORTES
```

**Gerar JWT Secret Forte:**
```bash
# Execute no terminal (Node.js necessário)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e cole em `JWT_SECRET` no arquivo `.env`

### 2️⃣ Proteger o Banco de Dados Neon

No arquivo `.env`, sua `DATABASE_URL` deve estar assim:

```env
DATABASE_URL="postgresql://neondb_owner:SUA_SENHA@seu-host.neon.tech/neondb?sslmode=require"
```

**Boas práticas:**
- ✅ SSL sempre habilitado (`sslmode=require`)
- ✅ Senha forte com caracteres especiais
- ✅ Conexão pooler para performance
- ✅ Rotacione a senha periodicamente

### 3️⃣ Configurar Git

Execute o script de configuração:

```bash
.\setup-git.bat
```

Ou manualmente:

```bash
git config user.name "Seu Nome"
git config user.email "seu@email.com"
git add .
git commit -m "Initial commit"
```

### 4️⃣ Verificar .gitignore

Certifique-se de que estes arquivos **NUNCA** sejam commitados:

❌ `.env`
❌ `*.key`
❌ `*.pem`
❌ `credentials.*`
❌ `secrets.*`
❌ `node_modules/`

### 5️⃣ Segurança do Backend

**Implementações Recomendadas:**

```bash
cd backend

# Rate limiting
npm install express-rate-limit

# Helmet (security headers)
npm install helmet

# Input validation extra
npm install express-validator

# Sanitização
npm install xss-clean
```

**Adicione no `server.ts`:**

```typescript
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Helmet
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // max 100 requests
});
app.use('/api/', limiter);

// Rate limit mais restritivo para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // max 5 tentativas
});
app.use('/api/auth/', loginLimiter);
```

### 6️⃣ Segurança do Frontend

**localStorage vs httpOnly Cookies:**

Atualmente os tokens JWT estão no `localStorage`. Para máxima segurança:

1. Migrar para **httpOnly cookies**
2. Implementar **CSRF tokens**
3. Usar **SameSite cookies**

### 7️⃣ HTTPS em Produção

**Nunca deploy sem HTTPS!**

- ✅ Vercel/Netlify: HTTPS automático
- ✅ Railway/Render: HTTPS automático
- ✅ Custom server: Use Let's Encrypt

### 8️⃣ Auditoria de Dependências

```bash
# Verificar vulnerabilidades
npm audit

# Frontend
cd frontend
npm audit

# Backend
cd backend
npm audit

# Corrigir automaticamente
npm audit fix
```

### 9️⃣ Variáveis de Ambiente em Produção

**Vercel:**
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

**Railway:**
- Settings → Variables → Add Variable

**Render:**
- Environment → Add Environment Variable

### 🔟 Monitoramento e Logs

**Implementar:**
- 📊 Sentry para error tracking
- 📝 Winston para logs estruturados
- 🔍 Auditoria de acessos

## 🚨 CHECKLIST ANTES DO DEPLOY

- [ ] ✅ `.env` não está commitado
- [ ] ✅ `JWT_SECRET` é forte (64+ caracteres)
- [ ] ✅ `DATABASE_URL` usa SSL
- [ ] ✅ CORS configurado corretamente
- [ ] ✅ Rate limiting implementado
- [ ] ✅ Helmet.js ativado
- [ ] ✅ Dependências auditadas
- [ ] ✅ HTTPS habilitado
- [ ] ✅ Backups configurados
- [ ] ✅ Monitoring ativo

## 🔒 NÍVEL DE SEGURANÇA ATUAL

### ✅ Implementado
- Bcrypt para senhas (salt rounds: 10)
- JWT com expiração
- Prisma ORM (previne SQL Injection)
- CORS configurado
- SSL no banco de dados
- Validação com Zod
- Middlewares de autenticação

### ⚠️ Recomendado (Próximas Implementações)
- Rate limiting
- Helmet.js
- Input sanitization
- httpOnly cookies
- 2FA
- Logs estruturados

## 📞 EM CASO DE INCIDENTE

1. **Rotacione imediatamente:**
   - JWT_SECRET
   - Senha do banco
   - API Keys

2. **Revogue tokens:**
   - Implemente blacklist de tokens
   - Force logout de todos usuários

3. **Investigue:**
   - Verifique logs
   - Identifique a brecha
   - Corrija a vulnerabilidade

---

⚠️ **LEMBRE-SE:** Segurança é um processo contínuo, não um produto final!
