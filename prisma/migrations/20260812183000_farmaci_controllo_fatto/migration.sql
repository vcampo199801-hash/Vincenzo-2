-- Rinomina il vecchio campo testo libero in "note" e aggiunge il flag
-- strutturato "fatto" (esito del controllo mensile), impostato a true per
-- i controlli già registrati con una data.
ALTER TABLE "FarmacoControlloMensile" RENAME COLUMN "esito" TO "note";
ALTER TABLE "FarmacoControlloMensile" ADD COLUMN "fatto" BOOLEAN NOT NULL DEFAULT false;
UPDATE "FarmacoControlloMensile" SET "fatto" = true WHERE "dataControllo" IS NOT NULL;
