-- CreateEnum
CREATE TYPE "RawMaterialHistoryAction" AS ENUM ('BALANCE_UPDATE', 'STATUS_CHANGE');

-- AlterTable
ALTER TABLE "raw_materials" ADD COLUMN "packedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "raw_materials_status_idx" ON "raw_materials"("status");

-- CreateTable
CREATE TABLE "raw_material_histories" (
    "id" SERIAL NOT NULL,
    "rawMaterialId" INTEGER NOT NULL,
    "actionType" "RawMaterialHistoryAction" NOT NULL,
    "performedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableBagsBefore" DOUBLE PRECISION,
    "availableBagsAfter" DOUBLE PRECISION,
    "availableWeightKgBefore" DOUBLE PRECISION,
    "availableWeightKgAfter" DOUBLE PRECISION,
    "statusBefore" "RawMaterialStatus",
    "statusAfter" "RawMaterialStatus",

    CONSTRAINT "raw_material_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_material_histories_rawMaterialId_createdAt_idx" ON "raw_material_histories"("rawMaterialId", "createdAt");

-- AddForeignKey
ALTER TABLE "raw_material_histories" ADD CONSTRAINT "raw_material_histories_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_histories" ADD CONSTRAINT "raw_material_histories_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill packedAt for existing PACKED rows (approximate: last update time)
UPDATE "raw_materials"
SET "packedAt" = "updatedAt"
WHERE "status" = 'PACKED' AND "packedAt" IS NULL;
