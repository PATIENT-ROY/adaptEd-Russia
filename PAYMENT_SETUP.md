# 🏦 Настройка платежной системы YooKassa

Этот документ описывает настройку тестовой платежной системы с использованием YooKassa для проекта AdaptEd Russia.

## 📋 Требования

- Node.js 18+
- YooKassa аккаунт (для получения тестовых ключей)
- База данных (SQLite для разработки)

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# В папке server
cd server
npm install

# В папке client
cd ../client
npm install
```

### 2. Настройка переменных окружения

Скопируйте файл `.env.example` в `server/.env`:

```bash
cd server
cp .env.example .env
```

Отредактируйте `.env` файл:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=3003
NODE_ENV=development

# Client URL (for CORS and redirects)
CLIENT_URL=http://localhost:3000

# YooKassa Configuration (тестовые ключи)
YOOKASSA_SHOP_ID="your-yookassa-shop-id"
YOOKASSA_SECRET_KEY="your-yookassa-secret-key"
```

### 3. Получение тестовых ключей YooKassa

1. Зарегистрируйтесь на [YooKassa](https://yookassa.ru/)
2. Перейдите в [личный кабинет](https://yookassa.ru/integration)
3. Создайте новый магазин для тестирования
4. Скопируйте `Shop ID` и `Secret Key` в `.env` файл

### 4. Инициализация базы данных

```bash
cd server

# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma db push

# Инициализация тестовых данных
npx tsx src/scripts/init-payment-data.ts
```

### 5. Запуск серверов

```bash
# Запуск бэкенда (в папке server)
npm run dev

# Запуск фронтенда (в папке client)
cd ../client
npm run dev
```

## 🧪 Тестирование

### Доступ к тестовой странице

Откройте в браузере: `http://localhost:3000/payment-test`

### Тестовые данные

#### Банковские карты

| Сценарий | Номер карты | CVC | Дата |
|----------|-------------|-----|------|
| Успешный платеж | `4111111111111111` | `123` | Любая будущая дата |
| Неуспешный платеж | `4000000000000002` | `123` | Любая будущая дата |
| Недостаточно средств | `4000000000009995` | `123` | Любая будущая дата |
| Просроченная карта | `4000000000000069` | `123` | Любая прошедшая дата |
| Неверный CVC | `4000000000000127` | `000` | Любая будущая дата |

#### СБП номера

| Сценарий | Номер телефона |
|----------|----------------|
| Успешный платеж | `+79001234567` |
| Неуспешный платеж | `+79001234568` |

## 🔧 API Endpoints

### Планы подписок

```http
GET /api/payments/plans
```

### Создание платежа

```http
POST /api/payments/create-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "plan_id",
  "paymentMethod": "CARD"
}
```

### Проверка статуса платежа

```http
GET /api/payments/payment/:paymentId
Authorization: Bearer <token>
```

### Отмена платежа

```http
POST /api/payments/payment/:paymentId/cancel
Authorization: Bearer <token>
```

### Активная подписка

```http
GET /api/payments/subscription
Authorization: Bearer <token>
```

### История платежей

```http
GET /api/payments/history
Authorization: Bearer <token>
```

### Тестовые данные

```http
GET /api/payments/test-data
```

## 🔄 Webhook

Для обработки уведомлений от YooKassa:

```http
POST /api/payments/webhook
```

## 📊 Структура базы данных

### SubscriptionPlan
- `id` - уникальный идентификатор
- `name` - название плана
- `price` - цена
- `currency` - валюта (RUB)
- `interval` - интервал (MONTHLY/YEARLY)
- `features` - JSON массив функций
- `isActive` - активен ли план

### Payment
- `id` - уникальный идентификатор
- `userId` - ID пользователя
- `amount` - сумма
- `currency` - валюта
- `description` - описание
- `status` - статус (PENDING/SUCCEEDED/CANCELED/FAILED)
- `paymentMethod` - способ оплаты (CARD/SBP/WALLET)
- `yooKassaPaymentId` - ID платежа в YooKassa

### Subscription
- `id` - уникальный идентификатор
- `userId` - ID пользователя
- `planId` - ID плана
- `status` - статус (ACTIVE/EXPIRED/CANCELED/PENDING)
- `startDate` - дата начала
- `endDate` - дата окончания
- `autoRenew` - автопродление
- `paymentId` - ID платежа

## 🛡️ Безопасность

- Все платежи помечаются как тестовые (`test_mode: true`)
- Используется JWT аутентификация
- Все API endpoints защищены middleware
- Webhook проверяет подпись от YooKassa

## 🚨 Важные замечания

1. **Только для тестирования**: Эта система предназначена только для разработки и тестирования
2. **Тестовые данные**: Используйте только предоставленные тестовые карты и номера
3. **Безопасность**: Не используйте реальные данные карт в тестовой среде
4. **Продакшен**: Для продакшена настройте отдельные ключи YooKassa

## 🆘 Устранение неполадок

### Ошибка "Invalid credentials"
- Проверьте правильность `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`
- Убедитесь, что используете тестовые ключи

### Ошибка "Database connection failed"
- Проверьте `DATABASE_URL` в `.env`
- Убедитесь, что база данных создана

### Ошибка "Payment not found"
- Проверьте правильность `paymentId`
- Убедитесь, что пользователь авторизован

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Убедитесь в правильности настроек
3. Проверьте документацию YooKassa
4. Обратитесь к команде разработки
