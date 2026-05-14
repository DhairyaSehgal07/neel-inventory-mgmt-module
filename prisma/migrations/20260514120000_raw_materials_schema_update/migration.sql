-- Align raw_materials with prisma/schema.prisma (inventory fields, status, rawMaterial rename).
CREATE TYPE "RawMaterialStatus" AS ENUM ('IN_USE', 'ASSIGNED', 'OPEN', 'PACKED', 'CONSUMED', 'REJECTED', 'TRADED');

ALTER TABLE "raw_materials" DROP COLUMN "material",
DROP COLUMN "quantity",
DROP COLUMN "weight",
ADD COLUMN     "availableBags" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "availableWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "purchasedBags" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "purchasedWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rawMaterial" TEXT NOT NULL,
ADD COLUMN     "status" "RawMaterialStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "weightPerUnit" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "grade" DROP NOT NULL,
ALTER COLUMN "vendor" DROP NOT NULL;

CREATE UNIQUE INDEX "raw_materials_materialCode_key" ON "raw_materials"("materialCode");

CREATE INDEX "raw_materials_rawMaterial_idx" ON "raw_materials"("rawMaterial");

CREATE INDEX "raw_materials_vendor_idx" ON "raw_materials"("vendor");
