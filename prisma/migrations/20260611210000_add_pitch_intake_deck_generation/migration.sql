-- Phase 25B: pitch intake modes, private startup profile context, generated deck jobs.

ALTER TABLE "vc_deck_review_jobs"
  ADD COLUMN "reviewInputType" TEXT NOT NULL DEFAULT 'pdf_upload',
  ALTER COLUMN "deckStorageKey" DROP NOT NULL,
  ALTER COLUMN "deckSha256" DROP NOT NULL,
  ALTER COLUMN "deckFileName" DROP NOT NULL,
  ALTER COLUMN "deckSizeBytes" SET DEFAULT 0,
  ADD COLUMN "startupProfile" JSONB,
  ADD COLUMN "generatedDeck" JSONB,
  ADD COLUMN "sourceSummary" TEXT,
  ADD COLUMN "accessConsumedAt" TIMESTAMP(3),
  ADD COLUMN "accessUsedCredit" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "vc_deck_review_jobs_reviewInputType_idx" ON "vc_deck_review_jobs"("reviewInputType");

CREATE TABLE "vc_deck_generation_jobs" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startupId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "requestText" TEXT NOT NULL,
  "startupProfile" JSONB,
  "generatedDeck" JSONB,
  "provider" TEXT,
  "model" TEXT,
  "errorCategory" TEXT,
  "safeErrorMessage" TEXT,
  "accessConsumedAt" TIMESTAMP(3),
  "accessUsedCredit" BOOLEAN NOT NULL DEFAULT false,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "vc_deck_generation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vc_deck_generation_jobs_userId_idx" ON "vc_deck_generation_jobs"("userId");
CREATE INDEX "vc_deck_generation_jobs_startupId_idx" ON "vc_deck_generation_jobs"("startupId");
CREATE INDEX "vc_deck_generation_jobs_status_idx" ON "vc_deck_generation_jobs"("status");
CREATE INDEX "vc_deck_generation_jobs_createdAt_idx" ON "vc_deck_generation_jobs"("createdAt");

ALTER TABLE "vc_deck_generation_jobs"
  ADD CONSTRAINT "vc_deck_generation_jobs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vc_deck_generation_jobs"
  ADD CONSTRAINT "vc_deck_generation_jobs_startupId_fkey"
  FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
