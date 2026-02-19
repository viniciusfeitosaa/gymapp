import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticatePersonal } from '../middlewares/auth.middleware';

const router = Router();
const subscriptionController = new SubscriptionController();

// Personal: gera link de pagamento Asaas (Plano Pro)
router.post('/create-checkout', authenticatePersonal, subscriptionController.createCheckout.bind(subscriptionController));
// Personal: cancelar assinatura (acesso em Perfil → Assinatura)
router.post('/cancel', authenticatePersonal, subscriptionController.cancelSubscription.bind(subscriptionController));
// Personal: sincronizar plano com Asaas pelo e-mail (ao voltar do pagamento, sem precisar de ID)
router.post('/sync', authenticatePersonal, subscriptionController.syncSubscription.bind(subscriptionController));
// Vincular por ID (suporte; não exposto na UI)
router.post('/link', authenticatePersonal, subscriptionController.linkSubscription.bind(subscriptionController));

export { router as subscriptionRoutes };
