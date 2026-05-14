# Phase 6: Market Intelligence v1

## Overview

Phase 6 adds a structured market intelligence system that makes the game world feel dynamic and responsive to macro conditions. Startups in different sectors are affected differently by the same world state, creating strategic depth and replayability.

## Architecture

```
lib/market/
├── types.ts          # MarketScenario, StartupExposure, MarketImpactResult
├── scenarios.ts      # 12 deterministic scenario templates
├── exposure.ts       # deriveStartupMarketExposure()
├── impact-engine.ts  # calculateMarketImpactForStartup()
└── snapshot-service.ts # DB seeding, querying, timeline
```

## Data Model Changes

Migration: `20260502220000_phase6_market_intelligence_v1`

- `MarketSnapshot`: Added `scenarioKey` (String?), `metadata` (Json?) for macro scores
- `MarketEvent`: Added `severity` (Int @default(50)), `metadata` (Json?) for gameplay effects
- `SimulationMonth`: Added `metadata` (Json?) to store computed impact details

## Scenario Library (12 Scenarios)

| Key | Name | Condition | Severity |
|-----|------|-----------|----------|
| neutral_market | Steady State | neutral | 20 |
| ai_boom | AI Boom | bullish | 70 |
| high_interest_rates | Tight Money | bearish | 75 |
| geopolitical_conflict | Global Tensions | bearish | 80 |
| crypto_bull_market | Crypto Bull Run | bullish | 65 |
| crypto_bear_market | Crypto Winter | bearish | 85 |
| fintech_regulatory_crackdown | Regulatory Storm | bearish | 70 |
| consumer_recession | Consumer Recession | bearish | 75 |
| enterprise_software_budget_expansion | Enterprise Expansion | bullish | 60 |
| supply_chain_crisis | Supply Chain Crisis | bearish | 70 |
| energy_price_spike | Energy Shock | bearish | 65 |
| healthcare_ai_tailwind | Healthcare AI Tailwind | bullish | 60 |

Each scenario defines:
- Macro scores (VC climate, AI demand, crypto sentiment, regulation, inflation, geopolitical risk, consumer/enterprise spending, supply chain, energy prices)
- Sector modifiers with gameplay deltas
- Event name, description, severity, affected sectors/regions

## Exposure Engine

`deriveStartupMarketExposure(startup)` analyzes:
- Sector keywords (AI, Fintech, Web3, Healthcare, SaaS, Gaming, etc.)
- Region (Europe, Asia, Latin America have different risk profiles)
- Business model and solution keywords

Returns:
- Macro exposure scores (0-100)
- Sector-specific exposures
- Tailwinds and headwinds list
- Human-readable explanation

## Impact Engine

`calculateMarketImpactForStartup(startupSector, startupRegion, exposure, scenario, currentMonth)`

Rules:
1. Sector match → apply sector modifier deltas
2. Macro-driven effects based on exposure:
   - AI trend × AI demand
   - Crypto cycle × crypto sentiment
   - Regulation × regulation pressure
   - Consumer/enterprise demand × spending
   - Supply chain × supply chain pressure
   - Energy prices × energy sensitivity
   - Geopolitical risk × geopolitical exposure
   - VC climate affects all startups
3. Deterministic month seed adds slight variation
4. All deltas clamped to safe bounds

Output:
- demandDelta, revenueDelta, burnDelta, valuationDelta, investorDelta, riskDelta
- marketScoreDelta, difficultyScore
- explanation and affectedBecause array

## Simulation Integration

`simulateMonth` now accepts optional `startupProfile` and `currentMonth`. When a profile is provided and the snapshot has a `scenarioKey`, the Phase 6 engine is used. Otherwise, it falls back to the Phase 3 simple market impact.

The simulation action (`lib/actions/simulation.ts`) passes the startup profile and stores computed impact metadata on each `SimulationMonth`.

## Leaderboard Difficulty Bonus

`finalizeStartup` computes average difficulty across all simulation months:
- `difficultyBonus = round((avgDifficulty - 50) * 0.5)`
- Startups surviving harsh markets get up to ~22 extra points
- Bonus is stored in leaderboard metadata alongside `marketScenario` and `marketDifficulty`

## AI Integration

### Startup Creation
- `createStartupAction` computes exposure after AI analysis
- Enriches `aiAnalysis` JSON with: `marketExposure`, `currentMarketScenario`, `tailwinds`, `headwinds`, `sectorTimingScore`, `regionRiskNotes`

### VC Review
- `submitPitchForReviewAction` enriches the review with market timing context
- Appends current scenario, tailwinds, headwinds to `marketTiming`
- Adds `investorClimateImpact` (Favorable/Unfavorable/Neutral)
- Adds `riskAdjustedRecommendation`

## Pages

### `/market` (new)
- Current scenario card with condition badge
- Event card with severity and type
- 8 macro score cards (VC Climate, AI Demand, Crypto Sentiment, etc.)
- Hot sectors and Cold sectors
- Scenario timeline (12 months)

### `/startup/[id]`
- Market Exposure card showing tailwinds, headwinds, explanation
- Link to `/market`

### `/startup/[id]/operate`
- Monthly history cards show Market Impact section with explanation and difficulty score

## Seed Data

`prisma/seed.ts` uses `seedMarketSnapshotsV1()` to create 12 rich snapshots with events.
Safe to rerun — uses `upsert`.

## Tests

`tests/unit/market.test.ts` — 17 tests covering:
- Scenario library validity (12+ scenarios, unique keys, required fields)
- Exposure derivation per sector (AI, Fintech, Web3, Healthcare)
- Bounded market impact
- Positive vs negative scenario effects
- Deterministic month behavior
- Difficulty score ranges
- Bull vs bear difficulty comparison

Total test suite: 110 tests, all passing.

## How to Connect Real APIs Later

1. Add `source: "api"` to snapshot metadata
2. Create `lib/market/api-adapter.ts` with interface for news/market data providers
3. Replace `seedMarketSnapshotsV1` with a polling/cron job that:
   - Fetches real macro data
   - Maps it to scenario templates
   - Creates new snapshots with `source: "api"`
4. The impact engine and exposure engine remain unchanged — they consume snapshots, regardless of source

## Known Limitations

- Scenarios are static templates — no real-time data yet
- Month-based snapshot selection is simple (cycling through 12 months)
- AI provider interface was not modified; market context is appended post-generation
- Some sector/region matching is fuzzy string-based
- No visual charts for market timeline yet

## Next Phase Recommendations

1. **Real Market Data Integration**: Connect to news APIs, sentiment analysis, or financial data providers
2. **Market Events During Simulation**: Random mid-simulation events that require founder decisions
3. **Competitive Multiplayer**: Founders in same sector competing under same market conditions
4. **Advanced Analytics**: Market correlation charts, sector rotation visualization
