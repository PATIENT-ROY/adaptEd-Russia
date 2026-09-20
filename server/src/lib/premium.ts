import { prisma } from './database';

export type PremiumAccess = {
  plan?: string | null;
  /** Subscription endDate — source of truth for paid access expiry. */
  premiumUntil?: Date | null;
};

/**
 * Premium is active only while plan is PREMIUM and endDate is still in the future.
 * A stale PREMIUM plan with a null/past endDate must not keep privileges.
 */
export function isPremiumActive(user: PremiumAccess): boolean {
  if (String(user.plan || '').toUpperCase() !== 'PREMIUM') return false;
  if (!user.premiumUntil) return false;
  return user.premiumUntil.getTime() > Date.now();
}

/** Resolve plan from an unexpired ACTIVE subscription (ignores stale user.plan). */
export async function getEffectivePlan(userId: string): Promise<'FREEMIUM' | 'PREMIUM'> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    select: { endDate: true },
  });

  if (subscription) return 'PREMIUM';

  // Heal stale PREMIUM flag left after expiry/cancel/refund.
  await prisma.user.updateMany({
    where: { id: userId, plan: 'PREMIUM' },
    data: { plan: 'FREEMIUM' },
  });

  return 'FREEMIUM';
}
