import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { authRoutes } from './routes/auth.routes';
import { studentRoutes } from './routes/student.routes';
import { workoutRoutes } from './routes/workout.routes';
import { messageRoutes } from './routes/message.routes';
import { progressRoutes } from './routes/progress.routes';

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

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/progress', progressRoutes);

// Rota raiz - informações da API
app.get('/', (req, res) => {
  res.json({
    name: 'GymApp API',
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
  res.json({ status: 'ok', message: 'GymConnect API is running!' });
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
