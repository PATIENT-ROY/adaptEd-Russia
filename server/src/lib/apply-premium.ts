import { v4 as uuidv4 } from 'uuid';
import { prisma } from './database';
import { getPayment, YooKassaPayment, YooKassaRefund } from './yookassa';
import { isPaymentTester } from './payment-test-access';

export class PaymentVerificationError extends Error {}

export function getPlanDurationMonths(plan: { durationMonths: number }): number {
  if (!Number.isInteger(plan.durationMonths) || plan.durationMonths < 1 || plan.durationMonths > 120) {
    throw new PaymentVerificationError('Invalid subscription duration');
  }
  return plan.durationMonths;
}

export function formatPremiumPaymentDescription(plan: { durationMonths: number }): string {
  const months = getPlanDurationMonths(plan);
  if (months === 12) return 'Подписка Премиум — год';
  if (months === 1) return 'Подписка Премиум — месяц';
  return `Подписка Премиум — ${months} мес.`;
}

// Clamp to the last day of the target month (Jan 31 + 1 month = Feb 28/29).
export function addSubscriptionMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

type AppliedPurchase = {
  id: string;
  planId: string | null;
  durationMonths: number | null;
  appliedAt: Date | null;
  createdAt?: Date;
};

export type PremiumEntitlement = {
  startDate: Date;
  endDate: Date;
  paymentId: string;
  planId: string;
};

/** Replay the paid-access ledger after a refund, including gaps between purchases. */
export function calculatePremiumEntitlement(
  purchases: AppliedPurchase[],
): PremiumEntitlement | null {
  let entitlement: PremiumEntitlement | null = null;
  const ordered = [...purchases].sort((a, b) => {
    const byAppliedAt = (a.appliedAt?.getTime() || 0) - (b.appliedAt?.getTime() || 0);
    const byCreatedAt = (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
    return byAppliedAt || byCreatedAt || a.id.localeCompare(b.id);
  });

  for (const purchase of ordered) {
    if (!purchase.appliedAt || !purchase.planId || !purchase.durationMonths) {
      throw new PaymentVerificationError('Applied payment is missing entitlement data');
    }
    const months = getPlanDurationMonths({ durationMonths: purchase.durationMonths });
    const current = entitlement;
    const continuesCurrentSegment: boolean =
      current !== null && current.endDate > purchase.appliedAt;
    const startDate: Date = continuesCurrentSegment
      ? current!.startDate
      : purchase.appliedAt;
    const baseDate: Date = continuesCurrentSegment
      ? current!.endDate
      : purchase.appliedAt;
    entitlement = {
      startDate,
      endDate: addSubscriptionMonths(baseDate, months),
      paymentId: purchase.id,
      planId: purchase.planId,
    };
  }

  return entitlement;
}

function moneyToCents(value: string | number): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new PaymentVerificationError('Invalid refund amount');
  }
  return Math.round(amount * 100);
}

export function assertVerifiedPayment(
  payment: { yooKassaPaymentId: string | null; amount: number; currency: string; status?: string },
  verified: YooKassaPayment,
): void {
  if (String(payment.status || '').toUpperCase() === 'REFUNDED') {
    throw new PaymentVerificationError('Payment was refunded');
  }
  if (!payment.yooKassaPaymentId || verified.id !== payment.yooKassaPaymentId ||
      !Number.isFinite(Number(verified.amount?.value)) ||
      Math.round(Number(verified.amount.value) * 100) !== Math.round(payment.amount * 100) ||
      verified.amount.currency !== payment.currency ||
      !['pending', 'waiting_for_capture', 'succeeded', 'canceled'].includes(verified.status) ||
      (verified.status === 'succeeded' && verified.paid !== true)) {
    throw new PaymentVerificationError('Payment verification failed');
  }
}

/** All entry points use provider verification followed by the same atomic application. */
export async function synchronizePayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment?.yooKassaPaymentId || !payment.userId) {
    throw new PaymentVerificationError('Payment has no provider confirmation');
  }
  if (String(payment.status).toUpperCase() === 'REFUNDED') {
    return payment;
  }
  const verified = await getPayment(payment.yooKassaPaymentId);
  return applyVerifiedPayment(paymentId, verified);
}

export async function applyVerifiedPayment(paymentId: string, verified: YooKassaPayment) {
  return prisma.$transaction(async (tx) => {
    const initial = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!initial?.userId) throw new PaymentVerificationError('Payment owner missing');

    // Serialize every payment for this user, including two different purchases.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${initial.userId} FOR UPDATE`;
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (String(payment.status).toUpperCase() === 'REFUNDED') return payment;
    assertVerifiedPayment(payment, verified);
    const owner = await tx.user.findUniqueOrThrow({ where: { id: initial.userId } });
    if ((verified.test || verified.id.startsWith('test_')) && !isPaymentTester(owner)) {
      throw new PaymentVerificationError('PAYMENT_TEST_ONLY');
    }

    // Also protects previously applied payments after newer purchases replace paymentId.
    if (payment.appliedAt) return payment;
    const status = verified.status.toUpperCase();
    if (status !== 'SUCCEEDED') {
      if (payment.status === 'SUCCEEDED' || payment.status === 'CANCELED' || payment.status === 'REFUNDED') {
        return payment;
      }
      return tx.payment.update({ where: { id: paymentId }, data: { status } });
    }

    if (!payment.planId || !payment.durationMonths) {
      throw new PaymentVerificationError('Purchased plan or duration missing');
    }
    const plan = await tx.subscriptionPlan.findUnique({ where: { id: payment.planId } });
    if (!plan) throw new PaymentVerificationError('Purchased plan missing');
    const months = getPlanDurationMonths({ durationMonths: payment.durationMonths });
    const now = new Date();
    const existing = await tx.subscription.findUnique({ where: { userId: owner.id } });
    const hasRemainingTime = existing?.status === 'ACTIVE' && existing.endDate > now;
    const endDate = addSubscriptionMonths(hasRemainingTime ? existing.endDate : now, months);
    const startDate = hasRemainingTime ? existing.startDate : now;
    const data = { planId: plan.id, status: 'ACTIVE', startDate, endDate,
      paymentId, autoRenew: false };
    await tx.subscription.upsert({
      where: { userId: owner.id },
      update: data,
      create: { id: uuidv4(), userId: owner.id, ...data },
    });
    await tx.user.update({ where: { id: owner.id }, data: { plan: 'PREMIUM' } });
    return tx.payment.update({ where: { id: paymentId }, data: { status, appliedAt: now } });
  });
}

/** Record an idempotent verified refund and rebuild access after a full refund. */
export async function applyVerifiedRefund(refund: YooKassaRefund) {
  if (refund.status !== 'succeeded' || !refund.payment_id || !refund.id) {
    throw new PaymentVerificationError('Refund is not succeeded');
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { yooKassaPaymentId: refund.payment_id },
    });
    if (!payment?.userId) return { matched: false as const };

    await tx.$queryRaw`SELECT id FROM users WHERE id = ${payment.userId} FOR UPDATE`;

    const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    const owner = await tx.user.findUniqueOrThrow({ where: { id: payment.userId } });
    if ((refund.test || refund.id.startsWith('test_refund_')) && !isPaymentTester(owner)) {
      throw new PaymentVerificationError('PAYMENT_TEST_ONLY');
    }

    const existingRefund = await tx.paymentRefund.findUnique({
      where: { yooKassaRefundId: refund.id },
    });
    if (existingRefund) {
      if (existingRefund.paymentId !== current.id) {
        throw new PaymentVerificationError('Refund belongs to another payment');
      }
      return {
        matched: true as const,
        paymentId: current.id,
        alreadyProcessed: true as const,
        fullyRefunded: String(current.status).toUpperCase() === 'REFUNDED',
      };
    }

    if (refund.amount.currency !== current.currency) {
      throw new PaymentVerificationError('Refund currency mismatch');
    }
    const refundCents = moneyToCents(refund.amount.value);
    const paymentCents = moneyToCents(current.amount);
    const refunded = await tx.paymentRefund.aggregate({
      where: { paymentId: current.id, status: 'SUCCEEDED' },
      _sum: { amount: true },
    });
    const previousRefundCents = Math.round(Number(refunded._sum.amount || 0) * 100);
    const totalRefundedCents = previousRefundCents + refundCents;
    if (totalRefundedCents > paymentCents) {
      throw new PaymentVerificationError('Refund exceeds payment amount');
    }

    const providerCreatedAt = refund.created_at ? new Date(refund.created_at) : null;
    await tx.paymentRefund.create({
      data: {
        paymentId: current.id,
        yooKassaRefundId: refund.id,
        amount: refundCents / 100,
        currency: refund.amount.currency,
        status: 'SUCCEEDED',
        providerCreatedAt:
          providerCreatedAt && Number.isFinite(providerCreatedAt.getTime())
            ? providerCreatedAt
            : null,
      },
    });

    const fullyRefunded = totalRefundedCents === paymentCents;
    if (!fullyRefunded) {
      return {
        matched: true as const,
        paymentId: current.id,
        alreadyProcessed: false as const,
        fullyRefunded: false as const,
      };
    }

    await tx.payment.update({
      where: { id: current.id },
      data: { status: 'REFUNDED' },
    });

    const remainingPurchases = await tx.payment.findMany({
      where: {
        userId: current.userId!,
        status: 'SUCCEEDED',
        appliedAt: { not: null },
        NOT: { id: current.id },
      },
      select: { id: true, planId: true, durationMonths: true, appliedAt: true, createdAt: true },
      orderBy: [{ appliedAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const entitlement = calculatePremiumEntitlement(remainingPurchases);
    const now = new Date();

    if (entitlement && entitlement.endDate > now) {
      await tx.subscription.upsert({
        where: { userId: current.userId! },
        update: {
          ...entitlement,
          status: 'ACTIVE',
          autoRenew: false,
        },
        create: {
          id: uuidv4(),
          userId: current.userId!,
          ...entitlement,
          status: 'ACTIVE',
          autoRenew: false,
        },
      });
      await tx.user.update({
        where: { id: current.userId! },
        data: { plan: 'PREMIUM' },
      });
    } else {
      await tx.subscription.updateMany({
        where: { userId: current.userId!, status: 'ACTIVE' },
        data: { status: 'CANCELED', autoRenew: false },
      });
      await tx.user.update({
        where: { id: current.userId! },
        data: { plan: 'FREEMIUM' },
      });
    }

    return {
      matched: true as const,
      paymentId: current.id,
      alreadyProcessed: false as const,
      fullyRefunded: true as const,
    };
  });
}
