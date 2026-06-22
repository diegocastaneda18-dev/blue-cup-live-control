-- AlterEnum
ALTER TYPE "ReviewAction" ADD VALUE 'set_pending';

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "manualScoreAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Team" ADD COLUMN "manualScoreReason" TEXT;
ALTER TABLE "Team" ADD COLUMN "manualScoreUpdatedById" TEXT;
ALTER TABLE "Team" ADD COLUMN "manualScoreUpdatedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_manualScoreUpdatedById_fkey" FOREIGN KEY ("manualScoreUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
