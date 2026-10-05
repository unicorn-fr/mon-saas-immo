-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "structureId" TEXT;

-- CreateTable
CREATE TABLE "Structure" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Structure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Structure_userId_idx" ON "Structure"("userId");

-- CreateIndex
CREATE INDEX "Property_structureId_idx" ON "Property"("structureId");

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
