import { Router } from 'express';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import {
  synchronizePayment, applyVerifiedPayment, applyVerifiedRefund, PaymentVerificationError,
  formatPremiumPaymentDescription, getPlanDurationMonths,
} from '../lib/apply-premium';
import {
  createPayment, cancelPayment, getPayment as getYooKassaPayment, getRefund,
  shouldUseMockYooKassa, isTestPaymentMode, isCheckoutAvailable, TEST_CARDS, TEST_SBP_PHONES,
} from '../lib/yookassa';
import { isPaymentTester } from '../lib/payment-test-access';
import { logWebhookEvent } from '../lib/webhook-log';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/availability', (req, res, next) => {
  if (req.headers.authorization) return authMiddleware(req, res, next);
  next();
}, (req, res) => {
  res.json({ available: isCheckoutAvailable() || (isTestPaymentMode() && isPaymentTester((req as any).user)) });
});

router.get('/plans', async (_req, res) => {
  try {
    res.json(await prisma.subscriptionPlan.findMany({
      where: { isActive: true }, orderBy: { price: 'asc' },
    }));
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

router.post('/create-payment', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (isTestPaymentMode() && !isPaymentTester(user)) {
      return res.status(403).json({ error: 'PAYMENT_TEST_ONLY' });
    }
    const { planId, paymentMethod = 'CARD' } = req.body || {};
    if (typeof planId !== 'string' || !['CARD', 'SBP', 'WALLET'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid plan or payment method' });
    }
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan?.isActive) return res.status(404).json({ error: 'Subscription plan not found' });
    if (!Number.isFinite(plan.price) || plan.price <= 0 || plan.currency !== 'RUB') {
      return res.status(400).json({ error: 'Invalid plan amount or currency' });
    }
    const description = formatPremiumPaymentDescription(plan);
    const paymentId = uuidv4();
    const payment = await prisma.payment.create({ data: {
      id: paymentId, userId: user.userId, planId: plan.id,
      amount: plan.price, currency: plan.currency, durationMonths: getPlanDurationMonths(plan),
      description, status: 'PENDING', paymentMethod,
    } });
    // Keep an uncertain API request pending: a timeout does not prove cancellation.
    const created = await createPayment(plan.price, description, {
      userId: user.userId, planId: plan.id, paymentId,
      planMonths: String(payment.durationMonths),
    }, { idempotenceKey: paymentId, returnUrlPaymentId: paymentId, paymentMethod });
    await prisma.payment.update({ where: { id: paymentId }, data: { yooKassaPaymentId: created.id } });
    res.json({ paymentId, yooKassaPaymentId: created.id,
      confirmationUrl: created.confirmation?.confirmation_url,
      amount: created.amount, description: created.description,
      mock: shouldUseMockYooKassa() || created.id.startsWith('test_'),
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(502).json({ error: 'Failed to create payment' });
  }
});

async function findOwnedPayment(id: string, userId: string) {
  return prisma.payment.findFirst({ where: { userId, OR: [{ id }, { yooKassaPaymentId: id }] } });
}

router.get('/payment/:paymentId', authMiddleware, async (req, res) => {
  try {
    const payment = await findOwnedPayment(req.params.paymentId, (req as any).user.userId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    // A local record with no provider id can be displayed, but never activated.
    res.json(payment.yooKassaPaymentId ? await synchronizePayment(payment.id) : payment);
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(502).json({ error: 'Unable to verify payment' });
  }
});

router.post('/payment/:paymentId/cancel', authMiddleware, async (req, res) => {
  try {
    const payment = await findOwnedPayment(req.params.paymentId, (req as any).user.userId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.appliedAt || payment.status === 'SUCCEEDED' || !payment.yooKassaPaymentId) {
      return res.status(400).json({ error: 'Payment cannot be canceled' });
    }
    const canceled = await cancelPayment(payment.yooKassaPaymentId);
    if (canceled.status !== 'canceled') throw new Error('Cancellation not confirmed');
    const result = await prisma.payment.updateMany({
      where: { id: payment.id, appliedAt: null, status: { in: ['PENDING', 'WAITING_FOR_CAPTURE'] } },
      data: { status: 'CANCELED' },
    });
    if (!result.count && payment.status !== 'CANCELED') {
      return res.status(409).json({ error: 'Payment status changed' });
    }
    res.json({ message: 'Payment canceled successfully' });
  } catch (error) {
    console.error('Error canceling payment:', error);
    res.status(502).json({ error: 'Failed to cancel payment' });
  }
});

router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    res.json(await prisma.subscription.findFirst({
      where: { userId: (req as any).user.userId, status: 'ACTIVE', endDate: { gte: new Date() } },
      include: { plan: true, payment: true },
    }));
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    res.json(await prisma.payment.findMany({
      where: { userId: (req as any).user.userId }, orderBy: { createdAt: 'desc' },
      include: { subscriptions: true },
    }));
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

router.post('/webhook', async (req, res) => {
  const event = typeof req.body?.event === 'string' ? req.body.event : 'unknown';
  const payload = req.body ?? {};

  try {
    const secret = (process.env.YOOKASSA_WEBHOOK_SECRET || '').trim();
    if (secret && (req.query.secret || req.headers['x-webhook-secret']) !== secret) {
      await logWebhookEvent(event, payload, 'failed', 'Invalid webhook secret');
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    const id = req.body?.object?.id;
    if (typeof id !== 'string' || !id || id.length > 128) {
      await logWebhookEvent(event, payload, 'failed', 'Invalid webhook payload');
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // refund.succeeded: object.id is the refund id, payment is under payment_id.
    if (event === 'refund.succeeded') {
      const verifiedRefund = await getRefund(id);
      if (verifiedRefund.id !== id || verifiedRefund.status !== 'succeeded') {
        await logWebhookEvent(event, payload, 'failed', 'Refund verification failed');
        return res.status(400).json({ error: 'Refund verification failed' });
      }
      const result = await applyVerifiedRefund(verifiedRefund);
      await logWebhookEvent(
        event,
        payload,
        result.matched ? 'processed' : 'skipped',
        result.matched ? null : 'Payment not found for refund',
      );
      return res.json({ received: true, ...result });
    }

    // Never trust the status, amount, or owner sent by the webhook caller.
    const verified = await getYooKassaPayment(id);
    let payment = await prisma.payment.findFirst({ where: { yooKassaPaymentId: verified.id } });
    // Recover the race where a provider notification arrives before create returns.
    if (!payment && verified.metadata?.paymentId) {
      await prisma.payment.updateMany({ where: {
        id: verified.metadata.paymentId, yooKassaPaymentId: null,
        userId: verified.metadata.userId || '', planId: verified.metadata.planId || '',
      }, data: { yooKassaPaymentId: verified.id } });
      payment = await prisma.payment.findFirst({ where: { yooKassaPaymentId: verified.id } });
    }
    if (!payment) {
      await logWebhookEvent(event, payload, 'skipped', 'Payment not matched');
      return res.status(200).json({ received: true, matched: false });
    }
    if (String(payment.status).toUpperCase() === 'REFUNDED') {
      await logWebhookEvent(event, payload, 'skipped', 'Payment already refunded');
      return res.json({ received: true, skipped: 'refunded' });
    }
    await applyVerifiedPayment(payment.id, verified);
    await logWebhookEvent(event, payload, 'processed');
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    await logWebhookEvent(
      event,
      payload,
      'failed',
      error instanceof Error ? error.message : 'Webhook processing failed',
    );
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/fix-my-plan', authMiddleware, async (req, res) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { userId: (req as any).user.userId, status: 'SUCCEEDED', yooKassaPaymentId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) return res.status(400).json({ error: 'No successful payment' });
    const verified = await synchronizePayment(payment.id);
    if (verified.status !== 'SUCCEEDED') return res.status(400).json({ error: 'Payment is not succeeded yet' });
    res.json({ success: true, message: 'Premium applied' });
  } catch (error) {
    console.error('fix-my-plan error:', error);
    res.status(error instanceof PaymentVerificationError ? 400 : 502).json({ error: 'Unable to apply payment' });
  }
});

router.post('/apply-premium/:paymentId', authMiddleware, async (req, res) => {
  try {
    const payment = await findOwnedPayment(req.params.paymentId, (req as any).user.userId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    const verified = await synchronizePayment(payment.id);
    if (verified.status !== 'SUCCEEDED') return res.status(400).json({ error: 'Payment is not succeeded yet' });
    res.json({ success: true, message: 'Premium applied' });
  } catch (error) {
    console.error('Apply premium error:', error);
    res.status(error instanceof PaymentVerificationError ? 400 : 502).json({ error: 'Unable to apply payment' });
  }
});

router.get('/test-data', authMiddleware, (req, res) => {
  if (!isPaymentTester((req as any).user)) return res.status(403).json({ error: 'PAYMENT_TEST_ONLY' });
  res.json({ mockMode: shouldUseMockYooKassa(), testCards: TEST_CARDS, testSbpPhones: TEST_SBP_PHONES });
});

export default router;
