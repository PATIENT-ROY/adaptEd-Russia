import { PrismaClient } from '../../prisma/generated';

const prisma = new PrismaClient();

async function initPaymentData() {
  try {
    console.log('🚀 Инициализация тестовых данных для платежной системы...');

    // Создаем тестовые планы подписок
    const plans = [
      {
        name: 'Freemium',
        price: 0,
        currency: 'RUB',
        interval: 'MONTHLY',
        features: JSON.stringify([
          'Опубликованные гайды по учёбе и быту',
          'Сообщество и AdaptEd Buddy',
          'DocScan в браузере: OCR фото и PDF, экспорт в TXT',
          'Неограниченное создание напоминаний',
          '2 отправки уведомлений в месяц (email или Telegram)',
          '15 сообщений AI в день (чат и генераторы — общая квота)',
          'Обращения через форму поддержки',
        ]),
        isActive: true,
      },
      {
        name: 'Премиум (месяц)',
        price: 199,
        currency: 'RUB',
        interval: 'MONTHLY',
        features: JSON.stringify([
          'Всё из бесплатного тарифа, плюс:',
          '200 сообщений AI в день (чат и генераторы — общая квота)',
          'Неограниченные отправки уведомлений-напоминаний',
        ]),
        isActive: true,
      },
      {
        name: 'Премиум (6 месяцев)',
        price: 1499,
        currency: 'RUB',
        interval: 'MONTHLY',
        features: JSON.stringify([
          'Всё из бесплатного тарифа, плюс:',
          '200 сообщений AI в день (чат и генераторы — общая квота)',
          'Неограниченные отправки уведомлений-напоминаний',
          'Скидка 17% при оплате за 6 месяцев',
        ]),
        isActive: true,
      },
      {
        name: 'Премиум (год)',
        price: 2990,
        currency: 'RUB',
        interval: 'YEARLY',
        features: JSON.stringify([
          'Всё из бесплатного тарифа, плюс:',
          '200 сообщений AI в день (чат и генераторы — общая квота)',
          'Неограниченные отправки уведомлений-напоминаний',
          'Скидка 17% при оплате за год',
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