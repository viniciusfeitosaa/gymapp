import { Router } from 'express';
import { PersonalController } from '../controllers/personal.controller';
import { authenticatePersonal } from '../middlewares/auth.middleware';

const router = Router();
const personalController = new PersonalController();

router.patch('/me', authenticatePersonal, personalController.updateProfile.bind(personalController));
router.post('/me/logo', authenticatePersonal, personalController.uploadLogo.bind(personalController));
router.delete('/me/logo', authenticatePersonal, personalController.deleteLogo.bind(personalController));
router.delete('/me/account', authenticatePersonal, personalController.deleteAccount.bind(personalController));

export { router as personalRoutes };
