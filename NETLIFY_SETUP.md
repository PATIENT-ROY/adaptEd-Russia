# Настройка Netlify для AdaptEd Russia

## Проблема
На Netlify развернут только фронтенд, но нет подключения к бэкенду. Поэтому авторизация и API не работают.

## Решение

### 1. Развернуть бэкенд отдельно

Бэкенд нужно развернуть на отдельном сервисе:
- **Railway** (рекомендуется): https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

После развертывания бэкенда у тебя будет URL, например:
- `https://adapted-russia-api.railway.app`
- `https://adapted-russia-api.onrender.com`

### 2. Настроить переменные окружения в Netlify

#### Вариант A: Через UI Netlify (рекомендуется)

1. Зайди в панель Netlify: https://app.netlify.com
2. Выбери свой сайт `adaptedrussia`
3. Перейди в **Site settings** → **Environment variables**
4. Добавь переменную:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://твой-бэкенд-url.com/api` (замени на реальный URL бэкенда)
5. Сохрани и перезапусти деплой

#### Вариант B: Через netlify.toml (только для билда)

Добавь в `netlify.toml`:

```toml
[build.environment]
  NEXT_PUBLIC_API_URL = "https://твой-бэкенд-url.com/api"
```

⚠️ **Важно**: Это значение будет использоваться только во время билда. Для runtime лучше использовать UI Netlify.

### 3. Перезапустить деплой

После добавления переменной окружения:
1. В Netlify перейди в **Deploys**
2. Нажми **Trigger deploy** → **Deploy site**
3. Дождись завершения деплоя

### 4. Проверить работу

После деплоя проверь:
- Открой консоль браузера (F12)
- Проверь, что `NEXT_PUBLIC_API_URL` правильный
- Попробуй войти в аккаунт

## Временное решение (для тестирования)

Если бэкенд еще не развернут, можно временно использовать mock данные или отключить авторизацию для демо.

## Полезные ссылки

- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Railway Deployment](https://docs.railway.app/deploy/builds)
- [Render Deployment](https://render.com/docs/deploy-node)

