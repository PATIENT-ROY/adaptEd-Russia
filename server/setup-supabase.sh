#!/bin/bash

echo "🚀 Настройка Supabase для AdaptEd Russia"
echo "========================================"

# Проверяем, существует ли .env файл
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📝 Создайте файл .env в папке server с содержимым из SETUP_SUPABASE.md"
    echo "🔗 Сначала создайте проект на https://supabase.com"
    exit 1
fi

echo "✅ Файл .env найден"

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Генерируем Prisma Client
echo "🔧 Генерируем Prisma Client..."
npx prisma generate

# Запускаем миграции
echo "🗄️ Запускаем миграции базы данных..."
npx prisma migrate dev --name init

echo ""
echo "🎉 Настройка завершена!"
echo "📊 Для просмотра базы данных запустите: npx prisma studio"
echo "🚀 Для запуска сервера: npm run dev" 