-- AlterTable
ALTER TABLE "Preventivo" ADD COLUMN "importoListino" DOUBLE PRECISION;
ALTER TABLE "Preventivo" ADD COLUMN "importoAssicurazione" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "KpiGiornaliero" ADD COLUMN "chiusuraPos" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MovimentoCassa" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "importo" DOUBLE PRECISION NOT NULL,
    "modalitaIncasso" TEXT,
    "numeroFattura" TEXT,
    "nominativo" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimentoCassa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovimentoCassa_studioId_idx" ON "MovimentoCassa"("studioId");

-- CreateIndex
CREATE INDEX "MovimentoCassa_studioId_data_idx" ON "MovimentoCassa"("studioId", "data");

-- AddForeignKey
ALTER TABLE "MovimentoCassa" ADD CONSTRAINT "MovimentoCassa_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
