# 🚀 Руководство по деплою AdaptEd Russia

## 📋 Требования

- Docker и Docker Compose
- 2GB RAM минимум
- 10GB свободного места
- Домен (опционально, для SSL)

## 🛠️ Быстрый старт

### 1. Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd adapted-russia

# Создайте .env файл
cp .env.example .env
```

### 2. Настройка переменных окружения

Отредактируйте `.env` файл:

```env
# Database
DATABASE_URL=postgresql://c108771_adaptedrussia_ru:WaBfuCashudup28@postgres.c108771.h2/c108771_adaptedrussia_ru

# JWT
JWT_SECRET=your_very_secure_jwt_secret_here

# API URL
NEXT_PUBLIC_API_URL=http://your-domain.com/api
```

### 3. Запуск приложения

```bash
# Сборка и запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

## 🌐 Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3003
- **Database**: localhost:5432

## 🔧 Управление

```bash
# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Обновление
git pull
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f [service_name]
```

## 📊 Мониторинг

```bash
# Статус сервисов
docker-compose ps

# Использование ресурсов
docker stats

# Проверка здоровья
curl http://localhost/health
```

## 🔒 SSL/HTTPS (опционально)

1. Получите SSL сертификаты (Let's Encrypt)
2. Создайте папку `ssl/` в корне проекта
3. Поместите сертификаты:
   - `ssl/cert.pem`
   - `ssl/key.pem`
4. Раскомментируйте HTTPS секцию в `nginx.conf`
5. Перезапустите nginx: `docker-compose restart nginx`

## 🗄️ База данных

```bash
# Резервное копирование
docker-compose exec postgres pg_dump -U postgres adapted_russia > backup.sql

# Восстановление
docker-compose exec -T postgres psql -U postgres adapted_russia < backup.sql

# Миграции
docker-compose exec server npx prisma migrate deploy
```

## 🚨 Устранение неполадок

### Проблема: Приложение не запускается
```bash
# Проверьте логи
docker-compose logs

# Проверьте порты
netstat -tulpn | grep :3000
netstat -tulpn | grep :3003
```

### Проблема: База данных не подключается
```bash
# Проверьте переменные окружения
docker-compose exec server env | grep DATABASE

# Проверьте подключение к БД
docker-compose exec postgres psql -U postgres -d adapted_russia
```

### Проблема: Nginx не работает
```bash
# Проверьте конфигурацию
docker-compose exec nginx nginx -t

# Перезапустите nginx
docker-compose restart nginx
```

## 📈 Масштабирование

Для увеличения производительности:

1. **Увеличьте ресурсы** в docker-compose.yml
2. **Добавьте кеширование** (Redis)
3. **Настройте балансировщик нагрузки**
4. **Используйте CDN** для статических файлов

## 🔄 Обновления

```bash
# Получите обновления
git pull origin main

# Пересоберите образы
docker-compose build --no-cache

# Запустите с новой версией
docker-compose up -d

# Проверьте работоспособность
curl http://localhost/health
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs`
2. Убедитесь в корректности переменных окружения
3. Проверьте доступность портов
4. Обратитесь к документации Docker и Next.js 