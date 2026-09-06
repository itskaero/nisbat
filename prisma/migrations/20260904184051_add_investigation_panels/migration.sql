-- CreateTable
CREATE TABLE "InvestigationPanel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "tests" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedBy" TEXT,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "InvestigationPanel_pkey" PRIMARY KEY ("id")
);
