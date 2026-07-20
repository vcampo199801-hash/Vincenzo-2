-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Studio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "titolare" TEXT,
    "citta" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Studio_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'TRIALING',
    "trialEndsAt" DATETIME,
    "currentPeriodEnd" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Adempimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioId" TEXT NOT NULL,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "nome" TEXT NOT NULL,
    "riferimento" TEXT,
    "periodicita" TEXT NOT NULL,
    "mesi" INTEGER NOT NULL,
    "dataUltimoControllo" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Adempimento_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ControlloLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioId" TEXT NOT NULL,
    "adempimentoId" TEXT,
    "dataIntervento" DATETIME NOT NULL,
    "tecnico" TEXT,
    "esito" TEXT NOT NULL,
    "costo" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ControlloLog_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ControlloLog_adempimentoId_fkey" FOREIGN KEY ("adempimentoId") REFERENCES "Adempimento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EcmCredito" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioId" TEXT NOT NULL,
    "professionista" TEXT NOT NULL,
    "crediti2026" INTEGER NOT NULL DEFAULT 0,
    "crediti2027" INTEGER NOT NULL DEFAULT 0,
    "crediti2028" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL DEFAULT 150,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EcmCredito_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioId" TEXT NOT NULL,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "nome" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'MANCANTE',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Documento_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MagazzinoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "prodotto" TEXT NOT NULL,
    "fornitore" TEXT,
    "unita" TEXT NOT NULL DEFAULT 'pz',
    "scortaMinima" REAL NOT NULL DEFAULT 0,
    "quantitaAttuale" REAL NOT NULL DEFAULT 0,
    "scadenzaLotto" DATETIME,
    "prezzoUnitario" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MagazzinoItem_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Farmaco" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoriaUso" TEXT,
    "doveSiTrova" TEXT,
    "quantita" INTEGER NOT NULL DEFAULT 1,
    "lotto" TEXT,
    "scadenza" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Farmaco_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FarmacoControlloMensile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioId" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "mese" INTEGER NOT NULL,
    "dataControllo" DATETIME,
    "operatore" TEXT,
    "esito" TEXT,
    CONSTRAINT "FarmacoControlloMensile_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fornitore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'COMPLIANCE',
    "ruolo" TEXT NOT NULL,
    "nome" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "contrattoAttivo" BOOLEAN NOT NULL DEFAULT false,
    "scadenzaContratto" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fornitore_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_studioId_key" ON "Subscription"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Adempimento_studioId_idx" ON "Adempimento"("studioId");

-- CreateIndex
CREATE INDEX "ControlloLog_studioId_idx" ON "ControlloLog"("studioId");

-- CreateIndex
CREATE INDEX "EcmCredito_studioId_idx" ON "EcmCredito"("studioId");

-- CreateIndex
CREATE INDEX "Documento_studioId_idx" ON "Documento"("studioId");

-- CreateIndex
CREATE INDEX "MagazzinoItem_studioId_idx" ON "MagazzinoItem"("studioId");

-- CreateIndex
CREATE INDEX "Farmaco_studioId_idx" ON "Farmaco"("studioId");

-- CreateIndex
CREATE INDEX "FarmacoControlloMensile_studioId_idx" ON "FarmacoControlloMensile"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmacoControlloMensile_studioId_anno_mese_key" ON "FarmacoControlloMensile"("studioId", "anno", "mese");

-- CreateIndex
CREATE INDEX "Fornitore_studioId_idx" ON "Fornitore"("studioId");
