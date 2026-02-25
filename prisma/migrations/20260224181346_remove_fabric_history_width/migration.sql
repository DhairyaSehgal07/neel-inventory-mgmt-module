/*
  Warnings:

  - You are about to drop the `issue_fabrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FabricHistoryAction" AS ENUM ('ASSIGN', 'BALANCE_UPDATE');

-- DropForeignKey
ALTER TABLE "issue_fabrics" DROP CONSTRAINT "issue_fabrics_createdById_fkey";

-- DropForeignKey
ALTER TABLE "issue_fabrics" DROP CONSTRAINT "issue_fabrics_fabricId_fkey";

-- DropTable
DROP TABLE "issue_fabrics";

-- CreateTable
CREATE TABLE "fabric_histories" (
    "id" SERIAL NOT NULL,
    "fabricId" INTEGER NOT NULL,
    "actionType" "FabricHistoryAction" NOT NULL,
    "performedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignToBefore" TEXT,
    "assignToAfter" TEXT,
    "statusBefore" TEXT,
    "statusAfter" TEXT,
    "lengthBefore" DOUBLE PRECISION,
    "lengthAfter" DOUBLE PRECISION,

    CONSTRAINT "fabric_histories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fabric_histories" ADD CONSTRAINT "fabric_histories_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "fabrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_histories" ADD CONSTRAINT "fabric_histories_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
