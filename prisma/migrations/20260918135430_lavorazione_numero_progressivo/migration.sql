-- AlterTable: aggiunge la colonna prima come opzionale, per poter valorizzare
-- le righe già esistenti prima di renderla obbligatoria.
ALTER TABLE "Lavorazione" ADD COLUMN "numero" INTEGER;

-- Backfill: assegna un numero progressivo per studio alle lavorazioni già
-- presenti, nell'ordine in cui sono state create.
WITH numerate AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "studioId" ORDER BY "createdAt" ASC) AS rn
  FROM "Lavorazione"
)
UPDATE "Lavorazione" AS l
SET "numero" = numerate.rn
FROM numerate
WHERE l."id" = numerate."id";

-- AlterTable: ora che tutte le righe hanno un valore, rende la colonna obbligatoria.
ALTER TABLE "Lavorazione" ALTER COLUMN "numero" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Lavorazione_studioId_numero_key" ON "Lavorazione"("studioId", "numero");
