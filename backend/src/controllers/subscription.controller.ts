import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://api.asaas.com';
const ASAAS_CHECKOUT_BASE = process.env.ASAAS_CHECKOUT_BASE || 'https://www.asaas.com';
const PRO_PLAN_VALUE = 29.9; // R$ 29,90/mês
const UNLIMITED_STUDENTS = 999;
const FREE_PLAN_STUDENTS = 2;

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
        select: { name: true, email: true, phone: true, taxId: true, address: true, addressNumber: true, complement: true, province: true, postalCode: true },
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

      // Primeira cobrança: hoje, para que a Asaas tente debitar na hora (evita ficar só validação R$ 0)
      const nextDue = new Date();
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
          address: personal.address?.trim() || 'A definir',
          addressNumber: personal.addressNumber?.trim() || 'S/N',
          complement: personal.complement?.trim() || undefined,
          province: personal.province?.trim() || 'Centro',
          postalCode: (personal.postalCode?.replace(/\D/g, '') || '01310100').slice(0, 8),
        },
        subscription: {
          cycle: 'MONTHLY',
          nextDueDate: nextDueFull,
          externalReference: personalId, // para o webhook identificar o personal ao receber PAYMENT_CONFIRMED
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

  // Webhook Asaas: PAYMENT_CONFIRMED ou PAYMENT_RECEIVED ativam Pro; inadimplência/cancelamento rebaixam
  async webhookAsaas(req: AuthRequest, res: Response) {
    try {
      // Asaas pode enviar JSON direto ou em um campo (ex.: body.payload); evita quebrar se payload for string
      let rawBody = req.body;
      if (req.body?.payload != null) {
        try {
          rawBody = typeof req.body.payload === 'string' ? JSON.parse(req.body.payload) : req.body.payload;
        } catch {
          rawBody = req.body;
        }
      }
      const event = rawBody?.event as string | undefined;
      const payment = rawBody?.payment as { id?: string; subscription?: string | { id?: string }; externalReference?: string } | undefined;
      const subscription = rawBody?.subscription as { id?: string; externalReference?: string } | undefined;

      // Log para diagnóstico (sem dados sensíveis)
      console.log('[Webhook Asaas] Evento:', event, '| payment.id:', payment?.id, '| payment.subscription:', payment?.subscription, '| payment.externalReference:', payment?.externalReference ?? '(vazio)', '| subscription.id:', subscription?.id, '| subscription.externalReference:', subscription?.externalReference ?? '(vazio)');

      const eventsWeHandle = [
        'PAYMENT_CONFIRMED',  // Cartão: pagamento aprovado (RECEIVED só vem ~30 dias depois)
        'PAYMENT_RECEIVED',
        'PAYMENT_OVERDUE',
        'SUBSCRIPTION_INACTIVATED',
        'SUBSCRIPTION_DELETED',
      ];
      if (!event || !eventsWeHandle.includes(event)) {
        return res.status(200).json({ received: true });
      }

      const personalId = await this.resolvePersonalIdFromWebhook(payment, subscription);

      if (!personalId) {
        console.warn('[Webhook Asaas] personalId não encontrado — event:', event, 'payment.id:', payment?.id);
        return res.status(200).json({ received: true });
      }

      const isPaymentOk = event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED';
      if (isPaymentOk) {
        const subscriptionId = payment?.subscription && typeof payment.subscription === 'string' ? payment.subscription : null;
        await prisma.personalTrainer.update({
          where: { id: personalId },
          data: {
            maxStudentsAllowed: UNLIMITED_STUDENTS,
            ...(subscriptionId && { asaasSubscriptionId: subscriptionId }),
          },
        });
        console.log(`[Webhook Asaas] Plano Pro ativado para personal ${personalId} (evento: ${event})`);
      } else {
        // PAYMENT_OVERDUE | SUBSCRIPTION_INACTIVATED | SUBSCRIPTION_DELETED → rebaixa para plano gratuito
        await prisma.personalTrainer.update({
          where: { id: personalId },
          data: { maxStudentsAllowed: FREE_PLAN_STUDENTS, asaasSubscriptionId: null },
        });
        console.log(`[Webhook Asaas] Plano rebaixado para gratuito (${FREE_PLAN_STUDENTS} alunos) para personal ${personalId} (evento: ${event})`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook Asaas error:', error);
      res.status(500).json({ error: 'Webhook error' });
    }
  }

  /** Obtém o ID do personal a partir do payload do webhook (payment ou subscription). */
  private async resolvePersonalIdFromWebhook(
    payment: { id?: string; subscription?: string | { id?: string }; externalReference?: string } | undefined,
    subscription: { id?: string; externalReference?: string } | undefined
  ): Promise<string | undefined> {
    if (payment?.externalReference) return payment.externalReference;
    if (subscription?.externalReference) return subscription.externalReference;

    // payment.subscription pode vir como string (id) ou objeto { id: "..." }
    let subId: string | undefined =
      typeof payment?.subscription === 'string'
        ? payment.subscription
        : payment?.subscription?.id ?? subscription?.id;

    if (!subId && payment?.id) {
      try {
        const headers = getAsaasHeaders();
        const payRes = await fetch(`${ASAAS_BASE_URL}/v3/payments/${payment.id}`, { method: 'GET', headers });
        if (payRes.ok) {
          const payData = (await payRes.json().catch(() => ({}))) as { subscription?: string };
          subId = payData?.subscription;
        }
      } catch {
        // ignora
      }
    }

    if (!subId) return undefined;

    const headers = getAsaasHeaders();
    const subRes = await fetch(`${ASAAS_BASE_URL}/v3/subscriptions/${subId}`, {
      method: 'GET',
      headers,
    });
    if (!subRes.ok) return undefined;
    const subData = (await subRes.json().catch(() => ({}))) as { externalReference?: string };
    return subData?.externalReference ?? undefined;
  }

  // Sincronizar plano com Asaas pelo e-mail do usuário (sem precisar de ID) — chamado ao voltar do pagamento
  async syncSubscription(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const personal = await prisma.personalTrainer.findUnique({
        where: { id: personalId },
        select: { email: true, maxStudentsAllowed: true },
      });
      if (!personal?.email) {
        return res.json({ activated: false });
      }
      if (personal.maxStudentsAllowed > FREE_PLAN_STUDENTS) {
        return res.json({ activated: true, maxStudentsAllowed: personal.maxStudentsAllowed });
      }

      const headers = getAsaasHeaders();
      const email = encodeURIComponent(personal.email.trim());
      const custRes = await fetch(`${ASAAS_BASE_URL}/v3/customers?email=${email}&limit=1`, {
        method: 'GET',
        headers,
      });
      if (!custRes.ok) {
        return res.json({ activated: false });
      }
      const custData = (await custRes.json().catch(() => ({}))) as { data?: { id?: string }[] };
      const customerId = custData?.data?.[0]?.id;
      if (!customerId) {
        return res.json({ activated: false });
      }

      const subRes = await fetch(
        `${ASAAS_BASE_URL}/v3/subscriptions?customer=${encodeURIComponent(customerId)}&status=ACTIVE&limit=1`,
        { method: 'GET', headers }
      );
      if (!subRes.ok) {
        return res.json({ activated: false });
      }
      const subData = (await subRes.json().catch(() => ({}))) as { data?: { id?: string }[] };
      const subscriptionId = subData?.data?.[0]?.id;
      if (!subscriptionId) {
        return res.json({ activated: false });
      }

      await prisma.personalTrainer.update({
        where: { id: personalId },
        data: { maxStudentsAllowed: UNLIMITED_STUDENTS, asaasSubscriptionId: subscriptionId },
      });
      console.log(`[Subscription] Plano Pro ativado por sync (email) para personal ${personalId}`);
      res.json({ activated: true, maxStudentsAllowed: UNLIMITED_STUDENTS });
    } catch (error) {
      console.error('Sync subscription error:', error);
      res.status(500).json({ error: 'Erro ao sincronizar assinatura.' });
    }
  }

  // Vincular assinatura por ID (uso interno/suporte; usuário não precisa)
  async linkSubscription(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const asaasSubscriptionId = (req.body?.asaasSubscriptionId ?? req.body?.subscriptionId ?? '').toString().trim();
      if (!asaasSubscriptionId) {
        return res.status(400).json({ error: 'Envie o ID da assinatura (asaasSubscriptionId).' });
      }

      const headers = getAsaasHeaders();
      const subRes = await fetch(`${ASAAS_BASE_URL}/v3/subscriptions/${asaasSubscriptionId}`, {
        method: 'GET',
        headers,
      });
      if (!subRes.ok) {
        const err = await subRes.json().catch(() => ({}));
        console.warn('[Asaas] GET subscription falhou:', subRes.status, err);
        return res.status(400).json({ error: 'Assinatura não encontrada na Asaas. Verifique o ID.' });
      }
      const sub = (await subRes.json()) as { status?: string };
      if (sub?.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Assinatura não está ativa na Asaas.' });
      }

      await prisma.personalTrainer.update({
        where: { id: personalId },
        data: { maxStudentsAllowed: UNLIMITED_STUDENTS, asaasSubscriptionId: asaasSubscriptionId },
      });
      console.log(`[Subscription] Assinatura ${asaasSubscriptionId} vinculada ao personal ${personalId}`);
      res.json({ success: true, maxStudentsAllowed: UNLIMITED_STUDENTS });
    } catch (error) {
      console.error('Link subscription error:', error);
      res.status(500).json({ error: 'Erro ao vincular assinatura.' });
    }
  }

  // Cancelar assinatura pelo app (assinante acessa em Perfil → Assinatura)
  async cancelSubscription(req: AuthRequest, res: Response) {
    try {
      const personalId = req.userId!;
      const personal = await prisma.personalTrainer.findUnique({
        where: { id: personalId },
        select: { asaasSubscriptionId: true, maxStudentsAllowed: true },
      });
      if (!personal) {
        return res.status(404).json({ error: 'Personal não encontrado' });
      }
      if (personal.maxStudentsAllowed <= FREE_PLAN_STUDENTS) {
        return res.status(400).json({ error: 'Você não possui assinatura ativa para cancelar.' });
      }

      let subscriptionId: string | null = personal.asaasSubscriptionId;
      if (!subscriptionId) {
        const headers = getAsaasHeaders();
        const listRes = await fetch(
          `${ASAAS_BASE_URL}/v3/subscriptions?externalReference=${encodeURIComponent(personalId)}&status=ACTIVE&limit=1`,
          { method: 'GET', headers }
        );
        if (!listRes.ok) {
          console.error('[Asaas] List subscriptions failed:', listRes.status);
          return res.status(502).json({ error: 'Não foi possível localizar sua assinatura. Contate o suporte.' });
        }
        const listData = (await listRes.json().catch(() => ({}))) as { data?: { id?: string }[] };
        subscriptionId = listData?.data?.[0]?.id ?? null;
      }
      if (!subscriptionId) {
        return res.status(400).json({ error: 'Assinatura não encontrada na Asaas. Seu plano já pode ter sido cancelado.' });
      }

      const headers = getAsaasHeaders();
      const delRes = await fetch(`${ASAAS_BASE_URL}/v3/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers,
      });
      if (!delRes.ok) {
        const errBody = await delRes.json().catch(() => ({}));
        console.error('[Asaas] Delete subscription failed:', delRes.status, errBody);
        return res.status(502).json({ error: 'Não foi possível cancelar na Asaas. Tente novamente ou contate o suporte.' });
      }

      await prisma.personalTrainer.update({
        where: { id: personalId },
        data: { maxStudentsAllowed: FREE_PLAN_STUDENTS, asaasSubscriptionId: null },
      });
      console.log(`[Subscription] Assinatura cancelada pelo personal ${personalId}`);
      res.json({ success: true, maxStudentsAllowed: FREE_PLAN_STUDENTS });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ error: 'Erro ao cancelar assinatura.' });
    }
  }
}
