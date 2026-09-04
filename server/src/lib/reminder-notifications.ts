import { prisma } from './database';
import { SKIP_RESERVED_EMAIL, sendReminderEmail } from './email';
import { parseTelegramChatId, sendTelegramMessage } from './telegram';
import { getEffectivePlan } from './effective-plan';
import { FREEMIUM_MONTHLY_NOTIFICATIONS, PlanKey } from './plan-limits';

export { getEffectivePlan, FREEMIUM_MONTHLY_NOTIFICATIONS };

export interface ReminderQuota {
  used: number;
  limit: number | null;
  plan: PlanKey;
}

function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
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
    if (result.error === SKIP_RESERVED_EMAIL) return true;
    console.error('[reminders] email failed:', reminder.id, result.error);
  }

  return result.sent;
}

function reminderLeadMs() {
  const hours = Number(process.env.REMINDER_LEAD_HOURS);
  const parsed = Number.isFinite(hours) && hours >= 0 ? hours : 24;
  return parsed * 60 * 60 * 1000;
}

export async function dispatchDueReminders(): Promise<void> {
  const due = await prisma.reminder.findMany({
    where: {
      status: 'PENDING',
      notifiedAt: null,
      dueDate: { lte: new Date(Date.now() + reminderLeadMs()) },
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
