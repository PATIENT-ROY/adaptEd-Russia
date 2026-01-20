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

    // Получаем актуальный статус из YooKassa
    if (payment.yooKassaPaymentId) {
      try {
        const yooKassaStatus = await checkPaymentStatus(payment.yooKassaPaymentId);
        
        console.log('YooKassa status:', { 
          current: payment.status, 
          yooKassa: yooKassaStatus.status 
        });
        
        // Обновляем статус в базе данных если он изменился
        if (yooKassaStatus.status !== payment.status) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: yooKassaStatus.status },
          });
          
          payment.status = yooKassaStatus.status;
          console.log('Payment status updated:', payment.status);
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