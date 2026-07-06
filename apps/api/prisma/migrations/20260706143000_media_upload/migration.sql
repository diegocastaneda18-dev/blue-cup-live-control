-- CreateEnum
CREATE TYPE "MediaUploadStatus" AS ENUM ('uploading', 'processing', 'ready', 'failed');

-- AlterTable
ALTER TABLE "CatchMedia" ADD COLUMN     "storageProvider" TEXT NOT NULL DEFAULT 's3',
ADD COLUMN     "bucket" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "uploadStatus" "MediaUploadStatus" NOT NULL DEFAULT 'ready',
ADD COLUMN     "multipartUploadId" TEXT,
ADD COLUMN     "uploadSessionId" TEXT,
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "CatchMedia_uploadSessionId_key" ON "CatchMedia"("uploadSessionId");

-- CreateIndex
CREATE INDEX "CatchMedia_catchId_uploadStatus_idx" ON "CatchMedia"("catchId", "uploadStatus");
