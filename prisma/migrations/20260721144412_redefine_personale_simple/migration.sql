/*
  Warnings:

  - You are about to drop the column `ccnl` on the `Dipendente` table. All the data in the column will be lost.
  - You are about to drop the column `codiceFiscale` on the `Dipendente` table. All the data in the column will be lost.
  - You are about to drop the column `dataFineContratto` on the `Dipendente` table. All the data in the column will be lost.
  - You are about to drop the column `dataNascita` on the `Dipendente` table. All the data in the column will be lost.
  - You are about to drop the column `livello` on the `Dipendente` table. All the data in the column will be lost.
  - You are about to drop the `AdempimentoPersonale` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AllegatoPersonale` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MovimentoAssenza` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonaleAccessLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SaldoAnnuale` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `dataAssunzione` on table `Dipendente` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AdempimentoPersonale" DROP CONSTRAINT "AdempimentoPersonale_dipendenteId_fkey";

-- DropForeignKey
ALTER TABLE "AdempimentoPersonale" DROP CONSTRAINT "AdempimentoPersonale_fileAllegatoId_fkey";

-- DropForeignKey
ALTER TABLE "MovimentoAssenza" DROP CONSTRAINT "MovimentoAssenza_dipendenteId_fkey";

-- DropForeignKey
ALTER TABLE "PersonaleAccessLog" DROP CONSTRAINT "PersonaleAccessLog_dipendenteId_fkey";

-- DropForeignKey
ALTER TABLE "PersonaleAccessLog" DROP CONSTRAINT "PersonaleAccessLog_studioId_fkey";

-- DropForeignKey
ALTER TABLE "SaldoAnnuale" DROP CONSTRAINT "SaldoAnnuale_dipendenteId_fkey";

-- AlterTable
ALTER TABLE "Dipendente" DROP COLUMN "ccnl",
DROP COLUMN "codiceFiscale",
DROP COLUMN "dataFineContratto",
DROP COLUMN "dataNascita",
DROP COLUMN "livello",
ADD COLUMN     "costoAziendaleMensile" DOUBLE PRECISION,
ADD COLUMN     "dataScadenzaContratto" TIMESTAMP(3),
ADD COLUMN     "stipendioLordoMensile" DOUBLE PRECISION,
ALTER COLUMN "dataAssunzione" SET NOT NULL;

-- DropTable
DROP TABLE "AdempimentoPersonale";

-- DropTable
DROP TABLE "AllegatoPersonale";

-- DropTable
DROP TABLE "MovimentoAssenza";

-- DropTable
DROP TABLE "PersonaleAccessLog";

-- DropTable
DROP TABLE "SaldoAnnuale";

-- CreateTable
CREATE TABLE "Cedolino" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "dipendenteId" TEXT NOT NULL,
    "mese" INTEGER NOT NULL,
    "anno" INTEGER NOT NULL,
    "nomeFile" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "dataCaricamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cedolino_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cedolino_studioId_idx" ON "Cedolino"("studioId");

-- CreateIndex
CREATE INDEX "Cedolino_dipendenteId_idx" ON "Cedolino"("dipendenteId");

-- CreateIndex
CREATE UNIQUE INDEX "Cedolino_dipendenteId_mese_anno_key" ON "Cedolino"("dipendenteId", "mese", "anno");

-- AddForeignKey
ALTER TABLE "Cedolino" ADD CONSTRAINT "Cedolino_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cedolino" ADD CONSTRAINT "Cedolino_dipendenteId_fkey" FOREIGN KEY ("dipendenteId") REFERENCES "Dipendente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
