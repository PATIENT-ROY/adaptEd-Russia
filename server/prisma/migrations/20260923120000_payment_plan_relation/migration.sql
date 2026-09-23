-- Drop orphan plan ids before adding the FK
UPDATE "payments"
SET "planId" = NULL
WHERE "planId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "subscription_plans" sp WHERE sp.id = "payments"."planId"
  );

CREATE UNIQUE INDEX "payments_yooKassaPaymentId_key"
ON "payments"("yooKassaPaymentId");

ALTER TABLE "payments"
ADD CONSTRAINT "payments_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
