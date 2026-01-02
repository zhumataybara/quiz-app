/*
  Warnings:

  - You are about to drop the column `originalTitle` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `posterPath` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `tmdbId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `tmdbType` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Question` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "CorrectAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "tmdbType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "year" INTEGER,
    "posterPath" TEXT,
    CONSTRAINT "CorrectAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing question data to CorrectAnswer table
INSERT INTO "CorrectAnswer" ("id", "questionId", "tmdbId", "tmdbType", "title", "originalTitle", "year", "posterPath")
SELECT 
    lower(hex(randomblob(16))), -- Generate new ID
    "id" as "questionId",
    "tmdbId",
    "tmdbType",
    "title",
    "originalTitle",
    "year",
    "posterPath"
FROM "Question"
WHERE "tmdbId" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("createdAt", "id", "orderIndex", "points", "roundId") SELECT "createdAt", "id", "orderIndex", "points", "roundId" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE INDEX "Question_roundId_idx" ON "Question"("roundId");
CREATE UNIQUE INDEX "Question_roundId_orderIndex_key" ON "Question"("roundId", "orderIndex");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CorrectAnswer_questionId_idx" ON "CorrectAnswer"("questionId");

-- CreateIndex
CREATE INDEX "CorrectAnswer_tmdbId_idx" ON "CorrectAnswer"("tmdbId");
