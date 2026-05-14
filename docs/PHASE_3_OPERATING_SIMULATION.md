# Phase 3: 12-Month Operating Simulation

## Implemented Flow

```
Funded startup
  → /startup/[id]/operate
    → Monthly decision form (1–3 actions)
      → Simulation engine (deterministic rules + market impact)
        → AI monthly summary
          → SimulationMonth stored
            → Startup metrics updated
              → Death/final outcome check
                → Leaderboard entry on completion
```

## What Was Implemented

### 1. Operating Dashboard (`/startup/[id]/operate`)
- **Locked state** if startup not funded — CTA to term sheet
- **Active state** shows:
  - Current month (e.g., Month 3 of 12)
  - Cash, monthly burn, revenue, valuation
  - Product progress, investor score, risk score
  - Current market conditions snapshot
  - Funding round details
- **Decision form** — interactive client component:
  - 1–3 actions selectable per month
  - Each action shows cost, burn impact, product/revenue deltas
  - Visual selection with order indicators
  - Validation: min 1, max 3, must afford total cost
- **Monthly history** — prior SimulationMonth cards with:
  - Cash, burn, revenue, product progress
  - Market events
  - AI-generated monthly summary
- **Final report** — displayed on death or month 12 completion:
  - Outcome classification
  - Months survived
  - Final valuation, revenue, cash
  - Founder score
  - Leaderboard score
  - CTAs to dashboard, leaderboard, or new startup

### 2. Decision System
`lib/simulation/decisions.ts`

12 decision options:
- Hire Engineering/Sales/Compliance contractors
- Increase Product Focus
- Launch Beta (requires productProgress >= 40)
- Spend on Marketing
- Cut Costs
- Improve Security
- Customer Interviews
- Enterprise Sales Push (requires productProgress >= 50)
- Delay Launch for Quality
- Fundraising Preparation

Each decision has:
- cashCost, burnDelta, productDelta, revenueDelta
- investorDelta, marketDelta, riskDelta
- Sector-specific boost multipliers
- Product progress gating for launch/enterprise actions

Validation:
- Min 1, max 3 actions
- Cannot select unaffordable actions
- Month 1 restrictions (no launch/enterprise)

### 3. Simulation Engine
`lib/simulation/engine.ts`

Pure functions:
- `getCurrentSimulationMonth(history)` — returns max month completed
- `calculateRunway(cash, burn)` — months until broke
- `applyMarketImpact(state, snapshot, sector)` — revenue/valuation/burn multipliers + deltas
- `simulateMonth(state, decisions, snapshot, sector)` — runs one month
- `checkDeathCondition(result, monthNumber)` — determines survival
- `classifyFinalOutcome(state, monthsSurvived, history)` — final classification
- `calculateLeaderboardScore(state, monthsSurvived, outcome)` — scoring formula

**Financial math:**
- `cashEnd = cashStart - totalCashCost - burnRate + revenue`
- `burnRate = (baseBurn + burnDeltas) * marketBurnMultiplier`
- `revenue = (baseRevenue + revenueDeltas) * marketRevenueMultiplier`
- `valuation = baseValuation * marketValuationMultiplier + investorDelta * 1000`
- Product progress clamped 0–100

**Death conditions:**
- cash <= 0 AND revenue < burn
- runway <= 0
- riskScore >= 95
- investorScore <= 10 AND cash < 2 months burn
- productProgress < 20 AND revenue < 5000 after month 9

**Final outcomes (month 12 or death):**
- DEAD — failed before month 12
- ZOMBIE — survived but weak metrics or no cash
- SMALL_PROFITABLE — small but profitable
- SEED_READY — good PMF with early revenue
- SERIES_A_READY — strong metrics for next round
- ACQUISITION_TARGET — valuable tech, limited revenue
- BREAKOUT — strong revenue + healthy unit economics

### 4. Market Impact
`lib/simulation/engine.ts` + `lib/market/snapshot.ts`

- Loads MarketSnapshot for current month from seeded data
- Condition multipliers: bullish (+8% revenue, +5% valuation), bearish (-8% revenue, -5% valuation)
- Sector-specific trend modifiers from `sectorTrends` JSON
- Market events applied with globalImpact and type (positive/negative)
- Fallback neutral snapshot if none found

### 5. Server Action
`lib/actions/simulation.ts`

`runMonthlySimulationAction(startupId, decisionIds)`:
1. Validates ownership and status
2. Checks month < 12
3. Validates decision selection
4. Loads market snapshot
5. Runs `simulateMonth`
6. Checks death condition
7. Calls AI `summarizeMonthlySimulation`
8. Creates SimulationMonth row
9. Updates Startup metrics
10. If final: computes outcome, creates leaderboard entry

### 6. AI Provider Update
Added `summarizeMonthlySimulation()` to `AIProvider`:
- **OpenAIProvider**: GPT-4o generates 2-3 sentence narrative
- **MockProvider**: Deterministic template based on cash change, burn, revenue, product, market

### 7. Leaderboard
`/leaderboard` now shows real `LeaderboardEntry` rows:
- Rank, startup name, sector, founder name
- Score, valuation, survival months
- Empty state with CTA

### 8. Dashboard & Profile Updates
- Dashboard cards show operating month progress and completion status
- Startup profile adaptive CTA now includes "Operate Company" for funded startups

## DB Schema / Migration Changes
Migration: `20260502193000_phase3_operating_simulation`

**SimulationMonth additions:**
- `productProgressBefore` (Int, default 0)
- `valuation` (Int, default 0)
- `investorScoreBefore`, `investorScoreAfter` (Int?)
- `marketScoreBefore`, `marketScoreAfter` (Int?)
- `riskScoreBefore`, `riskScoreAfter` (Int?)
- `status` (String, default "active")
- `eventTitle`, `eventSummary` (String?)
- `decisions` (Json?)

## Simulation Formulas

```
cashEnd = cashStart - sum(cashCost) - burnRate + revenue
burnRate = (monthlyBurn + sum(burnDelta)) * marketBurnMultiplier
revenue = (baseRevenue + sum(revenueDelta)) * marketRevenueMultiplier
valuation = baseValuation * marketValuationMultiplier + investorDelta * 1000
productProgress = clamp(base + sum(productDelta), 0, 100)
runway = cashEnd / max(burnRate, 1)
```

## Market Impact Rules

| Condition | Revenue | Valuation | Burn | Investor | Risk |
|-----------|---------|-----------|------|----------|------|
| Bullish   | +8%     | +5%       | +2%  | +2       | 0    |
| Neutral   | 0%      | 0%        | 0%   | 0        | 0    |
| Bearish   | -8%     | -5%       | -2%  | -3       | +3   |

Events add additional `globalImpact` to revenue and valuation.

## Outcome Rules

| Outcome            | Criteria                                      |
|--------------------|-----------------------------------------------|
| BREAKOUT           | Revenue > $100K, capitalEfficiency > 2        |
| SERIES_A_READY     | Revenue > $50K, valuation > $5M               |
| SEED_READY         | Revenue > $20K, productProgress >= 70%        |
| SMALL_PROFITABLE   | Revenue > 0, cash > 0                         |
| ACQUISITION_TARGET | Valuation > $3M, otherwise weak               |
| ZOMBIE             | Survived 12mo but cash <= 0 or weak metrics   |
| DEAD               | Died before month 12                          |

## How to Test Locally

1. Ensure DB is running: `docker start founder-arena-db`
2. Create startup → build pitch → submit review → accept term sheet
3. Visit `/startup/[id]/operate`
4. Select 1–3 decisions per month and run simulation
5. Continue for 12 months or until death
6. Verify leaderboard entry created on completion

Quick test with all validations:
```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

## Known Limitations

- No employee marketplace (hiring is abstracted as monthly decisions)
- No multi-round fundraising during simulation
- Market snapshots are seeded, not live
- Only one counter-offer round in term sheet phase
- Death conditions are deterministic; no random events
- AI summary is narrative-only; does not affect math

## Next Phase Recommendation

**Phase 4: Polish & Advanced Features**
- Responsive mobile improvements
- Achievement system with `FounderAchievement`
- Startup graveyard with memorials
- Real-time leaderboard updates
- Enhanced analytics/charts for monthly history
- OAuth completion (Google/GitHub)
