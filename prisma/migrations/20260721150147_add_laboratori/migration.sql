-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "templateIstruzioniManutenzione" TEXT;

-- CreateTable
CREATE TABLE "Laboratorio" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "ragioneSociale" TEXT NOT NULL,
    "partitaIva" TEXT,
    "indirizzo" TEXT,
    "referente" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "numeroRegistrazioneMinisteriale" TEXT,
    "dataUltimaVerificaRegistrazione" TIMESTAMP(3),
    "tipologieLavorazione" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'ATTIVO',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lavorazione" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "laboratorioId" TEXT NOT NULL,
    "riferimentoPaziente" TEXT NOT NULL,
    "tipoLavorazione" TEXT NOT NULL DEFAULT 'ALTRO',
    "elementiDentali" TEXT,
    "dataInvio" TIMESTAMP(3) NOT NULL,
    "dataConsegnaPrevista" TIMESTAMP(3),
    "dataConsegnaEffettiva" TIMESTAMP(3),
    "stato" TEXT NOT NULL DEFAULT 'INVIATO',
    "costo" DOUBLE PRECISION,
    "dataConsegnaCopiaPaziente" TIMESTAMP(3),
    "istruzioniManutenzione" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lavorazione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllegatoLaboratorio" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "laboratorioId" TEXT,
    "lavorazioneId" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'ALTRO',
    "nomeFile" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "dataCaricamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllegatoLaboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Laboratorio_studioId_idx" ON "Laboratorio"("studioId");

-- CreateIndex
CREATE INDEX "Lavorazione_studioId_idx" ON "Lavorazione"("studioId");

-- CreateIndex
CREATE INDEX "Lavorazione_laboratorioId_idx" ON "Lavorazione"("laboratorioId");

-- CreateIndex
CREATE INDEX "AllegatoLaboratorio_studioId_idx" ON "AllegatoLaboratorio"("studioId");

-- CreateIndex
CREATE INDEX "AllegatoLaboratorio_laboratorioId_idx" ON "AllegatoLaboratorio"("laboratorioId");

-- CreateIndex
CREATE INDEX "AllegatoLaboratorio_lavorazioneId_idx" ON "AllegatoLaboratorio"("lavorazioneId");

-- AddForeignKey
ALTER TABLE "Laboratorio" ADD CONSTRAINT "Laboratorio_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lavorazione" ADD CONSTRAINT "Lavorazione_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lavorazione" ADD CONSTRAINT "Lavorazione_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "Laboratorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllegatoLaboratorio" ADD CONSTRAINT "AllegatoLaboratorio_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllegatoLaboratorio" ADD CONSTRAINT "AllegatoLaboratorio_laboratorioId_fkey" FOREIGN KEY ("laboratorioId") REFERENCES "Laboratorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllegatoLaboratorio" ADD CONSTRAINT "AllegatoLaboratorio_lavorazioneId_fkey" FOREIGN KEY ("lavorazioneId") REFERENCES "Lavorazione"("id") ON DELETE CASCADE ON UPDATE CASCADE;
