# AI chat reliability update

## Scope

- AI tools accept up to 12,000 characters per complete prompt, including tool
  instructions. Ordinary chat remains limited to 2,000. The tools form shows a
  translated counter and prevents oversized submissions without truncating text.
  The server independently enforces both limits before reserving quota.
- Regeneration keeps the previous result visible during the request and on
  failure; only a successful, non-empty answer replaces it. Editing is disabled
  while generation is pending.
- `POST /api/chat/messages` requires a real DeepSeek completion. Provider errors
  are returned as `AI_UNAVAILABLE` (503) or `AI_TIMEOUT` (504), not mock replies.
  Client error messages are translated into RU, EN, FR, AR, ZH and ES. The input
  stays editable so the user can retry.
- One 45-second deadline covers provider requests and response reads. Only 429
  and 5xx responses are retried, once, after a delay. Auth/payment and ambiguous
  network errors are not retried automatically.
- `chat_daily_usage` counts successful requests and in-flight reservations per
  user and UTC day. Conditional PostgreSQL updates enforce the existing 15/200
  limits across Node workers. Clearing history does not reset usage. Failed
  requests release their reservation; successful message pairs are saved in a
  transaction. Generator requests use the same quota.
- Guide matching uses only the question, not the model's answer. Language
  translation no longer matches banking. No default guide block is displayed
  when there is no relevant match. Guide search remains a conservative keyword
  matcher, not a full semantic search; full multilingual guide coverage is a
  separate improvement.

## Deployment requirement (not applied to production automatically)

Migration: `20260912020000_add_chat_daily_usage`.

The live NetAngels backend is `/home/c502756/api.adaptedrussia.ru/app/server`,
not the server copy inside the frontend repository. Preserve its existing
environment settings, including the DeepSeek key stored in the NodeJS panel.

Back up the database and backend before deployment. Use a short maintenance
window with backend workers stopped while applying the migration and replacing
the application, so old workers cannot add uncounted messages during backfill.
In the actual backend directory, install locked dependencies, generate Prisma,
apply migrations with `npx prisma migrate deploy`, and build with `npm run build`.
Restart all backend workers only after these steps succeed. Deploy the matching
client build as well. Do not use `db push` or `migrate dev` on production.

The migration preserves existing history and backfills usage from remaining
user messages. It cannot reconstruct messages deleted before deployment.
Existing failed attempts in history cannot be distinguished retrospectively.
Days now consistently reset at 00:00 UTC rather than depending on worker TZ.
If a worker is killed mid-request, its reservation may remain counted until the
next UTC day; this conservatively prevents overspending. Automatic recovery of
abandoned reservations is outside this update.

## Verification

- `npm run test:chat --workspace server`: isolated unit tests; DB test skips
  unless `AI_TEST_DATABASE_URL` is explicitly set.
- For DB integration, use a disposable local PostgreSQL database named
  `adapted_ai_test...` on `127.0.0.1`, initialize it from the Prisma schema, then
  set `AI_TEST_DATABASE_URL` to that database when running the command above.
  The test recreates the usage table to verify the actual migration, creates
  synthetic users, exercises HTTP routes and concurrent reservations, and
  mocks all DeepSeek traffic. Never point it at a normal development database.
- Build the client, then `npm run test:chat-ui --workspace client`: production
  UI on port 3017, six locales at desktop and mobile sizes, API fully mocked.
- `npm run build:server`, `npm run build:client`, and
  `npm run lint --workspace client`.

After deployment, verify a real answer and the provider usage dashboard; confirm
an unrelated translation question has no guide block. Do not paste API keys or
environment files into logs, support messages, or screenshots.
