-- Add new columns (nullable first for backfill)
ALTER TABLE "fabrics" ADD COLUMN "fabricLengthInitial" DOUBLE PRECISION;
ALTER TABLE "fabrics" ADD COLUMN "fabricLengthCurrent" DOUBLE PRECISION;
ALTER TABLE "fabrics" ADD COLUMN "fabricWidthInitial" DOUBLE PRECISION;
ALTER TABLE "fabrics" ADD COLUMN "fabricWidthCurrent" DOUBLE PRECISION;

-- Backfill from existing fabricLength and fabric_widths
UPDATE "fabrics" f
SET
  "fabricLengthInitial" = f."fabricLength",
  "fabricLengthCurrent" = f."fabricLength",
  "fabricWidthInitial" = fw."value",
  "fabricWidthCurrent" = fw."value"
FROM "fabric_widths" fw
WHERE f."fabricWidthId" = fw."id";

-- Set defaults for any rows that might have missed (e.g. orphaned fabricWidthId)
UPDATE "fabrics"
SET
  "fabricLengthInitial" = COALESCE("fabricLengthInitial", 0),
  "fabricLengthCurrent" = COALESCE("fabricLengthCurrent", 0),
  "fabricWidthInitial" = COALESCE("fabricWidthInitial", 0),
  "fabricWidthCurrent" = COALESCE("fabricWidthCurrent", 0)
WHERE "fabricLengthInitial" IS NULL OR "fabricWidthInitial" IS NULL;

-- Make columns non-nullable
ALTER TABLE "fabrics" ALTER COLUMN "fabricLengthInitial" SET NOT NULL;
ALTER TABLE "fabrics" ALTER COLUMN "fabricLengthCurrent" SET NOT NULL;
ALTER TABLE "fabrics" ALTER COLUMN "fabricWidthInitial" SET NOT NULL;
ALTER TABLE "fabrics" ALTER COLUMN "fabricWidthCurrent" SET NOT NULL;

-- Drop old column
ALTER TABLE "fabrics" DROP COLUMN "fabricLength";
