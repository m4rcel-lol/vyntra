ALTER TABLE "Profile"
ALTER COLUMN "statusText" SET DEFAULT '';

UPDATE "Profile"
SET "statusText" = ''
WHERE "statusText" IS NOT NULL;
