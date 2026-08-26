-- CreateTable
CREATE TABLE "Comunicazione" (
    "id" TEXT NOT NULL,
    "oggetto" TEXT NOT NULL,
    "messaggio" TEXT NOT NULL,
    "destinatari" TEXT NOT NULL,
    "totale" INTEGER NOT NULL,
    "inviate" INTEGER NOT NULL,
    "fallite" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comunicazione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComunicazioneInvio" (
    "id" TEXT NOT NULL,
    "comunicazioneId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "resendId" TEXT,
    "apertaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComunicazioneInvio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComunicazioneInvio_resendId_key" ON "ComunicazioneInvio"("resendId");

-- CreateIndex
CREATE INDEX "ComunicazioneInvio_comunicazioneId_idx" ON "ComunicazioneInvio"("comunicazioneId");

-- AddForeignKey
ALTER TABLE "ComunicazioneInvio" ADD CONSTRAINT "ComunicazioneInvio_comunicazioneId_fkey" FOREIGN KEY ("comunicazioneId") REFERENCES "Comunicazione"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComunicazioneInvio" ADD CONSTRAINT "ComunicazioneInvio_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
