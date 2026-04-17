-- Normalize legacy application statuses and enforce canonical enum values.
-- Canonical values: pending, reviewed, accepted, rejected

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApplicationStatus_new') THEN
    DROP TYPE "ApplicationStatus_new";
  END IF;
END $$;

CREATE TYPE "ApplicationStatus_new" AS ENUM ('pending', 'reviewed', 'accepted', 'rejected');

ALTER TABLE "applications"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "applications"
ALTER COLUMN "status"
TYPE "ApplicationStatus_new"
USING (
  CASE
    WHEN "status"::text IN ('review', 'interview', 'reviewed') THEN 'reviewed'::"ApplicationStatus_new"
    WHEN "status"::text IN ('hired', 'accepted') THEN 'accepted'::"ApplicationStatus_new"
    WHEN "status"::text = 'rejected' THEN 'rejected'::"ApplicationStatus_new"
    ELSE 'pending'::"ApplicationStatus_new"
  END
);

DROP TYPE "ApplicationStatus";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";

ALTER TABLE "applications"
ALTER COLUMN "status" SET DEFAULT 'pending'::"ApplicationStatus";
