# Infrastructure Burn Balance Check — Phase 16E.1

This QA pass validates the live infrastructure economy before adding outage or bill-shock events.

Scope:

- runtime infrastructure burn
- selected infrastructure stack effects
- cloud credit depletion / expiry / idempotency
- double-count prevention against legacy operating cost categories
- balance sanity across startup archetypes

Out of scope:

- live outage events
- bill-shock events
- provider APIs or pricing APIs
- schema changes
- scoring/death/funding/leaderboard/career formula changes

## Scenario Matrix

| Scenario | Expected Stack Posture | Expected Behavior |
|---|---|---|
| Cheap Prototype | Cheap Static / Replit MVP | Infra burn stays tiny and cannot kill the run by itself. |
| Standard SaaS MVP | Vercel / Render | Infra burn is visible but below payroll/operating pressure. |
| DB-Heavy SaaS / Fintech | Supabase/Neon / Render | Database and compliance posture create noticeable burn. |
| AI SaaS | AI-Heavy Stack | AI/API cost appears as a distinct pressure. |
| Agentic AI Startup | AI-Heavy Stack | AI/API burn and bill-shock warnings become material. |
| Enterprise / Regulated Startup | Enterprise Cloud / AWS-GCP | Higher burn buys stronger trust/security posture. |
| High-Traction Growth Startup | AWS-GCP / Enterprise | Scale traffic raises gross infra burn but guardrails cap runtime impact. |
| Cloud Credit Masked Startup | AWS-GCP with credits | Credits reduce effective infra burn while warnings expose the cliff. |

## Sanity Rules

The automated tests assert:

- early prototype infra burn is capped and small relative to total Monthly Burn
- AI-heavy startups cost more than comparable non-AI startups
- agentic AI produces stronger AI/API pressure and warning copy
- enterprise/regulatory stack costs more but improves security/trust risk posture
- cheap stacks lower burn but carry higher outage/scaling risk
- cloud credits reduce effective infra burn, not gross infra burn
- cloud credits never reduce payroll, office, mission, or non-infra operating costs
- cloud credits cannot make Monthly Burn negative
- cloud credits do not double-deplete on same-sprint retry
- selected stack affects runtime burn when valid
- invalid/locked stack selection remains rejected
- runtime infra excludes legacy generic `AI Inference / API` and `Cloud Infrastructure` operating categories to avoid double-counting

## Current Balance Read

The model is conservative for early startups and meaningful for high-usage or AI-heavy startups.

Important observations:

- Prototype stacks are safe enough for first-run flow.
- AI-heavy stacks create real burn pressure without changing death thresholds.
- Cloud credits work as runway relief, but warnings are necessary because they can hide gross burn.
- Enterprise stacks are intentionally expensive but defensible because they improve trust/security posture.
- Runtime caps are still doing useful work for high-traction and agentic scenarios.

## Playtest Checklist

Before Phase 16F:

- Run a cheap prototype through Week 3 and verify infra does not dominate decisions.
- Run a Standard SaaS MVP through Week 6 and verify infra is visible but not the main killer.
- Run an AI SaaS through Week 6 and verify AI/API burn feels noticeable.
- Run an Agentic AI startup into Week 9 and verify bill-shock warnings are readable.
- Accept Cloud Credits and run multiple sprints to confirm credits decrement once.
- Retry a sprint action in development and confirm credits do not double-deplete.
- Select Enterprise Cloud on a regulated startup and confirm the tradeoff is clear.
- Select a cheap stack on a high-traffic startup and confirm risk warnings are clear.

## Known Balance Risks

- Cloud credits can mask gross burn, so event design should not punish players without warning.
- AI-heavy startups can become cost-sensitive quickly; Phase 16F events should use warnings before stat damage.
- Enterprise Cloud may look expensive to new players; keep locked-state and trust/security copy explicit.
- Exact dollar values are gameplay approximations and should not be presented as provider quotes.

## Phase 16F Readiness

Phase 16F is safe to start when:

- the 8-scenario sweep passes
- cloud credit lifecycle tests pass
- playtest confirms early startups are not over-punished
- players can understand gross vs effective infra burn
- credit cliff warnings are visible before bill-shock events are introduced

Recommended Phase 16F scope:

- warning-first infra events
- no instant-death outage outcomes
- no score/death threshold changes
- deterministic event triggers based on existing infra warnings and selected stack risk
