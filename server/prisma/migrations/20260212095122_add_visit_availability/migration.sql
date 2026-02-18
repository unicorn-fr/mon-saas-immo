-- CreateEnum
CREATE TYPE "DateOverrideType" AS ENUM ('BLOCKED', 'EXTRA');

-- CreateTable
CREATE TABLE "visit_availability_slots" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_date_overrides" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "DateOverrideType" NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_date_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visit_availability_slots_propertyId_idx" ON "visit_availability_slots"("propertyId");

-- CreateIndex
CREATE INDEX "visit_date_overrides_propertyId_idx" ON "visit_date_overrides"("propertyId");

-- CreateIndex
CREATE INDEX "visit_date_overrides_date_idx" ON "visit_date_overrides"("date");

-- AddForeignKey
ALTER TABLE "visit_availability_slots" ADD CONSTRAINT "visit_availability_slots_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_date_overrides" ADD CONSTRAINT "visit_date_overrides_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
