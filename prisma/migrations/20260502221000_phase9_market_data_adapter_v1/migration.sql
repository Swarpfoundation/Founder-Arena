-- CreateTable MarketSignal
CREATE TABLE "market_signals" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "url" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signalType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 50,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "sectors" JSONB,
    "regions" JSONB,
    "effects" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex MarketSignal.sourceId
CREATE UNIQUE INDEX "market_signals_sourceId_key" ON "market_signals"("sourceId");

-- CreateTable MarketDataRun
CREATE TABLE "market_data_runs" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'static',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "signalsFetched" INTEGER NOT NULL DEFAULT 0,
    "signalsStored" INTEGER NOT NULL DEFAULT 0,
    "snapshotId" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_data_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex MarketDataRun.snapshotId
CREATE UNIQUE INDEX "market_data_runs_snapshotId_key" ON "market_data_runs"("snapshotId");

-- AlterTable MarketSnapshot
ALTER TABLE "market_snapshots" ADD COLUMN "dataRunId" TEXT;

-- CreateIndex MarketSnapshot.dataRunId
CREATE UNIQUE INDEX "market_snapshots_dataRunId_key" ON "market_snapshots"("dataRunId");

-- AddForeignKey MarketSnapshot.dataRunId -> MarketDataRun.id
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_dataRunId_fkey" FOREIGN KEY ("dataRunId") REFERENCES "market_data_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
