-- KI-Kalender: Termine + Schließzeiten. Neue, vollständig isolierte Tabellen.
-- Rein additiv: keine Änderung an bestehenden Tabellen/Enums.

-- CreateEnum
CREATE TYPE "public"."KiAppointmentStatus" AS ENUM ('geplant', 'bestaetigt', 'abgesagt', 'erledigt');

-- CreateEnum
CREATE TYPE "public"."KiAppointmentSource" AS ENUM ('manuell', 'ki_wunsch', 'ki_gebucht', 'api');

-- CreateEnum
CREATE TYPE "public"."KiClosureType" AS ENUM ('betriebsschliessung', 'urlaub', 'wartung', 'feiertag');

-- CreateTable
CREATE TABLE "public"."KiAppointment" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "customerName" TEXT NOT NULL DEFAULT 'Unbekannt',
    "customerPhone" TEXT,
    "category" "public"."KiReceptionCategory",
    "service" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT 'Nagold',
    "staff" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "priceCents" INTEGER,
    "notesPublic" TEXT,
    "notesInternal" TEXT,
    "status" "public"."KiAppointmentStatus" NOT NULL DEFAULT 'geplant',
    "source" "public"."KiAppointmentSource" NOT NULL DEFAULT 'manuell',
    "sourceCallId" TEXT,
    "rawPayload" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KiAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KiLocationClosure" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Nagold',
    "type" "public"."KiClosureType" NOT NULL DEFAULT 'betriebsschliessung',
    "name" TEXT NOT NULL DEFAULT '',
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KiLocationClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KiAppointment_externalId_key" ON "public"."KiAppointment"("externalId");

-- CreateIndex
CREATE INDEX "KiAppointment_startTime_location_idx" ON "public"."KiAppointment"("startTime", "location");

-- CreateIndex
CREATE INDEX "KiAppointment_status_startTime_idx" ON "public"."KiAppointment"("status", "startTime");

-- CreateIndex
CREATE INDEX "KiLocationClosure_location_startDate_idx" ON "public"."KiLocationClosure"("location", "startDate");

-- Row Level Security (Muster wie 20260602120000_enable_rls): sperrt anon/PostgREST,
-- Prisma (postgres-Owner) bleibt unberührt.
ALTER TABLE "public"."KiAppointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."KiLocationClosure" ENABLE ROW LEVEL SECURITY;
