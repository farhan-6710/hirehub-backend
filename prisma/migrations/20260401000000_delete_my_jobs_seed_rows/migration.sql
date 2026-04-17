-- Remove previously seeded "my jobs" rows for the core employer account.
-- This allows reseeding with normalized company ownership.
DELETE FROM "jobs"
WHERE "posted_by_user_id" = (
  SELECT "id"
  FROM "users"
  WHERE "email" = 'employer@gmail.com'
)
AND "title" IN (
  'Full Stack Developer',
  'UI/UX Designer',
  'DevOps Engineer',
  'Data Analyst'
);
