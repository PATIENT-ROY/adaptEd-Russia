-- CreateEnum
CREATE TYPE "BuddyApplicationType" AS ENUM ('STUDENT', 'MENTOR');

-- CreateEnum
CREATE TYPE "BuddyApplicationStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'APPROVED', 'MATCHED', 'REJECTED', 'CLOSED');

-- CreateTable
CREATE TABLE "buddy_applications" (
    "id" TEXT NOT NULL,
    "type" "BuddyApplicationType" NOT NULL,
    "status" "BuddyApplicationStatus" NOT NULL DEFAULT 'NEW',
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAdult" BOOLEAN NOT NULL,
    "country" TEXT,
    "city" TEXT NOT NULL,
    "affiliation" TEXT,
    "participantStatus" TEXT,
    "languages" TEXT[] NOT NULL,
    "helpTopics" TEXT[] NOT NULL,
    "interests" TEXT,
    "availability" TEXT NOT NULL,
    "contactMethod" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "motivation" TEXT,
    "comment" TEXT,
    "agreedToRules" BOOLEAN NOT NULL,
    "agreedToDataPolicy" BOOLEAN NOT NULL,
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buddy_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buddy_applications_userId_idx" ON "buddy_applications"("userId");
CREATE INDEX "buddy_applications_type_idx" ON "buddy_applications"("type");
CREATE INDEX "buddy_applications_status_idx" ON "buddy_applications"("status");
CREATE INDEX "buddy_applications_city_idx" ON "buddy_applications"("city");
CREATE INDEX "buddy_applications_createdAt_idx" ON "buddy_applications"("createdAt");

-- AddForeignKey
ALTER TABLE "buddy_applications" ADD CONSTRAINT "buddy_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
