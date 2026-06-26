-- Fahrzeug-Marke je KI-Anruf (Badge + Filter im Dashboard).
-- Werte: mercedes | smart | lucid | skoda | byd | fuso | andere | NULL (ohne Angabe).
ALTER TABLE "public"."KiReceptionCallRecord" ADD COLUMN "marke" TEXT;
