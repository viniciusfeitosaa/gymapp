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

      const completionUrl = `${frontendUrl}/personal/perfil?subscription=success`;
      const headers = getAsaasHeaders();

      // 1) Criar cliente no Asaas
      const customerBody = {
        name: personal.name,
        cpfCnpj: rawCpf,
        email: personal.email,
        mobilePhone: formatPhoneToDigits(personal.phone) || '11999999999',
        externalReference: personalId,
      };

      const customerRes = await fetch(`${ASAAS_BASE_URL}/v3/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(customerBody),
      });

      const customerData = (await customerRes.json().catch(() => ({}))) as { id?: string; errors?: { description: string; code?: string }[] };

      if (!customerRes.ok) {
        const msg = customerData?.errors?.[0]?.description || 'Não foi possível validar seus dados no gateway. Verifique CPF e telefone.';
        console.error('[Asaas] create customer falhou:', customerRes.status, JSON.stringify(customerData));
        return res.status(502).json({ error: msg, details: customerData?.errors });
      }

      const customerId = customerData?.id;
      if (!customerId || typeof customerId !== 'string') {
        console.error('Asaas customer response sem id:', customerData);
        return res.status(502).json({ error: 'Resposta inválida do gateway de pagamento.' });
      }

      // 2) Criar assinatura mensal (gera checkout para pagamento)
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 1);
      const nextDueStr = nextDue.toISOString().slice(0, 10); // YYYY-MM-DD

      const subscriptionBody = {
        customer: customerId,
        billingType: 'UNDEFINED' as const,
        value: PRO_PLAN_VALUE,
        nextDueDate: nextDueStr,
        cycle: 'MONTHLY' as const,
        description: 'Plano Pro - Gym Code (alunos ilimitados)',
        externalReference: personalId,
        callback: {
          successUrl: completionUrl,
          autoRedirect: true,
        },
      };

      const subRes = await fetch(`${ASAAS_BASE_URL}/v3/subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(subscriptionBody),
      });

      const subData = (await subRes.json().catch(() => ({}))) as { checkoutSession?: string; id?: string; errors?: { description: string; code?: string }[] };

      if (!subRes.ok) {
        const msg = subData?.errors?.[0]?.description || 'Erro ao gerar link de pagamento. Tente novamente.';
        console.error('[Asaas] create subscription falhou:', subRes.status, JSON.stringify(subData));
        return res.status(502).json({ error: msg, details: subData?.errors });
      }

      const checkoutSession = subData?.checkoutSession ?? subData?.id;
      if (!checkoutSession || typeof checkoutSession !== 'string') {
        console.error('Asaas subscription response sem checkoutSession:', subData);
        return res.status(502).json({ error: 'Resposta inválida do gateway de pagamento.' });
      }

      const url = `${ASAAS_CHECKOUT_BASE}/checkoutSession/show?id=${checkoutSession}`;
      res.json({ url });
    } catch (error) {
      console.error('Create checkout error:', error);
      res.status(500).json({ error: 'Erro ao criar checkout' });
    }
  }

  // Webhook Asaas: PAYMENT_RECEIVED — ativa Plano Pro (maxStudentsAllowed = ilimitado)
  async webhookAsaas(req: AuthRequest, res: Response) {
    try {
      const event = req.body?.event;
      const payment = req.body?.payment;

      if (event !== 'PAYMENT_RECEIVED' || !payment?.id) {
        return res.status(200).json({ received: true });
      }

      const subscriptionId = payment.subscription;
      if (!subscriptionId) {
        return res.status(200).json({ received: true });
      }

      const headers = getAsaasHeaders();
      const subRes = await fetch(`${ASAAS_BASE_URL}/v3/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers,
      });

      if (!subRes.ok) {
        console.error('Asaas get subscription:', subRes.status);
        return res.status(200).json({ received: true });
      }

      const subData = (await subRes.json().catch(() => ({}))) as { externalReference?: string };
      const personalId = subData?.externalReference;
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
