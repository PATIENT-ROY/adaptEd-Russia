import { prisma } from './database';

export function chatUsageDay(at = new Date()): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

export async function getChatUsage(userId: string, day = chatUsageDay()): Promise<number> {
  const usage = await prisma.chatDailyUsage.findUnique({ where: { userId_day: { userId, day } } });
  return usage?.used ?? 0;
}

// PostgreSQL serializes conditional updates to the same row, including across
// Node workers. Reserve before calling the provider; release on failure.
export async function reserveChatQuota(userId: string, limit: number, day = chatUsageDay()): Promise<boolean> {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`
      INSERT INTO "chat_daily_usage" ("userId", "day", "used") VALUES (${userId}, ${day}, 0)
      ON CONFLICT ("userId", "day") DO NOTHING
    `;
    const result = await tx.chatDailyUsage.updateMany({
      where: { userId, day, used: { lt: limit } },
      data: { used: { increment: 1 } },
    });
    return result.count === 1;
  });
}

export async function releaseChatQuota(userId: string, day: Date): Promise<void> {
  await prisma.chatDailyUsage.updateMany({
    where: { userId, day, used: { gt: 0 } },
    data: { used: { decrement: 1 } },
  });
}
