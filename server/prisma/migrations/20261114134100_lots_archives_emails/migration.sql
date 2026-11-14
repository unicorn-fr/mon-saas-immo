-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaseId" TEXT,
    "tenantId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'OTHER',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_userId_sentAt_idx" ON "EmailLog"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "EmailLog_tenantId_idx" ON "EmailLog"("tenantId");

-- CreateIndex
CREATE INDEX "EmailLog_leaseId_idx" ON "EmailLog"("leaseId");

-- CreateIndex
CREATE INDEX "Property_parentId_idx" ON "Property"("parentId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
