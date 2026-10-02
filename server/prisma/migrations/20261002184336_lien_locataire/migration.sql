-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "tenantCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lease_tenantCode_key" ON "Lease"("tenantCode");

