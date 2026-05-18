# Founder Arena Phase 16F: Infra Outage & Bill-Shock Events v0.1

Phase 16F adds deterministic, response-driven infrastructure events. Phase 16G makes those events visible across the wider Founder Arena presentation layer without increasing event damage.

The event system uses:

- selected infrastructure stack
- runtime infrastructure burn
- AI/API exposure
- cloud credit lifecycle
- product progress
- user growth
- regulated/enterprise profile
- current Founder Week
- existing infrastructure event history

No live pricing APIs, provider SDKs, cloud credentials, or exact billing claims are used.

## Trigger Rules

Infra events are conservative:

- no events before Week 3
- no more than one infra event per sprint
- no open-event stacking
- no repeated event type per run
- maximum 5 infra events per run
- effects require player response
- critical events are recoverable

Events are triggered during sprint simulation after runtime infrastructure burn is calculated. The selected event is written to `startup.aiAnalysis.infrastructure.infraEventHistory`.

## Live Event Types

| Event | Trigger Shape | Player Problem |
|---|---|---|
| Prototype Stack Outgrown | Cheap/static/Replit stack plus product traction | MVP infrastructure is carrying real traffic. |
| Serverless Bill Spike | Vercel/serverless/edge stack plus usage volatility | Usage-based compute is getting expensive. |
| Database Connection Limit | DB-heavy stack plus users/product pressure | Database concurrency is throttling reliability. |
| Bandwidth / Egress Surprise | High transfer, viral traffic, AWS/GCP/Vercel/Cloudflare-like stack | Momentum is turning into egress burn. |
| Logs & Observability Spike | Growth-stage traffic or high product progress | Logging and monitoring costs are becoming visible. |
| Cloud Credits Cliff | Credits low, near expiry, or masking gross burn | Effective burn is about to jump. |
| LLM Token Bill Shock | AI-heavy stack or heavy/agentic/multimodal usage | Token usage is outrunning pricing. |
| Compliance Infrastructure Audit | Fintech/healthcare/enterprise/regulated profile | Trust requirements exceed infra posture. |
| Enterprise Reliability Review | Enterprise trust need plus weaker reliability stack | Customer wants proof the system can survive. |
| GPU Inference Overload | Multimodal AI plus spiky demand | Inference capacity is exposed to traffic spikes. |

At least 8 event types are covered in the test suite.

## Response Choices

Each event has 3-4 validated responses. Examples:

- optimize prompts and caching
- rate limit free usage
- upgrade database tier
- add connection pooling
- compress payloads
- tighten CDN rules
- negotiate credit extension
- fund a security audit
- publish a reliability plan

Responses apply moderate deterministic effects:

- cash delta
- product progress delta
- investor score delta
- risk score delta

They do not directly change death thresholds, scoring formulas, funding math, leaderboard math, or career formulas.

## Persistence

Infrastructure event history is stored under:

`startup.aiAnalysis.infrastructure.infraEventHistory`

Each record includes:

- id
- type
- Founder Week
- severity
- title
- trigger reason
- response options
- selected response id
- resolved flag
- effects summary
- created/resolved timestamps

History is capped to keep JSON state bounded.

## Player Counterplay

The model is warning-first:

- credit cliffs warn before the bill shock becomes a live event
- AI token shocks require meaningful AI/API exposure
- cheap-stack events require traction
- compliance audits require regulated or enterprise context
- enterprise reliability reviews require real customer/trust pressure

The player should feel infrastructure pressure, not arbitrary punishment.

## UI

Infra Console shows:

- open infra event
- severity and trigger reason
- response choices
- effect previews
- event history grouped by Founder Week
- selected response and effect summary
- links back to Operate

Operate page shows a stronger banner when an infra event is open and links to the Infra Console.

Critical events can render through the shared `EventRevealPanel` / `EventImpactBanner` system when the event is critical, a cloud credit cliff, LLM token bill shock, prototype-stack pressure late in the run, or compliance pressure for regulated startups.

## Arena Feed Integration

Phase 16G adds idempotent Arena Feed entries:

- trigger entry: `Infrastructure Warning: {event title}`
- resolution entry: `Infra Response Resolved: {response title}`

Feed entries use safe, generic infrastructure language. They do not expose private pitch text, exact provider pricing, or real billing claims.

Resolution entries summarize the selected response and bounded effects. Duplicate trigger/resolution feed entries are prevented by deterministic ids.

## Light Cross-System Hooks

Phase 16G adds light awareness only:

- strategy: resolved infra responses can emit small playstyle signals, such as Technical Builder, Regulated Operator, Cockroach, or Capital Blitzscaler.
- documentary/story: major infra feed entries can become timeline moments after Demo Day.
- boardroom/social: UI copy explains that unresolved infra risk may become investor or trust pressure later, but no new boardroom or social penalty chains are live.

These hooks do not change strategy scoring formulas, boardroom trigger math, social backlash mechanics, death thresholds, funding math, leaderboard formulas, or career formulas.

## Balance Guardrails

Current guardrails:

- no instant death
- max direct cash impact per event response
- max risk/investor/product deltas
- no more than 5 infra events per run
- no open-event stacking
- no repeat event types per run

Phase 16F/16G is intentionally conservative. It should be playtested before adding boardroom hearings, social backlash, rival sabotage, or response modifiers that alter event severity.

## Deferred Integrations

Deferred:

- boardroom infra hearings
- social backlash penalty chains
- rival attacks on infrastructure reliability
- strategy synergies that modify infra response effectiveness
- live outage chains
- exact cloud/provider pricing

## Safety

Phase 16F does not add:

- external APIs
- pricing APIs
- provider SDKs
- cloud credentials
- OAuth
- analytics
- telemetry
- payment integrations
- API keys or secrets
- LLM calls
