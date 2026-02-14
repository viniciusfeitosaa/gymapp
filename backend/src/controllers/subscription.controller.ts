import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://api.asaas.com';
const ASAAS_CHECKOUT_BASE = process.env.ASAAS_CHECKOUT_BASE || 'https://www.asaas.com';
const PRO_PLAN_VALUE = 29.9; // R$ 29,90/mês
const UNLIMITED_STUDENTS = 999;

function getAsaasHeaders(): Record<string, string> {
  let apiKey = process.env.ASAAS_API_KEY || '';
  apiKey = apiKey.replace(/^["']|["']$/g, '').trim(); // remove aspas se vieram do .env
  if (!apiKey) throw new Error('ASAAS_API_KEY não configurada');
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'GymCode/1.0 (Node.js; production)',
    'access_token': apiKey,
  };
}

function formatCpfToDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11);
}

function formatPhoneToDigits(phone: string | null): string {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-11);
}

export class SubscriptionController {
  // Criar link de checkout Asaas (Plano Pro - R$ 29,90/mês)
  async createCheckout(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const rawKey = process.env.ASAAS_API_KEY || '';
      if (!rawKey.trim()) {
        return res.status(500).json({ error: 'Pagamentos não configurados. Contate o suporte.' });
      }
      // Log apenas para debug (comprimento da chave; não exibe o valor)
      console.log('[Asaas] Checkout: API key carregada, tamanho=', rawKey.replace(/^["']|["']$/g, '').trim().length);

      const personal = await prisma.personalTrainer.findUnique({
        where: { id: personalId },
        select: { name: true, email: true, phone: true, taxId: true },
      });
      if (!personal) {
        return res.status(404).json({ error: 'Personal não encontrado' });
      }

      const rawCpf = formatCpfToDigits(personal.taxId ?? '');
      if (rawCpf.length < 11) {
        return res.status(400).json({
          error: 'Para assinar o plano Pro, cadastre seu CPF nas informações da conta abaixo.',
          code: 'CPF_REQUIRED',
        });
      }

      const successUrl = `${frontendUrl}/personal/perfil?subscription=success`;
      const cancelUrl = `${frontendUrl}/personal/perfil`;
      const expiredUrl = `${frontendUrl}/personal/perfil`;
      const headers = getAsaasHeaders();

      // Próxima data de vencimento (amanhã)
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 1);
      const nextDueStr = nextDue.toISOString().slice(0, 10); // YYYY-MM-DD
      const nextDueFull = `${nextDueStr}T12:00:00`;

      // Criar sessão de checkout (POST /v3/checkouts) — retorna ID UUID para a URL da página de pagamento
      const checkoutBody = {
        billingTypes: ['CREDIT_CARD'],
        chargeTypes: ['RECURRENT'],
        minutesToExpire: 100,
        externalReference: personalId,
        callback: {
          successUrl,
          cancelUrl,
          expiredUrl,
        },
        customerData: {
          name: personal.name,
          cpfCnpj: rawCpf,
          email: personal.email,
          phone: formatPhoneToDigits(personal.phone) || '11999999999',
          address: 'A definir',
          addressNumber: 'S/N',
          province: 'Centro',
          postalCode: '01310100',
        },
        subscription: {
          cycle: 'MONTHLY',
          nextDueDate: nextDueFull,
        },
        items: [
          {
            name: 'Plano Pro',
            description: 'Plano Pro - Gym Code (alunos ilimitados)',
            quantity: 1,
            value: PRO_PLAN_VALUE,
            imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          },
        ],
      };

      const checkoutRes = await fetch(`${ASAAS_BASE_URL}/v3/checkouts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(checkoutBody),
      });

      const checkoutData = (await checkoutRes.json().catch(() => ({}))) as { id?: string; errors?: { description: string; code?: string }[] };

      if (!checkoutRes.ok) {
        const msg = checkoutData?.errors?.[0]?.description || 'Erro ao gerar link de pagamento. Tente novamente.';
        console.error('[Asaas] create checkout falhou:', checkoutRes.status, JSON.stringify(checkoutData));
        return res.status(502).json({ error: msg, details: checkoutData?.errors });
      }

      const checkoutId = checkoutData?.id;
      if (!checkoutId || typeof checkoutId !== 'string') {
        console.error('Asaas checkout response sem id:', checkoutData);
        return res.status(502).json({ error: 'Resposta inválida do gateway de pagamento.' });
      }

      const url = `${ASAAS_CHECKOUT_BASE}/checkoutSession/show?id=${checkoutId}`;
      res.json({ url });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[Asaas] Create checkout error:', err.message, err.stack);
      res.status(500).json({ error: 'Erro ao criar checkout. Tente novamente ou contate o suporte.' });
    }
  }

  // Webhook Asaas: PAYMENT_RECEIVED — ativa Plano Pro (maxStudentsAllowed = ilimitado)
  async webhookAsaas(req: AuthRequest, res: Response) {
    try {
      const event = req.body?.event;
      const payment = req.body?.payment as { id?: string; subscription?: string; externalReference?: string } | undefined;

      if (event !== 'PAYMENT_RECEIVED' || !payment?.id) {
        return res.status(200).json({ received: true });
      }

      let personalId: string | undefined = payment.externalReference;

      if (!personalId && payment.subscription) {
        const headers = getAsaasHeaders();
        const subRes = await fetch(`${ASAAS_BASE_URL}/v3/subscriptions/${payment.subscription}`, {
          method: 'GET',
          headers,
        });
        if (subRes.ok) {
          const subData = (await subRes.json().catch(() => ({}))) as { externalReference?: string };
          personalId = subData?.externalReference;
        }
      }

      if (personalId) {
        await prisma.personalTrainer.update({
          where: { id: personalId },
          data: { maxStudentsAllowed: UNLIMITED_STUDENTS },
        });
        console.log(`[Webhook Asaas] Plano Pro ativado para personal ${personalId}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook Asaas error:', error);
      res.status(500).json({ error: 'Webhook error' });
    }
  }
}
