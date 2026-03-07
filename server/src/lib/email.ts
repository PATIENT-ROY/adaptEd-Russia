interface SendInviteEmailParams {
  to: string;
  recipientName: string;
  setupLink: string;
  expiresAtIso: string;
}

interface SendInviteEmailResult {
  sent: boolean;
  provider: 'resend' | 'none';
  error?: string;
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

  if (!resendApiKey || !fromEmail) {
    return {
      sent: false,
      provider: 'none',
      error: 'RESEND_API_KEY или EMAIL_FROM не настроены',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject: 'Активация аккаунта AdaptEd Russia',
        html: buildInviteHtml(params),
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      return {
        sent: false,
        provider: 'resend',
        error: `Resend error: ${payload}`,
      };
    }

    return { sent: true, provider: 'resend' };
  } catch (error) {
    return {
      sent: false,
      provider: 'resend',
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}

