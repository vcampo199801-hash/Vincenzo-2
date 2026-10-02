-- AlterTable
ALTER TABLE "MovimentoCassa" ADD COLUMN     "dataVersamento" TIMESTAMP(3),
ADD COLUMN     "fotocopiaFR" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timbroRSD" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Preventivo" ADD COLUMN     "tipoOfferta" TEXT;
