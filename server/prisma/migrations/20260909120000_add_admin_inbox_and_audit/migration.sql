-- Persist per-admin inbox state and administrative actions.
CREATE TABLE "admin_inbox_reads" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_inbox_reads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "support_responses"
ADD COLUMN "adminUserId" TEXT,
ADD COLUMN "readByUserAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "admin_inbox_reads_adminUserId_category_key" ON "admin_inbox_reads"("adminUserId", "category");
CREATE INDEX "admin_inbox_reads_adminUserId_idx" ON "admin_inbox_reads"("adminUserId");
CREATE INDEX "admin_audit_logs_actorUserId_idx" ON "admin_audit_logs"("actorUserId");
CREATE INDEX "admin_audit_logs_entityType_entityId_idx" ON "admin_audit_logs"("entityType", "entityId");
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");
CREATE INDEX "support_responses_adminUserId_idx" ON "support_responses"("adminUserId");
CREATE INDEX "support_responses_readByUserAt_idx" ON "support_responses"("readByUserAt");

ALTER TABLE "admin_inbox_reads" ADD CONSTRAINT "admin_inbox_reads_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "support_responses" ADD CONSTRAINT "support_responses_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
