-- KI-Einstellungen: schlichter Key-Value-Store für Feature-Flags.
-- Rein additiv: keine Änderung an bestehenden Tabellen/Enums.

-- CreateTable
CREATE TABLE "public"."KiSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KiSetting_pkey" PRIMARY KEY ("key")
);

-- Row Level Security (Muster wie 20260602120000_enable_rls): sperrt anon/PostgREST,
-- Prisma (postgres-Owner) bleibt unberührt.
ALTER TABLE "public"."KiSetting" ENABLE ROW LEVEL SECURITY;
