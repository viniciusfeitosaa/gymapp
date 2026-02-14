import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticatePersonal } from '../middlewares/auth.middleware';

const router = Router();
const subscriptionController = new SubscriptionController();

// Personal: gera link de pagamento Asaas (Plano Pro)
router.post('/create-checkout', authenticatePersonal, subscriptionController.createCheckout.bind(subscriptionController));

export { router as subscriptionRoutes };
