import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller';
import { authenticatePersonal, authenticateStudent } from '../middlewares/auth.middleware';

const router = Router();
const progressController = new ProgressController();

// Rotas do Personal
router.post('/student/:studentId', authenticatePersonal, progressController.createProgress.bind(progressController));
router.get('/student/:studentId', authenticatePersonal, progressController.getStudentProgress.bind(progressController));

// Rotas do Aluno
router.get('/my-progress', authenticateStudent, progressController.getMyProgress.bind(progressController));

export { router as progressRoutes };
