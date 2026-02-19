import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticatePersonal } from '../middlewares/auth.middleware';

const router = Router();
const subscriptionController = new SubscriptionController();

// Personal: gera link de pagamento Asaas (Plano Pro)
router.post('/create-checkout', authenticatePersonal, subscriptionController.createCheckout.bind(subscriptionController));
// Personal: cancelar assinatura (acesso em Perfil → Assinatura)
router.post('/cancel', authenticatePersonal, subscriptionController.cancelSubscription.bind(subscriptionController));
// Personal: vincular assinatura já paga no Asaas (quando o webhook não ativou o Pro)
router.post('/link', authenticatePersonal, subscriptionController.linkSubscription.bind(subscriptionController));

export { router as subscriptionRoutes };
