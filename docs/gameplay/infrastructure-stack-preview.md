# Founder Arena Phase 16C: Infrastructure Stack Preview v0.1

Phase 16C made the infrastructure economy visible as a dry-run preview. Phase 16D applied conservative runtime infrastructure burn to live Monthly Burn. Phase 16E adds persistent selected stacks and cloud credit lifecycle state.

## Purpose

The preview helps players understand:

- which infrastructure stack their startup resembles
- estimated monthly infrastructure burn
- AI/API cost exposure
- cloud credit impact
- reliability, scaling, security, bill shock, outage, and lock-in risks
- future infrastructure events that may appear in later phases

The preview is intentionally labeled as:

- Preview
- Estimated
- Gameplay archetype
- Not exact provider billing
- Applied to live Monthly Burn as a gameplay estimate

## Where It Appears

Route:

- `/startup/[id]/infrastructure`

Navigation:

- `StartupRunHud` includes an `Infra` item that links to the preview.

## Stack Recommendation

The preview builder lives in `lib/infrastructure/infra-preview.ts`.

It derives stack recommendations from existing startup state:

- sector
- stage/status
- monetization model
- description/problem/solution
- product progress
- revenue
- simulation history/user growth
- optional cloud credit growth offers

Recommendation rules:

- idea/draft/prototype: Replit MVP or Cheap Static Landing posture
- early SaaS/consumer/marketplace: Vercel Serverless or Render Full-Stack
- backend-heavy products: Render Full-Stack
- DB-heavy/SaaS/fintech: Supabase/Neon DB Stack
- AI/ML/agentic products: AI-Heavy Stack
- regulated/enterprise/later-stage products: AWS/GCP Scale or Enterprise Cloud
- high user growth/revenue: AWS/GCP Scale or Enterprise Cloud

The output includes the recommended stack, alternate stack IDs, fit reason, warnings, and tradeoffs.

## Burn Numbers

The preview shows:

- fixed monthly stack cost
- variable monthly cost
- AI/API monthly cost
- compliance monthly cost
- gross monthly infra burn
- cloud credits applied
- effective monthly infra burn

Important:

- Gross burn shows the modeled pressure.
- Credits reduce effective infrastructure burn only.
- Phase 16D applies capped effective infrastructure burn to live Monthly Burn.

## AI Usage Exposure

The preview uses the Phase 16B AI tiers:

- none
- light
- moderate
- heavy
- agentic
- multimodal

AI-heavy startups default into higher AI exposure based on sector/profile, product progress, and simulated user scale. This is generalized gameplay modeling, not live OpenAI, Anthropic, or Gemini billing.

## Cloud Credits Preview And Lifecycle

If existing Growth Offers contain accepted `cloud_credits`, the runtime system syncs them into persistent credit balances.

Rules:

- credits reduce effective infrastructure burn
- credits do not mutate Growth Offers
- credits deplete server-side during sprint simulation
- credits expire by Founder Week
- accepted credits reduce live infrastructure burn
- expiry and credit cliff warnings are shown before the runway lever disappears

If no credits exist, the UI directs players to Growth Offers.

## Future Infra Events Preview

The preview selects likely future event risks from the Phase 16B catalog:

- Prototype Outgrown
- Serverless Bill Spike
- Database Connection Limit
- Bandwidth / Egress Surprise
- Logs & Observability Spike
- Cloud Credits Expiring
- LLM Token Bill Shock
- GPU Inference Overload
- Compliance Infrastructure Upgrade
- Enterprise Reliability Audit

These are not wired into sprint simulation yet.

## Safety Constraints

Phase 16C does not:

- change simulation math
- change Monthly Burn
- change runway
- change death checks
- change scoring
- change funding or term-sheet math
- change leaderboard/career math
- add schema
- add migrations
- call provider APIs
- call pricing APIs
- add SDKs
- add cloud credentials
- add API keys or secrets
- claim exact billing accuracy

## Phase 16D Runtime Status

Runtime integration now exists:

1. `/startup/[id]/infrastructure` remains the source of truth for infra UX.
2. Recommended stack remains deterministic unless the player selects a valid available stack.
3. Effective runtime infra burn is added through the existing burn path.
4. `recomputeStartupBaseBurn` remains the single writer for stored base burn.
5. Infra events are warnings only and are not live-triggered yet.
