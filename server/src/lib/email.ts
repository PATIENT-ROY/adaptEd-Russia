interface SendInviteEmailParams {
  to: string;
  recipientName: string;
  setupLink: string;
  expiresAtIso: string;
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

function buildInviteHtml({
  recipientName,
  setupLink,
  expiresAtIso,
}: SendInviteEmailParams) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
      <h2 style="margin:0 0 12px 0;">Добро пожаловать в AdaptEd Russia</h2>
      <p style="margin:0 0 12px 0;">Здравствуйте, ${recipientName || 'студент'}.</p>
      <p style="margin:0 0 16px 0;">
        Администратор создал для вас аккаунт. Нажмите кнопку ниже, чтобы установить пароль и завершить активацию.
      </p>
      <p style="margin:0 0 20px 0;">
        <a href="${setupLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">
          Установить пароль
        </a>
      </p>
      <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">
        Ссылка действительна до: ${new Date(expiresAtIso).toLocaleString('ru-RU')}
      </p>
      <p style="margin:0;color:#6b7280;font-size:14px;">
        Если кнопка не работает, используйте ссылку: <br />
        <a href="${setupLink}">${setupLink}</a>
      </p>
    </div>
  `;
}

export async function sendInviteEmail(params: SendInviteEmailParams): Promise<SendInviteEmailResult> {
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
          // Helps avoid duplicate emails when retrying the same invitation.
          'Idempotency-Key': `invite:${params.to}:${params.expiresAtIso}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [params.to],
          ...(replyTo ? { reply_to: replyTo } : {}),
          subject: 'Активация аккаунта AdaptEd Russia',
          html: buildInviteHtml(params),
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
