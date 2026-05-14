-- Hardening: add unique constraints to prevent race-condition duplicates.
-- Safe to apply to a database with existing clean data.
-- If duplicate rows exist, deduplicate first before running.

-- SimulationMonth: one month record per startup per month number
ALTER TABLE "simulation_months" ADD CONSTRAINT "simulation_months_startupId_monthNumber_key" UNIQUE ("startupId", "monthNumber");

-- UsageLedger: one ledger row per user/action/period (enables safe upsert)
ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_userId_actionType_periodStart_periodEnd_key" UNIQUE ("userId", "actionType", "periodStart", "periodEnd");

-- LeaderboardEntry: one entry per startup/category/season (enables safe upsert)
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_startupId_category_season_key" UNIQUE ("startupId", "category", "season");
