-- CreateTable: founder_profiles
CREATE TABLE "founder_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "totalStartups" INTEGER NOT NULL DEFAULT 0,
    "completedStartups" INTEGER NOT NULL DEFAULT 0,
    "deadStartups" INTEGER NOT NULL DEFAULT 0,
    "bestValuation" INTEGER NOT NULL DEFAULT 0,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "founder_profiles_userId_key" ON "founder_profiles"("userId");

-- AddForeignKey
ALTER TABLE "founder_profiles" ADD CONSTRAINT "founder_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create founder profiles for existing users
INSERT INTO "founder_profiles" ("id", "userId", "xp", "level", "totalStartups", "completedStartups", "deadStartups", "bestValuation", "bestScore", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", 0, 1, 0, 0, 0, 0, 0, NOW(), NOW()
FROM "users"
WHERE "id" NOT IN (SELECT "userId" FROM "founder_profiles");

-- DropForeignKey
ALTER TABLE "founder_achievements" DROP CONSTRAINT IF EXISTS "founder_achievements_userId_fkey";

-- AlterTable: founder_achievements
ALTER TABLE "founder_achievements" DROP COLUMN IF EXISTS "type",
DROP COLUMN IF EXISTS "userId",
ADD COLUMN "founderProfileId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
ADD COLUMN "icon" TEXT,
ADD COLUMN "key" TEXT NOT NULL DEFAULT 'legacy',
ADD COLUMN "metadata" JSONB;

-- Backfill founderProfileId for existing achievements
UPDATE "founder_achievements" fa
SET "founderProfileId" = fp."id"
FROM "founder_profiles" fp
WHERE fa."founderProfileId" = '00000000-0000-0000-0000-000000000000';

-- Remove temporary defaults
ALTER TABLE "founder_achievements" ALTER COLUMN "founderProfileId" DROP DEFAULT;
ALTER TABLE "founder_achievements" ALTER COLUMN "key" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "founder_achievements_founderProfileId_key_key" ON "founder_achievements"("founderProfileId", "key");

-- AddForeignKey
ALTER TABLE "founder_achievements" ADD CONSTRAINT "founder_achievements_founderProfileId_fkey" FOREIGN KEY ("founderProfileId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: leaderboard_entries
ALTER TABLE "leaderboard_entries"
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "metadata" JSONB,
ADD COLUMN "outcome" TEXT,
ADD COLUMN "season" TEXT NOT NULL DEFAULT 'beta-season-1',
ADD COLUMN "userId" TEXT;

-- AlterTable: startups
ALTER TABLE "startups"
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "deathReason" TEXT,
ADD COLUMN "finalOutcome" TEXT,
ADD COLUMN "finalScore" INTEGER,
ADD COLUMN "finalSummary" TEXT,
ADD COLUMN "publicSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "startups_publicSlug_key" ON "startups"("publicSlug");

-- Fix employees.name default (schema drift from earlier migration)
ALTER TABLE "employees" ALTER COLUMN "name" DROP DEFAULT;
