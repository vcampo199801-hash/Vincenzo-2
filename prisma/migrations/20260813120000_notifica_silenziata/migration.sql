-- AlterTable
ALTER TABLE "Adempimento" ADD COLUMN "notificaSilenziata" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Farmaco" ADD COLUMN "notificaSilenziata" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MagazzinoItem" ADD COLUMN "notificaSilenziata" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TipoManutenzione" ADD COLUMN "notificaSilenziata" BOOLEAN NOT NULL DEFAULT false;
