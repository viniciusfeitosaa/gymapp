import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Rotas de autenticação
router.post('/personal/register', authController.registerPersonal.bind(authController));
router.post('/personal/login', authController.loginPersonal.bind(authController));
router.post('/student/login', authController.loginStudent.bind(authController));

export { router as authRoutes };
