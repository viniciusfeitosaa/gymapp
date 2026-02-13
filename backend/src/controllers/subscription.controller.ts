import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

const ABACATEPAY_CUSTOMER_URL = 'https://api.abacatepay.com/v1/customer/create';
const ABACATEPAY_BILLING_URL = 'https://api.abacatepay.com/v1/billing/create';
const PRO_PLAN_PRICE_CENTS = 2990; // R$ 29,90
const UNLIMITED_STUDENTS = 999;

function formatCpf(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length >= 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return raw;
}

function formatCellphone(phone: string | null): string {
  const digits = phone ? String(phone).replace(/\D/g, '').slice(-11) : '11999999999';
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export class SubscriptionController {
  // Criar link de checkout AbacatePay (Plano Pro - R$ 29,90/mês)
  async createCheckout(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const apiKey = process.env.ABACATEPAY_API_KEY;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      if (!apiKey) {
        return res.status(500).json({ error: 'Pagamentos não configurados. Contate o suporte.' });
      }

      const personal = await prisma.personalTrainer.findUnique({
        where: { id: personalId },
        select: { name: true, email: true, phone: true, taxId: true },
      });
      if (!personal) {
        return res.status(404).json({ error: 'Personal não encontrado' });
      }

      const rawCpf = personal.taxId?.replace(/\D/g, '') ?? '';
      if (rawCpf.length < 11) {
        return res.status(400).json({
          error: 'Para assinar o plano Pro, cadastre seu CPF nas informações da conta abaixo.',
          code: 'CPF_REQUIRED',
        });
      }

      const returnUrl = `${frontendUrl}/personal/perfil`;
      const completionUrl = `${frontendUrl}/personal/perfil?subscription=success`;

      const taxId = formatCpf(rawCpf);
      const cellphone = formatCellphone(personal.phone);

      const customerPayload = {
        name: personal.name,
        email: personal.email,
        taxId,
        cellphone,
      };

      // 1) Criar cliente na AbacatePay para obter customerId
      const customerRes = await fetch(ABACATEPAY_CUSTOMER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerPayload),
      });

      const customerData: any = await customerRes.json().catch(() => ({}));

      if (!customerRes.ok) {
        console.error('AbacatePay create customer:', customerRes.status, JSON.stringify(customerData));
        const msg = customerData?.error ?? (typeof customerData?.error === 'string' ? customerData.error : null);
        return res.status(502).json({
          error: msg || 'Não foi possível validar seus dados no gateway. Verifique CPF e telefone.',
        });
      }

      const customerId = customerData?.data?.id ?? customerData?.id;
      if (!customerId || typeof customerId !== 'string') {
        console.error('AbacatePay customer response sem id:', customerData);
        return res.status(502).json({ error: 'Resposta inválida do gateway de pagamento.' });
      }

      // 2) Criar cobrança usando customerId
      const billingBody = {
        frequency: 'ONE_TIME',
        methods: ['PIX', 'CARD'],
        products: [
          {
            externalId: 'gymcode-pro-monthly',
            name: 'Plano Pro - Gym Code',
            description: 'Alunos ilimitados. Acesso completo por 1 mês.',
            quantity: 1,
            price: PRO_PLAN_PRICE_CENTS,
          },
        ],
        returnUrl,
        completionUrl,
        customerId,
        externalId: personalId,
        allowCoupons: false,
      };

      const billingRes = await fetch(ABACATEPAY_BILLING_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billingBody),
      });

      const billingData: any = await billingRes.json().catch(() => ({}));

      if (!billingRes.ok) {
        console.error('AbacatePay create billing:', billingRes.status, JSON.stringify(billingData));
        const msg = billingData?.error ?? (typeof billingData?.error === 'string' ? billingData.error : null);
        return res.status(502).json({
          error: msg || 'Erro ao gerar link de pagamento. Tente novamente.',
        });
      }

      const url = billingData?.data?.url ?? billingData?.url;
      if (!url || typeof url !== 'string') {
        console.error('AbacatePay response sem url:', billingData);
        return res.status(502).json({ error: 'Resposta inválida do gateway de pagamento.' });
      }

      res.json({ url });
    } catch (error) {
      console.error('Create checkout error:', error);
      res.status(500).json({ error: 'Erro ao criar checkout' });
    }
  }

  // Webhook AbacatePay: quando o pagamento é confirmado (billing.paid)
  async webhookAbacatePay(req: AuthRequest, res: Response) {
    try {
      const secret = req.query.webhookSecret;
      const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
      if (expectedSecret && secret !== expectedSecret) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }

      const event = req.body?.event;
      const payload = req.body?.data;

      if (event === 'billing.paid' && payload?.billing) {
        const billing = payload.billing;
        const personalId = billing.externalId;
        if (personalId) {
          await prisma.personalTrainer.update({
            where: { id: personalId },
            data: { maxStudentsAllowed: UNLIMITED_STUDENTS },
          });
          console.log(`[Webhook] Plano Pro ativado para personal ${personalId}`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook AbacatePay error:', error);
      res.status(500).json({ error: 'Webhook error' });
    }
  }
}
