import { Router } from 'express';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import {
  createPayment,
  cancelPayment,
  checkPaymentStatus,
  getPayment as getYooKassaPayment,
  shouldUseMockYooKassa,
  TEST_CARDS,
  TEST_SBP_PHONES,
} from '../lib/yookassa';
import {
  canApplyFromYooKassaStatus,
  isPaymentTester,
} from '../lib/payment-test-access';
import { applyPremiumForPayment, resolvePlanForPayment, formatPremiumPaymentDescription, getPlanDurationMonths } from '../lib/apply-premium';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function paymentTesterForbidden(
  req: { user?: { role?: string; email?: string } },
  res: { status: (code: number) => { json: (body: unknown) => void } },
): boolean {
  if (!shouldUseMockYooKassa()) return false;
  if (isPaymentTester(req.user)) return false;
  res.status(403).json({
    error: 'PAYMENT_TEST_ONLY',
    message: 'Пока подключены тестовые платежи. Доступ только для тестеров.',
  });
  return true;
}

function normalizeStatus(status: string | null | undefined): string {
  return (status || '').toUpperCase();
}

// Получить все планы подписок
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Создать платеж для подписки
router.post('/create-payment', authMiddleware, async (req, res) => {
  try {
    if (paymentTesterForbidden(req as any, res)) return;

    const { planId, paymentMethod } = req.body;
    const userId = (req as any).user.userId;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    if (plan.price <= 0) {
      return res.status(400).json({ error: 'Cannot checkout a free plan' });
    }

    const description = formatPremiumPaymentDescription(plan);

    // Сначала локальный платёж — чтобы return_url содержал наш payment_id
    const paymentId = uuidv4();
    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        userId,
        planId: plan.id,
        amount: plan.price,
        currency: plan.currency,
        description,
        status: 'PENDING',
        paymentMethod: String(paymentMethod || 'CARD'),
        yooKassaPaymentId: null,
      },
    });

    let yooKassaPayment;
    try {
      // Цена только из каталога — клиент не диктует amount
      yooKassaPayment = await createPayment(
        plan.price,
        description,
        {
          userId,
          planId: plan.id,
          paymentId,
          paymentMethod: String(paymentMethod || 'CARD'),
          planName: plan.name,
          planInterval: plan.interval,
          planMonths: String(getPlanDurationMonths(plan)),
        },
        { idempotenceKey: paymentId, returnUrlPaymentId: paymentId },
      );
    } catch (createErr) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'CANCELED' },
      });
      throw createErr;
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        yooKassaPaymentId: yooKassaPayment.id,
        description: yooKassaPayment.description || payment.description,
      },
    });

    res.json({
      paymentId: payment.id,
      yooKassaPaymentId: yooKassaPayment.id,
      confirmationUrl: yooKassaPayment.confirmation?.confirmation_url,
      amount: yooKassaPayment.amount,
      description: yooKassaPayment.description,
      mock: shouldUseMockYooKassa() || yooKassaPayment.id.startsWith('test_'),
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      error: 'Failed to create payment',
      detail: error instanceof Error ? error.message : undefined,
    });
  }
});

// Получить информацию о платеже
router.get('/payment/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const user = (req as any).user;
    const userId = user.userId;

    let payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { yooKassaPaymentId: paymentId, userId },
      });
    }

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    let statusNormalized = normalizeStatus(payment.status);

    if (payment.yooKassaPaymentId) {
      try {
        const yooKassaStatus = await checkPaymentStatus(payment.yooKassaPaymentId);
        statusNormalized = normalizeStatus(yooKassaStatus.status);

        if (statusNormalized !== payment.status) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: statusNormalized },
          });
          payment.status = statusNormalized;
        }

        if (
          statusNormalized === 'SUCCEEDED' &&
          payment.userId &&
          canApplyFromYooKassaStatus(user, payment.yooKassaPaymentId)
        ) {
          try {
            const plan = await resolvePlanForPayment(payment);
            if (plan) {
              await applyPremiumForPayment({
                userId: payment.userId,
                paymentId: payment.id,
                plan,
              });
            }
          } catch (applyErr) {
            console.error('Error applying subscription on payment check:', applyErr);
          }
        }
      } catch (yooKassaError) {
        console.error('Error checking YooKassa status:', yooKassaError);
      }
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

router.post('/payment/:paymentId/cancel', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = (req as any).user.userId;

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.yooKassaPaymentId) {
      await cancelPayment(payment.yooKassaPaymentId);
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELED' },
    });

    res.json({ message: 'Payment canceled successfully' });
  } catch (error) {
    console.error('Error canceling payment:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
});

router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      include: {
        plan: true,
        payment: true,
      },
    });

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: true,
      },
    });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

/**
 * YooKassa HTTP notifications.
 * Verifies by re-fetching payment from API (no shared HMAC from YooKassa).
 * Optional YOOKASSA_WEBHOOK_SECRET as ?secret= or x-webhook-secret header.
 */
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = (process.env.YOOKASSA_WEBHOOK_SECRET || '').trim();
    if (webhookSecret) {
      const provided =
        (typeof req.query.secret === 'string' && req.query.secret) ||
        req.headers['x-webhook-secret'];
      if (provided !== webhookSecret) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }
    } else if (process.env.NODE_ENV === 'production' && !shouldUseMockYooKassa()) {
      console.warn(
        'YOOKASSA_WEBHOOK_SECRET is empty — webhook accepted but verify-via-API only',
      );
    }

    const { event, object } = req.body || {};
    if (!object?.id) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Always verify against YooKassa (or mock) before mutating
    const verified = await getYooKassaPayment(object.id);
    const status = normalizeStatus(verified.status);

    const payment = await prisma.payment.findFirst({
      where: { yooKassaPaymentId: verified.id },
    });

    if (!payment) {
      console.warn('Webhook payment not found locally:', verified.id);
      return res.status(200).json({ received: true, matched: false });
    }

    if (status !== payment.status) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status },
      });
    }

    const interesting =
      event === 'payment.succeeded' ||
      event === 'payment.waiting_for_capture' ||
      event === 'payment.canceled' ||
      !event;

    if (interesting && status === 'SUCCEEDED' && payment.userId) {
      const owner = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { email: true, role: true },
      });
      if (!canApplyFromYooKassaStatus(owner, payment.yooKassaPaymentId)) {
        console.warn('Blocked mock Premium apply for non-tester', payment.userId);
        return res.status(200).json({ received: true, applied: false });
      }

      const plan = await resolvePlanForPayment(payment);
      if (plan) {
        await applyPremiumForPayment({
          userId: payment.userId,
          paymentId: payment.id,
          plan,
        });
      }
    }

    res.status(200).json({ received: true, status });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/fix-my-plan', authMiddleware, async (req, res) => {
  try {
    if (paymentTesterForbidden(req as any, res)) return;

    const user = (req as any).user;
    const userId = user.userId;

    const recentPayments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const succeededPayment = recentPayments.find(
      (payment) => normalizeStatus(payment.status) === 'SUCCEEDED',
    );
    if (!succeededPayment) {
      return res.status(400).json({
        error: 'Нет успешных платежей. Сначала оплатите подписку.',
      });
    }

    if (!canApplyFromYooKassaStatus(user, succeededPayment.yooKassaPaymentId)) {
      return res.status(403).json({ error: 'PAYMENT_TEST_ONLY' });
    }

    const plan = await resolvePlanForPayment(succeededPayment);
    if (!plan) {
      return res.status(400).json({
        error: 'План не найден. Запустите: cd server && npx tsx src/scripts/init-payment-data.ts',
      });
    }

    await applyPremiumForPayment({
      userId,
      paymentId: succeededPayment.id,
      plan,
    });

    res.json({ success: true, message: 'Premium применён' });
  } catch (error) {
    console.error('fix-my-plan error:', error);
    res.status(500).json({ error: 'Ошибка: ' + (error instanceof Error ? error.message : 'Unknown') });
  }
});

router.post('/apply-premium/:paymentId', authMiddleware, async (req, res) => {
  try {
    if (paymentTesterForbidden(req as any, res)) return;

    const { paymentId } = req.params;
    const user = (req as any).user;
    const userId = user.userId;

    let payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { yooKassaPaymentId: paymentId, userId },
      });
    }
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!canApplyFromYooKassaStatus(user, payment.yooKassaPaymentId)) {
      return res.status(403).json({ error: 'PAYMENT_TEST_ONLY' });
    }

    // Prefer live status for real payments
    if (payment.yooKassaPaymentId && !payment.yooKassaPaymentId.startsWith('test_')) {
      const live = await checkPaymentStatus(payment.yooKassaPaymentId);
      if (normalizeStatus(live.status) !== 'SUCCEEDED') {
        return res.status(400).json({ error: 'Payment is not succeeded yet' });
      }
    }

    const plan = await resolvePlanForPayment(payment);
    if (!plan) {
      return res.status(400).json({ error: 'No subscription plan found. Run: npx tsx src/scripts/init-payment-data.ts' });
    }

    await applyPremiumForPayment({
      userId,
      paymentId: payment.id,
      plan,
    });

    res.json({ success: true, message: 'Premium applied' });
  } catch (error) {
    console.error('Apply premium error:', error);
    res.status(500).json({ error: 'Failed to apply premium' });
  }
});

router.get('/test-data', authMiddleware, (req, res) => {
  if (!isPaymentTester((req as any).user)) {
    return res.status(403).json({ error: 'PAYMENT_TEST_ONLY' });
  }

  res.json({
    mockMode: shouldUseMockYooKassa(),
    testCards: TEST_CARDS,
    testSbpPhones: TEST_SBP_PHONES,
    instructions: {
      cards: {
        success: 'Используйте для успешных платежей',
        failure: 'Используйте для неуспешных платежей',
        insufficientFunds: 'Используйте для имитации недостатка средств',
        expired: 'Используйте для имитации просроченной карты',
        invalidCvc: 'Используйте для имитации неверного CVC',
      },
      sbp: {
        success: 'Используйте для успешных СБП платежей',
        failure: 'Используйте для неуспешных СБП платежей',
      },
    },
  });
});

export default router;
