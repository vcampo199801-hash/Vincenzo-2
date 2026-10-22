-- CreateTable
CREATE TABLE "RecapDestinatario" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sezioni" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecapDestinatario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecapDestinatario_studioId_email_key" ON "RecapDestinatario"("studioId", "email");

-- AddForeignKey
ALTER TABLE "RecapDestinatario" ADD CONSTRAINT "RecapDestinatario_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: ogni studio che aveva già il vecchio recap attivo diventa un
-- destinatario con tutte le sezioni (sezioni NULL), per non perdere il
-- recap a chi lo riceveva già prima di questa migrazione.
INSERT INTO "RecapDestinatario" ("id", "studioId", "email", "sezioni", "createdAt")
SELECT gen_random_uuid()::text, "id", COALESCE(NULLIF("emailRecapAttivita", ''), "email"), NULL, CURRENT_TIMESTAMP
FROM "Studio"
WHERE "recapAttivitaAttivo" = true AND COALESCE(NULLIF("emailRecapAttivita", ''), "email") IS NOT NULL;

-- DropColumn
ALTER TABLE "Studio" DROP COLUMN "recapAttivitaAttivo";
ALTER TABLE "Studio" DROP COLUMN "emailRecapAttivita";
