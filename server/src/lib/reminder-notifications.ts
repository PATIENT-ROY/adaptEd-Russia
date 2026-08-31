import { prisma } from './database';
import { sendReminderEmail } from './email';

export const FREEMIUM_MONTHLY_NOTIFICATIONS = 2;

export interface ReminderQuota {
  used: number;
  limit: number | null;
  plan: 'FREEMIUM' | 'PREMIUM';
}

function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getEffectivePlan(userId: string): Promise<'FREEMIUM' | 'PREMIUM'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (user?.plan === 'PREMIUM') return 'PREMIUM';

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    select: { id: true },
  });

  return subscription ? 'PREMIUM' : 'FREEMIUM';
}

export async function getReminderQuota(userId: string): Promise<ReminderQuota> {
  const plan = await getEffectivePlan(userId);
  const used = await prisma.reminder.count({
    where: {
      userId,
      notifiedAt: { gte: monthStart() },
    },
  });

  return {
    used,
    limit: plan === 'PREMIUM' ? null : FREEMIUM_MONTHLY_NOTIFICATIONS,
    plan,
  };
}

function parseTelegramChatId(socialLinks: string | null | undefined): string | null {
  if (!socialLinks) return null;
  try {
    const parsed = JSON.parse(socialLinks) as { telegramChatId?: string; telegram_chat_id?: string };
    const id = parsed.telegramChatId || parsed.telegram_chat_id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return response.ok;
  } catch (error) {
    console.error('[reminders] telegram send failed:', error);
    return false;
  }
}

async function deliverReminder(reminder: {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  notificationMethod: string;
  user: {
    email: string;
    name: string;
    emailNotifications: boolean;
    profile: { socialLinks: string | null } | null;
  };
}): Promise<boolean> {
  const method = reminder.notificationMethod;
  const telegramChatId = parseTelegramChatId(reminder.user.profile?.socialLinks);

  if (method === 'telegram' && telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
    const sent = await sendTelegramMessage(
      telegramChatId,
      `AdaptEd: ${reminder.title}\nСрок: ${reminder.dueDate.toLocaleString('ru-RU')}`,
    );
    if (sent) return true;
  }

  if (!reminder.user.emailNotifications) {
    return true;
  }

  const result = await sendReminderEmail({
    to: reminder.user.email,
    name: reminder.user.name,
    title: reminder.title,
    description: reminder.description,
    dueDate: reminder.dueDate,
    reminderId: reminder.id,
  });

  if (!result.sent) {
    console.error('[reminders] email failed:', reminder.id, result.error);
  }

  return result.sent;
}

export async function dispatchDueReminders(): Promise<void> {
  const due = await prisma.reminder.findMany({
    where: {
      status: 'PENDING',
      notifiedAt: null,
      dueDate: { lte: new Date() },
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          emailNotifications: true,
          profile: { select: { socialLinks: true } },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
    take: 50,
  });

  if (due.length === 0) return;

  const quotaByUser = new Map<string, ReminderQuota>();

  for (const reminder of due) {
    let quota = quotaByUser.get(reminder.userId);
    if (!quota) {
      quota = await getReminderQuota(reminder.userId);
      quotaByUser.set(reminder.userId, quota);
    }

    if (quota.limit !== null && quota.used >= quota.limit) {
      continue;
    }

    const claimed = await prisma.reminder.updateMany({
      where: { id: reminder.id, notifiedAt: null, status: 'PENDING' },
      data: { notifiedAt: new Date() },
    });
    if (claimed.count === 0) continue;

    const sent = await deliverReminder(reminder);
    if (!sent) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { notifiedAt: null },
      });
      continue;
    }

    quota.used += 1;
  }
}

export function startReminderNotificationWorker() {
  if (process.env.REMINDER_CRON === 'false') return;

  const intervalMs = Number(process.env.REMINDER_CRON_MS) || 60_000;
  const tick = () => {
    dispatchDueReminders().catch((error) => {
      console.error('[reminders] dispatch failed:', error);
    });
  };

  tick();
  setInterval(tick, intervalMs);
}
