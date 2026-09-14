-- AlterTable: aggiunge la nuova casella, la valorizza da tipoRinnovo, poi
-- rimuove i due campi ora superflui (contrattoAttivo e tipoRinnovo).
ALTER TABLE "Fornitore" ADD COLUMN "rinnovoTacito" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Fornitore" SET "rinnovoTacito" = true WHERE "tipoRinnovo" = 'TACITO';

ALTER TABLE "Fornitore" DROP COLUMN "contrattoAttivo";
ALTER TABLE "Fornitore" DROP COLUMN "tipoRinnovo";
