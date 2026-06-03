import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getStoreManageUrls, verifyStorePurchase } from '../services/store-billing.service';

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

  private async getPersonalSubscription(personalId: string) {
    return prisma.personalTrainer.findUnique({
      where: { id: personalId },
      select: { maxStudentsAllowed: true, storeSubscriptionId: true },
    });
  }

  /** Status da assinatura para o perfil */
  async getStatus(req: AuthRequest, res: Response) {
    try {
      const personal = await this.getPersonalSubscription(req.userId!);
      if (!personal) {
        return res.status(404).json({ error: 'Personal não encontrado' });
      }

      const isPro = personal.maxStudentsAllowed > FREE_PLAN_STUDENTS;
      res.json({
        isPro,
        maxStudentsAllowed: personal.maxStudentsAllowed,
        billingProvider: isPro ? 'store' : null,
        storeSubscriptionId: personal.storeSubscriptionId,
        manageUrls: getStoreManageUrls(),
      });
    } catch (error) {
      console.error('[Subscription] Status error:', error);
      res.status(500).json({ error: 'Erro ao consultar assinatura.' });
    }
  }

  /** Retorna status atual da assinatura (sincronizado via app móvel / webhooks das lojas) */
  async syncSubscription(req: AuthRequest, res: Response) {
    try {
      const personal = await this.getPersonalSubscription(req.userId!);
      if (!personal) {
        return res.status(404).json({ error: 'Personal não encontrado' });
      }

      const isPro = personal.maxStudentsAllowed > FREE_PLAN_STUDENTS;
      res.json({
        activated: isPro,
        isPro,
        maxStudentsAllowed: personal.maxStudentsAllowed,
        billingProvider: isPro ? 'store' : null,
        storeSubscriptionId: personal.storeSubscriptionId,
        manageUrls: getStoreManageUrls(),
      });
    } catch (error) {
      console.error('[Subscription] Sync error:', error);
      res.status(500).json({ error: 'Erro ao consultar assinatura.' });
    }
  }

  /** Cancelamento é feito nas configurações da App Store ou Google Play */
  async cancelSubscription(_req: AuthRequest, res: Response) {
    const manageUrls = getStoreManageUrls();
    return res.json({
      message:
        'Para cancelar, abra as configurações de assinatura da App Store (iPhone) ou Google Play (Android). Você continuará com o Pro até o fim do período já pago.',
      code: 'CANCEL_VIA_STORE',
      manageUrls,
    });
  }

  /** Valida recibo Apple ou token Google Play e ativa o Pro */
  async verifyPurchase(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const { platform, productId, receipt, purchaseToken } = req.body as {
        platform?: 'ios' | 'android';
        productId?: string;
        receipt?: string;
        purchaseToken?: string;
      };

      if (!platform || !productId) {
        return res.status(400).json({ error: 'platform e productId são obrigatórios.' });
      }

      const result = await verifyStorePurchase({
        platform,
        productId,
        receipt,
        purchaseToken,
      });

      if (!result.valid) {
        return res.status(400).json({ error: result.error || 'Compra inválida.' });
      }

      const storeId =
        platform === 'android' && purchaseToken?.trim()
          ? purchaseToken.trim()
          : result.subscriptionId;

      await this.activatePro(personalId, storeId);

      const personal = await this.getPersonalSubscription(personalId);
      res.json({
        success: true,
        isPro: true,
        maxStudentsAllowed: personal?.maxStudentsAllowed ?? UNLIMITED_STUDENTS,
        storeSubscriptionId: storeId,
      });
    } catch (error) {
      console.error('[Subscription] Verify purchase error:', error);
      res.status(500).json({ error: 'Erro ao verificar compra.' });
    }
  }

  /** Webhook App Store Server Notifications V2 */
  async webhookApple(req: AuthRequest, res: Response) {
    try {
      const { signedPayload } = req.body as { signedPayload?: string };
      if (!signedPayload) {
        return res.status(400).json({ received: false, error: 'signedPayload ausente' });
      }

      const parts = signedPayload.split('.');
      if (parts.length < 2) {
        return res.status(400).json({ received: false, error: 'Payload inválido' });
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
        notificationType?: string;
        data?: { signedTransactionInfo?: string };
      };

      const type = payload.notificationType;
      console.log('[Webhook Apple]', type);

      if (type === 'EXPIRED' || type === 'REVOKE' || type === 'DID_FAIL_TO_RENEW') {
        const txParts = payload.data?.signedTransactionInfo?.split('.');
        if (txParts && txParts.length >= 2) {
          const tx = JSON.parse(Buffer.from(txParts[1], 'base64url').toString('utf8')) as {
            originalTransactionId?: string;
            productId?: string;
          };
          const storeId = tx.originalTransactionId || tx.productId;
          if (storeId) {
            const personal = await prisma.personalTrainer.findFirst({
              where: { storeSubscriptionId: storeId },
            });
            if (personal) await this.deactivatePro(personal.id);
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('[Webhook Apple] Error:', error);
      res.status(500).json({ received: false });
    }
  }

  /** Webhook Google Play Real-time Developer Notifications */
  async webhookGoogle(req: AuthRequest, res: Response) {
    try {
      const message = (req.body as { message?: { data?: string } })?.message;
      if (!message?.data) {
        return res.status(400).json({ received: false, error: 'message.data ausente' });
      }

      const decoded = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8')) as {
        subscriptionNotification?: {
          notificationType?: number;
          purchaseToken?: string;
        };
      };

      const sub = decoded.subscriptionNotification;
      if (!sub) {
        return res.json({ received: true, ignored: true });
      }

      console.log('[Webhook Google] notificationType', sub.notificationType);

      const shouldDeactivate =
        sub.notificationType === 3 || sub.notificationType === 12 || sub.notificationType === 13;
      if (shouldDeactivate && sub.purchaseToken) {
        const personal = await prisma.personalTrainer.findFirst({
          where: { storeSubscriptionId: sub.purchaseToken },
        });
        if (personal) await this.deactivatePro(personal.id);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('[Webhook Google] Error:', error);
      res.status(500).json({ received: false });
    }
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
