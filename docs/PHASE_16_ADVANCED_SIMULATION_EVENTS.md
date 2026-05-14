# Phase 16: Advanced Simulation Events and Crisis Decision Trees

## Overview

Phase 16 introduces **25+ deterministic simulation events** across 11 categories that add strategic depth to the operating simulation. Events appear as crisis decision trees: the player is presented with a scenario, chooses a response, then selects their monthly decisions. All event effects are bounded, deterministic, and survivable. AI generates narrative flavor and coaching but never controls math.

## Event Architecture

### Core Files

| File | Purpose |
|------|---------|
| `lib/events/types.ts` | Event interfaces, categories, severity levels, PRNG utilities |
| `lib/events/event-library.ts` | 25+ event definitions with choices and effects |
| `lib/events/event-selection.ts` | Deterministic event selection, eligibility, choice filtering |
| `lib/events/event-effects.ts` | Effect application, crisis bonus scoring, difficulty scores |
| `lib/events/event-engine.ts` | Validation, resolution, JSON serialization for Prisma metadata |
| `tests/unit/events.test.ts` | 32 unit tests covering selection, effects, bounds, determinism |

### Event Categories (11)

- **market** — Market corrections, sector booms, supply chain disruptions
- **team** — Key resignations, team conflicts, burnout waves, talent poaching
- **product** — Major outages, whale customer demands
- **security** — Data breach scares, phishing attempts
- **regulatory** — Regulatory inquiries, new compliance rules, patent threats
- **investor** — Investor pressure, warm introductions, strategic partnerships
- **customer** — Viral complaints, churn spikes
- **competitor** — Competitor funding, feature copying
- **finance** — Tax surprises, late enterprise payments
- **viral** — Product Hunt hits, viral moments
- **operational** — Office lease decisions, key vendor acquisitions

### Event Severity

| Severity | Meaning | Max per 12-month run |
|----------|---------|---------------------|
| minor | Low impact, mostly narrative | Unlimited |
| moderate | Noticeable financial/strategic impact | Up to 3 |
| critical | Major crisis requiring tough trade-offs | Up to 2 |

**Total events per run: max 3.**

## Deterministic Selection

Events are selected using a seeded PRNG (`mulberry32`) keyed on `startupId + monthNumber`.

```ts
const seed = hashString(`${startupId}:${monthNumber}`);
const rng = mulberry32(seed);
```

This guarantees:
- Same startup + month = same event (or same null result)
- No hidden randomness in scoring or outcome
- Reproducible runs for testing and debugging

### Eligibility Rules

- `minMonth` / `maxMonth` / `eligibleMonths`
- `eligibleSectors`
- `oncePerRun` deduplication
- Global caps: `MAX_EVENTS_PER_RUN = 3`, `MAX_CRITICAL_EVENTS_PER_RUN = 2`
- State-based choice gating: `minCashRequired`, `minProductProgress`, `minEmployees`

## Event Resolution Flow

```
1. getSimulationState() selects the monthly event deterministically
2. OperateClient renders event card with available choices + effect previews
3. Player selects event response → then selects 1-3 monthly decisions
4. runMonthlySimulationAction() validates event choice + decisions
5. simulateMonth() applies event effects alongside decisions + team + market
6. SimulationMonth.metadata.resolvedEvent stores the full event record
7. AI board update prompt includes event title and narrative
```

## Effect System

Event choice effects use the same delta vocabulary as monthly decisions:

```ts
interface EventEffect {
  cashDelta?: number;       // Negative = cost, positive = gain
  burnDelta?: number;
  revenueDelta?: number;
  productDelta?: number;
  investorDelta?: number;
  marketDelta?: number;
  riskDelta?: number;
  valuationMultiplier?: number;
  revenueMultiplier?: number;
  burnMultiplier?: number;
}
```

Effects are applied in `simulateMonth()` via `applyEventEffects()`:
- Decision costs and event cash deltas are tracked separately
- All multipliers are clamped to safe bounds (revenue 0.5-1.5x, burn 0.8-1.3x, valuation 0.7-1.3x)
- No single effect can instantly kill a startup

## UI Updates

### OperateClient (`app/(game)/startup/[id]/operate/operate-client.tsx`)

- **Event card** appears above decisions when an event is active
- Severity-based styling: minor (neutral), moderate (amber/violet), critical (rose)
- Category icon badges
- Choice buttons show real-time effect previews in monospace
- Decisions are hidden until an event choice is selected (if event present)

### Monthly History

- Event title displayed in month card
- Resolved event card shows: chosen response label, severity badge, AI coaching tip

## Achievements (5 New)

| Key | Title | Unlock Condition |
|-----|-------|-----------------|
| `crisis_manager` | Crisis Manager | Survive any critical event |
| `security_first` | Security First | Choose security-focused response to security event |
| `clutch_founder` | Clutch Founder | High-risk + high-reward choice during critical event |
| `partnership_win` | Partnership Win | Accept or negotiate a strategic partnership |
| `viral_moment` | Viral Moment | Capitalize on a viral product moment |

## Leaderboard Scoring

Event crisis bonus is added to the final leaderboard score:

```ts
const crisisBonus = calculateEventCrisisBonus(eventResolvedList); // 0-25 points
const leaderboardScore = Math.max(0, baseScore + difficultyBonus + crisisBonus);
```

Bonus breakdown:
- Critical event survived: +8
- Moderate event survived: +4
- Minor event survived: +1
- High-risk choice taken: +2 (per event)
- **Hard cap: 25 points**

Leaderboard metadata now includes `crisisBonus` and `eventsResolved` count.

## AI Integration

- AI **narrates** events through the existing `generateMonthlyBoardUpdate` flow
- Event title and narrative are passed as `eventTitle` / `eventSummary` in the board update prompt
- Future enhancement: dedicated `generateEventNarrative()` method for per-choice AI storytelling
- **AI never sets cash, burn, valuation, score, or outcome directly**

## Database

**No schema migration required.** Events are stored in existing fields:

- `SimulationMonth.eventsTriggered` — array of event IDs
- `SimulationMonth.eventTitle` / `eventSummary` — event display text
- `SimulationMonth.metadata.resolvedEvent` — full JSON blob including:
  - `eventId`, `title`, `category`, `severity`
  - `selectedChoiceId`, `selectedChoiceLabel`
  - `effects`, `narrative`, `aiNarrative`, `aiCoaching`

## Testing

32 new unit tests in `tests/unit/events.test.ts`:

- PRNG determinism and bounds
- Library coverage (25+ events, 11 categories, unique IDs)
- Critical effect bounds (no instant-death choices)
- Eligibility filtering (month, oncePerRun, max caps)
- Choice gating (cash requirements)
- Deterministic selection stability
- Effect application arithmetic
- Multiplier clamping
- Crisis bonus capping
- Validation (valid/invalid events and choices)
- JSON serialization round-trip
- Integration with `simulateMonth()`

## Design Principles

1. **Deterministic** — Same inputs always produce the same event
2. **Bounded** — Effects are survivable; no single event ends the run
3. **Strategic** — Choices have real trade-offs; no dominant strategy
4. **Transparent** — Effect previews shown before choosing
5. **Limited** — Max 3 events per run, max 2 critical
6. **AI-Narrated, Human-Controlled** — AI adds flavor, player controls math
