-- AlterTable: il recap attività diventa una preferenza personale per membro
-- (come notificheAttive/notificheEmail), non più un elenco di indirizzi
-- gestito a parte dal titolare.
ALTER TABLE "Membership" ADD COLUMN "recapAttivitaAttivo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Membership" ADD COLUMN "recapSezioni" TEXT;

-- Backfill: ogni RecapDestinatario la cui email coincide con l'email di
-- accesso di un membro dello studio diventa la sua preferenza personale —
-- lo stesso indirizzo da qui in poi si attiva da sé (Impostazioni → Account),
-- non più da un elenco separato. Un eventuale indirizzo senza un account
-- corrispondente (es. una casella condivisa mai registrata come collaboratore)
-- non ha più un equivalente in questo modello e viene perso: la funzione è
-- stata introdotta pochi minuti prima di questa migrazione, senza ancora
-- clienti reali configurati.
UPDATE "Membership" m
SET "recapAttivitaAttivo" = true,
    "recapSezioni" = rd."sezioni"
FROM "RecapDestinatario" rd, "User" u
WHERE u."id" = m."userId" AND rd."studioId" = m."studioId" AND lower(rd."email") = lower(u."email");

-- DropTable
DROP TABLE "RecapDestinatario";
