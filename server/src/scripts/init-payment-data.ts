import { PrismaClient } from '../../prisma/generated';

const prisma = new PrismaClient();

/** Catalog Variant 1: 199 / 549 (3 мес) / 1990 (год) */
async function initPaymentData() {
  try {
    console.log('🚀 Инициализация каталога подписок (Вариант 1)...');

    const plans = [
      {
        name: 'Freemium',
        code: 'freemium',
        durationMonths: 1,
        price: 0,
        currency: 'RUB',
        interval: 'MONTHLY',
        features: JSON.stringify([
          'Бесплатный доступ ко всем базовым гайдам',
          '2 уведомления-напоминания в месяц',
          'Базовые шаблоны документов',
          'Поддержка по email',
          'DocScan Light: сканирование до 3 документов в месяц',
          'DocScan Light: только фото → PDF',
        ]),
        isActive: true,
      },
      {
        name: 'Премиум (месяц)',
        code: 'premium-month',
        durationMonths: 1,
        price: 199,
        currency: 'RUB',
        interval: 'MONTHLY',
        features: JSON.stringify([
          'Полный доступ ко всем функциям',
          'Неограниченные уведомления-напоминания в месяц',
          'Приоритетный доступ к AI-чату',
          'Расширенные шаблоны документов',
          'Приоритетная поддержка 24/7',
          'Персональный план адаптации',
          'Эксклюзивные гайды и материалы',
          'DocScan Pro: Неограниченное сканирование',
          'DocScan Pro: OCR из PDF и фото',
          'DocScan Pro: Экспорт в Word, TXT, PDF',
          'DocScan Pro: Объединение страниц',
          'DocScan Pro: Облачное хранение',
          'DocScan Pro: Без водяных знаков',
        ]),
        isActive: true,
      },
      {
        name: 'Премиум (3 месяца)',
        code: 'premium-3months',
        durationMonths: 3,
        price: 549,
        currency: 'RUB',
        interval: 'MONTHLY',
        features: JSON.stringify([
          'Полный доступ ко всем функциям',
          'Неограниченные уведомления-напоминания в месяц',
          'Приоритетный доступ к AI-чату',
          'Расширенные шаблоны документов',
          'Приоритетная поддержка 24/7',
          'Персональный план адаптации',
          'Эксклюзивные гайды и материалы',
          'DocScan Pro: Неограниченное сканирование',
          'DocScan Pro: OCR из PDF и фото',
          'DocScan Pro: Экспорт в Word, TXT, PDF',
          'DocScan Pro: Объединение страниц',
          'DocScan Pro: Облачное хранение',
          'DocScan Pro: Без водяных знаков',
          'Скидка 8% при оплате за 3 месяца',
        ]),
        isActive: true,
      },
      {
        name: 'Премиум (год)',
        code: 'premium-year',
        durationMonths: 12,
        price: 1990,
        currency: 'RUB',
        interval: 'YEARLY',
        features: JSON.stringify([
          'Полный доступ ко всем функциям',
          'Неограниченные уведомления-напоминания в месяц',
          'Приоритетный доступ к AI-чату',
          'Расширенные шаблоны документов',
          'Приоритетная поддержка 24/7',
          'Персональный план адаптации',
          'Эксклюзивные гайды и материалы',
          'DocScan Pro: Неограниченное сканирование',
          'DocScan Pro: OCR из PDF и фото',
          'DocScan Pro: Экспорт в Word, TXT, PDF',
          'DocScan Pro: Объединение страниц',
          'DocScan Pro: Облачное хранение',
          'DocScan Pro: Без водяных знаков',
          'Скидка 17% при оплате за год',
          'Доступ к закрытым вебинарам',
          'Персональный ментор',
          'Эксклюзивные мастер-классы',
        ]),
        isActive: true,
      },
    ];

    for (const plan of plans) {
      await prisma.subscriptionPlan.upsert({
        where: { code: plan.code },
        create: plan,
        update: plan,
      });
      console.log(`✅ Создан план: ${plan.name} - ${plan.price} ${plan.currency}`);
    }

    console.log('🎉 Каталог обновлён: 199 / 549 (3 мес) / 1990 (год)');
  } catch (error) {
    console.error('❌ Ошибка при инициализации данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initPaymentData();
