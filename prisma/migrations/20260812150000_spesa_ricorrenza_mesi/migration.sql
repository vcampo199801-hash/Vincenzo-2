-- AlterTable: aggiunge la colonna numerica.
ALTER TABLE "SpesaStudio" ADD COLUMN "ricorrenzaMesi" INTEGER;

-- Migra i dati esistenti dal vecchio campo testo libero: "MENSILE" -> 1,
-- qualsiasi altro testo -> primo numero trovato nella stringa (es. "2 mesi" -> 2).
UPDATE "SpesaStudio" SET "ricorrenzaMesi" = 1 WHERE "ricorrenza" = 'MENSILE';
UPDATE "SpesaStudio"
SET "ricorrenzaMesi" = NULLIF(regexp_replace("ricorrenza", '\D', '', 'g'), '')::int
WHERE "ricorrenza" IS NOT NULL AND "ricorrenza" <> 'MENSILE' AND "ricorrenzaMesi" IS NULL;

-- Rimuove il vecchio campo testo libero.
ALTER TABLE "SpesaStudio" DROP COLUMN "ricorrenza";
