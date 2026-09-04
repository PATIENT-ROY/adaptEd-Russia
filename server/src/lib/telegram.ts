import crypto from 'crypto';
import { prisma } from './database';

const LINK_TTL_MS = 30 * 60 * 1000;
const START_PAYLOAD_RE = /^[A-Za-z0-9_-]{8,64}$/;

export type TelegramSocialLinks = {
  telegramChatId?: string;
  telegramUsername?: string;
  telegramLinkToken?: string;
  telegramLinkExpiresAt?: string;
};

export type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    chat?: { id?: number; username?: string };
    from?: { username?: string; language_code?: string };
  };
};

export function parseSocialLinks(raw: string | null | undefined): TelegramSocialLinks {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as TelegramSocialLinks & {
      telegram_chat_id?: string;
    };
    if (parsed.telegram_chat_id && !parsed.telegramChatId) {
      parsed.telegramChatId = String(parsed.telegram_chat_id);
    }
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeSocialLinks(links: TelegramSocialLinks): string {
  const next: TelegramSocialLinks = {};
  if (links.telegramChatId) next.telegramChatId = String(links.telegramChatId);
  if (links.telegramUsername) next.telegramUsername = links.telegramUsername;
  if (links.telegramLinkToken) next.telegramLinkToken = links.telegramLinkToken;
  if (links.telegramLinkExpiresAt) next.telegramLinkExpiresAt = links.telegramLinkExpiresAt;
  return JSON.stringify(next);
}

export function parseTelegramChatId(raw: string | null | undefined): string | null {
  const id = parseSocialLinks(raw).telegramChatId;
  return id ? String(id) : null;
}

export function parseStartPayload(text: string | undefined): string | null {
  if (!text) return null;
  const match = text.trim().match(/^\/start(?:@[A-Za-z0-9_]+)?(?:\s+(.+))?$/);
  if (!match) return null;
  const payload = (match[1] || '').trim();
  if (!payload) return '';
  return START_PAYLOAD_RE.test(payload) ? payload : '';
}

export function verifyTelegramWebhookSecret(header: string | string[] | undefined): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return process.env.NODE_ENV !== 'production';
  const provided = Array.isArray(header) ? header[0] : header;
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function telegramApi(method: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const url = telegramApi('sendMessage');
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error('[telegram] sendMessage failed:', response.status, body);
    }
    return response.ok;
  } catch (error) {
    console.error('[telegram] sendMessage failed:', error);
    return false;
  }
}

let cachedBotUsername: string | null = null;

export async function getTelegramBotUsername(): Promise<string | null> {
  if (process.env.TELEGRAM_BOT_USERNAME) {
    return process.env.TELEGRAM_BOT_USERNAME.replace(/^@/, '');
  }
  if (cachedBotUsername) return cachedBotUsername;
  const url = telegramApi('getMe');
  if (!url) return null;
  try {
    const response = await fetch(url);
    const payload = (await response.json()) as { ok?: boolean; result?: { username?: string } };
    cachedBotUsername = payload.result?.username || null;
    return cachedBotUsername;
  } catch (error) {
    console.error('[telegram] getMe failed:', error);
    return null;
  }
}

async function saveSocialLinks(userId: string, links: TelegramSocialLinks) {
  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      interests: '[]',
      socialLinks: serializeSocialLinks(links),
    },
    update: { socialLinks: serializeSocialLinks(links) },
  });
}

export async function getTelegramStatus(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { socialLinks: true },
  });
  const links = parseSocialLinks(profile?.socialLinks);
  return {
    linked: Boolean(links.telegramChatId),
    username: links.telegramUsername || null,
    botUsername: await getTelegramBotUsername(),
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  };
}

export async function createTelegramLink(userId: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_NOT_CONFIGURED');
  }

  const botUsername = await getTelegramBotUsername();
  if (!botUsername) {
    throw new Error('TELEGRAM_NOT_CONFIGURED');
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { socialLinks: true },
  });
  const links = parseSocialLinks(profile?.socialLinks);
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + LINK_TTL_MS).toISOString();

  await saveSocialLinks(userId, {
    ...links,
    telegramLinkToken: token,
    telegramLinkExpiresAt: expiresAt,
  });

  return {
    url: `https://t.me/${botUsername}?start=${token}`,
    expiresAt,
  };
}

export async function unlinkTelegram(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { socialLinks: true },
  });
  const links = parseSocialLinks(profile?.socialLinks);
  delete links.telegramChatId;
  delete links.telegramUsername;
  delete links.telegramLinkToken;
  delete links.telegramLinkExpiresAt;
  await saveSocialLinks(userId, links);
}

async function unlinkChatIdFromOthers(chatId: string, keepUserId: string) {
  const profiles = await prisma.profile.findMany({
    where: { socialLinks: { contains: chatId } },
    select: { userId: true, socialLinks: true },
  });

  for (const profile of profiles) {
    if (profile.userId === keepUserId) continue;
    const links = parseSocialLinks(profile.socialLinks);
    if (links.telegramChatId !== chatId) continue;
    delete links.telegramChatId;
    delete links.telegramUsername;
    await saveSocialLinks(profile.userId, links);
  }
}

async function consumeLinkToken(token: string, chatId: string, username?: string) {
  const profiles = await prisma.profile.findMany({
    where: { socialLinks: { contains: token } },
    select: { userId: true, socialLinks: true },
  });

  const match = profiles.find((profile) => parseSocialLinks(profile.socialLinks).telegramLinkToken === token);
  if (!match) return 'invalid' as const;

  const links = parseSocialLinks(match.socialLinks);
  const expiresAt = links.telegramLinkExpiresAt ? Date.parse(links.telegramLinkExpiresAt) : 0;
  if (!expiresAt || expiresAt < Date.now()) return 'expired' as const;

  await unlinkChatIdFromOthers(chatId, match.userId);
  await saveSocialLinks(match.userId, {
    telegramChatId: chatId,
    telegramUsername: username,
  });
  return 'linked' as const;
}

function startReply(kind: 'need_link' | 'invalid' | 'expired' | 'linked', language?: string) {
  const en = language?.toLowerCase().startsWith('en');
  if (kind === 'linked') {
    return en
      ? 'AdaptEd is connected. Deadline alerts will arrive here when a reminder uses Telegram.'
      : 'AdaptEd подключён. Дедлайны придут сюда, если в напоминании выбран Telegram.';
  }
  if (kind === 'expired') {
    return en
      ? 'This link expired. Generate a new one in Profile → Settings.'
      : 'Ссылка устарела. Сгенерируйте новую в Профиль → Настройки.';
  }
  if (kind === 'invalid') {
    return en
      ? 'This link is invalid. Open AdaptEd → Profile → Settings → Connect Telegram.'
      : 'Ссылка недействительна. Откройте AdaptEd → Профиль → Настройки → Подключить Telegram.';
  }
  return en
    ? 'Open AdaptEd → Profile → Settings → Connect Telegram, then tap Start again.'
    : 'Откройте AdaptEd → Профиль → Настройки → Подключить Telegram, затем снова нажмите Start.';
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  const chatId = message?.chat?.id;
  if (!message || chatId == null) return;

  const payload = parseStartPayload(message.text);
  if (payload === null) return;

  const language = message.from?.language_code;
  const username = message.from?.username || message.chat?.username;
  let kind: 'need_link' | 'invalid' | 'expired' | 'linked' = 'need_link';

  if (payload) {
    kind = await consumeLinkToken(payload, String(chatId), username);
  }

  await sendTelegramMessage(String(chatId), startReply(kind, language));
}

export async function syncTelegramWebhook(): Promise<void> {
  if (process.env.TELEGRAM_SET_WEBHOOK === 'false') return;
  const url = telegramApi('setWebhook');
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!url || !webhookUrl || !secret) {
    if (process.env.TELEGRAM_BOT_TOKEN) {
      console.warn('[telegram] webhook skipped: TELEGRAM_WEBHOOK_URL / TELEGRAM_WEBHOOK_SECRET');
    }
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ['message'],
        drop_pending_updates: false,
      }),
    });
    const payload = await response.text();
    if (!response.ok) {
      console.error('[telegram] setWebhook failed:', response.status, payload);
      return;
    }
    console.log('[telegram] webhook set:', webhookUrl);
  } catch (error) {
    console.error('[telegram] setWebhook failed:', error);
  }
}
