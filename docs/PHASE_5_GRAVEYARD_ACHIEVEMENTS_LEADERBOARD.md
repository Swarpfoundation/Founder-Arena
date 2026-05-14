# Phase 5: Graveyard, Achievements, Leaderboard & Public Pages

## Overview

Phase 5 makes Founder Arena replayable and competitive by adding:
- Startup Graveyard with real dead startups
- Founder Achievement system (15+ achievements)
- Improved Leaderboard with category/season filters
- Public/shareable startup result pages
- Founder profile with XP, level, and progression
- Centralized finalization service

## Data Model Changes

Migration: `20260502210000_phase5_graveyard_achievements_leaderboard`

### New Model: FounderProfile
- `userId` (unique), `xp`, `level`
- `totalStartups`, `completedStartups`, `deadStartups`
- `bestValuation`, `bestScore`
- Auto-created lazily when needed

### Updated: FounderAchievement
- Renamed relation from `userId` → `founderProfileId`
- Added `key`, `icon`, `metadata`
- `@@unique([founderProfileId, key])` prevents duplicates

### Updated: LeaderboardEntry
- Added `userId`, `outcome`, `season` (default "beta-season-1")
- Added `completedAt`, `metadata`
- Sector-specific entries created automatically on finalization

### Updated: Startup
- Added `publicSlug` (unique), `finalOutcome`, `finalSummary`
- Added `finalScore`, `completedAt`, `deathReason`

## Core Services

### `lib/game/finalize-startup.ts`
Centralized, idempotent finalization:
- Calculates final outcome and score
- Generates stable public slug
- Creates/updates leaderboard entries (overall + sector)
- Updates founder profile stats and XP
- Evaluates achievements
- Stores final summary on Startup

### `lib/game/achievements.ts`
15 achievements with XP rewards:
1. First Pitch (50 XP)
2. Funded Founder (100 XP)
3. First Hire (75 XP)
4. Survived 12 Months (200 XP)
5. Breakout Startup (500 XP)
6. Efficient Operator (300 XP)
7. Cockroach Founder (250 XP)
8. Revenue Machine (400 XP)
9. Unicorn Dream (350 XP)
10. Team Builder (150 XP)
11. Lean Startup (300 XP)
12. Graveyard Entry (50 XP)
13. Compliance Minded (150 XP)
14. Product Shipper (200 XP)
15. Investor Favorite (250 XP)

Hooks:
- `evaluateAchievementsForPitch` — on pitch submission
- `evaluateAchievementsForFunding` — on term sheet acceptance
- `evaluateAchievementsForHire` — on employee hire
- `evaluateAchievementsOnFinalization` — on simulation end

### `lib/game/founder-progression.ts`
- `calculateLevel` — threshold-based levels (1–10+)
- `addXP` — grants XP and recalculates level
- `updateFounderStatsAfterFinalization` — updates best score/valuation, counts

### `lib/game/leaderboard.ts`
- `createOrUpdateLeaderboardEntry` — idempotent upsert
- `getLeaderboardEntries` — supports category/season/sector filters

### `lib/game/public-slug.ts`
- `slugify` — pure string slugification
- `generatePublicSlug` — DB-checked unique slug

## Routes

### New
- `/profile` — Founder profile with XP, achievements, history, leaderboard placements
- `/s/[slug]` — Public startup result page (no auth required)

### Updated
- `/graveyard` — Real dead startups with death reasons, funding, team info
- `/leaderboard` — Category tabs (Global, AI, Fintech, Web3, Gaming, SaaS, Healthcare)
- `/dashboard` — Founder level/XP bar, recent achievements, best score
- `/startup/[id]` — Final result card in sidebar for completed/dead startups
- `/startup/[id]/operate` — Final report with public link, graveyard/leaderboard CTAs

## Finalization Flow

1. Monthly simulation detects death or month 12 completion
2. `runMonthlySimulationAction` calls `finalizeStartup(startupId)`
3. `finalizeStartup`:
   - Loads startup with history, employees, funding rounds
   - Skips if already finalized (idempotent)
   - Classifies outcome + calculates scores
   - Generates public slug
   - Updates Startup record
   - Creates leaderboard entries (overall + sector)
   - Updates FounderProfile stats
   - Grants base + outcome bonus XP
   - Unlocks achievements
4. Revalidates all affected paths

## Scoring

- `classifyFinalOutcome` returns: DEAD, ZOMBIE, BREAKOUT, SERIES_A_READY, SEED_READY, SMALL_PROFITABLE, ACQUISITION_TARGET
- `calculateLeaderboardScore`: base from valuation/revenue/survival × outcome multiplier
- BREAKOUT = 3.0×, SERIES_A_READY = 2.5×, ACQUISITION_TARGET = 2.0×, etc.

## Manual Test Path

1. Create startup → verify profile exists, totalStartups increments
2. Build pitch → verify "First Pitch" achievement
3. Submit VC review
4. Accept terms → verify "Funded Founder" achievement
5. Hire employee → verify "First Hire" achievement
6. Run months until death or completion
7. Verify finalization: outcome, slug, leaderboard entry
8. Verify profile XP/level updated, achievements shown
9. If dead: verify graveyard entry, public page shows death reason
10. If completed: verify leaderboard placement, public page accessible

## Tests

`tests/unit/game.test.ts` — 26 tests covering:
- XP/level calculation
- Achievement definitions and uniqueness
- Slug generation
- Final outcome classification
- Leaderboard scoring
- Graveyard eligibility
- Duplicate achievement prevention

Total test suite: 93 tests, all passing.

## Known Limitations

- Season is hardcoded to "beta-season-1" — no admin season management yet
- Public pages show limited detail (no full monthly history graph)
- Achievement hooks are event-based but not exhaustive (e.g., no real-time mid-simulation achievement for revenue milestones)
- FounderProfile is lazily created — very first request may be slightly slower
- Demo-user auth means all achievements/leaderboard entries belong to one user in local dev

## Next Phase Recommendations

1. **Social/Multiplayer**: Founder vs Founder challenges, shared sectors, rival startups
2. **Advanced Simulation**: Events that require team decisions, market pivots, second funding rounds
3. **Visual Polish**: Charts for monthly history, animated achievement unlocks, avatar system
4. **Content Expansion**: More sectors, more employee roles, seasonal events
