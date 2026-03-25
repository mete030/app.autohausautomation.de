-- CreateEnum
CREATE TYPE "public"."CallbackStatus" AS ENUM ('offen', 'in_bearbeitung', 'erledigt', 'ueberfaellig');

-- CreateEnum
CREATE TYPE "public"."CallbackPriority" AS ENUM ('niedrig', 'mittel', 'hoch', 'dringend');

-- CreateEnum
CREATE TYPE "public"."CallSource" AS ENUM ('telefon', 'website', 'whatsapp', 'ki_agent', 'manuell');

-- CreateEnum
CREATE TYPE "public"."AgentType" AS ENUM ('mensch', 'ki');

-- CreateEnum
CREATE TYPE "public"."CallbackEmailActionType" AS ENUM ('complete_callback');

-- CreateTable
CREATE TABLE "public"."CallbackRecord" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "assignedAdvisor" TEXT NOT NULL,
    "assignedEmployeeId" TEXT,
    "status" "public"."CallbackStatus" NOT NULL DEFAULT 'offen',
    "priority" "public"."CallbackPriority" NOT NULL,
    "source" "public"."CallSource" NOT NULL,
    "takenById" TEXT NOT NULL,
    "takenByName" TEXT NOT NULL,
    "takenByType" "public"."AgentType" NOT NULL,
    "callTranscript" TEXT,
    "callDuration" INTEGER,
    "slaDurationMinutes" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "completionNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallbackRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CallbackActivityRecord" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "CallbackActivityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CallbackEmailActionRecord" (
    "id" TEXT NOT NULL,
    "callbackId" TEXT NOT NULL,
    "actionType" "public"."CallbackEmailActionType" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByIp" TEXT,
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallbackEmailActionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallbackRecord_status_createdAt_idx" ON "public"."CallbackRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CallbackRecord_assignedEmployeeId_idx" ON "public"."CallbackRecord"("assignedEmployeeId");

-- CreateIndex
CREATE INDEX "CallbackActivityRecord_callbackId_performedAt_idx" ON "public"."CallbackActivityRecord"("callbackId", "performedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CallbackEmailActionRecord_tokenHash_key" ON "public"."CallbackEmailActionRecord"("tokenHash");

-- CreateIndex
CREATE INDEX "CallbackEmailActionRecord_callbackId_actionType_idx" ON "public"."CallbackEmailActionRecord"("callbackId", "actionType");

-- CreateIndex
CREATE INDEX "CallbackEmailActionRecord_expiresAt_idx" ON "public"."CallbackEmailActionRecord"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."CallbackActivityRecord" ADD CONSTRAINT "CallbackActivityRecord_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."CallbackRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallbackEmailActionRecord" ADD CONSTRAINT "CallbackEmailActionRecord_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "public"."CallbackRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
