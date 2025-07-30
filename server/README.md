# AdaptEd Russia - Серверная часть

Backend API для платформы помощи иностранным студентам в России.

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Настройка базы данных
cp .env.example .env
# Отредактируйте .env файл

# Генерация Prisma клиента
npm run db:generate

# Миграция базы данных
npm run db:migrate

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшен версии
npm start
```

## 📁 Структура проекта

```
server/src/
├── 📁 api/              # API роуты
│   ├── auth.ts         # Аутентификация
│   ├── user.ts         # Пользователи
│   ├── guides.ts       # Гайды
│   ├── reminders.ts    # Напоминания
│   └── chat.ts         # Чат
├── 📁 lib/             # Утилиты
│   ├── database.ts     # Подключение к БД
│   ├── auth.ts         # Аутентификация
│   └── middleware.ts   # Middleware
├── 📁 models/          # Модели данных
├── 📁 services/        # Бизнес-логика
├── 📁 types/           # TypeScript типы
└── index.ts            # Основной файл сервера
```

## 🔧 Технологии

- **Express.js** - Node.js фреймворк
- **Prisma** - ORM для базы данных
- **PostgreSQL** - База данных
- **JWT** - Аутентификация
- **bcryptjs** - Хеширование паролей
- **Zod** - Валидация данных
- **Helmet** - Безопасность
- **CORS** - Cross-Origin Resource Sharing

## 📊 API Endpoints

### Аутентификация
```
POST /api/auth/register  - Регистрация пользователя
POST /api/auth/login     - Вход в систему
GET  /api/auth/verify    - Проверка токена
```

### Пользователи
```
GET  /api/user/profile   - Получить профиль
PUT  /api/user/profile   - Обновить профиль
```

### Напоминания
```
GET    /api/reminders           - Получить напоминания
POST   /api/reminders           - Создать напоминание
PUT    /api/reminders/:id       - Обновить напоминание
DELETE /api/reminders/:id       - Удалить напоминание
```

### Гайды
```
GET /api/guides        - Получить гайды
GET /api/guides/:id    - Получить гайд
```

### Чат
```
GET  /api/chat/messages - История чата
POST /api/chat/messages - Отправить сообщение
```

## 🗄️ База данных

### Модели

#### User (Пользователи)
```typescript
{
  id: string
  email: string
  password: string
  name: string
  language: Language
  country: string
  role: Role
  registeredAt: Date
  university?: string
  faculty?: string
  year?: string
  plan: Plan
  phone?: string
  gender?: Gender
}
```

#### Reminder (Напоминания)
```typescript
{
  id: string
  userId: string
  title: string
  description?: string
  dueDate: Date
  priority: ReminderPriority
  status: ReminderStatus
  category: ReminderCategory
  createdAt: Date
  updatedAt: Date
}
```

#### Guide (Гайды)
```typescript
{
  id: string
  title: string
  description: string
  content: string
  category: GuideCategory
  tags: string[]
  difficulty: Difficulty
  language: Language
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  views: number
  likes: number
}
```

## 🔐 Безопасность

### Аутентификация
- JWT токены для аутентификации
- Хеширование паролей с bcrypt
- Middleware для проверки токенов

### Защита API
- Rate limiting (100 запросов за 15 минут)
- CORS настройки
- Helmet для HTTP заголовков
- Валидация данных с Zod

### Middleware
```typescript
// Проверка аутентификации
authMiddleware(req, res, next)

// Проверка роли
requireRole(['ADMIN', 'SUPER_ADMIN'])(req, res, next)
```

## 📝 Логирование

```typescript
// Пример логирования
console.log('API Request:', {
  method: req.method,
  url: req.url,
  userId: req.user?.userId,
  timestamp: new Date().toISOString()
});
```

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Запуск тестов с покрытием
npm run test:coverage

# E2E тесты
npm run test:e2e
```

## 📊 Мониторинг

### Health Check
```
GET /health
```

Ответ:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Метрики
- Время ответа API
- Количество запросов
- Ошибки и исключения
- Использование базы данных

## 🔧 Конфигурация

### Переменные окружения
```env
# База данных
DATABASE_URL="postgresql://username:password@localhost:5432/adapted_russia"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Сервер
PORT=3001
NODE_ENV=development

# Клиент
CLIENT_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Деплой

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### PM2
```bash
# Установка PM2
npm install -g pm2

# Запуск
pm2 start ecosystem.config.js

# Мониторинг
pm2 monit
```

### Облачные платформы
- **Railway** - Простой деплой
- **Heroku** - Классический выбор
- **AWS** - Масштабируемость
- **Google Cloud** - Интеграция с Google сервисами

## 📈 Производительность

### Оптимизации
- Connection pooling для базы данных
- Кэширование запросов
- Сжатие ответов
- Оптимизация запросов Prisma

### Мониторинг
- Время ответа API
- Использование памяти
- Количество подключений к БД
- Ошибки и исключения

## 🔍 Отладка

### Логирование
```typescript
// Разработка
console.log('Debug info:', data);

// Продакшен
console.error('Error occurred:', error);
```

### Prisma Studio
```bash
# Запуск Prisma Studio
npm run db:studio
```

## 📝 Документация API

### Swagger/OpenAPI
```bash
# Генерация документации
npm run docs:generate

# Запуск Swagger UI
npm run docs:serve
```

## 🔄 Миграции

```bash
# Создание миграции
npm run db:migrate:create

# Применение миграций
npm run db:migrate

# Откат миграции
npm run db:migrate:reset
```

## 📝 Лицензия

MIT License 