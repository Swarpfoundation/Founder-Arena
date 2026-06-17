-- Backend-26C: private structured pitch deck draft input for AI review jobs.

ALTER TABLE "vc_deck_review_jobs"
  ADD COLUMN "structuredDeck" JSONB;
