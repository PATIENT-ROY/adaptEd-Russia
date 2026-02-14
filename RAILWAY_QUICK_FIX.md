# Быстрое исправление ошибки Railway

## Проблема
Railway не может найти Dockerfile, потому что он ищет его в корне репозитория, а Dockerfile находится в папке `server/`.

## Решение (выбери один вариант)

### Вариант 1: Настроить Root Directory в UI Railway (рекомендуется)

1. В Railway открой сервис `adapted-russia-server`
2. Перейди в **Settings** → **Service**
3. Найди **Root Directory**
4. Установи: `server`
5. Сохрани изменения
6. Railway автоматически перезапустит деплой

### Вариант 2: Использовать Nixpacks (автоматический билдер)

Railway автоматически определит Node.js проект и соберет его без Dockerfile.

1. В Railway открой сервис `adapted-russia-server`
2. Перейди в **Settings** → **Build**
3. Убедись, что **Builder** = `Nixpacks`
4. Если нет - выбери `Nixpacks`
5. Сохрани и перезапусти деплой

### Вариант 3: Использовать Dockerfile (если нужно)

1. В Railway открой сервис `adapted-russia-server`
2. Перейди в **Settings** → **Service**
3. Установи **Root Directory**: `server`
4. В **Settings** → **Build**
5. Установи **Builder**: `Dockerfile`
6. **Dockerfile Path**: `Dockerfile` (относительно server/)
7. Сохрани и перезапусти деплой

## После настройки

Railway должен успешно собрать проект. Проверь логи, если есть ошибки.

