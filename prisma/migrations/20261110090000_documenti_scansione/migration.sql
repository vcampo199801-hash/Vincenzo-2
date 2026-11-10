-- AlterTable: scansione opzionale per ogni riga della checklist documenti.
ALTER TABLE "Documento" ADD COLUMN "nomeFile" TEXT;
ALTER TABLE "Documento" ADD COLUMN "fileUrl" TEXT;
ALTER TABLE "Documento" ADD COLUMN "dataCaricamento" TIMESTAMP(3);
