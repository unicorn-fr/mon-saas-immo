-- CreateTable
CREATE TABLE "IrlPoint" (
    "quarter" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "publishedAt" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IrlPoint_pkey" PRIMARY KEY ("quarter")
);
