-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "formCode" TEXT,
ADD COLUMN     "formSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_formCode_key" ON "Tenant"("formCode");

