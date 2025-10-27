# 🚀 Инструкция по деплою на Netlify

## ⚠️ Важно

**Netlify деплоит ТОЛЬКО frontend (Next.js клиент)**, backend API нужно деплоить отдельно на:
- Railway
- Render
- Fly.io
- Vercel (через serverless functions)

## 📋 Шаги для деплоя на Netlify

### 1. Подготовка репозитория

Убедитесь, что все изменения закоммичены:

```bash
git add .
git commit -m "Configure Netlify deployment"
git push origin main
```

### 2. Создание проекта на Netlify

1. Зайдите на [netlify.com](https://www.netlify.com)
2. Нажмите "Add new site" → "Import an existing project"
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий с проектом

### 3. Настройка Build Settings в Netlify

В разделе **Site settings → Build & deploy → Continuous Deployment**:

**Base directory:** `adapted-russia`

**Build command:** `cd client && npm run build`

**Publish directory:** `client/.next`

### 4. Настройка Environment Variables

В **Site settings → Environment variables** добавьте:

```
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
```

⚠️ **Заметьте:** Бекенд должен быть уже задеплоен и доступен по URL!

### 5. Обновите настройки для Production

После деплоя бэкенда обновите `NEXT_PUBLIC_API_URL` на production URL вашего API.

## 🔧 Проверка после деплоя

После успешного деплоя проверьте:

1. **Главная страница:** `https://your-site.netlify.app`
2. **Все страницы загружаются корректно**
3. **API запросы работают** (проверьте в Network tab браузера)

## 🐛 Устранение проблем

### Ошибка 404

Если видите "Page not found":
- Проверьте, что `netlify.toml` существует в `adapted-russia/`
- Убедитесь, что Base directory установлен правильно
- Проверьте логи билда в Netlify Dashboard

### Build ошибки

```bash
# Проверьте локально
cd adapted-russia/client
npm install
npm run build

# Если ошибки - проверьте package.json dependencies
```

### API не работает

- Проверьте `NEXT_PUBLIC_API_URL` в Environment Variables
- Убедитесь, что бэкенд API деплоен и доступен
- Проверьте CORS настройки на бэкенде

## 📝 Примечания

- **Netlify Free план** имеет ограничения по build времени (300 минут/месяц)
- **Нужен платный план для** длительных билдов или больше ресурсов
- **Рекомендую использовать Vercel для Next.js** - лучше интеграция из коробки

## 🔄 Обновление

После каждого push в main ветку, Netlify автоматически передеплоит сайт.

## 🎯 Деплой бэкенда

Для деплоя бэкенда на Railway:

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Создайте новый проект из GitHub
3. Выберите `adapted-russia/server` директорию
4. Добавьте переменные окружения (DATABASE_URL, JWT_SECRET)
5. Railway автоматически задеплоит API

После этого обновите `NEXT_PUBLIC_API_URL` в Netlify на Railway URL.
