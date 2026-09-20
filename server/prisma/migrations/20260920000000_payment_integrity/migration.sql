ALTER TABLE "subscription_plans" ADD COLUMN "code" TEXT;
ALTER TABLE "subscription_plans" ADD COLUMN "durationMonths" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "payments" ADD COLUMN "appliedAt" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN "durationMonths" INTEGER;

-- One-time conversion of legacy plans. Runtime code never infers duration from price.
UPDATE "subscription_plans" SET "durationMonths" = CASE
  WHEN lower(name) ~ '(3|три|three)' THEN 3
  WHEN "interval" = 'YEARLY' OR lower(name) ~ '(год|year)' THEN 12
  WHEN lower(name) ~ '(6|шест)' THEN 6
  WHEN price = 549 THEN 3
  WHEN price IN (1990, 2990) THEN 12
  WHEN price = 1499 THEN 6
  ELSE 1 END;

WITH candidates AS (
  SELECT id, CASE "durationMonths"
    WHEN 1 THEN 'premium-month' WHEN 3 THEN 'premium-3months'
    WHEN 12 THEN 'premium-year' END AS code,
    row_number() OVER (PARTITION BY "durationMonths" ORDER BY "isActive" DESC, "createdAt" DESC, id) AS rank
  FROM "subscription_plans" WHERE price > 0 AND "currency" = 'RUB'
)
UPDATE "subscription_plans" p SET code = c.code
FROM candidates c WHERE p.id = c.id AND c.rank = 1 AND c.code IS NOT NULL;
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

UPDATE "payments" p SET "durationMonths" = sp."durationMonths"
FROM "subscription_plans" sp WHERE p."planId" = sp.id;

-- Historical successes must not grant access again. Any previously unfulfilled
-- legacy success needs explicit reconciliation, not replay through the public API.
UPDATE "payments" SET "appliedAt" = "updatedAt" WHERE upper(status) = 'SUCCEEDED';
UPDATE "payments" p SET "appliedAt" = s."updatedAt"
FROM "subscriptions" s WHERE s."paymentId" = p.id AND p."appliedAt" IS NULL;
