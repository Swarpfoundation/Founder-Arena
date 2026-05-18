# Founder Arena Phase 16E: Infrastructure Stack Selection + Cloud Credit Lifecycle v0.1

Phase 16E gives players controlled infrastructure strategy without adding live provider integrations.

Infrastructure is still a deterministic gameplay model:

- provider archetypes, not exact invoices
- no live pricing APIs
- no provider SDKs
- no cloud credentials
- no official sponsorship or quote claims

Monthly financial accounting remains preserved. Founder Arena still uses 12 Founder Weeks / Sprints for pacing, while infrastructure affects Monthly Burn.

## Persistent Stack Selection

Selected infrastructure stack state is stored in `startup.aiAnalysis.infrastructure`.

This avoids a migration and keeps existing startups compatible.

Stored state includes:

- selected stack id
- previous stack id
- selected sprint
- last switched sprint
- cloud credit balances
- economy version

If no selected stack exists, the runtime model falls back to the deterministic recommended stack.

## Server-Side Validation

Stack selection is validated server-side in `lib/actions/infrastructure.ts`.

The client submits only:

- `startupId`
- `stackId`

The server recomputes:

- startup profile
- current Founder Week
- recommended stack
- allowed/locked alternatives
- runtime burn estimate

Invalid or locked stack ids are rejected.

## Stack Availability Rules

Early stacks are broadly available:

- Cheap Static Landing
- Replit MVP
- Vercel Serverless
- Render Full-Stack

Conditional stacks unlock from startup shape:

- Supabase/Neon DB Stack: DB-heavy, SaaS, fintech, regulated workflows, or stronger product progress
- AI-Heavy Stack: AI/ML, agentic, automation, or inference-heavy positioning
- AWS/GCP Scale Stack: stronger product progress, revenue, user growth, or later stage
- Enterprise Cloud Stack: regulated, enterprise, healthcare, fintech, or later-stage trust needs

The model intentionally avoids a best stack. Cheap stacks preserve runway but raise scaling/outage risk. Enterprise stacks raise burn and complexity but improve trust/security posture.

## Switching Rules

Phase 16E supports one stack switch per sprint.

Switching during Demo Day Runway is allowed but returns a stronger warning. Migration cost is warning-only in v0.1 and is not applied to burn.

Future phases may add migration cost events, boardroom concerns, or outage risk events.

## Cloud Credit Lifecycle

Accepted `cloud_credits` Growth Offers create persistent credit balances.

Each balance tracks:

- original amount
- remaining amount
- accepted sprint
- expiry sprint
- status: active / depleted / expired
- total applied
- last applied sprint
- source offer id

Credits only reduce infrastructure burn. They never reduce payroll, office, mission, or non-infrastructure operating costs.

Credits cannot make infrastructure burn negative.

## Depletion And Idempotency

Cloud credits are applied during sprint simulation through the runtime infrastructure burn helper.

Credit application is idempotent per sprint:

- if a credit has already applied to the same sprint, it will not deplete again
- if a simulation transaction fails, the credit update does not persist
- credit balances are stored with the same startup update as the sprint result

This protects against retry/double-submit corruption.

## Expiry And Credit Cliff Warnings

Warnings appear when:

- credits are below 20 percent remaining
- credits expire within 2 sprints
- gross infrastructure burn is high and credits mask a large share of it

Warnings appear in the Infra Stack Console and can surface in the Operate burn breakdown.

Phase 16E does not trigger live bill-shock or outage events. These remain warnings only.

## UI

The Infra Stack Console shows:

- selected stack
- deterministic recommended stack
- available alternatives
- locked alternatives and unlock reasons
- runtime Monthly Burn impact
- AI/API exposure
- compliance overhead
- cloud credit balances
- expiry and credit cliff warnings
- future infra event risks

Operate page burn breakdown can show credit warnings when active.

## What Remains Deferred

Deferred to later phases:

- player-defined custom provider stacks
- migration costs as live economic events
- infra outage events
- serverless bill-shock events
- database limit events
- boardroom infra hearings
- rival attacks on reliability
- social backlash from outages
- strategy synergies that reduce infrastructure burn
- exact provider billing or live pricing APIs

## Balance QA Notes

Phase 16E.1 adds an 8-scenario balance sweep covering cheap prototypes, SaaS MVPs, DB-heavy fintech, AI SaaS, agentic AI, enterprise/regulated startups, high-traction growth, and cloud-credit-masked startups.

Current guardrail intent:

- early infrastructure burn should stay conservative
- AI-heavy products should feel meaningful AI/API pressure
- enterprise stacks should cost more but improve trust/security posture
- cheap stacks should preserve runway but raise scaling/outage risk
- cloud credits should provide temporary relief without hiding gross burn forever

See `docs/qa/infrastructure-burn-balance-check.md` for the QA matrix and Phase 16F readiness checklist.

## Phase 16F Event Status

Phase 16F adds deterministic infrastructure events on top of this lifecycle. Credit cliffs, AI/API burn, prototype stack pressure, database limits, compliance audits, and reliability reviews can now open an infra event that the player resolves in the Infra Stack Console.

These events remain warning-first and response-driven. They do not add instant death or change scoring/death/funding/leaderboard/career formulas.

## Safety

Phase 16E does not change:

- scoring formulas
- death thresholds
- funding math
- term-sheet math
- leaderboard formulas
- career formulas
- Prisma schema
- internal month-based fields/actions

No external APIs, pricing APIs, provider SDKs, cloud credentials, secrets, OAuth, analytics, telemetry, payment integrations, or LLM calls are added.
