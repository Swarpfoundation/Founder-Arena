# Founder Arena — Production Hardening Checklist

This document covers the exact deployment order for a fresh production environment
after the two hardening passes (2026-05-14).

---

## 1. Configure environment variables

Set all of the following in your deployment platform (Vercel → Settings → Environment Variables).

### Required (app will not function without these)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string with `?sslmode=require` for Neon/Vercel Postgres |
| `AUTH_SECRET` | Min 32 chars. Generate: `openssl rand -base64 32` |
| `AUTH_URL` | Exact deployed domain, e.g. `https://your-project.vercel.app` |
| `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` | At least one OAuth pair required |
| `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` | Or GitHub — need at least one |

### Required for production security

| Variable | Notes |
|---|---|
| `CRON_SECRET` | **Must be at least 32 chars.** Generate: `openssl rand -base64 32`. The `/api/cron/*` routes are public at middleware level; this secret is the only guard. A weak or missing secret disables the endpoint with 503. |
| `DEMO_MODE_ENABLED` | Must be `"false"` in production. When `true` it bypasses OAuth entirely. |

### Admin market snapshot generation (set if you want manual generation)

| Variable | Notes |
|---|---|
| `ADMIN_EMAILS` | Comma-separated list of admin emails for the manual market snapshot UI on `/market`. **Fail-closed**: if not set or empty, the admin generation form is disabled for ALL authenticated users in production. Setting this is required to enable manual snapshot generation; omitting it safely disables the feature. |

### Strongly recommended

| Variable | Notes |
|---|---|
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Without these, rate limiting falls back to in-memory per serverless instance (no cross-request enforcement on Vercel). |
| `NEXT_PUBLIC_APP_URL` | Your deployed domain. Used in share-link URLs. Falls back to hardcoded `https://founder-arena.vercel.app`. |
| One AI key: `DEEPSEEK_API_KEY` / `QWEN_API_KEY` / `OPENROUTER_API_KEY` / `OPENAI_API_KEY` | Without any key, AI analysis falls back to MockProvider (deterministic fake responses). |

### Billing (required if enabling subscriptions)

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET      # Must be set; webhook endpoint returns 500 without it
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_YEARLY
STRIPE_PRICE_MAX_MONTHLY
STRIPE_PRICE_MAX_YEARLY
```

### Optional

```
NEWS_API_KEY               # External market data from NewsAPI
FRED_API_KEY               # FRED economic data
MARKET_DATA_PROVIDER_MODE  # Defaults to "static"
APP_ENV=beta               # Shows "Closed Beta" badge in header
```

---

## 2. Run preflight SQL on the production database

Before running `prisma migrate deploy`, execute the duplicate-detection queries in:

```
scripts/preflight-hardening-unique-constraints.sql
```

Run them in read-only mode or against a snapshot. If any query returns rows, resolve
duplicates manually using the commented deduplication patterns in the script before
continuing.

> **Do not run the migration if any table shows duplicate_groups > 0.**

### Tables being constrained

| Table | Unique key columns |
|---|---|
| `simulation_months` | `startup_id, month_number` |
| `usage_ledger` | `user_id, action_type, period_start, period_end` |
| `leaderboard_entries` | `startup_id, category, season` |

---

## 3. Resolve any duplicates found (manual)

If the preflight queries return rows, use the `ROW_NUMBER()` deduplication patterns
(commented out in the SQL file) to identify and remove extra rows.

- For `simulation_months`: keep the **newest** row per `(startup_id, month_number)`.
- For `usage_ledger`: consolidate counts into the newest row, then delete extras.
- For `leaderboard_entries`: keep the row with the **highest score** per group.

---

## 4. Run `prisma migrate deploy`

```bash
npx prisma migrate deploy
```

This applies all pending migrations including the unique-constraint additions.
Run from the same environment that has `DATABASE_URL` set.

---

## 5. Build and test

```bash
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm test
npm run build
```

All six must pass before deploying. Do not skip test failures.

---

## 6. Deploy

Deploy via your CI/CD pipeline or `vercel --prod`.

After deploy:
- Verify `/api/health` returns `{"status":"ok"}` or `{"status":"degraded"}` only — no secrets or internal diagnostics should appear in the response.
- Verify OAuth login works for at least one provider.
- Verify the Stripe webhook endpoint is registered and the `STRIPE_WEBHOOK_SECRET` matches.

---

## 7. Post-deploy smoke test

Manual checks:
1. Sign in via Google or GitHub → lands on `/dashboard`
2. Create a startup → fills in sector/region from valid enums
3. Submit a pitch → VC review completes
4. Run one simulation month → cash/burn updates correctly
5. Check `/leaderboard` loads public data
6. Hit `/api/health` → status `ok` or `degraded`, no sensitive fields visible

---

## Known remaining audit issue

`npm audit` reports one **moderate** transitive vulnerability:
- **postcss < 8.5.10** (GHSA-qx2v-qp2m-jg93) inside Next.js's internally bundled postcss.
- **Do not run `npm audit fix --force`** — it would downgrade Next.js to 9.3.3, which is destructive.
- This will be resolved when the Next.js team releases a patch that updates their internal postcss.
- Monitor Next.js releases for a `15.x` patch.

---

## Security notes

- `/api/cron/*` is public in middleware so Vercel's cron scheduler (which sends unauthenticated GET requests) can reach the handler. The `CRON_SECRET` Bearer token check in each handler is the real guard.
- `/api/webhooks/stripe` is public in middleware; Stripe signature verification (`constructStripeEvent`) happens before any business logic or DB writes.
- The health endpoint (`/api/health`) returns only `status`, `version`, `environment`, `database`, `authConfigured`, `activeMarketSnapshot`, and `timestamp`. No secrets, API keys, or internal diagnostics.
