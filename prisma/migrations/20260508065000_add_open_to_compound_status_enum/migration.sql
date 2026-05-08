-- Ensure database enum accepts OPEN, matching prisma/schema.prisma.
-- Guarded so shadow DB validation does not fail in environments where
-- CompoundStatus is not present in migration history yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'CompoundStatus'
      AND n.nspname = 'public'
  ) THEN
    ALTER TYPE "public"."CompoundStatus" ADD VALUE IF NOT EXISTS 'OPEN';
  END IF;
END $$;
