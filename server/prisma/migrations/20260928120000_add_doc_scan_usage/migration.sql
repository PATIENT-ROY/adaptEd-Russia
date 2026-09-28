CREATE TABLE "doc_scan_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_scan_usage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "doc_scan_usage_userId_idx" ON "doc_scan_usage"("userId");
CREATE INDEX "doc_scan_usage_createdAt_idx" ON "doc_scan_usage"("createdAt");

ALTER TABLE "doc_scan_usage"
ADD CONSTRAINT "doc_scan_usage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
