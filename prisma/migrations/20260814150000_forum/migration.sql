-- AlterTable
ALTER TABLE "Studio" ADD COLUMN "forumAttivo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "prezzo" DOUBLE PRECISION,
    "nascosto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumCommento" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "nascosto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumCommento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumSegnalazione" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "commentoId" TEXT,
    "studioId" TEXT NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumSegnalazione_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumPost_studioId_idx" ON "ForumPost"("studioId");

-- CreateIndex
CREATE INDEX "ForumPost_categoria_idx" ON "ForumPost"("categoria");

-- CreateIndex
CREATE INDEX "ForumPost_createdAt_idx" ON "ForumPost"("createdAt");

-- CreateIndex
CREATE INDEX "ForumCommento_postId_idx" ON "ForumCommento"("postId");

-- CreateIndex
CREATE INDEX "ForumCommento_studioId_idx" ON "ForumCommento"("studioId");

-- CreateIndex
CREATE INDEX "ForumSegnalazione_postId_idx" ON "ForumSegnalazione"("postId");

-- CreateIndex
CREATE INDEX "ForumSegnalazione_commentoId_idx" ON "ForumSegnalazione"("commentoId");

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumCommento" ADD CONSTRAINT "ForumCommento_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumCommento" ADD CONSTRAINT "ForumCommento_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumSegnalazione" ADD CONSTRAINT "ForumSegnalazione_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumSegnalazione" ADD CONSTRAINT "ForumSegnalazione_commentoId_fkey" FOREIGN KEY ("commentoId") REFERENCES "ForumCommento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumSegnalazione" ADD CONSTRAINT "ForumSegnalazione_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
