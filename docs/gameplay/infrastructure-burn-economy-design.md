# Founder Arena Phase 16B: Infrastructure Burn Economy Design v0.1

This document converts the Phase 16A infrastructure/LLM pricing research into a deterministic gameplay model. It is not live billing, not an exact provider calculator, and not wired into simulation burn yet.

Related research:

- `docs/research/real-infrastructure-llm-burn-research.md`

## Purpose

Founder Arena needs infrastructure burn to become a meaningful founder tradeoff:

- cheap stacks preserve runway but increase outage/scaling risk
- mature cloud stacks increase burn but improve reliability, investor trust, and enterprise readiness
- AI-heavy products can spend more on tokens/API usage than hosting
- cloud credits help short-term runway but create cliff risk when they expire

Phase 16B creates the model and tests only. Phase 16C can later connect it to Monthly Burn and sprint simulation.

## Core Files

- `lib/infrastructure/types.ts`
- `lib/infrastructure/infra-catalog.ts`
- `lib/infrastructure/infra-balance.ts`
- `lib/infrastructure/infra-burn-engine.ts`
- `lib/infrastructure/infra-events.ts`
- `lib/infrastructure/index.ts`

The active catalog version is `2026.05.v0`.

## Provider Archetypes

Provider names are gameplay archetypes informed by public pricing research. They are not sponsorship copy or live provider guarantees.

| Stack | Role | Strength | Risk |
|---|---|---|---|
| Replit MVP | Idea/prototype stack | Very fast, cheap, easy to demo | Outgrown quickly, lower reliability/scalability |
| Vercel Serverless | Frontend/serverless SaaS | High developer speed, scalable launch posture | Function usage, bandwidth, edge/serverless overages |
| Render Full-Stack | Managed full-stack app | Predictable app/backend hosting | Managed DB scaling, always-on services, instance upgrades |
| Supabase/Neon DB Stack | DB-heavy app layer | Strong Postgres/auth/storage path | DB storage, compute, connection, branch/backup growth |
| AWS/GCP Scale Stack | Growth/Series A cloud | High scalability/security/trust | Egress, logs, managed DB, autoscaling, complexity |
| Enterprise Cloud Stack | Regulated enterprise stack | Compliance, security, investor trust | High burn, complexity, lock-in |
| AI-Heavy Stack | AI-native product stack | Strong AI readiness and investor interest | Token/API spikes and high bill shock risk |
| Cheap Static Landing Stack | Validation stack | Lowest burn for waitlist/testing | Not a real product stack |
| Cloudflare Edge Stack | Optional edge/global stack | Global read traffic, egress-sensitive workloads | Product fit complexity |

Ratings use 0-100 values for:

- reliability
- scalability
- security
- devSpeed
- complexity
- investorTrust
- outageRisk
- lockInRisk
- aiReadiness
- complianceReadiness

## AI Usage Tiers

AI usage is separated from generic hosting.

| Tier | Intended meaning | Economy effect |
|---|---|---|
| none | no meaningful LLM/API usage | no AI monthly cost |
| light | small copilots, internal summaries | low cost, small bill shock risk |
| moderate | regular AI workflows | noticeable monthly cost |
| heavy | AI is core product usage | material burn, high bill shock risk |
| agentic | multi-step tools/agents/retrieval | very high context/tool/retry risk |
| multimodal | image/audio/video/realtime | highest volatility, advanced profile |

The model does not bind tiers to exact OpenAI, Anthropic, or Gemini models. Phase 16A showed that token prices change too often and vary by context, caching, batch mode, media type, and provider. The game should model the strategic pressure, not a penny-accurate invoice.

## Burn Formula

`calculateInfrastructureBurn(input)` returns an `InfrastructureBurnEstimate`.

Inputs include:

- stackId
- startupStage
- sector/classification
- usageProfile
- aiUsageTier
- cloudCredits
- complianceRequired
- currentSprint/product/revenue/user context for future callers

The estimate includes:

- fixedMonthlyCost
- variableMonthlyCost
- aiMonthlyCost
- complianceMonthlyCost
- grossMonthlyInfraBurn
- cloudCreditsApplied
- effectiveMonthlyInfraBurn
- reliabilityRisk
- scalingRisk
- securityRisk
- billShockRisk
- outageRisk
- investorTrustModifier
- riskScoreModifier
- explanation
- warnings

Formula shape:

1. Fixed monthly cost comes from the static stack catalog.
2. Variable monthly cost increases with monthly active users, requests/user, bandwidth/egress, DB storage, logs, and stage multiplier.
3. AI monthly cost increases with AI tier, AI requests/user, input/output tokens, embeddings, and image/audio usage.
4. Compliance monthly cost increases with compliance level.
5. Gross monthly infra burn is fixed + variable + AI + compliance.
6. Cloud credits reduce effective burn only.
7. Risk outputs derive from stack ratings, usage pressure, volatility, AI tier, and compliance gap.

Monthly accounting is preserved. The game can still run in 12 Founder Weeks / Sprints while infrastructure burn is expressed as monthly cost and runway impact.

## Cloud Credits

Helpers:

- `applyCloudCredits(grossMonthlyInfraBurn, credits, provider)`
- `decrementCloudCreditsOverTime(credits, sprintAdvance)`
- `getCloudCreditWarning(credits)`

Rules:

- credits reduce effective monthly infra burn
- credits do not reduce gross burn
- credits cannot make burn negative
- credits may be provider-scoped
- credits expire by sprint count
- expiring credits warn the player before the runway cliff

Phase 16C should connect this to existing Growth Offers that already include Cloud Credits. The correct display is:

- gross infra burn: visible
- credits applied: visible
- effective infra burn: used for current period if integrated
- expiry warning: visible before the player gets punished

## Infra Event Catalog

Phase 16B creates event design data only. It does not wire events into sprint simulation.

Events:

1. Prototype Outgrown
2. Serverless Bill Spike
3. Database Connection Limit
4. Bandwidth / Egress Surprise
5. Logs & Observability Spike
6. Cloud Credits Expiring
7. LLM Token Bill Shock
8. GPU Inference Overload
9. Compliance Infrastructure Upgrade
10. Enterprise Reliability Audit

Each event includes:

- id
- title
- trigger conditions
- severity
- future affected stats
- future player choices
- recommended counterplay
- warning copy

Phase 16C or 16D can later map these to actual sprint events.

## Balance Philosophy

Guardrails:

- Infra burn should matter but not instantly kill early startups.
- Cheap stacks should be viable early.
- Cheap stacks should become risky when user/load pressure rises.
- Expensive stacks should buy reliability/trust, not automatic victory.
- AI-heavy products need meaningful token/API burn.
- Cloud credits should help runway but create cliff risk.
- Enterprise customers should require higher compliance/security spend.
- No provider archetype should be always best.

## What Is Intentionally Not Modeled

Not included in v0.1:

- live pricing APIs
- provider SDKs
- exact SKU/region selection
- real cloud credentials
- real user bills
- exact AWS/GCP billing complexity
- sponsorship claims
- GPU/self-hosting economics as active gameplay
- telemetry/analytics integrations
- schema persistence
- live Monthly Burn integration

## Phase 16C Integration Path

Recommended next phase:

1. Add a read-only Infra Stack panel to a startup page.
2. Let the server derive a default stack from startup sector/stage.
3. Show gross infra burn, credits, effective burn, and risks as preview.
4. Add deterministic tests proving no client-supplied economy values are trusted.
5. Only then decide whether infra burn should be added into `calculateTotalBurn` / `recomputeStartupBaseBurn`.
6. If added to live burn, keep `recomputeStartupBaseBurn` as the single writer for `startup.monthlyBurn`.

Phase 16C must preserve the existing single-writer burn invariant.

## Pricing Disclaimer

This is a static gameplay model based on official pricing research accessed on 2026-05-17. Provider prices, plans, quotas, credits, regions, and product names change often. Ranges must be revisited periodically and should never be presented as live billing accuracy.

