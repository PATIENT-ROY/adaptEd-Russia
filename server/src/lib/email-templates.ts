export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const APP_NAME = 'AdaptEd Russia';

export function renderEmailShell(params: {
  preheader: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
}) {
  const preheader = escapeHtml(params.preheader);
  const title = escapeHtml(params.title);
  const year = new Date().getUTCFullYear();
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2ff;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0e7ff;">
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#6d28d9);padding:22px 28px;">
              <p style="margin:0;font-size:13px;letter-spacing:.04em;color:#c7d2fe;text-transform:uppercase;">${APP_NAME}</p>
              <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#ffffff;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${params.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;color:#6b7280;font-size:12px;line-height:1.5;">
              ${params.footerNote || `Это письмо отправлено автоматически. Ответить можно на support@adaptedrussia.ru.`}
              <br />© ${year} ${APP_NAME}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string, color = '#2563eb') {
  return `<p style="margin:0 0 20px 0;">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
      ${escapeHtml(label)}
    </a>
  </p>`;
}

export function renderWelcomeEmail(params: { name: string; appUrl: string; language?: string }) {
  const name = escapeHtml(params.name || 'студент');
  const isEn = params.language === 'EN' || params.language === 'en';
  const title = isEn ? 'Welcome to AdaptEd Russia' : 'Добро пожаловать в AdaptEd Russia';
  const body = isEn
    ? `<p style="margin:0 0 12px 0;">Hi, ${name}.</p>
       <p style="margin:0 0 16px 0;">Your account is ready. Guides, AdaptEd AI, and reminders are available after sign-in.</p>
       ${ctaButton(params.appUrl, 'Open AdaptEd')}
       <p style="margin:0;color:#6b7280;font-size:14px;">If you did not create this account, ignore this email.</p>`
    : `<p style="margin:0 0 12px 0;">Здравствуйте, ${name}.</p>
       <p style="margin:0 0 16px 0;">Аккаунт создан. Гайды, AdaptEd AI и напоминания доступны после входа.</p>
       ${ctaButton(params.appUrl, 'Открыть AdaptEd')}
       <p style="margin:0;color:#6b7280;font-size:14px;">Если это были не вы — просто проигнорируйте письмо.</p>`;
  return {
    subject: title,
    html: renderEmailShell({ preheader: title, title, bodyHtml: body }),
  };
}

export function renderInviteEmail(params: {
  recipientName: string;
  setupLink: string;
  expiresAtIso: string;
}) {
  const name = escapeHtml(params.recipientName || 'студент');
  const expires = escapeHtml(new Date(params.expiresAtIso).toLocaleString('ru-RU'));
  const title = 'Активация аккаунта AdaptEd Russia';
  const body = `<p style="margin:0 0 12px 0;">Здравствуйте, ${name}.</p>
    <p style="margin:0 0 16px 0;">Администратор создал для вас аккаунт. Установите пароль, чтобы войти.</p>
    ${ctaButton(params.setupLink, 'Установить пароль')}
    <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">Ссылка действует до: ${expires}</p>
    <p style="margin:0;color:#6b7280;font-size:13px;word-break:break-all;">${escapeHtml(params.setupLink)}</p>`;
  return {
    subject: title,
    html: renderEmailShell({ preheader: title, title, bodyHtml: body }),
  };
}

export function renderDeadlineEmail(params: {
  name: string;
  title: string;
  description?: string | null;
  dueDate: Date;
  appUrl: string;
  upcoming: boolean;
}) {
  const name = escapeHtml(params.name || 'студент');
  const itemTitle = escapeHtml(params.title);
  const dueLabel = escapeHtml(
    params.dueDate.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  );
  const heading = params.upcoming ? 'Скоро дедлайн' : 'Срок наступил';
  const subject = params.upcoming ? `Скоро срок: ${params.title}` : `Дедлайн: ${params.title}`;
  const lead = params.upcoming
    ? 'Напоминание сработает в ближайшие 24 часа. Проверьте, что всё готово.'
    : 'Срок этого напоминания уже наступил.';
  const description = params.description
    ? `<p style="margin:0 0 16px 0;color:#4b5563">${escapeHtml(params.description)}</p>`
    : '';
  const body = `<p style="margin:0 0 12px 0;">Здравствуйте, ${name}.</p>
    <p style="margin:0 0 16px 0;">${lead}</p>
    <p style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#1e3a8a;">${itemTitle}</p>
    <p style="margin:0 0 16px 0;color:#6b7280">Срок: ${dueLabel}</p>
    ${description}
    ${ctaButton(`${params.appUrl.replace(/\/$/, '')}/reminders`, 'Открыть напоминания', '#7c3aed')}`;
  return {
    subject,
    html: renderEmailShell({ preheader: subject, title: heading, bodyHtml: body }),
  };
}
