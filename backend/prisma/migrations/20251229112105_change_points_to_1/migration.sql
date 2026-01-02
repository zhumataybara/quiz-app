-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "tmdbType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "year" INTEGER,
    "posterPath" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("createdAt", "id", "orderIndex", "originalTitle", "points", "posterPath", "roundId", "title", "tmdbId", "tmdbType", "year") SELECT "createdAt", "id", "orderIndex", "originalTitle", "points", "posterPath", "roundId", "title", "tmdbId", "tmdbType", "year" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE INDEX "Question_roundId_idx" ON "Question"("roundId");
CREATE INDEX "Question_tmdbId_idx" ON "Question"("tmdbId");
CREATE UNIQUE INDEX "Question_roundId_orderIndex_key" ON "Question"("roundId", "orderIndex");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
