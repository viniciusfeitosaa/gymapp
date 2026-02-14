import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();
const subscriptionController = new SubscriptionController();

// Asaas envia PAYMENT_RECEIVED etc.
router.post('/asaas', subscriptionController.webhookAsaas.bind(subscriptionController));

export { router as webhooksRoutes };
