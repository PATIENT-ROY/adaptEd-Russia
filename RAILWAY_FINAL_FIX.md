# Финальное исправление Railway

## Проблема
Nixpacks игнорирует настройки и использует `npm ci`, который падает из-за несинхронизированного package-lock.json.

## Решение: Использовать Dockerfile

### Шаг 1: В Railway UI

1. Открой сервис `adapted-russia-server`
2. Перейди в **Settings** → **Service**
3. **ОБЯЗАТЕЛЬНО установи Root Directory**: `server`
4. Сохрани

### Шаг 2: Настройка Builder

1. В **Settings** → **Build**
2. Установи **Builder**: `Dockerfile`
3. **Dockerfile Path**: `Dockerfile` (относительно server/)
4. Сохрани

### Шаг 3: Перезапуск

Railway автоматически перезапустит деплой с Dockerfile.

## Почему это работает

- Dockerfile использует `npm install` вместо `npm ci`
- `npm install` более гибкий и не требует точного соответствия lock файла
- Dockerfile явно указывает все шаги сборки

## Проверка

После перезапуска проверь логи:
- Должно быть: `npm install` (не `npm ci`)
- Должна быть сборка TypeScript: `npm run build`
- Должен быть запуск: `npm start`

Если ошибка останется - проверь, что Root Directory точно установлен в `server`.

