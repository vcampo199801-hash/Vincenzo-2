-- Remove SMS reminder feature: drop the now-unused columns from Studio.
ALTER TABLE "Studio" DROP COLUMN IF EXISTS "notificheSms";
ALTER TABLE "Studio" DROP COLUMN IF EXISTS "telefonoSms";
