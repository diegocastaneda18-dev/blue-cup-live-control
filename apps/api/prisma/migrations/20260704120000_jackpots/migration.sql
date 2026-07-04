-- CreateEnum
CREATE TYPE "JackpotCategory" AS ENUM ('sonar', 'non_sonar');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "usesSonar" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "JackpotTier" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "category" "JackpotCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "amountUsd" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JackpotTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamJackpotEligibility" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "category" "JackpotCategory" NOT NULL,
    "isEligible" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamJackpotEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JackpotTier_tournamentId_category_idx" ON "JackpotTier"("tournamentId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "JackpotTier_tournamentId_category_sortOrder_key" ON "JackpotTier"("tournamentId", "category", "sortOrder");

-- CreateIndex
CREATE INDEX "TeamJackpotEligibility_tournamentId_category_idx" ON "TeamJackpotEligibility"("tournamentId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "TeamJackpotEligibility_tournamentId_teamId_category_key" ON "TeamJackpotEligibility"("tournamentId", "teamId", "category");

-- AddForeignKey
ALTER TABLE "JackpotTier" ADD CONSTRAINT "JackpotTier_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamJackpotEligibility" ADD CONSTRAINT "TeamJackpotEligibility_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamJackpotEligibility" ADD CONSTRAINT "TeamJackpotEligibility_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamJackpotEligibility" ADD CONSTRAINT "TeamJackpotEligibility_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
