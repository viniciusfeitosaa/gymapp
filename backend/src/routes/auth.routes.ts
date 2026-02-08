import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Rotas de autenticação
router.post('/personal/register', authController.registerPersonal);
router.post('/personal/login', authController.loginPersonal);
router.post('/student/login', authController.loginStudent);

export { router as authRoutes };
