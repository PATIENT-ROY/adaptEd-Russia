CREATE TABLE "chat_daily_usage" (
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "chat_daily_usage_pkey" PRIMARY KEY ("userId", "day"),
    CONSTRAINT "chat_daily_usage_nonnegative" CHECK ("used" >= 0),
    CONSTRAINT "chat_daily_usage_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Prisma stores createdAt in UTC. Preserve usage from existing history.
INSERT INTO "chat_daily_usage" ("userId", "day", "used")
SELECT "userId", "createdAt"::date, COUNT(*)::integer
FROM "chat_messages"
WHERE "isUser" = true
GROUP BY "userId", "createdAt"::date;
