-- Add real-auth columns to AppUser. Existing rows (seed data only, this is a
-- fresh local dev DB) can't take a single shared default for a UNIQUE column,
-- so columns are added nullable first, backfilled with a per-row-unique
-- placeholder (their own id — guaranteed unique already), then locked down.
-- prisma/seed.ts's upsert immediately overwrites the placeholders with real
-- values on the next `npm run db:seed`.

ALTER TABLE "AppUser" ADD COLUMN "username" TEXT;
ALTER TABLE "AppUser" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "AppUser" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "AppUser" SET "username" = "id", "passwordHash" = '' WHERE "username" IS NULL;

ALTER TABLE "AppUser" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "AppUser" ALTER COLUMN "passwordHash" SET NOT NULL;

CREATE UNIQUE INDEX "AppUser_username_key" ON "AppUser"("username");
