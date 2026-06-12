-- Phase 25C: AI investor due-diligence missions attached to private deck review jobs.

ALTER TABLE "vc_deck_review_jobs"
  ADD COLUMN "missionGenerationStatus" TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN "missionGenerationErrorCategory" TEXT,
  ADD COLUMN "missionGenerationSafeErrorMessage" TEXT,
  ADD COLUMN "investorMissions" JSONB,
  ADD COLUMN "roadmapSummary" JSONB;

CREATE INDEX "vc_deck_review_jobs_missionGenerationStatus_idx" ON "vc_deck_review_jobs"("missionGenerationStatus");
