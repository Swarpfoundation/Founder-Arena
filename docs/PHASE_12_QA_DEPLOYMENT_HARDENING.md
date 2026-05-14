# Phase 12: QA, Smoke Tests, Health Checks, and Deployment Hardening

## Overview

Phase 12 hardens the MVP for safe deployment through route auditing, health endpoints, smoke tests, and comprehensive documentation.

## Route Audit Findings

### Issues Found & Fixed

1. **`/register` placeholder** — Showed "Registration form will be implemented here." Since auth is OAuth-only, replaced with server-side redirect to `/login`.

2. **`/api/cron/market-snapshot` GET required secret** — Changed to public health-like endpoint. No generation triggered, no secrets exposed.

3. **`/api/cron/market-snapshot` POST missing secret returned 500** — Now returns `503` in production with `{ status: "not_configured", message: "Cron is not configured" }`.

4. **`console.log` in seed function** — Removed noisy log from `lib/market/snapshot-service.ts`.

### Routes Verified OK

All 20+ routes verified functional:
- 6 public pages (/, /login, /market, /leaderboard, /graveyard, /s/[slug])
- 9 protected game pages (dashboard, profile, startup/*)
- 5 API routes (health, cron, auth, ai, market snapshot)
- Error boundaries (error.tsx, not-found.tsx)

## Health Endpoint

**`GET /api/health`**

Returns safe JSON:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "production",
  "database": "ok",
  "authConfigured": true,
  "marketDataMode": "static",
  "activeMarketSnapshot": "present",
  "timestamp": "2026-05-02T23:20:40.000Z"
}
```

- DB check is lightweight (`count` with `take: 1`)
- If DB fails: returns `503` with `status: "degraded"`, `database: "error"`
- Never exposes secrets
- Version read from `package.json` at runtime (server-side only)

## Cron Endpoint Fix

| Scenario | Before | After |
|----------|--------|-------|
| GET without secret | 401 | 200 (public health check) |
| POST missing CRON_SECRET in prod | 500 | 503 |
| POST wrong token | 401 | 401 |
| POST valid token | 200 | 200 |

## Smoke Tests

### HTTP Smoke (`npm run smoke`)

Verifies 10 routes against a running app:
- Landing, login, market, leaderboard, graveyard
- Health endpoint, cron health endpoint
- Register redirect, dashboard redirect (unauth)
- Missing share page 404

Uses Node.js built-in `fetch`. No external dependencies.

### DB Smoke (`npm run smoke:db`)

Verifies database state:
- Prisma connectivity
- Market snapshots exist
- Current-month snapshot status
- Latest data run status
- Demo mode safety check (warns if enabled in production)
- Critical env vars present

## Deployment Checklist

See `docs/DEPLOYMENT_QA_CHECKLIST.md` for the full pre-deployment checklist covering:
- Environment variables (required/optional/security)
- Database migration & seed
- Build validation
- Smoke tests
- Route checks (public/protected/API)
- Full game loop manual test
- Market data verification
- Cron setup
- Security checklist
- Rollback notes

## Remaining Known Limitations

1. **Rate limiting is in-memory** — For multi-instance production deployments, replace with Redis.
2. **NewsAPI/FRED are optional** — App works fully without external API keys via static fallback.
3. **CoinGecko free tier** — Crypto provider may hit rate limits under heavy use; returns empty signals gracefully.
4. **No email/password auth** — OAuth-only (Google/GitHub). This is by design.
5. **No real-time updates** — Market snapshots are daily/static, not streaming.

## Files Changed

| File | Action |
|------|--------|
| `app/(auth)/register/page.tsx` | Redirect to `/login` |
| `app/api/health/route.ts` | **NEW** — Health endpoint |
| `app/api/cron/market-snapshot/route.ts` | GET public, POST 503 for missing secret |
| `scripts/smoke.mjs` | **NEW** — HTTP smoke test |
| `scripts/db-smoke.ts` | **NEW** — DB smoke test |
| `lib/market/snapshot-service.ts` | Remove `console.log` |
| `tests/unit/health.test.ts` | **NEW** — Health tests |
| `tests/unit/cron-auth.test.ts` | **NEW** — Cron auth tests |
| `package.json` | Add `smoke` and `smoke:db` scripts |
| `README.md` | Updated deployment docs |
| `docs/DEPLOYMENT_QA_CHECKLIST.md` | **NEW** |
| `docs/PHASE_12_QA_DEPLOYMENT_HARDENING.md` | **NEW** |

## Validation

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ (201+ tests)
- `npm run build` ✅
- `npm run smoke:db` ✅

## Recommended Next Phase

**Phase 13: Performance & Observability**
- Add Sentry or similar error tracking
- Add analytics (privacy-friendly, e.g. Plausible or Vercel Analytics)
- Implement Redis for rate limiting and session caching
- Add request timing middleware
- Optimize slow queries with indexes
