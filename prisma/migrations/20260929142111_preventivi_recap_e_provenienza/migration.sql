-- AlterTable
ALTER TABLE "Preventivo" ADD COLUMN     "comeCiHaConosciuto" TEXT,
ADD COLUMN     "dataAccettazione" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "emailRecapAttivita" TEXT,
ADD COLUMN     "recapAttivitaAttivo" BOOLEAN NOT NULL DEFAULT false;
