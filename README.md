# AdaptEd Russia

Платформа для адаптации иностранных студентов в России с AI-помощником и образовательными гайдами.

## 🚀 Структура проекта

```
adapted-russia/
├── client/          # Next.js фронтенд приложение
├── server/          # Express.js бэкенд API
└── README.md        # Документация проекта
```

## 🛠️ Технологии

### Frontend (client/)
- **Next.js 14** - React фреймворк
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **Prisma** - ORM для базы данных

### Backend (server/)
- **Express.js** - Node.js фреймворк
- **TypeScript** - типизация
- **Prisma** - ORM для PostgreSQL
- **JWT** - аутентификация
- **bcrypt** - хеширование паролей

## 📦 Установка и запуск

### 1. Клонирование репозитория
```bash
git clone [repository-url]
cd adapted-russia
```

### 2. Настройка клиента
```bash
cd client
npm install
npm run dev
```

### 3. Настройка сервера
```bash
cd server
npm install
# Создайте .env файл (см. LOCAL_SETUP.md)
npm run dev
```

## 🗄️ База данных

Проект использует PostgreSQL. Для локальной разработки:
- Установите PostgreSQL
- Создайте базу данных `adapted_russia`
- Настройте `.env` файл в папке `server`

## 📚 Документация

- `client/README.md` - документация клиента
- `server/LOCAL_SETUP.md` - настройка локальной разработки
- `server/SETUP_SUPABASE.md` - настройка Supabase (для продакшена)

## 🎯 Функциональность

- 👤 Регистрация и аутентификация пользователей
- 📚 Образовательные гайды по адаптации
- 🤖 AI-помощник для ответов на вопросы
- ⏰ Система напоминаний
- 🌍 Многоязычная поддержка
- 📱 Адаптивный дизайн

## 🚀 Деплой

Для продакшена рекомендуется:
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Heroku, Vercel
- **Database**: Supabase, Neon, PlanetScale

## 📄 Лицензия

MIT License
