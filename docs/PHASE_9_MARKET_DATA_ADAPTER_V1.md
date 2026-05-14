# Phase 9: Market Data Adapter v1

## Overview

The Market Data Adapter v1 introduces a provider-adapter architecture that brings external market signals into Founder Arena through a safe, deterministic pipeline:

```
External/Raw Signals → Normalized Signals → Deterministic Interpretation → Proposed Market Snapshot → Active Snapshot
```

This design ensures the game remains fair, testable, and safe — external signals inform but do not directly control gameplay.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
│ Data Providers  │────▶│ Normalizer   │────▶│ Interpreter │────▶│ Snapshot Builder │
└─────────────────┘     └──────────────┘     └─────────────┘     └──────────────────┘
       │                                                         │
       │         ┌───────────────────────────────────────────────┘
       │         ▼
       │    ┌─────────────┐     ┌──────────────┐
       └───▶│ MarketSignal│    │ MarketDataRun│
            └─────────────┘     └──────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ MarketSnapshot  │
                              │  + MarketEvent  │
                              └─────────────────┘
```

## Provider Interface

All providers implement `MarketDataProvider`:

```typescript
interface MarketDataProvider {
  readonly name: string;
  readonly isAvailable: boolean;
  fetchSignals(config: ProviderConfig): Promise<RawMarketSignal[]>;
}
```

### Available Providers

| Provider | Key Required | Behavior |
|----------|-------------|----------|
| `StaticProvider` | None | Deterministic signals based on month index. Always available. |
| `NewsApiProvider` | `NEWS_API_KEY` | Skeleton stub. Returns empty unless implemented. |
| `FredProvider` | `FRED_API_KEY` | Skeleton stub. Returns empty unless implemented. |

### Adding a Real Provider

1. Create `lib/market-data/providers/your-provider.ts`
2. Extend `BaseProvider`
3. Implement `fetchSignals()`
4. Register in `lib/market-data/service.ts`
5. Add env var to `.env.example`

## Static Provider Behavior

The static provider generates 10 deterministic signals each month:

- AI Enterprise Adoption
- Inflation Pressure
- Geopolitical Risk
- Crypto Sentiment
- Regulatory Environment
- Energy Price Volatility
- Supply Chain Pressure
- Venture Capital Climate
- Consumer Spending Outlook
- Enterprise Software Budgets

Signal severity and direction vary deterministically by month index using sine waves and modulo cycles. This creates realistic market variation without API keys.

## Data Normalization Rules

The normalizer (`lib/market-data/normalizer.ts`) processes raw signals:

1. **Deduplication**: Stable hash based on `source:sourceId:title`
2. **Sector Mapping**: Keyword matching against 12 sector categories
3. **Region Mapping**: Keyword matching against 7 region categories
4. **Macro Dimension Mapping**: Each signal type maps to 1-2 macro dimensions
5. **Severity/Confidence Bounding**: Clamped to 1-100
6. **Effect Calculation**: Per-signal-type weighted deltas:
   - AI: high revenue/valuation impact
   - Crypto: high volatility impact
   - Regulation: high burn/risk impact
   - Funding: high investor/valuation impact
   - etc.

## Snapshot Builder Rules

The interpreter (`lib/market-data/interpreter.ts`) aggregates signals:

1. **Weighted Aggregation**: `severity × confidence` as weight
2. **Macro Scoring**: Weighted average per dimension, dampened to ±80
3. **Sector Modifiers**: Per-sector weighted averages, bounded
4. **Condition Determination**:
   - Bullish: positive weight > negative weight × 1.3
   - Bearish: negative weight > positive weight × 1.3
   - Neutral: otherwise
5. **Conflicting Signal Moderation**: Equal opposing signals cancel out

The snapshot builder stores:
- `MarketSnapshot` with macro scores, sector trends, scenario key
- `MarketEvent` with condition-based event
- `MarketDataRun` with generation metadata

## Admin Route Usage

The `/market` page includes an admin-only snapshot generation panel.

**Who can generate:**
- Development: any authenticated user
- Production: only emails in `ADMIN_EMAILS` env var

**Modes:**
- `static`: deterministic signals (no API keys)
- `seeded`: reset to Phase 6 preset scenarios
- `external`: use configured external providers (falls back to static if none available)

Rate limited: uses existing `aiAnalysis` rate limit (5/min).

## Public /market Changes

The market page now displays:
- **Source mode badge**: static / seeded / external
- **Confidence score**: from interpreted market state
- **Top signals**: highest-impact normalized signals
- **Limitations**: disclaimers about data simplification
- **Timeline**: shows adapter mode per snapshot

## Simulation Integration

When a simulation month runs:
1. `getMarketSnapshotForMonth` tries current real month first (adapter snapshots)
2. Falls back to seeded 2024 scenarios if no adapter snapshot exists
3. `SimulationMonth.metadata` stores:
   - `snapshotId`
   - `scenarioKey`
   - `signalSourceMode`

This ensures existing gameplay continues working regardless of adapter state.

## Safety / Fairness Design

- **No direct gameplay control**: External signals are normalized and interpreted through deterministic rules
- **Bounded effects**: All deltas clamped to safe ranges
- **Conflicting signals moderate**: No single signal can dominate
- **Fallback always available**: Static provider works without any API keys
- **No build-time external calls**: Providers only called at runtime
- **No secrets exposed**: API keys only in server environment

## Limitations

- External providers are stubs (NewsAPI, FRED) — implementation requires real API integration
- Static provider is deterministic and not truly "live"
- In-memory rate limiting (same as Phase 8)
- No background jobs — snapshots generated on-demand
- Single snapshot per month (last write wins)

## How to Add Real Providers Later

1. **NewsAPI**: Implement fetch in `newsapi-provider.ts`
   - Call `/everything` endpoint with tech/finance queries
   - Use basic sentiment analysis (keyword-based or lightweight NLP)
   - Map articles to signals

2. **FRED**: Implement fetch in `fred-provider.ts`
   - Call series API for economic indicators
   - Detect month-over-month changes
   - Map to macro signals

3. **Custom provider**: Create new provider file, register in service

## Next Phase Recommendations

1. **Implement real NewsAPI/FRED fetching**
2. **Background snapshot generation** (cron or scheduled function)
3. **Signal persistence** and historical signal analysis
4. **Multi-signal weighting** from user feedback
5. **Real-time price data** for crypto/equity sectors
