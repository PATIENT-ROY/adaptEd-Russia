import { v4 as uuidv4 } from 'uuid';
import { prisma } from './database';
import { PlanKey } from './plan-limits';

export type SubscriptionSnapshot = {
  status: string;
  startDate: Date;
  endDate: Date;
  paymentId?: string;
} | null;

export type PlanDuration = {
  interval?: string | null;
  name?: string | null;
};

/**
 * Proposed complimentary/admin grant. There is no such table today.
 * getEffectivePlan does not load this — do not backfill User.plan as a grant.
 */
export type ComplimentaryGrant = {
  until?: Date | null;
  revokedAt?: Date | null;
} | null | undefined;

export type SubscriptionApplySource = 'live' | 'restore';

export type SubscriptionApplyResult =
  | { kind: 'noop'; reason: 'duplicate' | 'existing_row' | 'window_expired' | 'already_covered' }
  | { kind: 'write'; startDate: Date; endDate: Date; status: 'ACTIVE' };

const PAID_STATUSES = new Set(['ACTIVE', 'CANCELED']);

export function normalizePlanKey(plan: string | null | undefined): PlanKey {
  return (plan || '').toUpperCase() === 'PREMIUM' ? 'PREMIUM' : 'FREEMIUM';
}

/**
 * Schema only stores MONTHLY | YEARLY. Six-month SKUs are MONTHLY with
 * duration encoded in the plan name. Prefer interval for yearly, name for 6.
 */
export function subscriptionDurationMonths(plan: PlanDuration): number {
  const interval = (plan.interval || '').toUpperCase();
  const name = (plan.name || '').toLowerCase().replace(/ё/g, 'е');

  if (interval === 'YEARLY' || /год|year|annual|année|annee/.test(name)) {
    return 12;
  }
  if (/\b6\b|шест|six/.test(name)) {
    return 6;
  }
  return 1;
}

export function addMonths(start: Date, months: number): Date {
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end;
}

export function computePaidWindow(
  start: Date,
  plan: PlanDuration,
): { startDate: Date; endDate: Date } {
  return {
    startDate: start,
    endDate: addMonths(start, subscriptionDurationMonths(plan)),
  };
}

export function hasPaidEntitlement(
  subscription: SubscriptionSnapshot,
  now = new Date(),
): boolean {
  if (!subscription) return false;

  const status = (subscription.status || '').toUpperCase();
  if (!PAID_STATUSES.has(status)) return false;

  const started = subscription.startDate.getTime() <= now.getTime();
  const notEnded = subscription.endDate.getTime() >= now.getTime();
  return started && notEnded;
}

export function snapshotAfterCancel(
  subscription: NonNullable<SubscriptionSnapshot>,
): NonNullable<SubscriptionSnapshot> {
  return {
    status: 'CANCELED',
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    paymentId: subscription.paymentId,
  };
}

export function isComplimentaryGrantActive(
  grant: ComplimentaryGrant,
  now: Date,
): boolean {
  if (!grant) return false;
  if (grant.revokedAt && grant.revokedAt.getTime() <= now.getTime()) return false;
  if (grant.until == null) return true;
  return grant.until.getTime() >= now.getTime();
}

/**
 * Paid window first. Then an explicit PlanGrant (proposed, not persisted).
 * Expired paid row beats leftover User.plan — that field is a payment cache,
 * not an admin marker. There is no planSource / grantedUntil today.
 */
export function resolveEffectivePlan(input: {
  userPlan: string | null | undefined;
  subscription: SubscriptionSnapshot;
  grant?: ComplimentaryGrant;
  now?: Date;
}): PlanKey {
  const now = input.now ?? new Date();
  const sub = input.subscription;

  if (hasPaidEntitlement(sub, now)) {
    return 'PREMIUM';
  }

  if (isComplimentaryGrantActive(input.grant, now)) {
    return 'PREMIUM';
  }

  if (sub) {
    const status = (sub.status || '').toUpperCase();
    const ended = sub.endDate.getTime() < now.getTime();
    const wasPaidAttempt = PAID_STATUSES.has(status) || status === 'EXPIRED';
    if (wasPaidAttempt && ended) {
      return 'FREEMIUM';
    }
  }

  return normalizePlanKey(input.userPlan);
}

/**
 * Live webhook / payment-check / apply-premium:
 *  - same paymentId → noop (retry-safe)
 *  - entitled + incoming window already covered → noop (delayed older payment)
 *  - entitled + new purchase → stack months onto current endDate
 *  - otherwise window from payment.createdAt; expired → noop
 *
 * Restore (missed webhook): never rewrite an existing row; never mint a
 * fresh period from an old SUCCEEDED payment whose createdAt window ended.
 */
export function resolveSubscriptionAfterPayment(input: {
  source: SubscriptionApplySource;
  existing: SubscriptionSnapshot;
  paymentId: string;
  paymentCreatedAt: Date;
  plan: PlanDuration;
  now: Date;
}): SubscriptionApplyResult {
  const incoming = computePaidWindow(input.paymentCreatedAt, input.plan);
  const months = subscriptionDurationMonths(input.plan);

  if (input.existing?.paymentId === input.paymentId) {
    return { kind: 'noop', reason: 'duplicate' };
  }

  if (input.source === 'restore') {
    if (input.existing) {
      return { kind: 'noop', reason: 'existing_row' };
    }
    if (incoming.endDate.getTime() < input.now.getTime()) {
      return { kind: 'noop', reason: 'window_expired' };
    }
    return {
      kind: 'write',
      startDate: incoming.startDate,
      endDate: incoming.endDate,
      status: 'ACTIVE',
    };
  }

  if (input.existing && hasPaidEntitlement(input.existing, input.now)) {
    if (incoming.endDate.getTime() <= input.existing.endDate.getTime()) {
      return { kind: 'noop', reason: 'already_covered' };
    }
    return {
      kind: 'write',
      startDate: input.existing.startDate,
      endDate: addMonths(input.existing.endDate, months),
      status: 'ACTIVE',
    };
  }

  if (incoming.endDate.getTime() < input.now.getTime()) {
    return { kind: 'noop', reason: 'window_expired' };
  }

  return {
    kind: 'write',
    startDate: incoming.startDate,
    endDate: incoming.endDate,
    status: 'ACTIVE',
  };
}

export async function loadSubscriptionSnapshot(
  userId: string,
): Promise<SubscriptionSnapshot> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true, startDate: true, endDate: true, paymentId: true },
  });
  return subscription;
}

export async function getEffectivePlan(
  userId: string,
  now = new Date(),
): Promise<PlanKey> {
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    }),
    loadSubscriptionSnapshot(userId),
  ]);

  return resolveEffectivePlan({
    userPlan: user?.plan,
    subscription,
    now,
  });
}

export async function overlayEffectivePlan<T extends { id: string; plan: string }>(
  user: T,
): Promise<T> {
  const plan = await getEffectivePlan(user.id);
  return { ...user, plan };
}

export async function applySucceededPayment(input: {
  userId: string;
  paymentId: string;
  paymentCreatedAt: Date;
  plan: { id: string; interval?: string | null; name?: string | null };
  source: SubscriptionApplySource;
  now?: Date;
}): Promise<{ applied: boolean; reason?: string }> {
  const existing = await prisma.subscription.findUnique({
    where: { userId: input.userId },
    select: { status: true, startDate: true, endDate: true, paymentId: true },
  });

  const decision = resolveSubscriptionAfterPayment({
    source: input.source,
    existing,
    paymentId: input.paymentId,
    paymentCreatedAt: input.paymentCreatedAt,
    plan: input.plan,
    now: input.now ?? new Date(),
  });

  if (decision.kind === 'noop') {
    return { applied: false, reason: decision.reason };
  }

  await prisma.subscription.upsert({
    where: { userId: input.userId },
    update: {
      status: decision.status,
      startDate: decision.startDate,
      endDate: decision.endDate,
      paymentId: input.paymentId,
      planId: input.plan.id,
    },
    create: {
      id: uuidv4(),
      userId: input.userId,
      planId: input.plan.id,
      status: decision.status,
      startDate: decision.startDate,
      endDate: decision.endDate,
      autoRenew: true,
      paymentId: input.paymentId,
    },
  });
  await prisma.user.update({
    where: { id: input.userId },
    data: { plan: 'PREMIUM' },
  });
  return { applied: true };
}

/**
 * Webhook-miss restore only. Never extends an expired row from an old payment.
 */
export async function restoreMissedPaidSubscription(userId: string, now = new Date()): Promise<void> {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const succeeded = payments.find(
    (payment) => (payment.status || '').toUpperCase() === 'SUCCEEDED',
  );
  if (!succeeded) return;

  const plan = succeeded.planId
    ? await prisma.subscriptionPlan.findUnique({ where: { id: succeeded.planId } })
    : await prisma.subscriptionPlan.findFirst({
        where: { price: succeeded.amount, isActive: true },
      }) || await prisma.subscriptionPlan.findFirst({
        where: { isActive: true, price: { gt: 0 } },
        orderBy: { price: 'asc' },
      });
  if (!plan) return;

  await applySucceededPayment({
    userId,
    paymentId: succeeded.id,
    paymentCreatedAt: succeeded.createdAt,
    plan,
    source: 'restore',
    now,
  });
}
