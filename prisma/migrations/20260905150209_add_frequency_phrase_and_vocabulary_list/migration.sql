-- AlterTable
ALTER TABLE "FollowUpModule" ADD COLUMN     "instructionsUr" TEXT,
ADD COLUMN     "purposeUr" TEXT;

-- CreateTable
CREATE TABLE "FrequencyPhrase" (
    "id" TEXT NOT NULL,
    "frequencyCode" TEXT NOT NULL,
    "phraseEnglish" TEXT NOT NULL,
    "phraseUrdu" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedBy" TEXT,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "FrequencyPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyList" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "chipsBySystem" JSONB,
    "flatItems" JSONB,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "publishedBy" TEXT,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "VocabularyList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FrequencyPhrase_frequencyCode_idx" ON "FrequencyPhrase"("frequencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyList_key_key" ON "VocabularyList"("key");
