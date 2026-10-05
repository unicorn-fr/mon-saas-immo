-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "data" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'OWNER';
