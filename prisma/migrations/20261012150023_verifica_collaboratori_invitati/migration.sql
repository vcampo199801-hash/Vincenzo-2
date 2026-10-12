-- Nessuna modifica allo schema: solo un backfill dati.
--
-- Da quando è stata introdotta la verifica email (migrazione 20261005113656),
-- il login blocca ogni utente con "emailVerificataAt" NULL — ma gli account dei
-- collaboratori invitati dal titolare (inviteMember) venivano creati senza mai
-- impostare quel campo, e non ricevono alcuna email di verifica (solo quella
-- con le credenziali), restando quindi bloccati al login per sempre.
--
-- Qui si marcano come verificati solo gli utenti che possono essere arrivati
-- ESCLUSIVAMENTE tramite un invito da collaboratore: nessuna delle loro
-- Membership è "OWNER" (un account OWNER arriva sempre da /signup o /codice,
-- entrambi flussi già correttamente soggetti a verifica, quindi non li
-- tocchiamo per non riaprire quella protezione).
UPDATE "User"
SET "emailVerificataAt" = "createdAt"
WHERE "emailVerificataAt" IS NULL
  AND EXISTS (SELECT 1 FROM "Membership" WHERE "Membership"."userId" = "User"."id")
  AND NOT EXISTS (
    SELECT 1 FROM "Membership" WHERE "Membership"."userId" = "User"."id" AND "Membership"."role" = 'OWNER'
  );
