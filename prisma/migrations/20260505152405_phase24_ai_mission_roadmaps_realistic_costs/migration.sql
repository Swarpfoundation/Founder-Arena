-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sequence" INTEGER NOT NULL,
    "monthStart" INTEGER,
    "monthEnd" INTEGER,
    "requiredRoles" JSONB,
    "optionalRoles" JSONB,
    "requiredCapabilities" JSONB,
    "estimatedCost" INTEGER NOT NULL DEFAULT 0,
    "monthlyCostDelta" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "successScore" INTEGER,
    "effects" JSONB,
    "aiSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "missions_startupId_idx" ON "missions"("startupId");

-- CreateIndex
CREATE INDEX "missions_status_idx" ON "missions"("status");

-- CreateIndex
CREATE INDEX "missions_sequence_idx" ON "missions"("sequence");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "startups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
