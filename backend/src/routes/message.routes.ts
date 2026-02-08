import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();
const messageController = new MessageController();

// Rotas compartilhadas (Personal e Aluno)
router.post('/', authenticateToken, messageController.sendMessage);
router.get('/:studentId', authenticateToken, messageController.getMessages);
router.put('/:id/read', authenticateToken, messageController.markAsRead);

export { router as messageRoutes };
