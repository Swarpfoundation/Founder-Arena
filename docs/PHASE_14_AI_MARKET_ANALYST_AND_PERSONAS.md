# Phase 14: AI Market Analyst & Investor Personas

## Overview

Phase 14 deepens the AI layer of Founder Arena with structured narratives, investor committee personas, richer VC memos, monthly board updates, and founder coaching — all while preserving the core safety rule that AI never controls deterministic game math.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  AI Provider Layer                                          │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ OpenAIProvider│  │ MockProvider │  (boot-time switch)    │
│  └──────────────┘  └──────────────┘                        │
│         │                 │                                 │
│         └─────────┬───────┘                                 │
│                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Shared Capabilities                                     ││
│  │  • analyzeStartupIdea()                                  ││
│  │  • reviewPitch()                                         ││
│  │  • generateCommitteeReview()        ← NEW                ││
│  │  • generateMarketAnalystNarrative() ← NEW                ││
│  │  • generateMonthlyBoardUpdate()     ← NEW                ││
│  │  • generateFounderCoaching()        ← NEW                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐         ┌──────────┐          ┌──────────┐
   │ Prompts │         │ Committee│          │ Market   │
   │ Builder │         │ Logic    │          │ Analyst  │
   └─────────┘         └──────────┘          └──────────┘
```

## Personas

Six investor personas are defined in `lib/ai/personas.ts`:

| ID | Name | Role | Focus |
|---|---|---|---|
| `generalist` | Alex Chen | Generalist VC Partner | Pattern-matching, founder quality, TAM |
| `technical` | Dr. Sarah Nakamura | Technical Deeptech Partner | IP moats, engineering depth, defensibility |
| `fintech` | Marcus Webb | Fintech & Regulatory Partner | Unit economics, compliance, recurring revenue |
| `growth` | Priya Sharma | Growth & Consumer Partner | CAC/LTV, viral loops, brand |
| `cfo` | James Roth | CFO & Unit Economics Partner | Margins, path to profitability, burn |
| `skeptic` | Elena Volkov | Skeptical Risk Partner | Downside scenarios, market timing, execution risk |

Each persona has a `scoringBias` object that adjusts their perception of the five base scores (problem, solution, market, team, business).

## Committee Review

`lib/ai/committee.ts` provides deterministic committee generation:

1. For each persona, compute a biased score using their scoring bias
2. Generate a persona-specific note from sector-aware templates
3. Aggregate consensus:
   - `supportLevel`: average of all persona scores
   - `mainObjections`: notes from personas scoring < 60
   - `whatWouldChangeTheirMind`: actionable suggestions
   - `termsStance`: aggressive | standard | cautious | pass

The OpenAI provider enriches the deterministic committee with better prose while preserving all scores and structure.

## Prompt Builders

Centralized in `lib/ai/prompts/`:

- `startup-analysis.ts` — truncates inputs to 500 chars, includes schema expectations
- `vc-review.ts` — same truncation + schema
- `market-analyst.ts` — builds from snapshot macro scores, sector trends, top signals
- `monthly-board-update.ts` — uses simulation result data

All prompts include: "Deterministic game math is authoritative. Do not invent exact data sources."

## Output Schemas

Defined in `lib/ai/schemas.ts`:

- `startupAnalysisSchema` — scores, summary, risks, strengths, valuation
- `vcReviewSchema` — decision, scores, memo, milestones, proposed terms
- `investorPersonaReviewSchema` — persona-specific score, note, stance
- `committeeConsensusSchema` — support level, objections, quotes, persona reviews
- `marketAnalystNarrativeSchema` — brief, sectors, climate, risks, opportunities
- `monthlyBoardUpdateSchema` — title, what went well/wrong, investor reaction, lesson, recommendations
- `founderCoachingNoteSchema` — strong/weak decision, next action, lesson

## Fallback Behavior

```
OpenAI call
    │
    ├─► Timeout (30s) ──────────────┐
    ├─► Network error ──────────────┤
    ├─► HTTP error ─────────────────┤
    └─► Parse failure ──────────────┤
                                    ▼
                         MockProvider fallback
                                    │
                                    ├─► Deterministic scores
                                    ├─► Sector-aware text
                                    └─► Valid JSON output
```

All fallbacks are logged via observability utilities with safe metadata (no prompts, no pitch text).

## Data Storage

No schema migration required. New data uses existing JSON fields:

| Data | Field |
|---|---|
| Committee review | `VcReview.rawResponse.committee` |
| Founder coaching (pitch) | `VcReview.rawResponse.coaching` |
| Monthly board update | `SimulationMonth.metadata.boardUpdate` |
| Market analyst narrative | `MarketSnapshot.metadata.aiNarrative` |
| Founder coaching (terms) | `Startup.aiAnalysis.termSheetCoaching` |
| Founder coaching (final) | `Startup.aiAnalysis.finalCoaching` |

## UI Changes

### `/market`
- AI Market Brief card below Current Scenario
- Executive brief, investor climate, risk watchlist, opportunity map
- Confidence label + gameplay note
- Deterministic fallback works with no visual difference

### `/startup/[id]/review`
- Investment Committee section with 6 persona cards
- Committee Consensus card with support bar, strongest support/objection quotes
- Founder Coaching card (4 bullets: strong decision, weak decision, next action, lesson)
- Graceful fallback for legacy reviews without committee data

### `/startup/[id]/operate`
- Monthly history cards show board update title, investor reaction, founder lesson, recommended next move
- Graceful fallback for months without structured board updates

## Observability

- `withTiming` wraps all new AI calls
- Safe events tracked: `ai_committee_generated`, `ai_market_analyst_generated`, `ai_board_update_generated`, `ai_coaching_generated`
- Logs include: provider, sector, schema name, durationMs, success/failure
- Never logs: raw prompts, full pitch text, user inputs

## Safety Rules

1. AI never sets cash, burn, runway, valuation, leaderboard score, final outcome, or state transitions
2. All AI outputs are parsed and validated with Zod
3. OpenAI failures fall back to deterministic mock provider
4. No secrets in logs or health endpoints
5. Prompts truncate user inputs at 500 chars
6. Market analyst includes disclaimer: "Current game market snapshot indicates... Not financial advice."

## Limitations

- Committee reviews are deterministic when OpenAI is unavailable (same inputs = same outputs)
- Market analyst narrative is cached per snapshot to avoid regeneration
- Monthly board updates are generated once per simulation month
- Founder coaching is generated at key milestones only

## Next Phase Recommendation

Phase 15 could focus on:
- **Social/sharing features**: public startup profiles, founder leaderboards by sector
- **Advanced simulation events**: randomized crisis events with AI-generated narratives
- **Multiplayer/competitive mode**: async founder duels (if scope allows)
- **AI voice/personality**: distinct voices for each committee persona
