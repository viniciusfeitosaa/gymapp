import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

const UNLIMITED_STUDENTS = 999;
const FREE_PLAN_STUDENTS = 2;

export class SubscriptionController {
  /** Web checkout desativado — assinaturas via App Store / Google Play */
  async createCheckout(_req: AuthRequest, res: Response) {
    return res.status(501).json({
      error: 'Assinaturas disponíveis pelo aplicativo móvel (App Store e Google Play).',
      code: 'STORE_BILLING_REQUIRED',
    });
  }

  /** Retorna status atual da assinatura (sincronizado via app móvel / webhooks das lojas) */
  async syncSubscription(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const personal = await prisma.personalTrainer.findUnique({
        where: { id: personalId },
        select: { maxStudentsAllowed: true },
      });
      if (!personal) {
        return res.status(404).json({ error: 'Personal não encontrado' });
      }

      const isPro = personal.maxStudentsAllowed > FREE_PLAN_STUDENTS;
      res.json({
        activated: isPro,
        maxStudentsAllowed: personal.maxStudentsAllowed,
        billingProvider: isPro ? 'store' : null,
      });
    } catch (error) {
      console.error('[Subscription] Sync error:', error);
      res.status(500).json({ error: 'Erro ao consultar assinatura.' });
    }
  }

  /** Cancelamento é feito nas configurações da App Store ou Google Play */
  async cancelSubscription(_req: AuthRequest, res: Response) {
    return res.status(400).json({
      error: 'Para cancelar, acesse Configurações → Assinaturas no seu iPhone ou Google Play no Android.',
      code: 'CANCEL_VIA_STORE',
    });
  }

  /** Verificação de recibo/compra — implementar ao publicar nas lojas */
  async verifyPurchase(_req: AuthRequest, res: Response) {
    return res.status(501).json({
      error: 'Verificação de compra em desenvolvimento. Use a App Store ou Google Play.',
      code: 'NOT_IMPLEMENTED',
    });
  }

  /** Webhook App Store Server Notifications V2 */
  async webhookApple(_req: AuthRequest, res: Response) {
    console.log('[Webhook Apple] Notificação recebida — integração pendente');
    res.status(501).json({ received: false, message: 'Integração App Store pendente' });
  }

  /** Webhook Google Play Real-time Developer Notifications */
  async webhookGoogle(_req: AuthRequest, res: Response) {
    console.log('[Webhook Google] Notificação recebida — integração pendente');
    res.status(501).json({ received: false, message: 'Integração Google Play pendente' });
  }

  /** Ativa plano Pro após validação de compra (uso interno / webhooks) */
  async activatePro(personalId: string, storeSubscriptionId?: string) {
    await prisma.personalTrainer.update({
      where: { id: personalId },
      data: {
        maxStudentsAllowed: UNLIMITED_STUDENTS,
        ...(storeSubscriptionId && { storeSubscriptionId }),
      },
    });
    console.log(`[Subscription] Plano Pro ativado para personal ${personalId}`);
  }

  /** Rebaixa para plano gratuito (cancelamento / expiração) */
  async deactivatePro(personalId: string) {
    await prisma.personalTrainer.update({
      where: { id: personalId },
      data: { maxStudentsAllowed: FREE_PLAN_STUDENTS, storeSubscriptionId: null },
    });
    console.log(`[Subscription] Plano rebaixado para gratuito (${FREE_PLAN_STUDENTS} alunos) — personal ${personalId}`);
  }
}
