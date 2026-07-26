-- CreateTable
CREATE TABLE "KpiGiornaliero" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "numeroPrimeVisite" INTEGER NOT NULL DEFAULT 0,
    "numeroAppuntamenti" INTEGER NOT NULL DEFAULT 0,
    "fatturato" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorePreventiviPresentati" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorePreventiviAccettati" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiGiornaliero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paziente" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "dataNascita" TIMESTAMP(3),
    "luogoNascita" TEXT,
    "codiceFiscale" TEXT,
    "residenza" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "medicoCurante" TEXT,
    "professione" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paziente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuloCompilato" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "pazienteId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "dati" TEXT NOT NULL,
    "luogo" TEXT,
    "data" TIMESTAMP(3),
    "firmaPazienteUrl" TEXT,
    "firmaGenitore1Url" TEXT,
    "firmaGenitore2Url" TEXT,
    "firmaOdontoiatraUrl" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'BOZZA',
    "pdfFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuloCompilato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KpiGiornaliero_studioId_idx" ON "KpiGiornaliero"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "KpiGiornaliero_studioId_data_key" ON "KpiGiornaliero"("studioId", "data");

-- CreateIndex
CREATE INDEX "Paziente_studioId_idx" ON "Paziente"("studioId");

-- CreateIndex
CREATE INDEX "Paziente_studioId_cognome_nome_idx" ON "Paziente"("studioId", "cognome", "nome");

-- CreateIndex
CREATE INDEX "ModuloCompilato_studioId_idx" ON "ModuloCompilato"("studioId");

-- CreateIndex
CREATE INDEX "ModuloCompilato_pazienteId_idx" ON "ModuloCompilato"("pazienteId");

-- AddForeignKey
ALTER TABLE "KpiGiornaliero" ADD CONSTRAINT "KpiGiornaliero_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paziente" ADD CONSTRAINT "Paziente_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuloCompilato" ADD CONSTRAINT "ModuloCompilato_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuloCompilato" ADD CONSTRAINT "ModuloCompilato_pazienteId_fkey" FOREIGN KEY ("pazienteId") REFERENCES "Paziente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

