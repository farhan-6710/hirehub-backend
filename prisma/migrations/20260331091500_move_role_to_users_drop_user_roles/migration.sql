-- Add role directly to users as nullable first so we can backfill from user_roles
ALTER TABLE "users" ADD COLUMN "role" "Role";

-- Prefer employer when a user had both candidate and employer rows
UPDATE "users" AS u
SET "role" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "user_roles" ur
    WHERE ur."userId" = u."id" AND ur."role" = 'employer'
  ) THEN 'employer'::"Role"
  ELSE 'candidate'::"Role"
END;

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'candidate';
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;

DROP TABLE "user_roles";