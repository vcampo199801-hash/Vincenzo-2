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

  Written defensively (IF EXISTS everywhere): earlier deploy attempts on this
  database left it in an inconsistent intermediate state, so this migration
  must succeed no matter which of these objects are already gone.
*/
-- DropForeignKey
ALTER TABLE IF EXISTS "AdempimentoPersonale" DROP CONSTRAINT IF EXISTS "AdempimentoPersonale_dipendenteId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "AdempimentoPersonale" DROP CONSTRAINT IF EXISTS "AdempimentoPersonale_fileAllegatoId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "MovimentoAssenza" DROP CONSTRAINT IF EXISTS "MovimentoAssenza_dipendenteId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "PersonaleAccessLog" DROP CONSTRAINT IF EXISTS "PersonaleAccessLog_dipendenteId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "PersonaleAccessLog" DROP CONSTRAINT IF EXISTS "PersonaleAccessLog_studioId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "SaldoAnnuale" DROP CONSTRAINT IF EXISTS "SaldoAnnuale_dipendenteId_fkey";

-- AlterTable
ALTER TABLE "Dipendente"
DROP COLUMN IF EXISTS "ccnl",
DROP COLUMN IF EXISTS "codiceFiscale",
DROP COLUMN IF EXISTS "dataFineContratto",
DROP COLUMN IF EXISTS "dataNascita",
DROP COLUMN IF EXISTS "livello",
-- Colonne di un esperimento successivo (calcolo automatico ferie/ROL), poi
-- annullato: rimaste sul database di produzione ma non più usate da nessun
-- codice applicativo.
DROP COLUMN IF EXISTS "oreSettimanaliFullTime",
DROP COLUMN IF EXISTS "ferieAnnueContrattuali",
DROP COLUMN IF EXISTS "rolAnnueContrattuali",
DROP COLUMN IF EXISTS "retribuzioneLordaAnnua",
ADD COLUMN IF NOT EXISTS "costoAziendaleMensile" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "dataScadenzaContratto" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "stipendioLordoMensile" DOUBLE PRECISION;

-- DropTable
DROP TABLE IF EXISTS "AdempimentoPersonale";

-- DropTable
DROP TABLE IF EXISTS "AllegatoPersonale";

-- DropTable
DROP TABLE IF EXISTS "MovimentoAssenza";

-- DropTable
DROP TABLE IF EXISTS "PersonaleAccessLog";

-- DropTable
DROP TABLE IF EXISTS "SaldoAnnuale";

-- CreateTable
CREATE TABLE IF NOT EXISTS "Cedolino" (
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
CREATE INDEX IF NOT EXISTS "Cedolino_studioId_idx" ON "Cedolino"("studioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Cedolino_dipendenteId_idx" ON "Cedolino"("dipendenteId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Cedolino_dipendenteId_mese_anno_key" ON "Cedolino"("dipendenteId", "mese", "anno");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Cedolino" ADD CONSTRAINT "Cedolino_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Cedolino" ADD CONSTRAINT "Cedolino_dipendenteId_fkey" FOREIGN KEY ("dipendenteId") REFERENCES "Dipendente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
