-- Drop old term sheet and funding round tables (database is empty after reset)
DROP TABLE IF EXISTS "term_sheets" CASCADE;
DROP TABLE IF EXISTS "funding_rounds" CASCADE;

-- Create new TermSheet table
CREATE TABLE "term_sheets" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "vcReviewId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "proposedAmount" INTEGER NOT NULL,
    "proposedEquity" DECIMAL(5,2) NOT NULL,
    "preMoneyValuation" INTEGER NOT NULL,
    "postMoneyValuation" INTEGER NOT NULL,
    "founderSalaryCap" INTEGER,
    "boardSeat" BOOLEAN NOT NULL DEFAULT false,
    "boardObserver" BOOLEAN NOT NULL DEFAULT false,
    "liquidationPreference" DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    "proRataRights" BOOLEAN NOT NULL DEFAULT false,
    "milestoneRequirements" TEXT,
    "investorNotes" TEXT,
    "founderCounter" JSONB,
    "negotiationHistory" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "term_sheets_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "term_sheets_vcReviewId_key" ON "term_sheets"("vcReviewId");

-- Create new FundingRound table
CREATE TABLE "funding_rounds" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "vcReviewId" TEXT,
    "termSheetId" TEXT,
    "roundType" TEXT NOT NULL DEFAULT 'pre_seed',
    "amountRaised" INTEGER,
    "equitySold" DECIMAL(5,2),
    "preMoneyValuation" INTEGER,
    "postMoneyValuation" INTEGER,
    "investorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_rounds_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "funding_rounds_vcReviewId_key" ON "funding_rounds"("vcReviewId");
CREATE UNIQUE INDEX "funding_rounds_termSheetId_key" ON "funding_rounds"("termSheetId");

-- Add foreign keys
ALTER TABLE "term_sheets" ADD CONSTRAINT "term_sheets_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "term_sheets" ADD CONSTRAINT "term_sheets_vcReviewId_fkey" FOREIGN KEY ("vcReviewId") REFERENCES "vc_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_vcReviewId_fkey" FOREIGN KEY ("vcReviewId") REFERENCES "vc_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_termSheetId_fkey" FOREIGN KEY ("termSheetId") REFERENCES "term_sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
