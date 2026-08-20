ALTER TABLE "ForumPost" ADD COLUMN "notificaSilenziata" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ForumCommento" ADD COLUMN "lettoDaAutore" BOOLEAN NOT NULL DEFAULT false;
