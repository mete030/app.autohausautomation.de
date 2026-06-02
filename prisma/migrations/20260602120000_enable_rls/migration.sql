-- Enable Row Level Security (RLS) on all public tables.
--
-- These tables are exposed to PostgREST (the Supabase auto-generated REST/anon
-- API). With RLS disabled, anyone holding the anon/public API key could read or
-- write rows directly. This app does NOT use the PostgREST API: it accesses the
-- database exclusively through Prisma using the `postgres` owner role, which is
-- unaffected by RLS (table owners bypass RLS unless FORCE is set). Enabling RLS
-- without any permissive policies therefore locks down the anon/authenticated
-- API surface while leaving the application's Prisma access fully intact.

ALTER TABLE "public"."CallbackRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CallbackActivityRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CallbackEmailActionRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CallbackAttachmentRecord" ENABLE ROW LEVEL SECURITY;
