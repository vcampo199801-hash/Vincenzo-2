-- CreateTable
CREATE TABLE "Dipendente" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "codiceFiscale" TEXT,
    "dataNascita" TIMESTAMP(3),
    "mansione" TEXT NOT NULL DEFAULT 'ALTRO',
    "tipoContratto" TEXT NOT NULL DEFAULT 'INDETERMINATO',
    "ccnl" TEXT,
    "livello" TEXT,
    "dataAssunzione" TIMESTAMP(3),
    "dataFineContratto" TIMESTAMP(3),
    "oreSettimanali" DOUBLE PRECISION,
    "finePeriodoProva" TIMESTAMP(3),
    "stato" TEXT NOT NULL DEFAULT 'ATTIVO',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dipendente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoAssenza" (
    "id" TEXT NOT NULL,
    "dipendenteId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3),
    "giorni" DOUBLE PRECISION,
    "ore" DOUBLE PRECISION,
    "protocolloCertificato" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentoAssenza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoAnnuale" (
    "id" TEXT NOT NULL,
    "dipendenteId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "ferieMaturate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ferieGodute" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rolMaturati" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rolGoduti" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "giorniMalattiaAnno" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "giorniComportoMassimo" INTEGER NOT NULL DEFAULT 180,
    "tfrAccantonatoInizioAnno" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tfrAccantonatoAnno" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "destinazioneTfr" TEXT,
    "retribuzioneUtileAnnua" DOUBLE PRECISION,
    "indiceRivalutazioneIstat" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaldoAnnuale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdempimentoPersonale" (
    "id" TEXT NOT NULL,
    "dipendenteId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "tipologia" TEXT NOT NULL,
    "dataEsecuzione" TIMESTAMP(3),
    "periodicitaMesi" INTEGER,
    "dataScadenza" TIMESTAMP(3),
    "esito" TEXT,
    "fileAllegatoId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdempimentoPersonale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllegatoPersonale" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "nomeFile" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "dimensioneByte" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "caricatoDaUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllegatoPersonale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonaleAccessLog" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dipendenteId" TEXT,
    "azione" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonaleAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dipendente_studioId_idx" ON "Dipendente"("studioId");

-- CreateIndex
CREATE INDEX "MovimentoAssenza_dipendenteId_idx" ON "MovimentoAssenza"("dipendenteId");

-- CreateIndex
CREATE INDEX "MovimentoAssenza_studioId_idx" ON "MovimentoAssenza"("studioId");

-- CreateIndex
CREATE INDEX "SaldoAnnuale_studioId_idx" ON "SaldoAnnuale"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoAnnuale_dipendenteId_anno_key" ON "SaldoAnnuale"("dipendenteId", "anno");

-- CreateIndex
CREATE UNIQUE INDEX "AdempimentoPersonale_fileAllegatoId_key" ON "AdempimentoPersonale"("fileAllegatoId");

-- CreateIndex
CREATE INDEX "AdempimentoPersonale_dipendenteId_idx" ON "AdempimentoPersonale"("dipendenteId");

-- CreateIndex
CREATE INDEX "AdempimentoPersonale_studioId_idx" ON "AdempimentoPersonale"("studioId");

-- CreateIndex
CREATE INDEX "AllegatoPersonale_studioId_idx" ON "AllegatoPersonale"("studioId");

-- CreateIndex
CREATE INDEX "PersonaleAccessLog_studioId_idx" ON "PersonaleAccessLog"("studioId");

-- CreateIndex
CREATE INDEX "PersonaleAccessLog_dipendenteId_idx" ON "PersonaleAccessLog"("dipendenteId");

-- AddForeignKey
ALTER TABLE "Dipendente" ADD CONSTRAINT "Dipendente_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoAssenza" ADD CONSTRAINT "MovimentoAssenza_dipendenteId_fkey" FOREIGN KEY ("dipendenteId") REFERENCES "Dipendente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoAnnuale" ADD CONSTRAINT "SaldoAnnuale_dipendenteId_fkey" FOREIGN KEY ("dipendenteId") REFERENCES "Dipendente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdempimentoPersonale" ADD CONSTRAINT "AdempimentoPersonale_dipendenteId_fkey" FOREIGN KEY ("dipendenteId") REFERENCES "Dipendente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdempimentoPersonale" ADD CONSTRAINT "AdempimentoPersonale_fileAllegatoId_fkey" FOREIGN KEY ("fileAllegatoId") REFERENCES "AllegatoPersonale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaleAccessLog" ADD CONSTRAINT "PersonaleAccessLog_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaleAccessLog" ADD CONSTRAINT "PersonaleAccessLog_dipendenteId_fkey" FOREIGN KEY ("dipendenteId") REFERENCES "Dipendente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
