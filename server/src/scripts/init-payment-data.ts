import { PrismaClient } from '../../prisma/generated';

const prisma = new PrismaClient();

async function initPaymentData() {
  try {
    console.log('🚀 Инициализация тестовых данных для платежной системы...');

    // Создаем тестовые планы подписок
    const plans = [
      {
        name: 'Платно версия',
        price: 199,
        currency: 'RUB',
        interval: 'MONTHLY',
        features: JSON.stringify([
          'Доступ ко всем базовым гайдам',
          '5 уведомлений в месяц',
          'Базовые шаблоны документов',
          'Поддержка по email',
          'Доступ к AI-чату',
        ]),
        isActive: true,
      },
      {
        name: 'Премиум (месяц)',
        price: 299,
        currency: 'RUB',
        interval: 'MONTHLY',
        features: JSON.stringify([
          'Все функции Платно версии',
          'Неограниченные уведомления',
          'Приоритетный доступ к AI-чату',
          'Расширенные шаблоны документов',
          'Приоритетная поддержка 24/7',
          'Персональный план адаптации',
          'Эксклюзивные гайды и материалы',
        ]),
        isActive: true,
      },
      {
        name: 'Премиум (6 месяцев)',
        price: 1499,
        currency: 'RUB',
        interval: 'MONTHLY',
        features: JSON.stringify([
          'Все функции Премиум (месяц)',
          'Скидка 17% при оплате за 6 месяцев',
          'Приоритетная поддержка 24/7',
          'Персональный план адаптации',
          'Эксклюзивные гайды и материалы',
          'Доступ к закрытым вебинарам',
          'Персональный ментор',
        ]),
        isActive: true,
      },
      {
        name: 'Премиум (год)',
        price: 2990,
        currency: 'RUB',
        interval: 'YEARLY',
        features: JSON.stringify([
          'Все функции Премиум (месяц)',
          'Скидка 17% при оплате за год',
          'Приоритетная поддержка 24/7',
          'Персональный план адаптации',
          'Эксклюзивные гайды и материалы',
          'Доступ к закрытым вебинарам',
          'Персональный ментор',
          'Эксклюзивные мастер-классы',
        ]),
        isActive: true,
      },
    ];

    // Удаляем существующие планы
    await prisma.subscriptionPlan.deleteMany();

    // Создаем новые планы
    for (const plan of plans) {
      await prisma.subscriptionPlan.create({
        data: plan,
      });
      console.log(`✅ Создан план: ${plan.name} - ${plan.price} ${plan.currency}`);
    }

    console.log('🎉 Тестовые данные успешно инициализированы!');
    console.log('');
    console.log('📋 Созданные планы:');
    const createdPlans = await prisma.subscriptionPlan.findMany();
    createdPlans.forEach((plan: any) => {
      console.log(`  - ${plan.name}: ${plan.price} ${plan.currency} (${plan.interval})`);
    });

  } catch (error) {
    console.error('❌ Ошибка при инициализации данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
initPaymentData(); 