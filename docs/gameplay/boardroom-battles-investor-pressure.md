# Boardroom Battles / Investor Pressure Events v0.1

## Overview

Boardroom Battles adds dramatic investor and boardroom pressure moments to every 12-week accelerator run. When key game metrics hit critical thresholds, a pressure event fires — surfacing an open event on the `/startup/[id]/boardroom` route with 3–5 response options, each with distinct tradeoffs.

One open event at a time. Effects apply immediately upon player response. No LLM calls. No external APIs. Fully deterministic.

---

## How to Access

- **BOARD tab** in the startup action bar → `/startup/[id]/boardroom`
- Arena Feed notifications when a boardroom event fires (category: `boardroom`)

---

## Domain Models

### BoardroomState

Stored as `socialState.boardroomState` (JSON field on `SocialState`).

| Field | Type | Description |
|---|---|---|
| `currentOpenEvent` | `BoardroomEvent \| null` | Active unresolved event |
| `eventHistory` | `BoardroomEvent[]` | All resolved events (max 20) |
| `boardConfidence` | `number` (0–100) | Board's confidence in the founder |
| `investorPatience` | `number` (0–100) | Investor patience remaining |
| `founderControl` | `number` (0–100) | Founder's decision-making authority |
| `pressureLevel` | `number` (0–100) | Cumulative pressure |
| `lastTriggeredMonth` | `number \| null` | Month of last triggered event |

**Defaults**: boardConfidence=60, investorPatience=70, founderControl=80, pressureLevel=0

### BoardroomEvent

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Deterministic event ID |
| `pressureType` | `BoardroomPressureType` | Which pressure type triggered this |
| `severity` | `BoardroomSeverity` | low / medium / high / critical |
| `title` | `string` | Event title |
| `concern` | `string` | Board's stated concern |
| `boardQuestion` | `string` | Direct question to founder |
| `contextSummary` | `string` | Context from game state |
| `responseOptions` | `BoardroomResponseOption[]` | 3–5 choices |
| `selectedResponseId` | `string?` | Chosen response (after resolution) |
| `resolved` | `boolean` | Whether event is closed |
| `appliedEffects` | `BoardroomEffect?` | Effects applied on resolution |
| `outcomeNarrative` | `string?` | Short narrative after resolution |

### BoardroomResponseOption

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique response ID |
| `title` | `string` | Short response title |
| `stance` | `BoardroomResponseStance` | Approach stance |
| `description` | `string` | What this response does |
| `requirements` | `BoardroomResponseRequirements?` | Optional lock conditions |
| `projectedEffects` | `BoardroomEffect` | Effects shown before choosing |
| `risk` | `low \| medium \| high` | Risk level |
| `recommendedForPlaystyles` | `string[]?` | Synergistic playstyles |

### BoardroomEffect

All fields optional. Applied to startup state and boardroomState on resolution.

| Field | Impact |
|---|---|
| `investorScoreDelta` | Startup.investorScore |
| `boardConfidenceDelta` | boardroomState.boardConfidence |
| `revenueDelta` | Startup.revenue (next month) |
| `burnDelta` | Startup.monthlyBurn |
| `productProgressDelta` | Startup.productProgress |
| `riskScoreDelta` | Startup.riskScore |
| `valuationDelta` | Startup.valuation |
| `socialTrustDelta` | socialState.trust |
| `socialHypeDelta` | socialState.hype |
| `brandRiskDelta` | socialState.brandRisk |
| `founderControlDelta` | boardroomState.founderControl |
| `investorPatienceDelta` | boardroomState.investorPatience |
| `strategySignal` | Emits a strategy signal for the given playstyle |

---

## Trigger Logic

Triggers are evaluated at the end of each sprint simulation, after social/rival/strategy layers.

**Guards:**
- One open event at a time (no double-trigger)
- Minimum 2-month cooldown between events
- Each pressure type fires at most once per run (tracked via `eventHistory`)

**Triggers (in priority order):**

| Pressure Type | Condition | Min Month |
|---|---|---|
| `runway_crisis` | runwayMonths ≤ 2 | 2 |
| `compliance_risk` | riskScore ≥ 85 | 3 |
| `investor_conflict` | investorScore ≤ 35 | 2 |
| `brand_risk` | brandRisk ≥ 70 | 2 |
| `revenue_miss` | revenue = 0 | 6 |
| `burn_rate` | burn > 3× revenue AND revenue > 0 | 4 |
| `product_delay` | productProgress < 40 | 6 |
| `rival_pressure` | rivalryMaxScore ≥ 70 | 3 |
| `fundraising_pressure` | month ≥ 9 AND runway ≤ 5 AND investorScore < 60 | 9 |

---

## Event Catalog

8 event types implemented in v0.1:

| Type | Severity | Title |
|---|---|---|
| `runway_crisis` | critical | Emergency Runway Meeting |
| `investor_conflict` | high | Investor Confidence Crisis |
| `revenue_miss` | high | Revenue Miss Debrief |
| `product_delay` | medium | Product Roadmap Review |
| `brand_risk` | high | Brand Risk Hearing |
| `rival_pressure` | medium | Rival Pressure Review |
| `burn_rate` | medium | Board Burn Rate Intervention |
| `compliance_risk` | high | Compliance Risk Review |
| `fundraising_pressure` | medium | Fundraising Strategy Meeting |

---

## Integration Points

### Sprint Simulation Flow

Added after the strategy layer, before the death check, in `runMonthlySimulationAction`:

```
social layer → rival layer → strategy layer → [BOARDROOM TRIGGER] → death check
```

The boardroom trigger:
1. Reads current `boardroomState` from `socialState.boardroomState`
2. Calls `selectBoardroomTrigger(ctx)` to check if any trigger fires
3. If a trigger fires: generates event, updates state, creates a feed item
4. Writes updated `boardroomState` to `socialState` in the DB transaction

### Arena Feed Integration

When a boardroom event fires, a feed item is written with:
- `category: "boardroom"`
- `source: "boardroom"`  
- `severity: "critical"` for runway/investor events, `"warning"` for brand/compliance, `"neutral"` for others

When a boardroom event is resolved (via `respondToBoardroomEvent`), a resolution feed item is also written.

### Strategy Signal Integration

Certain response options emit a `strategySignal`. When chosen, the boardroom server action creates a `StrategySignal` entry in `socialState.strategySignals`, contributing to the strategy archetype detection system.

---

## Server Actions

### `getBoardroomState(startupId): BoardroomPageData`

Reads boardroomState from socialState. Returns full page data for the boardroom UI.

### `respondToBoardroomEvent(startupId, eventId, responseId)`

Validates and applies a boardroom response:
1. Checks response requirements (cash, investorScore, productProgress, etc.)
2. Applies projected effects to `startup` (investorScore, riskScore)
3. Applies social effects to `socialState` (trust, hype, brandRisk)
4. Updates `boardroomState` (confidence, patience, founderControl)
5. Writes resolution feed item
6. Optionally emits strategy signal

---

## Persistence

BoardroomState is stored as `boardroomState Json @default("{}")` on the `SocialState` model. This follows the same pattern as `rivalProfiles`, `strategySignals`, `feedItems`, and `actionsTaken`.

**Migration:** `prisma/migrations/20260517000000_add_boardroom_state_v1/migration.sql`

No new DB table. No new Prisma model. Serializes cleanly to/from JSON.

---

## UI — `/startup/[id]/boardroom`

Three panels:

1. **Open Event Panel** (if event exists): shows concern, board question, and 3–5 response options. Locked options show reason. Projected effects displayed per option. Confirm button submits response.

2. **Board Dynamics Panel**: shows boardConfidence, investorPatience, founderControl, pressureLevel as progress bars.

3. **Event History Panel**: shows all resolved events in reverse chronological order with the chosen stance and outcome narrative.

**Empty state**: Shows the 6 trigger conditions for player awareness.

**Action bar**: BOARD tab added as 9th tab (amber color). Grid changes from `md:grid-cols-8` to `md:grid-cols-9`.

---

## Safety Confirmation

- No external APIs
- No LLM/AI calls
- No OpenAI/Claude/Kimi API calls
- No OAuth added
- No API keys added
- No image generation
- No real social posting
- No analytics SDKs
- No telemetry SDKs
- No secrets

---

## Known Limitations (v0.1)

1. **Effects are applied as-is**: No "best/worst case" variance — projected effects == actual effects. v0.2 could add mild randomization.
2. **Revenue/burn deltas not persisted to simulation**: The `revenueDelta` and `burnDelta` effects update the startup's base fields, but the change isn't recorded in a SimulationMonth. It takes effect in the next month's simulation.
3. **No boardroom notification on main dashboard**: The open event is only visible via the BOARD tab. v0.2 could add an inline alert on the startup profile page.
4. **One event type per run**: Each pressure type can only fire once per run. Complex scenarios requiring repeated pressure are not modeled.

---

## Future Roadmap

- **v0.2**: Add acquisition_pressure and growth_expectation event types
- **v0.2**: Mild effect variance for "actual" vs "projected" outcomes
- **v0.3**: Inline boardroom alert on startup profile page  
- **v0.4**: boardConfidence/investorPatience feed into finalization scoring
- **v1.0**: Board member personas with distinct response preferences
