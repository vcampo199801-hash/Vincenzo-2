-- AlterTable
ALTER TABLE "MagazzinoItem" ADD COLUMN "percentualeIva" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "MagazzinoCodiceMemoria" ADD COLUMN "percentualeIva" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SpesaStudio" ADD COLUMN "percentualeIva" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Lavorazione" ADD COLUMN "percentualeIva" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ManutenzioneLog" ADD COLUMN "percentualeIva" DOUBLE PRECISION;
