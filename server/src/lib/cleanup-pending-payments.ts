import { prisma } from './database';
import { cancelPayment, getPayment } from './yookassa';

export function pendingCutoff(olderThanHours = 24): Date {
  return new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
}

export function decidePendingCleanupAction(
  providerStatus: string | null,
): 'skip_paid' | 'cancel_provider' | 'mark_canceled' {
  if (!providerStatus) return 'mark_canceled';
  const status = providerStatus.toLowerCase();
  if (status === 'succeeded') return 'skip_paid';
  if (status === 'pending' || status === 'waiting_for_capture') return 'cancel_provider';
  return 'mark_canceled';
}

export async function cleanupPendingPayments(olderThanHours = 24) {
  const cutoff = pendingCutoff(olderThanHours);
  const stale = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      yooKassaPaymentId: true,
    },
  });

  let canceled = 0;
  let skippedPaid = 0;
  let failed = 0;

  for (const payment of stale) {
    try {
      let action: ReturnType<typeof decidePendingCleanupAction> = 'mark_canceled';
      if (payment.yooKassaPaymentId) {
        try {
          const verified = await getPayment(payment.yooKassaPaymentId);
          action = decidePendingCleanupAction(verified.status);
          if (action === 'cancel_provider') {
            await cancelPayment(payment.yooKassaPaymentId);
          }
        } catch (error) {
          console.error(`Pending cleanup provider error for ${payment.id}:`, error);
          action = 'mark_canceled';
        }
      }

      if (action === 'skip_paid') {
        skippedPaid += 1;
        continue;
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'CANCELED' },
      });
      canceled += 1;
    } catch (error) {
      failed += 1;
      console.error(`Pending cleanup failed for ${payment.id}:`, error);
    }
  }

  return {
    scanned: stale.length,
    canceled,
    skippedPaid,
    failed,
    cutoff: cutoff.toISOString(),
  };
}
