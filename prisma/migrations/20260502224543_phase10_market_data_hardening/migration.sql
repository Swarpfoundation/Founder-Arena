-- AlterTable
ALTER TABLE "market_signals" ADD COLUMN     "dataRunId" TEXT;

-- AlterTable
ALTER TABLE "market_snapshots" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "market_signals" ADD CONSTRAINT "market_signals_dataRunId_fkey" FOREIGN KEY ("dataRunId") REFERENCES "market_data_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
