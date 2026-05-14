# Phase 10: Market Data Adapter Hardening

## Overview

Phase 10 hardens the market data adapter pipeline introduced in Phase 9. It adds signal persistence, run lifecycle tracking, active snapshot selection, automated cron-based generation, provider health monitoring, and comprehensive test coverage.

## Schema Changes

### Migration: `20260502224543_phase10_market_data_hardening`

- **`MarketSignal.dataRunId`** (String, indexed) — links each signal to its generation run
- **`MarketSnapshot.isActive`** (Boolean, default `false`) — only active snapshots affect gameplay
- **`MarketSnapshot.activatedAt`** (DateTime?) — timestamp of activation

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Providers     │────▶│  Normalizer  │────▶│ Interpreter │────▶│ Snapshot Builder │
│ (static/external│     │ (dedup, map) │     │ (aggregate) │     │ (persist, build) │
└─────────────────┘     └──────────────┘     └─────────────┘     └──────────────────┘
                                                                           │
                                                                           ▼
                                                                  ┌─────────────────┐
                                                                  │ MarketDataRun   │
                                                                  │ MarketSnapshot  │
                                                                  │ MarketSignal    │
                                                                  │ MarketEvent     │
                                                                  └─────────────────┘
```

## Key Features

### 1. Signal Persistence

Individual `MarketSignal` records are now persisted during snapshot generation:

- Upsert via `sourceId` unique constraint (prevents duplicates)
- `skipDuplicates: true` in `createMany` for safety
- Each signal linked to its `MarketDataRun` via `dataRunId`
- Hash-based deduplication before persistence

### 2. MarketDataRun Lifecycle

Every generation creates a `MarketDataRun` record with full lifecycle tracking:

| Status    | Meaning                                  |
|-----------|------------------------------------------|
| `pending` | Run started, fetching signals            |
| `success` | All signals fetched and snapshot built   |
| `partial` | Some warnings or fallback used           |
| `failed`  | Error occurred, details in `error` field |

Fields: `startedAt`, `completedAt`, `signalsFetched`, `signalsStored`, `snapshotId`, `error`, `metadata`

### 3. Active Snapshot Selection

Only snapshots with `isActive = true` affect gameplay:

1. Prefer adapter-created snapshot for current month where `isActive = true`
2. Fallback to any snapshot for current month
3. Fallback to seeded Phase 6 scenario for the month

Activation deactivates any previously active snapshots for the same month.

### 4. Preview Before Generate

Admin UI supports previewing snapshot results before generating:

```typescript
await previewMarketSnapshotAction(mode); // Server action
```

Preview returns: signal count, confidence, macro changes, hot/cold sectors, warnings.

### 5. Cron Endpoint

**`POST /api/cron/market-snapshot`**

Automated generation endpoint for scheduled jobs:

- Requires `Authorization: Bearer <CRON_SECRET>`
- Idempotent: skips if active snapshot already exists for today
- Uses `MARKET_DATA_PROVIDER_MODE` env var (default: `static`)

**`GET /api/cron/market-snapshot`**

Health check endpoint returning current active snapshot info.

### 6. Provider Status

Real-time provider availability reporting:

| Provider | Availability Check                          |
|----------|--------------------------------------------|
| static   | Always available                           |
| newsapi  | `NEWS_API_KEY` present and length > 10     |
| fred     | `FRED_API_KEY` present and length > 10     |

External mode falls back to static if no external providers are available.

### 7. Admin Signal Read View

The `/market` page now includes an admin-only panel showing:

- Provider status cards (configured / available / error)
- Latest data run summary (mode, status, signals, duration)
- Latest 10 normalized market signals with metadata

## Error Handling

New error classes:

- **`ProviderUnavailableError`** — thrown when external providers cannot be reached
- **`SnapshotGenerationError`** — thrown during snapshot build with stage context

All errors are caught, logged to the data run record, and surfaced to the admin UI.

## Environment Variables

```bash
# Cron secret for automated snapshot generation
CRON_SECRET="your-cron-secret-min-32-chars"

# Default provider mode for cron endpoint
MARKET_DATA_PROVIDER_MODE="static"

# External provider API keys (optional)
NEWS_API_KEY=""
FRED_API_KEY=""
```

## Test Coverage

Phase 10 adds 26 new tests across:

- Provider availability (static/newsapi/fred status)
- Error classes (ProviderUnavailableError, SnapshotGenerationError)
- Admin authorization (email validation)
- Signal deduplication (hash stability, edge cases)
- Cron auth logic (token validation, secret length)
- Snapshot builder mocked tests (persistSignals empty array)

**Total: 163 tests passing**

## Files Added/Modified

| File | Change |
|------|--------|
| `prisma/migrations/20260502224543_phase10_market_data_hardening/` | Schema migration |
| `lib/market-data/errors.ts` | Error classes |
| `lib/market-data/types.ts` | New types (PreviewSnapshotResult, ProviderStatus, etc.) |
| `lib/market-data/service.ts` | `generateAndActivateMarketSnapshot`, `previewMarketSnapshot`, `getProviderStatus` |
| `lib/market-data/snapshot-builder.ts` | `persistSignals`, `createDataRun`, `completeDataRun`, `activateMarketSnapshot`, `getActiveMarketSnapshot` |
| `app/api/cron/market-snapshot/route.ts` | Cron endpoint (POST + GET) |
| `app/(game)/market/admin-signals-panel.tsx` | Admin signal read view component |
| `app/(game)/market/page.tsx` | Integrated admin panel |
| `lib/actions/market-data.ts` | `previewMarketSnapshotAction`, `getMarketDataFullStatus` |
| `tests/unit/market-data-hardening.test.ts` | 26 new tests |
| `.env.example` | Added `CRON_SECRET` |
| `docs/PHASE_10_MARKET_DATA_HARDENING.md` | This document |

## Safety Rules

1. **Only activated snapshots affect gameplay** — raw signals never directly control simulation
2. **Idempotent cron** — daily cron won't regenerate if snapshot already exists today
3. **Safe external stubs** — providers return empty arrays without API keys, never throw at build time
4. **Hash deduplication** — same `sourceId + title` from same source is treated as one signal
5. **Forward migrations only** — never use `prisma db push` for schema changes
