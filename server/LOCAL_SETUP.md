# Локальная настройка AdaptEd Russia

## Для локальной разработки:

### 1. Создайте файл .env в папке server:

```env
# База данных (локальная разработка)
DATABASE_URL="postgresql://username:password@localhost:5432/adapted_russia"

# JWT
JWT_SECRET="dev-jwt-secret-key-change-in-production"
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

### 2. Установите PostgreSQL локально:
- **macOS**: `brew install postgresql`
- **Windows**: Скачайте с postgresql.org
- **Linux**: `sudo apt install postgresql`

### 3. Создайте базу данных:
```bash
createdb adapted_russia
```

### 4. Установите зависимости:
```bash
cd server
npm install
```

### 5. Запустите миграции:
```bash
npx prisma migrate dev --name init
```

### 6. Запустите сервер:
```bash
npm run dev
```

## Когда будете готовы к деплою:

1. Купите хостинг (Vercel, Railway, Heroku)
2. Купите домен
3. Настройте Supabase или другую облачную БД
4. Обновите DATABASE_URL в продакшене

## Готово! 🎉

Теперь можете разрабатывать локально, а базу данных настроите позже. 