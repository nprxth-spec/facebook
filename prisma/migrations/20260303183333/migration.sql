-- AlterTable
ALTER TABLE "ExportConfig" ADD COLUMN     "autoDays" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
ADD COLUMN     "dateRange" TEXT NOT NULL DEFAULT 'today';

-- AlterTable
ALTER TABLE "ExportLog" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastFbAccountsSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastFbPagesSyncAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FacebookPage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "pageStatus" TEXT,
    "pictureUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacebookPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestAudiencePreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "interests" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterestAudiencePreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessengerTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "greeting" TEXT NOT NULL,
    "iceBreakers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessengerTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialHistory" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstSignupAt" TIMESTAMP(3) NOT NULL,
    "freeTrialStartedAt" TIMESTAMP(3) NOT NULL,
    "freeTrialExpiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacebookPage_userId_isActive_idx" ON "FacebookPage"("userId", "isActive");

-- CreateIndex
CREATE INDEX "InterestAudiencePreset_userId_updatedAt_idx" ON "InterestAudiencePreset"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "MessengerTemplate_userId_updatedAt_idx" ON "MessengerTemplate"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrialHistory_email_key" ON "TrialHistory"("email");

-- CreateIndex
CREATE INDEX "AiUsage_userId_month_idx" ON "AiUsage"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsage_userId_month_key" ON "AiUsage"("userId", "month");

-- CreateIndex
CREATE INDEX "ExportLog_userId_createdAt_idx" ON "ExportLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ExportLog_userId_status_idx" ON "ExportLog"("userId", "status");

-- CreateIndex
CREATE INDEX "ManagerAccount_userId_isActive_idx" ON "ManagerAccount"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "FacebookPage" ADD CONSTRAINT "FacebookPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestAudiencePreset" ADD CONSTRAINT "InterestAudiencePreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessengerTemplate" ADD CONSTRAINT "MessengerTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
