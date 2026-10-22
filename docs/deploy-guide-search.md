# Выкладка оставшихся frontend-изменений на NetAngels

Восстановление пароля уже опубликовано 23 октября 2026 и проверено через Resend. Следующая выкладка нужна для поиска/категорий гайдов и мобильного поля словаря. Backend повторно выкладывать и выполнять миграции для этих изменений не требуется. Команды ниже подготовлены по фактическим production-путям; целиком этот сценарий ещё не запускался.

Сначала создайте и слейте PR в `main`. В production рабочее дерево содержит серверные изменения, поэтому не делайте `git reset --hard` или обычный `git pull` поверх него. Сборка ниже использует отдельный каталог и сохраняет действующую конфигурацию.

Подключитесь с компьютера:

```sh
ssh netangels-adapted
```

Если SSH снова зависает на banner exchange, используйте штатный веб-терминал NetAngels. Далее команды выполняются на сервере. `set -e` останавливает последовательность при ошибке; не продолжайте замену `.next`, если сборка не прошла.

```sh
set -eu
umask 077
cd /home/c502756/adaptedrussia.ru/app
git fetch origin main
RELEASE_SHA=$(git rev-parse origin/main)
printf 'Deploy commit: %s\n' "$RELEASE_SHA"
RELEASE_DIR="/home/c502756/backups/frontend-$RELEASE_SHA"
# Новый каталог: повторный запуск с тем же SHA остановится здесь.
mkdir "$RELEASE_DIR"
git archive "$RELEASE_SHA" package.json package-lock.json client | tar -x -C "$RELEASE_DIR"
# Не выводить содержимое конфигурации.
cp client/.env.production.local "$RELEASE_DIR/client/.env.production.local"
cd "$RELEASE_DIR"
npm ci --workspace client --include=dev
npm run build --workspace client
test -f client/.next/BUILD_ID
# У этого релиза нет изменений public; оставляем текущий public на сервере.
# Сохраняем старые чанки для уже открытых вкладок.
cp -an /home/c502756/adaptedrussia.ru/app/client/.next/static/. client/.next/static/
mv /home/c502756/adaptedrussia.ru/app/client/.next "$RELEASE_DIR/previous.next"
mv client/.next /home/c502756/adaptedrussia.ru/app/client/.next
touch /home/c502756/adaptedrussia.ru/reload
```

Проверки после перезапуска (при кратком 502 дождитесь запуска и повторите GET):

```sh
curl --fail --max-time 30 -o /dev/null -w 'Home: %{http_code}\n' https://adaptedrussia.ru/
curl --fail --max-time 30 -o /dev/null -w 'Education: %{http_code}\n' https://adaptedrussia.ru/education-guide
curl --fail --max-time 30 -o /dev/null -w 'Life: %{http_code}\n' https://adaptedrussia.ru/life-guide
curl --fail --max-time 30 -o /dev/null -w 'Recovery: %{http_code}\n' https://adaptedrussia.ru/forgot-password
curl --fail --max-time 30 -o /dev/null -w 'API: %{http_code}\n' https://api.adaptedrussia.ru/health
```

В браузере проверьте «Подготовительный факультет», «ГОСТ», «учет/учёт», категории, подсказки другого раздела, сброс и мобильный словарь. HTTP200 не заменяет проверку поведения. Не отправляйте ещё одно recovery-письмо ради проверки доступности.

Если новая frontend-сборка не работает, откат в той же серверной сессии:

```sh
mv /home/c502756/adaptedrussia.ru/app/client/.next "$RELEASE_DIR/failed.next"
mv "$RELEASE_DIR/previous.next" /home/c502756/adaptedrussia.ru/app/client/.next
touch /home/c502756/adaptedrussia.ru/reload
```

При новой сессии сначала задайте `RELEASE_DIR` точным путём созданного релиза. БД и backend при таком откате не трогать. Если PR содержит дополнительные зависимости, public-файлы или изменения backend/schema, эти команды сначала нужно пересмотреть под фактический состав PR.
