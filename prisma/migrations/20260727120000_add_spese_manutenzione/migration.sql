-- CreateTable
CREATE TABLE "SpesaStudio" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'ALTRO',
    "descrizione" TEXT,
    "importo" DOUBLE PRECISION NOT NULL,
    "ricorrente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpesaStudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManutenzioneLog" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'ALTRO',
    "data" TIMESTAMP(3) NOT NULL,
    "operatore" TEXT NOT NULL,
    "esito" TEXT NOT NULL DEFAULT 'OK',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManutenzioneLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpesaStudio_studioId_idx" ON "SpesaStudio"("studioId");

-- CreateIndex
CREATE INDEX "ManutenzioneLog_studioId_idx" ON "ManutenzioneLog"("studioId");

-- AddForeignKey
ALTER TABLE "SpesaStudio" ADD CONSTRAINT "SpesaStudio_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManutenzioneLog" ADD CONSTRAINT "ManutenzioneLog_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

