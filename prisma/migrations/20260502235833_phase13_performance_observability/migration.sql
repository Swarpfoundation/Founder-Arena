-- CreateIndex
CREATE INDEX "employees_startupId_idx" ON "employees"("startupId");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "founder_achievements_founderProfileId_idx" ON "founder_achievements"("founderProfileId");

-- CreateIndex
CREATE INDEX "leaderboard_entries_userId_idx" ON "leaderboard_entries"("userId");

-- CreateIndex
CREATE INDEX "leaderboard_entries_startupId_idx" ON "leaderboard_entries"("startupId");

-- CreateIndex
CREATE INDEX "leaderboard_entries_season_category_idx" ON "leaderboard_entries"("season", "category");

-- CreateIndex
CREATE INDEX "leaderboard_entries_score_idx" ON "leaderboard_entries"("score");

-- CreateIndex
CREATE INDEX "market_data_runs_status_idx" ON "market_data_runs"("status");

-- CreateIndex
CREATE INDEX "market_data_runs_mode_idx" ON "market_data_runs"("mode");

-- CreateIndex
CREATE INDEX "market_data_runs_startedAt_idx" ON "market_data_runs"("startedAt");

-- CreateIndex
CREATE INDEX "market_events_marketSnapshotId_idx" ON "market_events"("marketSnapshotId");

-- CreateIndex
CREATE INDEX "market_signals_dataRunId_idx" ON "market_signals"("dataRunId");

-- CreateIndex
CREATE INDEX "market_signals_signalType_idx" ON "market_signals"("signalType");

-- CreateIndex
CREATE INDEX "market_signals_publishedAt_idx" ON "market_signals"("publishedAt");

-- CreateIndex
CREATE INDEX "market_snapshots_isActive_idx" ON "market_snapshots"("isActive");

-- CreateIndex
CREATE INDEX "market_snapshots_month_idx" ON "market_snapshots"("month");

-- CreateIndex
CREATE INDEX "simulation_months_startupId_idx" ON "simulation_months"("startupId");

-- CreateIndex
CREATE INDEX "simulation_months_monthNumber_idx" ON "simulation_months"("monthNumber");

-- CreateIndex
CREATE INDEX "startups_userId_idx" ON "startups"("userId");

-- CreateIndex
CREATE INDEX "startups_status_idx" ON "startups"("status");

-- CreateIndex
CREATE INDEX "startups_createdAt_idx" ON "startups"("createdAt");

-- CreateIndex
CREATE INDEX "term_sheets_startupId_idx" ON "term_sheets"("startupId");

-- CreateIndex
CREATE INDEX "vc_reviews_startupId_idx" ON "vc_reviews"("startupId");
