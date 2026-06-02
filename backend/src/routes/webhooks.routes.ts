import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();
const subscriptionController = new SubscriptionController();

router.post('/apple', subscriptionController.webhookApple.bind(subscriptionController));
router.post('/google', subscriptionController.webhookGoogle.bind(subscriptionController));

export { router as webhooksRoutes };
