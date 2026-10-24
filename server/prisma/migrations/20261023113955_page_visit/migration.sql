-- CreateTable
CREATE TABLE "PageVisit" (
    "day" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "entries" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("day","path","source")
);
