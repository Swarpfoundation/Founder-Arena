# Founder Arena Phase 17A: Cross-System Economy & Run Balance QA v0.1

Phase 17A validates the connected run economy after Social, Rivals, Strategy, Boardroom, Career, Documentary, Leaderboard, and Infrastructure systems are all live.

This is a QA and balance-sweep phase. It does not add new gameplay systems, new event types, formula changes, schema changes, external APIs, SDKs, provider integrations, or secrets.

## Method

The sweep uses deterministic fixtures in `tests/fixtures/cross-system-balance-scenarios.ts`.

Each scenario composes existing pure systems:

- runtime infrastructure burn
- selected stack and cloud credits
- total burn calculation
- sprint simulation
- death checks
- final outcome classification
- leaderboard scoring
- infra event trigger selection

Assertions use ordering and sanity ranges instead of exact dollar values or long copy snapshots.

## Scenario Matrix

| Scenario | Purpose | Expected Behavior | QA Result |
|---|---|---|---|
| Balanced SaaS Founder | Normal SaaS run with product focus and Vercel-style stack | Survives sensible sprint, infra burn stays small share of total burn | Pass: survivable, non-dead final outcome |
| AI-Heavy Hype Founder | AI/ML startup with high hype and AI-heavy stack | Higher AI/API burn and bill-shock exposure, still survivable with revenue | Pass: more expensive than SaaS, not impossible |
| Cockroach Founder | Low-burn conservative strategy and cheap stack | Lower burn, lower upside, longer survival bias | Pass: lower burn and lower leaderboard upside than growth |
| Enterprise Regulated Founder | Healthcare/fintech/enterprise stack | Higher burn, compliance cost, better security/trust posture | Pass: higher cost, higher trust/security posture |
| Rival Killer | High rivalry and public competitive pressure | Higher pressure without automatic loss | Pass: finite run state and no impossible event stack |
| Product-Led Builder | Strong product, lower hype | Strong product path with fair slower-growth outcome | Pass: survivable and viable |
| Cloud Credit Masked AI Startup | High gross infra burn softened by credits | Credit cliff warning before cliff; credits not infinite | Pass: warning present, retry does not double-deplete |
| Weak Startup / Bad Decisions | Poor product/revenue, high burn/risk | Death remains attributable to existing rules | Pass: death via existing cash/risk/runway rules |
| High-Traction Growth Startup | Strong users/revenue with scale cloud | High burn but strong outcome/leaderboard path | Pass: top outcome ordering beats balanced/weak runs |
| No-Traction Startup | Week 9+ with low product and low revenue | No-traction death remains fair | Pass: death via existing no-traction rule |

## Key Balance Findings

The connected economy appears stable enough for continued playtesting.

Healthy paths remain viable:

- Balanced SaaS can survive a sensible sprint and does not get crushed by infrastructure.
- Product-led and cockroach routes remain meaningfully different.
- High-traction growth can justify higher cloud spend through revenue and final score.

Infrastructure pressure is meaningful:

- AI-heavy profiles carry materially higher AI/API burn than standard SaaS.
- Regulated enterprise profiles incur compliance cost, but gain better trust/security posture.
- Cloud credits reduce effective infra burn without reducing gross burn or non-infra burn.

Death conditions remain attributable:

- Weak/bad-decision scenarios die from existing cash, runway, risk, or no-traction rules.
- Infrastructure burn contributes to burn/runway, but does not introduce a new death threshold.

## Known Balance Risks

Cloud credit cliffs remain the biggest risk:

- Credits can mask gross burn until late Founder Weeks.
- Current warnings appear before the cliff.
- Manual playtesting should verify that players notice the warning and understand the jump.

AI-heavy startups are cost-sensitive:

- Agentic/AI-heavy scenarios correctly cost more.
- The current stage caps prevent early instant death.
- Further playtesting should watch whether AI runs feel tense or overly constrained.

Enterprise stack tradeoffs are nuanced:

- Enterprise improves security and trust posture.
- It does not guarantee every risk dimension is lower than cheap stacks.
- This is acceptable because higher complexity can still create operational risk.

## Exploit / Double-Count Checks

Covered by tests:

- infrastructure burn is added once through total burn
- AI/API burn remains a subcomponent of infrastructure burn
- cloud credits reduce effective infra burn, not gross burn
- cloud credits do not reduce payroll, office, mission, or non-infra costs
- same-sprint cloud credit retry does not double-deplete
- selected stack changes burn/risk ordering
- strong final outcomes score above weak final outcomes
- weak/dead outcomes do not exploit leaderboard score

No obvious exploit was introduced in this QA phase.

## Event Density

The event density remains conservative:

- infra event selection returns at most one open event per sprint
- boardroom context in fixtures is capped to reasonable open-event counts
- infra + boardroom pressure does not create a synthetic instant-death path
- existing Phase 16F caps still prevent repeat infra event types and open-event stacking

Manual playtesting should still watch presentation density because a sprint can now include sprint recap, boardroom pressure, rival pressure, social feed changes, strategy hints, and infra warnings.

## UI / Player Comprehension Review

Current UI direction is understandable:

- Operate shows burn/runway and active infra warnings.
- Infra Console explains selected stack, burn impact, credits, open events, and event history.
- Arena Feed now records infra trigger/resolution entries.
- Strategy and Documentary hooks make infra events feel part of the run narrative.

Recommended manual checks:

- player can explain why Monthly Burn changed
- player can see gross vs effective infra burn
- player can identify credit cliff warnings
- player knows whether an infra event requires response
- player can distinguish monthly finance from weekly/sprint pacing

## Go / No-Go

Go for the next polish phase.

Do not increase infra event severity yet. The next phase should focus on playtest telemetry-by-observation, copy clarity, and presentation density rather than adding stronger penalties.

## Deferred

Deferred until after more playtesting:

- stronger social backlash from outages
- boardroom infra hearings
- rival infra sabotage
- strategy synergies that alter infra event response effectiveness
- formula rebalance
- exact provider billing
- live provider integrations
