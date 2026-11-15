-- AlterTable
ALTER TABLE "LoginToken" ADD COLUMN     "signup" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboarding" JSONB NOT NULL DEFAULT '{}';
