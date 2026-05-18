# Founder Arena Phase 16D: Infrastructure Burn Runtime Integration v0.1

Phase 16D wires the deterministic infrastructure burn model into live Monthly Burn in a conservative way.

Infrastructure burn is now:

- deterministic
- monthly-accounted
- based on provider archetypes, not exact invoices
- capped by startup stage
- reduced by persistent cloud credit balances where available
- included in sprint simulation burn through the existing burn path

## Integration Point

Founder Arena keeps `startup.monthlyBurn` as stored base burn:

- active employee salaries
- office cost

`recomputeStartupBaseBurn` remains the single writer for `startup.monthlyBurn` and `officeMonthlyCost`.

Runtime burn is recomputed when needed and added through:

- `calculateTotalBurn(...)` for display/advisor/finalization
- `simulateMonth(...)` for live sprint simulation

This avoids creating a parallel burn system.

## Runtime Helper

Runtime helper:

- `calculateRuntimeInfrastructureBurn(input, options)`

Source files:

- `lib/infrastructure/infra-runtime.ts`
- `lib/infrastructure/infra-preview.ts`
- `lib/infrastructure/infra-burn-engine.ts`

The runtime helper wraps the Phase 16C preview recommendation, applies live guardrails, and respects Phase 16E selected-stack and cloud-credit lifecycle state.

Output includes:

- `runtimeMonthlyInfraBurn`
- `grossInfraBurn`
- `uncappedGrossInfraBurn`
- `creditsApplied`
- `aiApiBurn`
- `complianceBurn`
- `capApplied`
- risk modifier preview
- warnings
- explanation
- source stack id
- version

## Burn Components

Live Monthly Burn now includes:

- payroll
- office
- non-infrastructure operating costs
- mission costs
- infrastructure burn

When runtime infrastructure burn is active, the older generic operating categories `AI Inference / API` and `Cloud Infrastructure` are excluded from operating costs to avoid double-counting.

## AI/API Burn

AI/API burn is part of runtime infrastructure burn and remains visible as a subcomponent.

AI-heavy, agentic, and multimodal startups can produce higher `aiApiBurn`, but runtime guardrails cap early-stage exposure.

## Cloud Credits

Accepted Growth Offers with `offerType = "cloud_credits"` are synced into persistent balances stored in `startup.aiAnalysis.infrastructure`.

Rules:

- credits reduce effective infrastructure burn only
- credits do not reduce gross infrastructure burn
- credits do not reduce payroll, office, mission, or non-infra operating costs
- credits cannot make infrastructure burn negative
- credits deplete when they offset infrastructure burn
- credits expire after their configured sprint window
- credit application is idempotent per sprint

Credit balances are updated in the same simulation transaction as the sprint result.

## Balance Guardrails

Runtime guardrails:

- minimum active infrastructure burn: `$25/mo`
- stage caps:
  - idea: `$50/mo`
  - prototype: `$150/mo`
  - pre-seed: `$500/mo`
  - seed: `$1,500/mo`
  - growth: `$8,000/mo`
  - series A: `$25,000/mo`
  - enterprise: `$60,000/mo`
- AI stage caps:
  - idea: `$100/mo`
  - prototype: `$300/mo`
  - pre-seed: `$1,500/mo`
  - seed: `$4,500/mo`
  - growth: `$18,000/mo`
  - series A: `$50,000/mo`
  - enterprise: `$90,000/mo`

These caps prevent infrastructure burn from instantly killing early startups.

## Simulation Effects

Infrastructure burn affects:

- monthly burn rate
- cash after sprint
- runway months
- final capital efficiency, because finalization uses true burn

Infrastructure burn does not change:

- death thresholds
- scoring formulas
- funding math
- term-sheet math
- leaderboard formulas
- career formulas
- 12 Founder Week pacing

## UI

The Infra Stack Console at `/startup/[id]/infrastructure` now states that infrastructure burn is runtime active.

Operate page Monthly Burn Breakdown now shows:

- Infrastructure
- AI/API
- Cloud Credits

## What Is Still Approximate

This is not exact provider billing.

Founder Arena still does not use:

- live pricing APIs
- provider SDKs
- cloud credentials
- exact region/SKU billing
- real user invoices

Provider names are gameplay archetypes unless partnerships exist.

## Deferred

Future phases should handle:

- boardroom infra hearings
- strategy synergies that reduce infrastructure burn
- social backlash from outages
- rival infrastructure attacks

Phase 16F now adds warning-first infrastructure events for credit cliffs, bill shock, scaling pressure, database limits, and compliance audits. Boardroom/social/rival integrations remain deferred.
