-- Add Phase 3 simulation fields to SimulationMonth
ALTER TABLE "simulation_months"
ADD COLUMN "productProgressBefore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "valuation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "investorScoreBefore" INTEGER,
ADD COLUMN "investorScoreAfter" INTEGER,
ADD COLUMN "marketScoreBefore" INTEGER,
ADD COLUMN "marketScoreAfter" INTEGER,
ADD COLUMN "riskScoreBefore" INTEGER,
ADD COLUMN "riskScoreAfter" INTEGER,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN "eventTitle" TEXT,
ADD COLUMN "eventSummary" TEXT,
ADD COLUMN "decisions" JSONB;
