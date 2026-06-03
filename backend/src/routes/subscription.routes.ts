import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticatePersonal } from '../middlewares/auth.middleware';

const router = Router();
const subscriptionController = new SubscriptionController();

router.get('/status', authenticatePersonal, subscriptionController.getStatus.bind(subscriptionController));
router.post('/create-checkout', authenticatePersonal, subscriptionController.createCheckout.bind(subscriptionController));
router.post('/cancel', authenticatePersonal, subscriptionController.cancelSubscription.bind(subscriptionController));
router.post('/sync', authenticatePersonal, subscriptionController.syncSubscription.bind(subscriptionController));
router.post('/verify-purchase', authenticatePersonal, subscriptionController.verifyPurchase.bind(subscriptionController));

export { router as subscriptionRoutes };
