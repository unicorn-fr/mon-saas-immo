-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "splitId" TEXT;

-- CreateIndex
CREATE INDEX "Expense_splitId_idx" ON "Expense"("splitId");
