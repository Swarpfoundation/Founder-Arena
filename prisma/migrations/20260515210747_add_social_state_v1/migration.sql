-- CreateTable
CREATE TABLE "social_state" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "hype" INTEGER NOT NULL DEFAULT 20,
    "trust" INTEGER NOT NULL DEFAULT 50,
    "sentiment" INTEGER NOT NULL DEFAULT 50,
    "brandRisk" INTEGER NOT NULL DEFAULT 0,
    "viralMomentum" INTEGER NOT NULL DEFAULT 0,
    "founderReputation" INTEGER NOT NULL DEFAULT 30,
    "communityStrength" INTEGER NOT NULL DEFAULT 10,
    "feedItems" JSONB NOT NULL DEFAULT '[]',
    "actionsTaken" JSONB NOT NULL DEFAULT '[]',
    "lastActionMonth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_state_startupId_key" ON "social_state"("startupId");

-- AddForeignKey
ALTER TABLE "social_state" ADD CONSTRAINT "social_state_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
