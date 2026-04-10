-- CreateTable
CREATE TABLE "public"."CallbackAttachmentRecord" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "uploadedByRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallbackAttachmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallbackAttachmentRecord_callbackId_stage_idx" ON "public"."CallbackAttachmentRecord"("callbackId", "stage");

-- AddForeignKey
ALTER TABLE "public"."CallbackAttachmentRecord" ADD CONSTRAINT "CallbackAttachmentRecord_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."CallbackRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
