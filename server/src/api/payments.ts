import { Router } from 'express';
import { prisma } from '../lib/database';
import { authMiddleware } from '../lib/auth';
import { createPayment, getPayment, cancelPayment, checkPaymentStatus, TEST_CARDS, TEST_SBP_PHONES } from '../lib/yookassa';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Получить все планы подписок
router.get('/plans', async (req, res) => {
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
    const { planId, paymentMethod } = req.body;
    const userId = (req as any).user.userId;

    // Получаем план подписки
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    // Создаем платеж в YooKassa
    const yooKassaPayment = await createPayment(
      plan.price,
      `Подписка ${plan.name} - ${plan.interval === 'MONTHLY' ? 'месячная' : 'годовая'}`,
      {
        userId,
        planId,
        paymentMethod,
        planName: plan.name,
        planInterval: plan.interval,
      }
    );

    // Сохраняем платеж в базе данных
    const payment = await prisma.payment.create({
      data: {
        id: uuidv4(),
        userId,
        planId,
        amount: plan.price,
        currency: plan.currency,
        description: yooKassaPayment.description || '',
        status: 'PENDING',
        paymentMethod,
        yooKassaPaymentId: yooKassaPayment.id,
      },
    });

    res.json({
      paymentId: payment.id,
      yooKassaPaymentId: yooKassaPayment.id,
      confirmationUrl: yooKassaPayment.confirmation?.confirmation_url,
      amount: yooKassaPayment.amount,
      description: yooKassaPayment.description,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Получить информацию о платеже
// Поддерживает поиск как по id (UUID из базы), так и по yooKassaPaymentId
router.get('/payment/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = (req as any).user.userId;

    console.log('Getting payment:', { paymentId, userId });

    // Сначала пытаемся найти по id (UUID из базы данных)
    let payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    // Если не найдено по id, пытаемся найти по yooKassaPaymentId
    if (!payment) {
      console.log('Payment not found by id, trying yooKassaPaymentId:', paymentId);
      payment = await prisma.payment.findFirst({
        where: { yooKassaPaymentId: paymentId, userId },
      });
    }

    if (!payment) {
      console.log('Payment not found:', paymentId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    console.log('Payment found:', { id: payment.id, yooKassaPaymentId: payment.yooKassaPaymentId, status: payment.status });

    // Получаем актуальный статус из YooKassa (или mock)
    let statusNormalized = (payment.status || '').toUpperCase();
    if (payment.yooKassaPaymentId) {
      try {
        const yooKassaStatus = await checkPaymentStatus(payment.yooKassaPaymentId);
        
        console.log('YooKassa status:', { 
          current: payment.status, 
          yooKassa: yooKassaStatus.status 
        });
        
        statusNormalized = (yooKassaStatus.status || '').toUpperCase();
        
        // Обновляем статус в базе данных если он изменился
        if (statusNormalized !== payment.status) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: statusNormalized },
          });
          
          payment.status = statusNormalized;
          console.log('Payment status updated:', payment.status);
        }

        // При успешной оплате — применяем подписку и обновляем план (fallback если webhook не сработал)
        if (statusNormalized === 'SUCCEEDED' && payment.userId) {
            try {
              let plan = payment.planId
                ? await prisma.subscriptionPlan.findUnique({ where: { id: payment.planId } })
                : await prisma.subscriptionPlan.findFirst({
                    where: { price: payment.amount, isActive: true },
                  });
              if (plan) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + (plan.interval === 'MONTHLY' ? 1 : 12));

                await prisma.subscription.upsert({
                  where: { userId: payment.userId },
                  update: {
                    status: 'ACTIVE',
                    startDate,
                    endDate,
                    paymentId: payment.id,
                  },
                  create: {
                    id: uuidv4(),
                    userId: payment.userId,
                    planId: plan.id,
                    status: 'ACTIVE',
                    startDate,
                    endDate,
                    autoRenew: true,
                    paymentId: payment.id,
                  },
                });

                await prisma.user.update({
                  where: { id: payment.userId },
                  data: { plan: 'PREMIUM' },
                });
                console.log('Subscription and user plan applied for payment:', payment.id);
              }
            } catch (applyErr) {
              console.error('Error applying subscription on payment check:', applyErr);
            }
        }
      } catch (yooKassaError) {
        console.error('Error checking YooKassa status:', yooKassaError);
        // Продолжаем, даже если проверка статуса в YooKassa не удалась
      }
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Отменить платеж
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

    // Обновляем статус в базе данных
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

// Получить активную подписку пользователя
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

// Получить историю платежей пользователя
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

// Webhook для обработки уведомлений от YooKassa
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.YOOKASSA_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.error('YOOKASSA_WEBHOOK_SECRET is required in production');
      return res.status(500).json({ error: 'Webhook is not configured' });
    }
    if (webhookSecret) {
      const providedSecret = req.headers['x-webhook-secret'];
      if (providedSecret !== webhookSecret) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }
    }

    const { event, object } = req.body;

    if (event === 'payment.succeeded') {
      const payment = await prisma.payment.findFirst({
        where: { yooKassaPaymentId: object.id },
      });

      if (payment) {
        // Обновляем статус платежа
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCEEDED' },
        });

        // Создаем или обновляем подписку
        const metadata = object.metadata;
        if (metadata?.planId && metadata?.userId) {
          const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: metadata.planId },
          });

          if (plan) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (plan.interval === 'MONTHLY' ? 1 : 12));

            await prisma.subscription.upsert({
              where: { userId: metadata.userId },
              update: {
                status: 'ACTIVE',
                startDate,
                endDate,
                paymentId: payment.id,
              },
              create: {
                id: uuidv4(),
                userId: metadata.userId,
                planId: metadata.planId,
                status: 'ACTIVE',
                startDate,
                endDate,
                autoRenew: true,
                paymentId: payment.id,
              },
            });

            // Обновляем план пользователя на PREMIUM (отображается в профиле)
            await prisma.user.update({
              where: { id: metadata.userId },
              data: { plan: 'PREMIUM' },
            });
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Принудительно применить Premium по оплаченному платежу текущего пользователя (без payment_id)
router.post('/fix-my-plan', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const recentPayments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const succeededPayment = recentPayments.find(
      (payment) => (payment.status || '').toUpperCase() === 'SUCCEEDED'
    );
    if (!succeededPayment) {
      return res.status(400).json({
        error: 'Нет успешных платежей. Сначала оплатите подписку.',
      });
    }

    if (succeededPayment.status !== 'SUCCEEDED') {
      await prisma.payment.update({
        where: { id: succeededPayment.id },
        data: { status: 'SUCCEEDED' },
      });
    }

    let plan = succeededPayment.planId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: succeededPayment.planId } })
      : await prisma.subscriptionPlan.findFirst({
          where: { price: succeededPayment.amount, isActive: true },
        });
    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true, price: { gt: 0 } },
        orderBy: { price: 'asc' },
      });
    }
    if (!plan) {
      return res.status(400).json({
        error: 'План не найден. Запустите: cd server && npx tsx src/scripts/init-payment-data.ts',
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (plan.interval === 'MONTHLY' ? 1 : 12));

    await prisma.subscription.upsert({
      where: { userId },
      update: { status: 'ACTIVE', startDate, endDate, paymentId: succeededPayment.id },
      create: {
        id: uuidv4(),
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        startDate,
        endDate,
        autoRenew: true,
        paymentId: succeededPayment.id,
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'PREMIUM' },
    });

    console.log('fix-my-plan: Premium applied for user', userId);
    res.json({ success: true, message: 'Premium применён' });
  } catch (error) {
    console.error('fix-my-plan error:', error);
    res.status(500).json({ error: 'Ошибка: ' + (error instanceof Error ? error.message : 'Unknown') });
  }
});

// Ручное применение Premium по payment_id (для случаев когда авто-применение не сработало)
router.post('/apply-premium/:paymentId', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = (req as any).user.userId;

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

    let plan = payment.planId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: payment.planId } })
      : await prisma.subscriptionPlan.findFirst({
          where: { price: payment.amount, isActive: true },
        });
    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true, price: { gt: 0 } },
        orderBy: { price: 'asc' },
      });
    }
    if (!plan) {
      return res.status(400).json({ error: 'No subscription plan found. Run: npx tsx src/scripts/init-payment-data.ts' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (plan.interval === 'MONTHLY' ? 1 : 12));

    await prisma.subscription.upsert({
      where: { userId },
      update: { status: 'ACTIVE', startDate, endDate, paymentId: payment.id },
      create: {
        id: uuidv4(),
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        startDate,
        endDate,
        autoRenew: true,
        paymentId: payment.id,
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'PREMIUM' },
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCEEDED' },
    });

    console.log('Premium applied manually for payment:', paymentId);
    res.json({ success: true, message: 'Premium applied' });
  } catch (error) {
    console.error('Apply premium error:', error);
    res.status(500).json({ error: 'Failed to apply premium' });
  }
});

// Получить тестовые данные для разработки
router.get('/test-data', (req, res) => {
  res.json({
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
