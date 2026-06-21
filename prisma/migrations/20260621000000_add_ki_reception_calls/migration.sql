-- KI-Rezeptionist (Famulor) — neue, vollständig isolierte Tabelle.
-- Rein additiv: keine Änderung an bestehenden Tabellen/Enums.

-- CreateEnum
CREATE TYPE "public"."KiReceptionStatus" AS ENUM ('offen', 'in_bearbeitung', 'erledigt');

-- CreateEnum
CREATE TYPE "public"."KiReceptionCategory" AS ENUM ('neuwagen', 'gebrauchtwagen', 'probefahrt', 'finanzierung_leasing', 'inzahlungnahme', 'werkstatt_service', 'beschwerde', 'sonstiges');

-- CreateTable
CREATE TABLE "public"."KiReceptionCallRecord" (
    "id" TEXT NOT NULL,
    "externalCallId" TEXT,
    "customerName" TEXT NOT NULL DEFAULT 'Unbekannt',
    "customerPhone" TEXT NOT NULL DEFAULT '',
    "category" "public"."KiReceptionCategory" NOT NULL DEFAULT 'sonstiges',
    "summary" TEXT NOT NULL DEFAULT '',
    "vehicle" TEXT,
    "desiredAppt" TEXT,
    "transcript" TEXT,
    "recordingUrl" TEXT,
    "callDurationSec" INTEGER,
    "status" "public"."KiReceptionStatus" NOT NULL DEFAULT 'offen',
    "assignedTo" TEXT,
    "completionNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KiReceptionCallRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KiReceptionCallRecord_externalCallId_key" ON "public"."KiReceptionCallRecord"("externalCallId");

-- CreateIndex
CREATE INDEX "KiReceptionCallRecord_status_receivedAt_idx" ON "public"."KiReceptionCallRecord"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "KiReceptionCallRecord_category_idx" ON "public"."KiReceptionCallRecord"("category");

-- Enable Row Level Security (gleiches Muster wie 20260602120000_enable_rls).
-- Sperrt die PostgREST/anon-API; Prisma (postgres-Owner) bleibt unberührt.
ALTER TABLE "public"."KiReceptionCallRecord" ENABLE ROW LEVEL SECURITY;
