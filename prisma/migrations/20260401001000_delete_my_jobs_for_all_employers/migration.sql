-- Remove previously seeded "my jobs" rows for all employer users.
-- This allows reseeding with normalized company ownership.
DELETE FROM "jobs"
WHERE "posted_by_user_id" IN (
  SELECT "id"
  FROM "users"
  WHERE "role" = 'employer'
)
AND "title" IN (
  'Full Stack Developer',
  'UI/UX Designer',
  'DevOps Engineer',
  'Data Analyst'
);
