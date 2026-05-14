-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "startups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'idea',
    "targetMarket" TEXT NOT NULL,
    "monetizationModel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "startups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pitch_decks" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "businessModel" TEXT NOT NULL,
    "traction" TEXT,
    "team" TEXT,
    "ask" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pitch_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vc_reviews" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "memo" TEXT NOT NULL,
    "scoreProblem" INTEGER,
    "scoreSolution" INTEGER,
    "scoreMarket" INTEGER,
    "scoreTeam" INTEGER,
    "scoreBusiness" INTEGER,
    "overallScore" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vc_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_rounds" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "vcReviewId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'pre_seed',
    "amountAsked" INTEGER NOT NULL,
    "amountOffered" INTEGER,
    "valuationPre" INTEGER,
    "valuationPost" INTEGER,
    "equityPercent" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "term_sheets" (
    "id" TEXT NOT NULL,
    "fundingRoundId" TEXT NOT NULL,
    "proposedValuation" INTEGER NOT NULL,
    "proposedAmount" INTEGER NOT NULL,
    "proposedEquity" DECIMAL(5,2) NOT NULL,
    "boardSeat" BOOLEAN NOT NULL DEFAULT false,
    "liquidationPreference" DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    "antiDilution" BOOLEAN NOT NULL DEFAULT false,
    "founderResponse" TEXT,
    "counterValuation" INTEGER,
    "counterAmount" INTEGER,
    "counterEquity" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'offered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "term_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_months" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "monthNumber" INTEGER NOT NULL,
    "cashStart" INTEGER NOT NULL,
    "cashEnd" INTEGER NOT NULL,
    "burnRate" INTEGER NOT NULL,
    "revenue" INTEGER NOT NULL,
    "runwayMonths" INTEGER NOT NULL,
    "productProgress" INTEGER NOT NULL,
    "userGrowth" INTEGER NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "marketingSpend" INTEGER NOT NULL,
    "productSpend" INTEGER NOT NULL,
    "hiringSpend" INTEGER NOT NULL,
    "marketCondition" TEXT NOT NULL,
    "eventsTriggered" TEXT[],
    "aiSummary" TEXT,
    "decisionsLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marketSnapshotId" TEXT,

    CONSTRAINT "simulation_months_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "salary" INTEGER NOT NULL,
    "hiredMonth" INTEGER NOT NULL,
    "firedMonth" INTEGER,
    "productivity" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_snapshots" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sectorTrends" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_events" (
    "id" TEXT NOT NULL,
    "marketSnapshotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sectorImpact" JSONB,
    "globalImpact" DECIMAL(4,3) NOT NULL DEFAULT 0.0,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "valuation" INTEGER NOT NULL,
    "revenue" INTEGER NOT NULL,
    "survivalMonths" INTEGER NOT NULL,
    "rank" INTEGER,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "founder_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "founder_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pitch_decks_startupId_key" ON "pitch_decks"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "funding_rounds_vcReviewId_key" ON "funding_rounds"("vcReviewId");

-- CreateIndex
CREATE UNIQUE INDEX "term_sheets_fundingRoundId_key" ON "term_sheets"("fundingRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "market_snapshots_month_key" ON "market_snapshots"("month");

-- AddForeignKey
ALTER TABLE "startups" ADD CONSTRAINT "startups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pitch_decks" ADD CONSTRAINT "pitch_decks_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vc_reviews" ADD CONSTRAINT "vc_reviews_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_vcReviewId_fkey" FOREIGN KEY ("vcReviewId") REFERENCES "vc_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "term_sheets" ADD CONSTRAINT "term_sheets_fundingRoundId_fkey" FOREIGN KEY ("fundingRoundId") REFERENCES "funding_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_months" ADD CONSTRAINT "simulation_months_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_months" ADD CONSTRAINT "simulation_months_marketSnapshotId_fkey" FOREIGN KEY ("marketSnapshotId") REFERENCES "market_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_events" ADD CONSTRAINT "market_events_marketSnapshotId_fkey" FOREIGN KEY ("marketSnapshotId") REFERENCES "market_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_achievements" ADD CONSTRAINT "founder_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
