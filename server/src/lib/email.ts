import { renderDeadlineEmail, renderInviteEmail, renderWelcomeEmail } from './email-templates';

const RESERVED_EMAIL_HOSTS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'localhost',
]);

export const SKIP_RESERVED_EMAIL = 'SKIP_RESERVED_EMAIL';

export function isDeliverableEmail(to: string): boolean {
  const trimmed = to.trim();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return false;
  const host = trimmed.slice(at + 1).toLowerCase();
  return !RESERVED_EMAIL_HOSTS.has(host);
}

interface SendInviteEmailParams {
  to: string;
  recipientName: string;
  setupLink: string;
  expiresAtIso: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}

interface SendInviteEmailResult {
  sent: boolean;
  provider: 'resend' | 'none';
  attempts?: number;
  error?: string;
}

const DEFAULT_EMAIL_TIMEOUT_MS = 10_000;
const DEFAULT_EMAIL_MAX_RETRIES = 2;

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function shouldRetryStatus(status: number) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmail(params: SendEmailParams): Promise<SendInviteEmailResult> {
  if (!isDeliverableEmail(params.to)) {
    return {
      sent: false,
      provider: 'none',
      attempts: 0,
      error: SKIP_RESERVED_EMAIL,
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO;
  const timeoutMs = parsePositiveInt(process.env.EMAIL_REQUEST_TIMEOUT_MS, DEFAULT_EMAIL_TIMEOUT_MS);
  const maxRetries = parsePositiveInt(process.env.EMAIL_MAX_RETRIES, DEFAULT_EMAIL_MAX_RETRIES);

  if (!resendApiKey || !fromEmail) {
    return {
      sent: false,
      provider: 'none',
      attempts: 0,
      error: 'RESEND_API_KEY или EMAIL_FROM не настроены',
    };
  }

  let lastError = 'Unknown email error';
  let attempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    attempts = attempt + 1;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          ...(params.idempotencyKey ? { 'Idempotency-Key': params.idempotencyKey } : {}),
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [params.to],
          ...(replyTo ? { reply_to: replyTo } : {}),
          subject: params.subject,
          html: params.html,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { sent: true, provider: 'resend', attempts };
      }

      const payload = await response.text();
      lastError = `Resend error ${response.status}: ${payload}`;

      if (attempt < maxRetries && shouldRetryStatus(response.status)) {
        await sleep(300 * Math.pow(2, attempt));
        continue;
      }

      return {
        sent: false,
        provider: 'resend',
        attempts,
        error: lastError,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error.message : 'Unknown email error';

      if (attempt < maxRetries) {
        await sleep(300 * Math.pow(2, attempt));
        continue;
      }

      return {
        sent: false,
        provider: 'resend',
        attempts,
        error: lastError,
      };
    }
  }

  return {
    sent: false,
    provider: 'resend',
    attempts,
    error: lastError,
  };
}

export async function sendInviteEmail(params: SendInviteEmailParams): Promise<SendInviteEmailResult> {
  const rendered = renderInviteEmail(params);
  return sendEmail({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
    idempotencyKey: `invite:${params.to}:${params.expiresAtIso}`,
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  language?: string;
}): Promise<SendInviteEmailResult> {
  const appUrl = process.env.CLIENT_URL || process.env.APP_BASE_URL || 'https://adaptedrussia.ru';
  const rendered = renderWelcomeEmail({
    name: params.name,
    appUrl,
    language: params.language,
  });
  return sendEmail({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
    idempotencyKey: `welcome:${params.to}`,
  });
}

export async function sendReminderEmail(params: {
  to: string;
  name: string;
  title: string;
  description?: string | null;
  dueDate: Date;
  reminderId: string;
}): Promise<SendInviteEmailResult> {
  const appUrl = process.env.CLIENT_URL || process.env.APP_BASE_URL || 'https://adaptedrussia.ru';
  const rendered = renderDeadlineEmail({
    name: params.name,
    title: params.title,
    description: params.description,
    dueDate: params.dueDate,
    appUrl,
    upcoming: params.dueDate.getTime() > Date.now(),
  });

  return sendEmail({
    to: params.to,
    subject: rendered.subject,
    html: rendered.html,
    idempotencyKey: `reminder:${params.reminderId}:${params.dueDate.toISOString()}`,
  });
}
