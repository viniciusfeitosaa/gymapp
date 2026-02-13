import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();
const subscriptionController = new SubscriptionController();

// AbacatePay envia billing.paid etc. (validar webhookSecret na query)
router.post('/abacatepay', subscriptionController.webhookAbacatePay.bind(subscriptionController));

export { router as webhooksRoutes };
