# Phase 24: AI Mission Roadmaps & Realistic Costs

## Overview

Phase 24 introduces a **mission system** that gives every startup a custom 12-month roadmap of objectives, plus a **realistic cost engine** that replaces static salary numbers with region-adjusted, all-in annual compensation bands. AI assists with classification and advisor summaries; all financial math and state transitions remain deterministic.

## Architecture

```
lib/missions/           — Mission system core
lib/economy/            — Realistic cost engine
lib/ai/operations-advisor.ts  — AI advisor (recommends only)
```

---

## 1. Mission System

### 1.1 Startup Classification

**File:** `lib/missions/startup-classifier.ts`

- **Deterministic** keyword-based scoring maps sector + business model → one of 17 startup types.
- `classifyStartupDeterministic(...)` is authoritative. AI may enrich explanations but never overrides the type.
- Outputs: `primaryStartupType`, `secondaryTypes`, complexity/capital/regulatory/technical/sales/hiring intensities (1-10), `missionArchetype`, `explanation`.

### 1.2 Mission Library

**File:** `lib/missions/mission-library.ts`

- 24 sector-specific `MissionTemplate` objects.
- Each template defines: category, required/optional roles, capabilities, estimated cost, monthly cost delta, duration, complexity, risk, success metrics, failure risks, completion/failure effects.
- **Stage compatibility:** Early-stage startups ("idea") match templates tagged "idea" or "pre_seed".

### 1.3 Roadmap Generator

**File:** `lib/missions/mission-generator.ts`

- `generateMissionRoadmap(startupId, classification, sector, stage)`:
  1. Filters `MISSION_LIBRARY` by type/sector/stage compatibility.
  2. Deduplicates and selects a balanced set (up to 10) across priority categories.
  3. Builds `MissionInstance` objects with `monthStart`, `monthEnd`, role requirements, and metadata.
  4. First mission is `active` with 10% progress; rest are `pending`.
- `persistRoadmapToDb(...)` returns an array of `PrismaPromise<Mission>` for transaction batching.

### 1.4 Progress Engine

**File:** `lib/missions/mission-progress.ts`

- `calculateMissionProgress(input)` — deterministic monthly progress calculator.
- Factors (weighted):
  - Role coverage: 40%
  - Cash readiness: 15%
  - Team readiness (productivity + morale): 15%
  - Market tailwind/headwind: 10%
  - Decision alignment: 10%
  - Risk control: 10%
- **Complexity factor:** Harder missions (complexity 9-10) progress slower per month than easy ones (complexity 2-3).
- **Runway penalty:** < 2 months = 0.3x, < 4 months = 0.7x.
- Status transitions: `pending` → `active` → `completed` | `failed`.

### 1.5 Mission Effects

**File:** `lib/missions/mission-effects.ts`

- `applyMissionEffects(state, effect)` — applies bounded deltas to cash, burn, revenue, valuation, product progress, investor/market/risk scores.
- `boundMissionEffect(effect)` — clamps all deltas to safe ranges (e.g., cashDelta ±20%, burnDelta ±30%).

### 1.6 Next Moves

**File:** `lib/missions/next-moves.ts`

- `generateNextMoves(context)` — produces 0-3 recommended actions based on:
  - Missing roles for the active mission
  - Cash/runway warnings
  - Mission completion priority
- Each `NextMove` includes: `urgency`, `estimatedCost`, `expectedImpact`, `riskIfIgnored`, `deterministicEffectPreview`.

### 1.7 Role Requirements

**File:** `lib/missions/role-requirements.ts`

- `calculateRoleCoverage(requiredRoles, employees)` — returns coverage 0-1 for each required role.
- `getRolesForMission(category, startupType)` — maps mission categories to recommended role compositions.

---

## 2. Realistic Cost Engine

### 2.1 Salary Bands

**File:** `lib/economy/salary-bands.ts`

- US-market baseline all-in annual costs by role and seniority.
- Examples: CTO senior = $320K, Full-stack Engineer mid = $140K, AI Engineer lead = $420K.

### 2.2 Region Multipliers

**File:** `lib/economy/region-multipliers.ts`

- SF/NYC: 1.3x | London: 0.9x | Remote: 0.55x | India: 0.3x | etc.

### 2.3 Office Costs

**File:** `lib/economy/office-costs.ts`

- Remote: $0 | Coworking: $3K/mo | Small Office: $8K/mo | Premium: $20K/mo.

### 2.4 Operating Costs

**File:** `lib/economy/operating-costs.ts`

- Sector-specific recurring costs (cloud, compliance, security, marketing) scaled by team size, revenue, or user count.

### 2.5 Unified Calculator

**File:** `lib/economy/cost-engine.ts`

- `calculateEmployeeCost(role, seniority, region, isContractor?)` → `{ baseAnnual, allInAnnual, monthlyBurn }`
- `calculateTotalBurn(employees, officeType, sector, stage, revenue)` → full burn breakdown
- `calculateRunwayWithCosts(cash, employees, officeType, sector, stage, revenue)` → runway estimate
- `estimateHireImpact(cash, currentBurn, revenue, role, seniority, region)` → pre-hire runway projection

---

## 3. AI Integration

### 3.1 Operations Advisor

**Files:** `lib/ai/operations-advisor.ts`, `lib/ai/prompts/operations-advisor.ts`

- `generateOperationsAdvisor(...)` — OpenAI-powered structured advice.
- **Deterministic fallback:** `generateDeterministicAdvisor(...)` returns sector-specific advice when no API key.
- Output schema: situation summary, top risks, mission gap analysis, recommended moves/hires, spending warnings, what-not-to-do, 30/90-day plans, confidence score.
- **AI never mutates state.** All financial effects are computed by deterministic engines.

### 3.2 AI Provider Extension

**Files:** `lib/ai/ai-provider.ts`, `lib/ai/openai-provider.ts`, `lib/ai/mock-provider.ts`

- Added `generateOperationsAdvisor` / `generateDeterministicAdvisor` to the `AIProvider` interface.
- Mock provider returns deterministic fallback data for offline dev.

---

## 4. Database Integration

### 4.1 Schema

**Migration:** `20260505152405_phase24_ai_mission_roadmaps_realistic_costs`

- `Startup.startupType String?` — cached primary type.
- `Startup.missionRoadmap Json?` — serialized roadmap metadata.
- `Mission` model:
  - `id`, `startupId`, `title`, `category`, `status`, `sequence`
  - `monthStart Int?`, `monthEnd Int?`
  - `requiredRoles Json`, `optionalRoles Json`, `requiredCapabilities Json`
  - `estimatedCost Int`, `monthlyCostDelta Int`, `progress Int @default(0)`
  - `successScore Int?`, `effects Json?`, `aiSummary String?`, `metadata Json?`

### 4.2 Startup Creation Flow

**File:** `lib/actions/startup.ts`

1. After AI analysis, call `classifyStartup({...})`.
2. Generate final roadmap with real `startupId`.
3. Persist via `db.$transaction(persistRoadmapToDb(startup.id, finalRoadmap))`.

### 4.3 Simulation Month Flow

**File:** `lib/actions/simulation.ts`

1. Load all missions for the startup.
2. Find active (or first pending) mission.
3. After `simulateMonth`, call `calculateMissionProgress(...)` with actual team/decision/cash state.
4. If mission completes/fails, apply bounded effects to the simulation result.
5. Activate next pending mission.
6. Batch all mission updates in the same Prisma transaction as the simulation month write.

---

## 5. UI Integration

### 5.1 Operate Page

**Files:** `app/(game)/startup/[id]/operate/page.tsx`, `operate-client.tsx`

- **Active Mission card:** Title, category, progress bar, required roles.
- **Recommended Next Moves:** Up to 3 moves with urgency badges, estimated cost, and rationale.
- Existing monthly decisions and event system unchanged.

### 5.2 Team Page

**Files:** `app/(game)/startup/[id]/team/page.tsx`, `team-client.tsx`

- **Mission-critical hiring banner:** Appears when candidates fill required mission roles.
- **Candidate cards:** Show `salary`, `all-in monthly burn`, and `runwayAfter` warning if < 6 months.
- **Mission relevance badge:** "Mission" badge on candidates whose role matches the active mission's required roles.

---

## 6. Testing

**File:** `tests/unit/missions-and-costs.test.ts` (23 tests)

### Startup Classification
- Fintech, AI SaaS, and generic SaaS B2B classification
- Intensity bounds (1-10)

### Mission Progress Engine
- Full role coverage → strong progress
- Missing roles + low runway → weak progress
- Completion at 100% progress
- Complexity factor (easy vs hard missions)
- `getActiveMission` and `getMissionCompletionRate`

### Mission Roadmap Generator
- Roadmap generation with 3-10 missions
- Unique IDs
- First mission active, rest pending
- Required roles present

### Cost Engine
- Region multiplier (SF > remote)
- Contractor overhead < employee overhead
- Fallback for unknown roles
- Seniority scaling (junior < mid < senior)
- Hire impact (runway reduction)
- 999 runway when revenue covers burn
- Total burn breakdown
- Runway calculation with real cash

---

## 7. Design Principles

1. **AI recommends; determinism enforces.** All cash, burn, runway, valuation, and score changes are computed by pure functions. AI only generates explanations, advisor briefs, and coaching.
2. **Bounded effects.** Mission completion/failure effects are clamped to safe ranges. No mission should single-handedly save or kill a startup.
3. **Deterministic fallback.** Every AI feature has a deterministic fallback so the game works without API keys.
4. **Progressive disclosure.** The operate page shows the active mission and next moves without overwhelming the player. Detailed advisor data is available but not required.

---

## 8. Known Limitations / Future Work

- **Mission library size:** 24 templates cover major sectors but not all niche combinations. Expanding the library will increase roadmap variety.
- **AI advisor UI:** The `generateOperationsAdvisor` action is integrated into the provider layer but not yet rendered on the operate page. A future update can add an "AI Advisor" card that calls this action on demand.
- **Mission effects in VC review:** Growth readiness and VC reviews do not yet consider mission completion status. This can be wired in Phase 25.
- **Cost engine in simulation:** The core `simulateMonth` engine still uses its own burn calculations. The cost engine is used for candidate previews and hiring decisions but does not yet replace the simulation's internal burn model.
