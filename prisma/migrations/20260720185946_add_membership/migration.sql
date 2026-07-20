-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_studioId_userId_key" ON "Membership"("studioId", "userId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing studio's owner becomes its OWNER membership row,
-- so studios created before this migration don't lose access.
INSERT INTO "Membership" ("id", "studioId", "userId", "role", "createdAt")
SELECT gen_random_uuid()::text, s."id", s."ownerId", 'OWNER', now()
FROM "Studio" s
ON CONFLICT ("studioId", "userId") DO NOTHING;
