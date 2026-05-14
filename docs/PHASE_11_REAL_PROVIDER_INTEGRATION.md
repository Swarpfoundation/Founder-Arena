# Phase 11: Real External Market Data Providers v1

## Overview

Phase 11 implements real external market data providers with safe fallback orchestration, source confidence weighting, and comprehensive observability. The pipeline remains:

```
external providers → raw signals → normalizer (dedup + cap) → interpreter → activated snapshot → simulation
```

External data never directly controls gameplay. Only activated `MarketSnapshot` records affect the simulation.

## Providers Implemented

### 1. NewsAPI Provider
**File:** `lib/market-data/providers/newsapi-provider.ts`

- **Endpoint:** NewsAPI `/v2/everything`
- **Requires:** `NEWS_API_KEY` env var
- **Queries:** Rotates through 10 categories (AI, VC/funding, inflation, crypto, fintech, supply chain, energy, geopolitical, consumer, enterprise)
- **Safety:**
  - 10s timeout via `AbortController`
  - Max 20 articles per request
  - Last 7 days only
  - Filters `[Removed]` articles
  - HTTP errors (429, etc.) return empty array
  - Network errors return empty array
- **Signal Mapping:**
  - `signalType`: keyword-matched from title + description
  - `direction`: sentiment heuristic (positive/negative/neutral keywords)
  - `severity`: 20-70 (news never maxes out)
  - `confidence`: 50 (capped to 60 by normalizer)

### 2. FRED Provider
**File:** `lib/market-data/providers/fred-provider.ts`

- **Endpoint:** FRED API `/fred/series/observations`
- **Requires:** `FRED_API_KEY` env var
- **Series Monitored:**
  - `FEDFUNDS` — Federal Funds Rate → `signalType: inflation`
  - `UNRATE` — Unemployment Rate → `signalType: macro`
- **Safety:**
  - 10s timeout
  - Graceful handling of empty/missing observations
  - HTTP errors return empty array
- **Signal Mapping:**
  - `direction`: Rate hike = negative (tighter money); Rate cut = positive
  - `severity`: 30-75 based on magnitude of change
  - `confidence`: 80 (capped to 85 by normalizer)

### 3. Crypto Provider (No API Key)
**File:** `lib/market-data/providers/crypto-provider.ts`

- **Endpoint:** CoinGecko `/api/v3/simple/price` (public, no key required)
- **Requires:** No env var
- **Data:** BTC and ETH 24h price change %
- **Safety:**
  - 8s timeout
  - HTTP errors return empty array
  - Rate limiting handled gracefully
- **Signal Mapping:**
  - `signalType: crypto`
  - `direction`: >3% = positive, <-3% = negative
  - `severity`: 20-60 based on magnitude
  - `confidence`: 50 (capped to 55 by normalizer)
  - ETH signal included only when direction conflicts with BTC (lower confidence)

## Provider Modes

| Mode | Behavior | Fallback |
|------|----------|----------|
| `static` | Deterministic signals only | None |
| `external` | External providers only | Configured fallback or fail |
| `hybrid` | External + static signals combined | Static already included |
| `seeded` | Phase 6 preset scenarios | None |

### Fallback Configuration

Set `MARKET_DATA_EXTERNAL_FALLBACK` env var:
- `static` (default) — fallback to static provider if external fails
- `seeded` — fallback to seeded scenarios
- `none` — no fallback; fail gracefully with error

## Source Confidence Caps

To prevent any single source from dominating the market state:

| Source | Confidence Cap |
|--------|---------------|
| newsapi | 60 |
| fred | 85 |
| crypto | 55 |
| static | 70 |

Applied in the normalizer after bounding to 1-100. Unknown sources are uncapped.

## Enriched MarketDataRun Metadata

Each generation run records:

```typescript
{
  providerSourcesRequested: ["newsapi", "fred", "crypto"],
  providerSourcesUsed: ["newsapi", "static"],
  providerErrors: { fred: "HTTP 500" },
  fallbackUsed: true,
  totalRawSignals: 15,
  totalNormalizedSignals: 12,
  confidence: 65,
  limitations: [
    "External provider data may be incomplete or delayed.",
    "News signals are heuristic-based, not quantitative analysis.",
    ...
  ]
}
```

## Cron Endpoint

**POST /api/cron/market-snapshot**

- Uses `MARKET_DATA_PROVIDER_MODE` env var
- Supports all modes: static, external, hybrid, seeded
- Returns `providerSourcesUsed` and `fallback` in response
- Idempotent: skips if active snapshot already created today

**GET /api/cron/market-snapshot**

- Health check
- Returns current mode, fallback config, and active snapshot info

## Environment Variables

```bash
# Provider API keys (optional)
NEWS_API_KEY=""
FRED_API_KEY=""

# Mode and fallback
MARKET_DATA_PROVIDER_MODE="static"      # static | external | hybrid | seeded
MARKET_DATA_EXTERNAL_FALLBACK="static"  # static | seeded | none

# Cron secret
CRON_SECRET=""
```

## Admin UI

The `/market` admin panel shows:
- **Provider Status:** All 4 providers with availability and env var hints
- **Latest Data Run:** Mode, status, signals count, duration, fallback used, provider errors
- **Latest Signals:** Last 10 normalized signals with source, type, direction, severity, confidence

## Testing

Phase 11 adds 37 tests:
- NewsAPI article-to-signal mapping with mocked payloads
- FRED observation-to-signal mapping with mocked payloads
- Crypto provider mapping with mocked CoinGecko payloads
- Source confidence caps
- Interpreter bounds (no single source dominates)
- Provider availability checks
- Fallback behavior
- Error handling (timeout, HTTP errors, network failures)

**Total: 201 tests passing**

## Adding More Providers

1. Create a new file in `lib/market-data/providers/`
2. Extend `BaseProvider`
3. Implement `fetchSignals()` with timeout and error handling
4. Add to `EXTERNAL_PROVIDERS` array in `service.ts`
5. Add confidence cap in `normalizer.ts` if needed
6. Add to `getProviderStatus()` in `service.ts`
7. Add tests with mocked fetch

## Safety Design

1. **No direct gameplay control** — only activated snapshots affect simulation
2. **Timeout-safe** — all external calls have AbortController timeouts
3. **Failure-safe** — any provider failure returns empty array, never crashes pipeline
4. **Confidence caps** — no single source can dominate market state
5. **Bounded severity** — each source type has severity limits
6. **No secrets in client** — all API calls are server-side
7. **Idempotent cron** — won't regenerate if already done today
8. **Fallback configured** — app works without any external API keys

## Limitations

- NewsAPI: Heuristic sentiment analysis, not true NLP. Limited to English articles.
- FRED: Only 2 series monitored. Real economic data is monthly, not real-time.
- Crypto: 24h price action only. Not a reliable macro indicator.
- All external data is simplified for gameplay, not financial advice.

## Next Phase Recommendations

- **Phase 12: AI Market Analyst** — Use LLM to synthesize signals into richer market narratives
- **Phase 13: Real-Time WebSocket** — Optional real-time crypto price streaming
- **Phase 14: Historical Backtesting** — Compare adapter snapshots against known market events
