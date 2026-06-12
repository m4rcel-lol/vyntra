-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN "replyToMessageId" TEXT,
ADD COLUMN "attachmentFileId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "DirectMessage_replyToMessageId_idx" ON "DirectMessage"("replyToMessageId");

-- CreateIndex
CREATE INDEX "DirectMessage_attachmentFileId_idx" ON "DirectMessage"("attachmentFileId");

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_attachmentFileId_fkey" FOREIGN KEY ("attachmentFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
