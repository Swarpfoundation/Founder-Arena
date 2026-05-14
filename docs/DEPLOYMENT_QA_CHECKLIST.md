# Deployment QA Checklist

Use this checklist before deploying Founder Arena to production.

## Pre-Deployment

### Environment Variables

```bash
cp .env.example .env
```

Required:
- [ ] `DATABASE_URL` — PostgreSQL connection string
- [ ] `AUTH_SECRET` — min 32 chars, generate with `openssl rand -base64 32`
- [ ] `AUTH_URL` — production domain, e.g. `https://founder-arena.vercel.app`

OAuth (at least one):
- [ ] `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`
- [ ] `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET`

Optional:
- [ ] `OPENAI_API_KEY` — for AI features (falls back to mock mode if missing)
- [ ] `NEWS_API_KEY` — for NewsAPI market data
- [ ] `FRED_API_KEY` — for FRED economic data
- [ ] `MARKET_DATA_PROVIDER_MODE` — `static` (default), `external`, `hybrid`, `seeded`
- [ ] `MARKET_DATA_EXTERNAL_FALLBACK` — `static` (default), `seeded`, `none`
- [ ] `CRON_SECRET` — for automated snapshot generation, min 32 chars
- [ ] `ADMIN_EMAILS` — comma-separated admin emails for snapshot generation
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — Redis-backed rate limiter (recommended for multi-instance deployments)
- [ ] `ANALYTICS_ENABLED` — set to `true` to enable coarse event logging

Security (must be false in production):
- [ ] `DEMO_MODE_ENABLED` = `false` or unset

### Database

- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Generate client: `npx prisma generate`
- [ ] Seed market snapshots: `npx tsx prisma/seed.ts`
- [ ] Verify connection: `npm run smoke:db`

### Build

- [ ] `npm run typecheck` — TypeScript compiles
- [ ] `npm run lint` — no ESLint errors
- [ ] `npm run test` — all tests pass
- [ ] `npm run build` — production build succeeds

## Smoke Tests

Run after build and before going live:

```bash
# Start the app
npm run start

# In another terminal
npm run smoke
npm run smoke:db
```

Checks:
- [ ] `GET /` — 200
- [ ] `GET /login` — 200
- [ ] `GET /market` — 200
- [ ] `GET /leaderboard` — 200
- [ ] `GET /graveyard` — 200
- [ ] `GET /api/health` — 200 with safe JSON
- [ ] `GET /api/cron/market-snapshot` — 200 (public health check)
- [ ] `GET /register` — redirects to `/login`
- [ ] `GET /dashboard` (unauthenticated) — redirects to `/login`
- [ ] `GET /s/nonexistent` — 404 (not 500)

## Route Checks

### Public Routes (no auth required)

- [ ] `/` — landing page renders
- [ ] `/login` — OAuth buttons visible
- [ ] `/market` — market intel displays
- [ ] `/leaderboard` — leaderboard renders
- [ ] `/graveyard` — graveyard renders
- [ ] `/s/[slug]` — valid startup share page works
- [ ] `/s/nonexistent` — 404 page, not crash

### Protected Routes (redirect to login when unauthenticated)

- [ ] `/dashboard` — redirects to `/login`
- [ ] `/profile` — redirects to `/login`
- [ ] `/startup/new` — redirects to `/login`
- [ ] `/startup/[id]` — redirects to `/login`
- [ ] `/startup/[id]/pitch` — redirects to `/login`
- [ ] `/startup/[id]/review` — redirects to `/login`
- [ ] `/startup/[id]/terms` — redirects to `/login`
- [ ] `/startup/[id]/operate` — redirects to `/login`
- [ ] `/startup/[id]/team` — redirects to `/login`

### API Routes

- [ ] `GET /api/health` — safe JSON, no secrets
- [ ] `GET /api/cron/market-snapshot` — public snapshot info
- [ ] `POST /api/cron/market-snapshot` without secret — 503 or 401
- [ ] `POST /api/cron/market-snapshot` with wrong secret — 401

## Full Game Loop (manual)

1. [ ] **Login** — OAuth sign-in works
2. [ ] **Create Startup** — form submits, startup appears on dashboard
3. [ ] **Pitch** — pitch deck builder works
4. [ ] **VC Review** — AI review returns scores and memo
5. [ ] **Terms** — term sheet generates and displays
6. [ ] **Accept Funding** — funding round created, startup status changes
7. [ ] **Team** — hire employees, office setup works
8. [ ] **Operate** — monthly decisions submit, simulation advances
9. [ ] **Finalization** — 12 months complete, final score calculated
10. [ ] **Leaderboard** — entry appears on leaderboard
11. [ ] **Profile** — XP, level, achievements visible
12. [ ] **Share Page** — `/s/[slug]` works publicly

## Market Data

- [ ] `/market` shows current snapshot with mode badge
- [ ] Admin can generate static snapshot
- [ ] Admin can generate hybrid snapshot
- [ ] Provider status panel shows all 4 providers
- [ ] `GET /api/cron/market-snapshot` returns active snapshot info

## Cron Setup (optional)

If using automated snapshots:

- [ ] `CRON_SECRET` is set and ≥ 32 chars
- [ ] `MARKET_DATA_PROVIDER_MODE` is set
- [ ] Configure Vercel Cron or external scheduler to `POST /api/cron/market-snapshot`
- [ ] Include `Authorization: Bearer <CRON_SECRET>` header

## Security Checklist

- [ ] `DEMO_MODE_ENABLED` is NOT `true` in production
- [ ] `AUTH_SECRET` is a strong random string
- [ ] `AUTH_URL` matches production domain
- [ ] OAuth redirect URIs point to production domain
- [ ] No API keys committed to repository
- [ ] `.env` is in `.gitignore`
- [ ] No `console.log` with secrets in production build
- [ ] Logger auto-redacts sensitive fields in production (structured JSON)
- [ ] Database connection uses SSL if required by host
- [ ] Rate limiter is configured (Upstash recommended for production with multiple instances)

## Rollback Notes

If deployment fails:

1. Revert to previous deployment in hosting platform
2. Check `npm run smoke` output for failing routes
3. Check `npm run smoke:db` for DB connectivity issues
4. Verify environment variables in hosting dashboard
5. Check application logs for errors

## Post-Deployment

- [ ] Verify `/api/health` returns `status: "ok"`
- [ ] Verify public pages load without auth
- [ ] Verify protected pages redirect when unauthenticated
- [ ] Run one simulation month end-to-end
