# Phase 24B: AI Operations Advisor + Mission Persistence + Full Flow Integration

## Overview

Phase 24B completes the mission system by integrating AI-driven operations advice, persisting mission roadmaps for all startups, enriching VC reviews with mission realism, factoring mission completion into growth readiness, and surfacing mission data across the UI. All financial state transitions remain deterministic; AI only recommends and explains.

## What Was Missing from Phase 24A

| Gap | Phase 24A Status | Phase 24B Fix |
|-----|-----------------|---------------|
| AI Operations Advisor rendered in UI | Backend existed, never called | Called in `getSimulationState`, rendered on operate page |
| Mission persistence for existing startups | Only new startups got missions | Lazy backfill in `getSimulationState` |
| Mission achievements unlockable | Definitions existed, never evaluated | Evaluated after monthly simulation and at finalization |
| VC review mission awareness | None | Funding adequacy, mission realism score, roadmap concern, recommended first hire added |
| Growth readiness mission factor | None | ±10 bounded modifier on Series A and acquisition readiness |
| Cost engine as source of truth | Display-only on candidate cards | `getTeamState` overrides `candidate.salary` with cost-engine `monthlyBurn` |
| Mission history in monthly log | "Mission Log" was just sim history | Monthly log now shows mission title/outcome per month |
| Mission preview on startup profile | None | Active mission progress + completed count + mini roadmap |
| SimulationMonth mission metadata | None | `missionResult` stored in `metadata` each month |

## Architecture

```
lib/missions/           — Mission system (classification, generator, progress, effects, next moves)
lib/economy/            — Realistic cost engine (salary bands, region multipliers, cost calculator)
lib/ai/operations-advisor.ts  — AI advisor + deterministic fallback
lib/actions/simulation.ts     — Monthly simulation with mission progress + AI advisor + backfill
lib/actions/startup.ts        — VC review enriched with mission/funding fields
lib/actions/team.ts           — Cost engine as source of truth for candidate salaries
lib/actions/growth.ts         — Growth state includes mission context
lib/game/finalize-startup.ts  — Mission achievements at finalization
lib/growth/eligibility.ts     — Mission completion modifier on readiness scores
```

## Mission Persistence

### Database Model
The `Mission` model (added in Phase 24 migration) stores:
- `id`, `startupId`, `title`, `category`, `status`, `sequence`
- `monthStart`, `monthEnd`
- `requiredRoles`, `optionalRoles`, `requiredCapabilities` (JSON)
- `estimatedCost`, `monthlyCostDelta`, `progress` (default 0)
- `successScore`, `effects`, `aiSummary`, `metadata` (JSON)

### Startup Creation
- `createStartupAction` classifies the startup type, generates a 6–10 mission roadmap, and persists it via `db.$transaction(persistRoadmapToDb(...))`.
- The first mission is `active` with 10% progress; the rest are `pending`.

### Backfill for Existing Startups
- `getSimulationState` checks if `startup.missions.length === 0`.
- If no missions exist, it deterministically re-classifies the startup, generates a roadmap, and persists it.
- This is **lazy** (happens when the user opens the operate page) and **best-effort** (errors are caught and ignored).

### Monthly Simulation Updates
- `runMonthlySimulationAction` loads missions, finds the active one, and runs `calculateMissionProgress`.
- Mission status transitions: `pending` → `active` → `completed` | `failed`.
- On completion/failure, bounded effects are applied to the simulation state.
- The next pending mission is auto-activated.
- All mission updates are batched in the same Prisma transaction as the simulation month write.

## AI Operations Advisor

### Data Flow
1. `getSimulationState` calls `generateOperationsAdvisor(...)` with real startup state.
2. The advisor result is returned alongside missions, next moves, and decisions.
3. The operate page passes it to `OperateClient`.
4. `OperateClient` renders a card with: situation summary, top risks, mission gap, recommended hires, spending warnings, what-not-to-do, 30/90-day plans, and confidence score.

### Deterministic Fallback
- If OpenAI fails or no API key is configured, `generateDeterministicAdvisor` returns useful advice based on:
  - Runway (< 3 months = critical risk)
  - Risk score (> 70 = crisis risk)
  - Product progress lag
  - Role gaps from the active mission
  - Revenue vs burn ratio

### Rules
- AI **never** sets cash, burn, valuation, score, or mission progress.
- All effects are computed by deterministic engines.

## Mission Progress Formula

```
rawScore = roleCoverage * 40 +
           cashReadiness * 15 +
           teamReadiness * 15 +
           marketImpact * 10 +
           decisionAlignment * 10 +
           (1 - riskPenalty) * 10

score = rawScore * runwayPenalty  // <2mo = 0.3x, <4mo = 0.7x
progressDelta = round(score * complexityFactor * 0.8)
newProgress = clamp(progress + progressDelta, 0, 100)
```

- **Complexity factor:** Harder missions (complexity 9-10) progress slower than easy ones (2-3).
- **Status rules:**
  - `newProgress >= 100` → `completed` (if score >= 60) or `delayed`
  - `score < 30` and `progress > 20` → `failed`
  - `status === "pending"` and `score > 20` → `active`

## UI Changes

### Operate Page (`/startup/[id]/operate`)
- **Active Mission card:** Title, category, progress bar, required roles.
- **AI Operations Advisor card:** Full advisor output with confidence score.
- **Recommended Next Moves:** Up to 3 moves with urgency, cost, rationale.
- **Monthly Mission Log:** Each month shows mission title and completion status (✓ for completed).

### Startup Profile (`/startup/[id]`)
- **Mission Roadmap card:**
  - Completed/active/failed mission count
  - Active mission progress bar
  - Mini roadmap pills (first 6 missions)

### Team Page (`/startup/[id]/team`)
- **Mission-critical hiring banner** when candidates match required roles.
- **Candidate cards:** Realistic all-in monthly burn, runway-after-hire warning, mission relevance badge.
- **Cost engine is now source of truth** for all salary/burn values.

## VC Review Integration

When a pitch is submitted for review, the following mission-aware fields are added to the review's `rawResponse`:
- `missionRealismScore` — % of missions completed
- `fundingAdequacy` — fundingAsk / totalMissionCost as %
- `roadmapConcern` — human-readable funding vs roadmap assessment
- `recommendedFirstHire` — first required role from the mission roadmap
- `missionCount` — total missions in roadmap
- `totalMissionCost` — sum of all mission estimated costs

## Growth Readiness Integration

Mission completion rate adds a **bounded ±10 point modifier** to:
- **Series A readiness** — high completion boosts score; low completion (< 30% with 3+ missions) adds a blocker
- **Acquisition readiness** — strong execution builds acquirer confidence

The modifier is applied after all other scoring but before the 0-100 clamp.

## Achievements

Eight mission achievements are now evaluated:
- `first_mission` — complete 1 mission
- `mission_streak` — 3 consecutive completions
- `technical_team` — 3+ engineers + completed engineering mission
- `compliance_ready` — completed compliance mission with score 80+
- `lean_roadmap` — 5+ missions completed with total spend <$100K
- `ai_cost_optimizer` — completed inference cost mission
- `audit_ready` — completed security audit mission
- `customer_validation` — completed customer dev + beta launch missions

Evaluation happens:
1. **After each monthly simulation** if a mission completed or failed.
2. **At startup finalization** as a catch-all.

All achievement grants are idempotent (checked via `hasAchievement` before create).

## Cost Engine as Source of Truth

- `lib/team/candidates.ts` still generates deterministic candidates with hardcoded base impacts.
- `lib/actions/team.ts` `getTeamState` now **overrides** `candidate.salary` with `calculateEmployeeCost(role, seniority, region).monthlyBurn`.
- All downstream burn calculations (`hireEmployeeAction`, `fireEmployeeAction`, `changeOfficeSetupAction`) use this realistic value.
- The hire action no longer double-counts office costs when adding a new employee's salary to burn.

## Tests

**`tests/unit/phase24b-integration.test.ts`** — 19 tests covering:
- Type-specific roadmap generation (AI, fintech)
- Mission progression, completion, failure
- Bounded mission effects
- Deterministic AI advisor (with/without role gaps)
- Mission-critical next moves
- Cost engine monthly burn consistency
- Hire impact runway warnings
- VC funding adequacy math
- Growth readiness mission modifiers (boost + penalty)
- Active mission selection and completion rate

**Total test count:** 399 (380 Phase 24A + 19 Phase 24B)

## Manual Test Path

1. Create AI startup → verify AI-specific roadmap persisted.
2. Create fintech startup → verify compliance/payment roadmap persisted.
3. Open startup profile → verify mission roadmap preview card.
4. Accept funding → open operate page.
5. Verify AI Operations Advisor card appears with role gaps and next moves.
6. Open team page → verify realistic costs + mission relevance badges.
7. Hire recommended role.
8. Run one simulation month → verify mission progress updates.
9. Complete a mission → verify next mission activates.
10. Submit VC review → verify mission/funding realism appears in review.
11. Check growth readiness → verify mission modifier affects score.

## Known Limitations

- **Mission library size:** 24 templates. Some startup type + sector + stage combinations may only match 3-5 templates. Expanding the library increases roadmap variety.
- **Backfill is lazy:** Existing startups only get missions when the operate page is opened. A batch backfill script could be added for data completeness.
- **Cost engine in core simulation:** The `simulateMonth` engine in `lib/simulation/engine.ts` still uses its own burn model. The cost engine influences hiring decisions and previews but does not yet replace the simulation's internal calculations.
- **AI advisor latency:** The advisor call in `getSimulationState` adds ~200-800ms to page load. This is acceptable for a game dashboard but could be made on-demand in the future.

## Validation

- `npm run typecheck` ✅ clean
- `npm run lint` ✅ no errors
- `npm test` ✅ 399 tests passing
- `npm run build` ✅ successful
