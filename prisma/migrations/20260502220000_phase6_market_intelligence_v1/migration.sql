-- Add new columns for market intelligence v1

ALTER TABLE "market_events"
ADD COLUMN "metadata" JSONB,
ADD COLUMN "severity" INTEGER NOT NULL DEFAULT 50;

ALTER TABLE "market_snapshots"
ADD COLUMN "metadata" JSONB,
ADD COLUMN "scenarioKey" TEXT;

ALTER TABLE "simulation_months"
ADD COLUMN "metadata" JSONB;
