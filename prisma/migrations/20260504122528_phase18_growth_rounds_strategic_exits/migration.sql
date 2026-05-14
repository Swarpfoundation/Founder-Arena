-- CreateTable
CREATE TABLE "growth_offers" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "offerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "headline" TEXT NOT NULL,
    "amount" INTEGER,
    "equityPercent" DECIMAL(5,2),
    "acquisitionPrice" INTEGER,
    "valuation" INTEGER,
    "terms" JSONB,
    "benefits" JSONB,
    "risks" JSONB,
    "counterTerms" JSONB,
    "expiresAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "growth_offers_startupId_idx" ON "growth_offers"("startupId");

-- AddForeignKey
ALTER TABLE "growth_offers" ADD CONSTRAINT "growth_offers_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
