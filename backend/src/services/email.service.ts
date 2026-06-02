import nodemailer from 'nodemailer';

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type ParsedFrom = { name?: string; email: string };

function parseFromAddress(from: string): ParsedFrom {
  const trimmed = from.trim().replace(/^["']|["']$/g, '');
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, ''),
      email: match[2].trim(),
    };
  }
  return { email: trimmed };
}

function getBrevoApiKey(): string | null {
  const key = process.env.BREVO_API_KEY?.trim();
  return key || null;
}

async function sendViaBrevoApi(
  options: SendMailOptions,
  from: string,
): Promise<void> {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    throw new Error('BREVO_API_KEY não configurada');
  }

  const sender = parseFromAddress(from);
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: sender.name || 'Gym Code',
        email: sender.email,
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Brevo API ${response.status}: ${body}`);
  }

  try {
    const parsed = JSON.parse(body) as { code?: string; message?: string };
    if (parsed.code && parsed.message) {
      throw new Error(`Brevo API: ${parsed.message}`);
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      return;
    }
    throw e;
  }
}

function getTransporter() {
  const { host, port, user, pass } = getSmtpConfig();

  if (!host || !user || !pass) {
    return null;
  }

  const isInternalMaddy = host === 'maddy' || host === 'gymapp-maddy';
  const isBrevo =
    host.includes('brevo.com') || host.includes('sendinblue.com');

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: isInternalMaddy
      ? { rejectUnauthorized: false }
      : isBrevo
        ? { servername: 'smtp-relay.sendinblue.com' }
        : undefined,
    requireTLS: isBrevo || port === 587,
  });
}

export function isEmailConfigured(): boolean {
  if (getBrevoApiKey()) {
    return true;
  }

  const host = process.env.SMTP_HOST || 'maddy';
  const user = process.env.SMTP_USER || process.env.SMTP_FROM;
  const pass = process.env.SMTP_PASS || process.env.MADDY_SMTP_PASS;
  return Boolean(host && user && pass);
}

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || 'maddy',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || process.env.SMTP_FROM || 'noreply@mygymcode.com',
    pass: process.env.SMTP_PASS || process.env.MADDY_SMTP_PASS || '',
  };
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mygymcode.com';

  if (getBrevoApiKey()) {
    await sendViaBrevoApi(options, from);
    return;
  }

  const transporter = getTransporter();

  if (!transporter) {
    console.warn('[email] SMTP não configurado. E-mail não enviado.');
    console.warn(`[email] Destino: ${options.to}`);
    console.warn(`[email] Assunto: ${options.subject}`);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[email] Conteúdo:\n${options.text}`);
    }
    throw new Error('Serviço de e-mail não configurado');
  }

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export function buildPasswordResetEmail(params: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string; text: string } {
  const { name, resetUrl } = params;
  const subject = 'Redefinição de senha — Gym Code';

  const text = [
    `Olá, ${name}!`,
    '',
    'Recebemos uma solicitação para redefinir a senha da sua conta no Gym Code.',
    '',
    `Acesse o link abaixo (válido por 1 hora):`,
    resetUrl,
    '',
    'Se você não solicitou isso, ignore este e-mail.',
    '',
    'Equipe Gym Code',
  ].join('\n');

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #0f172a;">Redefinição de senha</h2>
      <p>Olá, <strong>${escapeHtml(name)}</strong>!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Gym Code</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Redefinir senha
        </a>
      </p>
      <p style="font-size: 14px; color: #64748b;">Ou copie e cole este link no navegador:<br/>
        <a href="${resetUrl}" style="color: #ea580c; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="font-size: 13px; color: #94a3b8;">O link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.</p>
    </div>
  `;

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
