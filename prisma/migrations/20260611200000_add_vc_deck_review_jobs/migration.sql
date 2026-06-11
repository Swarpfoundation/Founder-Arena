-- CreateTable
CREATE TABLE "vc_deck_review_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "deckStorageKey" TEXT NOT NULL,
    "deckSha256" TEXT NOT NULL,
    "deckFileName" TEXT NOT NULL,
    "deckSizeBytes" INTEGER NOT NULL,
    "deckPageCount" INTEGER,
    "extractedText" TEXT,
    "extractedTextSha256" TEXT,
    "extractedTextTruncated" BOOLEAN NOT NULL DEFAULT false,
    "manualNotes" TEXT,
    "selectedFirmIds" JSONB NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "firmReviews" JSONB,
    "aggregateReview" JSONB,
    "errorCategory" TEXT,
    "safeErrorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vc_deck_review_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vc_deck_review_jobs_userId_idx" ON "vc_deck_review_jobs"("userId");

-- CreateIndex
CREATE INDEX "vc_deck_review_jobs_startupId_idx" ON "vc_deck_review_jobs"("startupId");

-- CreateIndex
CREATE INDEX "vc_deck_review_jobs_status_idx" ON "vc_deck_review_jobs"("status");

-- CreateIndex
CREATE INDEX "vc_deck_review_jobs_createdAt_idx" ON "vc_deck_review_jobs"("createdAt");

-- AddForeignKey
ALTER TABLE "vc_deck_review_jobs" ADD CONSTRAINT "vc_deck_review_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vc_deck_review_jobs" ADD CONSTRAINT "vc_deck_review_jobs_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

