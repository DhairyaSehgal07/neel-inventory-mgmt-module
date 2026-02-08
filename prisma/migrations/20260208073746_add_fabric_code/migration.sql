-- CreateTable
CREATE TABLE "fabric_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_strengths" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_strengths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_widths" (
    "id" SERIAL NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_widths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabrics" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fabricDate" TEXT NOT NULL,
    "fabricCode" TEXT NOT NULL,
    "fabricTypeId" INTEGER NOT NULL,
    "fabricStrengthId" INTEGER NOT NULL,
    "fabricWidthId" INTEGER NOT NULL,
    "fabricLength" DOUBLE PRECISION NOT NULL,
    "nameOfVendor" TEXT NOT NULL,
    "gsmObserved" DOUBLE PRECISION NOT NULL,
    "qrCode" TEXT NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "gsmCalculated" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fabric_types_name_key" ON "fabric_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fabric_strengths_name_key" ON "fabric_strengths"("name");

-- AddForeignKey
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_fabricTypeId_fkey" FOREIGN KEY ("fabricTypeId") REFERENCES "fabric_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_fabricStrengthId_fkey" FOREIGN KEY ("fabricStrengthId") REFERENCES "fabric_strengths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_fabricWidthId_fkey" FOREIGN KEY ("fabricWidthId") REFERENCES "fabric_widths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
