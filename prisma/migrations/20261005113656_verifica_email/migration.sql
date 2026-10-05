-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificataAt" TIMESTAMP(3),
ADD COLUMN     "tokenVerificaEmail" TEXT,
ADD COLUMN     "tokenVerificaScadenza" TIMESTAMP(3);

-- Backfill: gli utenti già registrati prima di questo controllo si
-- considerano verificati (si sono già creati un account prima che il flusso
-- esistesse) — senza questa riga, al prossimo deploy tutti gli account già
-- esistenti resterebbero bloccati fuori, non potendo più accedere.
UPDATE "User" SET "emailVerificataAt" = "createdAt" WHERE "emailVerificataAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_tokenVerificaEmail_key" ON "User"("tokenVerificaEmail");
