import { Router } from 'express';
import { PersonalController } from '../controllers/personal.controller';
import { authenticatePersonal } from '../middlewares/auth.middleware';

const router = Router();
const personalController = new PersonalController();

router.patch('/me', authenticatePersonal, personalController.updateProfile.bind(personalController));

export { router as personalRoutes };
