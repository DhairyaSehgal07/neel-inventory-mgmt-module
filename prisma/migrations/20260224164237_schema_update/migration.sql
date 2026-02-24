/*
  Warnings:

  - The `status` column on the `fabrics` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FabricStatus" AS ENUM ('PACKED', 'IN_USE', 'CLOSED', 'OPEN', 'REJECTED', 'TRADED');

-- AlterTable
ALTER TABLE "fabrics" DROP COLUMN "status",
ADD COLUMN     "status" "FabricStatus";
