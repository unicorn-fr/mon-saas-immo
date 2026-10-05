-- CreateTable
CREATE TABLE "Access" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "memberId" TEXT,
    "role" TEXT NOT NULL,
    "propertyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inviteTokenHash" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Access_inviteTokenHash_key" ON "Access"("inviteTokenHash");

-- CreateIndex
CREATE INDEX "Access_ownerId_idx" ON "Access"("ownerId");

-- CreateIndex
CREATE INDEX "Access_memberId_idx" ON "Access"("memberId");

-- AddForeignKey
ALTER TABLE "Access" ADD CONSTRAINT "Access_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Access" ADD CONSTRAINT "Access_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
