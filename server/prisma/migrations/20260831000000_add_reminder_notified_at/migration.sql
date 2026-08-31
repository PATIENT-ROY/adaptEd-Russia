-- AlterTable
ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reminders_notifiedAt_idx" ON "reminders"("notifiedAt");
