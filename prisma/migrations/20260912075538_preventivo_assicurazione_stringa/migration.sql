-- AlterTable
ALTER TABLE "Preventivo" ALTER COLUMN "assicurazione" DROP NOT NULL,
ALTER COLUMN "assicurazione" DROP DEFAULT,
ALTER COLUMN "assicurazione" SET DATA TYPE TEXT;
