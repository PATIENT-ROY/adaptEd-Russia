import { v4 as uuidv4 } from 'uuid';
import { prisma } from './database';

type PlanLike = {
  id: string;
  name: string;
  price: number;
  interval: string;
};

/** Months of access for catalog Variant 1: 199 / 549 (3) / 1990 (12). */
export function getPlanDurationMonths(plan: PlanLike): number {
  const name = (plan.name || '').toLowerCase();
  if (name.includes('3') || name.includes('три') || name.includes('three')) return 3;
  if (plan.interval === 'YEARLY' || name.includes('год') || name.includes('year')) return 12;
  // legacy catalog leftovers
  if (name.includes('6') || name.includes('шест')) return 6;
  if (plan.price === 549) return 3;
  if (plan.price === 1990 || plan.price === 2990) return 12;
  if (plan.price === 1499) return 6;
  return 1;
}

export async function resolvePlanForPayment(payment: {
  planId: string | null;
  amount: number;
}): Promise<PlanLike | null> {
  if (payment.planId) {
    const byId = await prisma.subscriptionPlan.findUnique({ where: { id: payment.planId } });
    if (byId) return byId;
  }
  const byPrice = await prisma.subscriptionPlan.findFirst({
    where: { price: payment.amount, isActive: true },
  });
  if (byPrice) return byPrice;
  return prisma.subscriptionPlan.findFirst({
    where: { isActive: true, price: { gt: 0 } },
    orderBy: { price: 'asc' },
  });
}

export async function applyPremiumForPayment(opts: {
  userId: string;
  paymentId: string;
  plan: PlanLike;
  markSucceeded?: boolean;
}): Promise<{ startDate: Date; endDate: Date }> {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + getPlanDurationMonths(opts.plan));

  await prisma.subscription.upsert({
    where: { userId: opts.userId },
    update: {
      status: 'ACTIVE',
      startDate,
      endDate,
      paymentId: opts.paymentId,
      planId: opts.plan.id,
    },
    create: {
      id: uuidv4(),
      userId: opts.userId,
      planId: opts.plan.id,
      status: 'ACTIVE',
      startDate,
      endDate,
      autoRenew: true,
      paymentId: opts.paymentId,
    },
  });

  await prisma.user.update({
    where: { id: opts.userId },
    data: { plan: 'PREMIUM' },
  });

  if (opts.markSucceeded !== false) {
    await prisma.payment.update({
      where: { id: opts.paymentId },
      data: { status: 'SUCCEEDED' },
    });
  }

  return { startDate, endDate };
}
