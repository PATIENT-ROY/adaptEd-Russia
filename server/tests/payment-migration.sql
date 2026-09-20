-- Run against a disposable test database with psql -f server/tests/payment-migration.sql.
-- Temporary tables shadow real tables; ROLLBACK leaves the database unchanged.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE subscription_plans (
  id TEXT PRIMARY KEY, name TEXT, price FLOAT, "interval" TEXT, currency TEXT,
  "isActive" BOOLEAN, "createdAt" TIMESTAMP
);
CREATE TEMP TABLE payments (
  id TEXT PRIMARY KEY, "planId" TEXT, status TEXT, "updatedAt" TIMESTAMP
);
CREATE TEMP TABLE subscriptions (
  "paymentId" TEXT, "updatedAt" TIMESTAMP, "endDate" TIMESTAMP
);
INSERT INTO subscription_plans VALUES
  ('month-old', 'Премиум (месяц)', 199, 'MONTHLY', 'RUB', false, '2026-01-01'),
  ('month', 'Премиум (месяц)', 250, 'MONTHLY', 'RUB', true, '2026-02-01'),
  ('quarter', 'Премиум (3 месяца)', 650, 'MONTHLY', 'RUB', true, '2026-02-01'),
  ('year', 'Премиум (год)', 2500, 'YEARLY', 'RUB', true, '2026-02-01');
INSERT INTO payments VALUES
  ('old-success', 'month', 'SUCCEEDED', '2026-05-01'),
  ('latest-success', 'quarter', 'SUCCEEDED', '2026-08-01'),
  ('pending', 'year', 'PENDING', '2026-09-01');
INSERT INTO subscriptions VALUES ('latest-success', '2026-08-01', '2026-11-01');
\ir ../prisma/migrations/20260920000000_payment_integrity/migration.sql
DO $$ BEGIN
  IF (SELECT code FROM subscription_plans WHERE id = 'month') != 'premium-month'
    OR (SELECT code FROM subscription_plans WHERE id = 'quarter') != 'premium-3months'
    OR (SELECT code FROM subscription_plans WHERE id = 'year') != 'premium-year'
    OR (SELECT code FROM subscription_plans WHERE id = 'month-old') IS NOT NULL THEN
    RAISE EXCEPTION 'Stable code migration failed';
  END IF;
  IF (SELECT "durationMonths" FROM payments WHERE id = 'latest-success') != 3
    OR (SELECT "durationMonths" FROM payments WHERE id = 'pending') != 12 THEN
    RAISE EXCEPTION 'Duration snapshot migration failed';
  END IF;
  IF (SELECT count(*) FROM payments WHERE "appliedAt" IS NOT NULL) != 2
    OR (SELECT "appliedAt" FROM payments WHERE id = 'pending') IS NOT NULL THEN
    RAISE EXCEPTION 'Historical replay protection migration failed';
  END IF;
  IF (SELECT "endDate" FROM subscriptions) != '2026-11-01'::timestamp THEN
    RAISE EXCEPTION 'Existing subscription was changed';
  END IF;
END $$;
ROLLBACK;
