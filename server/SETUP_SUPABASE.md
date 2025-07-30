# Настройка Supabase для AdaptEd Russia

## Шаг 1: Создание проекта в Supabase

1. Зайдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Войдите через GitHub или создайте аккаунт
4. Создайте новый проект:
   - **Name**: `adapted-russia`
   - **Database Password**: придумайте надежный пароль (запомните его!)
   - **Region**: выберите ближайший к вам регион

## Шаг 2: Получение строки подключения

1. В проекте Supabase перейдите в **Settings** → **Database**
2. Найдите секцию **Connection string**
3. Скопируйте строку подключения (URI format)

## Шаг 3: Создание файла .env

Создайте файл `.env` в папке `server` со следующим содержимым:

```env
# База данных (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
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

**Замените** `[YOUR-PASSWORD]` и `[YOUR-PROJECT-REF]` на ваши реальные данные из Supabase.

## Шаг 4: Установка зависимостей

```bash
cd server
npm install
```

## Шаг 5: Запуск миграций

```bash
npx prisma migrate dev --name init
```

## Шаг 6: Генерация Prisma Client

```bash
npx prisma generate
```

## Шаг 7: Проверка подключения

```bash
npx prisma studio
```

## Готово! 🎉

Теперь ваша база данных настроена в Supabase и готова к работе с высоким трафиком.

## Дополнительные настройки Supabase:

### Row Level Security (RLS)
В Supabase Dashboard → Authentication → Policies настройте политики безопасности для ваших таблиц.

### API Keys
В Settings → API вы найдете ключи для подключения клиентской части (если понадобятся).

### Мониторинг
В Dashboard → Logs можно отслеживать запросы к базе данных. 