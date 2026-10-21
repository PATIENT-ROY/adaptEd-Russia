# Карта проекта для начала SEO-задачи

Карта составлена 21.10.2026 чтением реализации и документов, без запуска SEO-аудита. Пути относительно корня репозитория. Перепроверь наличие и текущее назначение; это ориентиры, не список дефектов.

- `PROJECT_CONTEXT.md`: состояние локальных изменений и незавершённые проверки; сверяй с git, не считай подтверждением production.
- `client/package.json`, `client/package-lock.json`, корневой `package-lock.json`, установленные пакеты: версии и команды. На момент создания — Next.js App Router 15.5.12, React 19.1.0.
- `client/src/app/robots.ts`, `client/src/app/sitemap.ts`: генерация правил и карты сайта.
- `client/src/app/layout.tsx`, `client/src/lib/seo.ts`: базовые metadata, canonical, социальные изображения и генератор metadata.
- `client/src/app/guides/life/[id]/page.tsx`, `client/src/app/guides/education/[id]/page.tsx`: static params, metadata, опубликованные страницы, notFound и redirects.
- `client/src/lib/guide-slugs.ts`, `client/next.config.ts`, `client/src/middleware.ts`: действующие URL, legacy ID, домен, заголовки. Не заменяй контракты без проверки старых ссылок.
- `client/src/app/education-guide/`, `client/src/app/life-guide/`: каталоги и навигация к статьям.
- `client/src/data/education-guides.ts`, `life-guides.ts`, `life-guides-priority-2026.ts`, `guide-copy.ts` в той же папке: публикация, тексты, даты и локализованные поля. Проверь связи импортов и фактический состав, не суммируй массивы вслепую.
- `client/src/components/seo/guide-article.tsx`, `structured-data.tsx`: видимая статья, markdown-заголовки, JSON-LD и breadcrumbs.
- `client/src/contexts/LanguageContext.tsx`, `client/src/hooks/useTranslation.ts`, `client/src/lib/translations.ts` (либо актуальный модуль/директория): языковые переключения; отдельно проверь полный текст и публичные URL.
- `client/src/app/page.tsx`, `home-content.tsx`, `client/src/components/home/`: главная и её загрузка. В локальной работе уже отделён серверный подсчёт гайдов; не приравнивай к опубликованному изменению.
- `netlify.toml` и документы деплоя: различай preview и основной хостинг. Фактический production подтверждай публичным ответом, без изменений конфигурации.

## Предыдущие фазы

Прочитай относящиеся к задаче документы до новых рекомендаций:

- `docs/audits/chatgpt-search-content-audit-2026-10-10.md`: исторический аудит конкретного среза опубликованного контента, не актуальная истина о рабочей ветке.
- `docs/audits/phase-2-2a-guide-drafts-2026-10-10.md`.
- `docs/audits/phase-2-2b-final-guide-drafts-2026-10-10.md`.

Также найди появившиеся позже SEO-документы, решения и связанные коммиты. Редакционные черновики не публикуй и не считай одобренными автоматически. Историческое число гайдов не фиксируй как требование. Сохраняй подтверждённые достижения предыдущих фаз; конфликт сначала объясни фактами.
