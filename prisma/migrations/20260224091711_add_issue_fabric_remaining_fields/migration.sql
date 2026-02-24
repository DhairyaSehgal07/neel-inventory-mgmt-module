-- CreateTable
CREATE TABLE "issue_fabrics" (
    "id" SERIAL NOT NULL,
    "fabricId" INTEGER NOT NULL,
    "lengthIssued" DOUBLE PRECISION NOT NULL,
    "widthIssued" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fabricLengthBeforeIssuance" DOUBLE PRECISION NOT NULL,
    "fabricWidthBeforeIssuance" DOUBLE PRECISION NOT NULL,
    "fabricLengthRemaining" DOUBLE PRECISION NOT NULL,
    "fabricWidthRemaining" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "issue_fabrics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "issue_fabrics" ADD CONSTRAINT "issue_fabrics_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "fabrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_fabrics" ADD CONSTRAINT "issue_fabrics_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
