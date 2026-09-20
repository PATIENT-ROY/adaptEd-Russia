# Payment checkout

`/payment` loads prices, codes and durations from the server catalog. Supported codes
are `premium-month`, `premium-3months`, and `premium-year`. The selected code resolves
to the database plan ID; the server always calculates the charge itself.

## Deployment

Before starting the updated server, run from `server/`:

```sh
npx prisma migrate deploy
npx prisma generate
npm run build
```

Migration `20260920000000_payment_integrity` adds stable catalog codes, explicit
plan durations, a purchased-duration snapshot and the payment application timestamp.
Migration `20260920120000_webhook_logs` adds `webhook_logs` for YooKassa delivery audit.
It preserves subscriptions. Historical successful payments are marked as already
applied to prevent replay. If a historical success never actually granted access,
reconcile it manually against the provider before correcting that account; the public
repair endpoints intentionally cannot replay old successes.

The migration assigns codes to the newest active legacy plan for each supported
duration. Check the resulting catalog before enabling checkout. If creating a fresh
catalog, run `node --import tsx src/scripts/init-payment-data.ts` from `server/`.
The script upserts by code and never deletes plans referenced by subscriptions;
it resets those catalog entries to the configured default prices.

Set `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `CLIENT_URL`, and
`YOOKASSA_USE_MOCK=false` for real checkout. Without live credentials ordinary users
see an unavailable button. Local mocks and YooKassa sandbox payments are restricted
to admins and emails in `PAYMENT_TEST_EMAILS`.

Configure `/api/payments/webhook` for provider notifications. If
`YOOKASSA_WEBHOOK_SECRET` is set, configure the matching `?secret=...` in the notification
URL. Subscribe to both `payment.succeeded` / `payment.canceled` and `refund.succeeded`
in the merchant cabinet (Integration → HTTP-notifications). Every notification is
independently verified through the provider API (`GET /payments/{id}` or
`GET /refunds/{id}`). A `refund.succeeded` event marks the payment `REFUNDED`, cancels
the linked subscription, and demotes the user to FREEMIUM.
The browser return URL does not prove payment. The callback polls up to 20 times;
a user can also inspect the payment from `/payment`.

The selected method is sent as `payment_method_data.type`:
[bank card](https://yookassa.ru/developers/payment-acceptance/integration-scenarios/manual-integration/bank-card),
[SBP](https://yookassa.ru/developers/payment-acceptance/integration-scenarios/manual-integration/other/sbp),
[YooMoney](https://yookassa.ru/developers/payment-acceptance/integration-scenarios/manual-integration/yoo-money).
Enable the methods used by the site in the merchant account.

## Guarantees and tests

Provider ID, amount, currency, paid status and test mode are checked before granting
access. Application runs in one PostgreSQL transaction with a user row lock, so both
duplicate notifications and concurrent separate purchases are serialized. Every webhook
delivery is written to `webhook_logs` (`processed` / `failed` / `skipped`) with the raw
payload for later debugging. A payment's
`appliedAt` is retained even after newer purchases. Renewals extend remaining access;
calendar dates clamp to the last day of the target month. No recurring charge is
scheduled (`autoRenew=false`).

Run from the repository root:

```sh
npm run test:payments --workspace server
# Optional integration tests: ONLY use an isolated disposable PostgreSQL database
# containing the current schema. Fixtures are created and removed by the tests.
PAYMENT_TEST_DATABASE_URL=postgresql://USER@127.0.0.1:PORT/TEST_DB npm run test:payments --workspace server
npm run build --workspace client
npm run test:payment-ui --workspace client
```

The UI tests mock APIs and do not charge money. Integration tests exercise real
PostgreSQL transactions, concurrent duplicate/different purchases, old payment replays,
orphan/unpaid payment endpoints, test-mode restrictions, and duration snapshots.
Real merchant payments require an end-to-end check after activation and deployment.
