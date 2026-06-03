import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { ensureLogoDir, getUploadsRoot } from './utils/personalLogo';
import { authRoutes } from './routes/auth.routes';
import { studentRoutes } from './routes/student.routes';
import { workoutRoutes } from './routes/workout.routes';
import { messageRoutes } from './routes/message.routes';
import { progressRoutes } from './routes/progress.routes';
import { subscriptionRoutes } from './routes/subscription.routes';
import { personalRoutes } from './routes/personal.routes';
import { webhooksRoutes } from './routes/webhooks.routes';

// Carregar variáveis de ambiente ANTES de qualquer outra coisa
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verificar se DATABASE_URL está carregada
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO: DATABASE_URL não encontrada no arquivo .env');
  process.exit(1);
}

console.log('✅ Variáveis de ambiente carregadas');
console.log('✅ DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO ENCONTRADA');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares — origens permitidas via FRONTEND_URL (+ localhost em dev)
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost',
  'http://127.0.0.1',
  'https://localhost',
  'capacitor://localhost',
  'ionic://localhost',
];

const allowedOrigins = [
  ...defaultOrigins,
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : []),
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean)
    : []),
];

function isMobileAppOrigin(origin: string) {
  return (
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    origin.startsWith('capacitor://') ||
    origin.startsWith('ionic://')
  );
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(normalizedOrigin) || isMobileAppOrigin(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true }));

ensureLogoDir().catch((err) => console.warn('[Uploads] mkdir:', err));
app.use('/api/uploads', express.static(path.join(getUploadsRoot())));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Rota raiz - informações da API
app.get('/', (req, res) => {
  res.json({
    name: 'Gym Code API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      students: '/api/students',
      workouts: '/api/workouts',
      messages: '/api/messages',
      progress: '/api/progress'
    },
    documentation: 'https://github.com/viniciusfeitosaa/gymapp'
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Gym Code API is running!' });
});

// Tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
