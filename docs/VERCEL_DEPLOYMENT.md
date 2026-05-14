# Vercel Deployment Guide

This guide walks through deploying Founder Arena to Vercel for closed-beta testing with friends.

---

## Required Services

| Service | Purpose | Recommendation |
|---------|---------|----------------|
| Vercel | Host the Next.js app | [vercel.com](https://vercel.com) |
| PostgreSQL | Database | [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com) |
| OAuth | User authentication | Google OAuth (required) + GitHub OAuth (optional) |

---

## Vercel Project Setup

1. **Push your code to GitHub**
2. **Import project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import the GitHub repository
   - Framework preset: Next.js
3. **Build settings**
   - Build command: `npm run vercel-build` (runs `prisma migrate deploy && next build`)
   - Output directory: `.next`
   - Install command: `npm install` (the `postinstall` script auto-runs `prisma generate`)

---

## Environment Variables

Add **all** required variables in Vercel dashboard → Settings → Environment Variables.

### Required for Closed Beta

| Variable | Example Value | Notes |
|----------|---------------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host.vercel-postgres.com:5432/db?sslmode=require` | Connection string from your Postgres provider |
| `AUTH_SECRET` | `aJ9xK2mNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKl` | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | `https://founder-arena.vercel.app` | Must match your production domain exactly |
| `AUTH_GOOGLE_ID` | `123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com` | From Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx` | From Google Cloud Console |
| `CRON_SECRET` | `bK3yL4mNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKl` | Generate with `openssl rand -base64 32` |
| `DEMO_MODE_ENABLED` | `false` | **Must be false in production** |

### Optional

| Variable | Notes |
|----------|-------|
| `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` | Enable GitHub sign-in |
| `OPENAI_API_KEY` | Enables AI reviews; mock provider works without it |
| `ADMIN_EMAILS` | Your email — allows market snapshot generation from `/market` |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Production rate limiting (recommended) |
| `APP_ENV` | Set to `beta` to show a "Closed Beta" badge |

---

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Authorized JavaScript origins:
   - `https://your-domain.com` (production)
   - `https://your-preview-url.vercel.app` (preview deployments)
5. Authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `https://your-preview-url.vercel.app/api/auth/callback/google`
6. Copy **Client ID** → `AUTH_GOOGLE_ID`
7. Copy **Client Secret** → `AUTH_GOOGLE_SECRET`

### GitHub OAuth (Optional)

1. Go to [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Authorization callback URL:
   - `https://your-domain.com/api/auth/callback/github`
4. Copy **Client ID** → `AUTH_GITHUB_ID`
5. Copy **Client Secret** → `AUTH_GITHUB_SECRET`

---

## Database Migrations

Migrations are automatically applied during the Vercel build via `prisma migrate deploy`.

**For the first deployment or if auto-migration fails**, run manually:

```bash
# 1. Set DATABASE_URL to your production database
export DATABASE_URL="postgresql://..."

# 2. Deploy migrations
npx prisma migrate deploy

# 3. Seed initial data (first deployment only)
npx tsx prisma/seed.ts
```

**Option: Use Vercel CLI with a one-off command**

```bash
vercel env pull .env.production
npx prisma migrate deploy
```

---

## First Deployment Checklist

- [ ] Vercel project created and connected to GitHub
- [ ] `DATABASE_URL` set and database reachable
- [ ] `AUTH_SECRET` generated and set (≥32 chars)
- [ ] `AUTH_URL` matches production domain exactly
- [ ] Google OAuth app created with correct redirect URIs
- [ ] `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` set
- [ ] `CRON_SECRET` generated and set
- [ ] `DEMO_MODE_ENABLED=false` (or unset)
- [ ] Database migrations applied with `prisma migrate deploy`
- [ ] Database seeded with `npx tsx prisma/seed.ts`
- [ ] Build succeeds: `npm run vercel-build`

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "production",
  "database": "ok",
  "authConfigured": true,
  "marketDataMode": "static",
  "activeMarketSnapshot": "present",
  "timestamp": "2026-05-04T12:00:00.000Z"
}
```

### 2. Smoke Tests

```bash
# Against your deployed app
BASE_URL=https://your-domain.com npm run smoke
```

### 3. Manual Walkthrough

1. Open `/` — landing page loads
2. Click **Sign In** → OAuth flow works
3. Create a startup from `/startup/new`
4. Submit a pitch at `/startup/[id]/pitch`
5. Accept term sheet at `/startup/[id]/terms`
6. Run one month at `/startup/[id]/operate`
7. Check `/leaderboard` — your startup appears
8. Check `/market` — market conditions display

---

## Cron Setup

Founder Arena includes two cron endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cron/market-snapshot` | POST | External cron services (requires Bearer token) |
| `/api/cron/generate-market-snapshot` | GET | Vercel Cron (protected by Bearer token) |

### Option A: Vercel Cron (Recommended)

A `vercel.json` is included in the repo with:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-market-snapshot",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Vercel automatically includes the `CRON_SECRET` in the `Authorization: Bearer` header when calling cron routes.

### Option B: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com):

```
POST https://your-domain.com/api/cron/market-snapshot
Authorization: Bearer <CRON_SECRET>
```

---

## Closed Beta with Friends

### Recommended Setup

- `DEMO_MODE_ENABLED=false`
- `APP_ENV=beta` (shows a "Closed Beta" badge)
- `ADMIN_EMAILS=your-email@example.com`
- Share the URL with friends
- Friends sign in with Google or GitHub
- Friends create their own startups
- Public pages (`/leaderboard`, `/s/[slug]`, `/f/[slug]`) are visible to everyone

### What Friends Can Do

- Create startups and pitch ideas
- Get AI VC reviews
- Negotiate term sheets
- Hire teams and manage offices
- Operate through 12 months
- Share results publicly
- Appear on the global leaderboard

### What Friends Cannot Do

- Access your admin controls
- Generate market snapshots (admin-only in production)
- See other users' private startup details

---

## Public vs. Protected Routes

### Public (no login required)

- `/` — Landing page
- `/login` — Sign in
- `/how-to-play` — Game guide
- `/market` — Market conditions
- `/leaderboard` — Global leaderboard
- `/graveyard` — Failed startups
- `/s/[slug]` — Public startup result pages
- `/f/[slug]` — Public founder profiles
- `/api/health` — Health check
- `/api/auth/*` — Auth.js callbacks
- `GET /api/cron/market-snapshot` — Cron health

### Protected (requires login)

- `/dashboard`
- `/profile`
- `/startup/new`
- `/startup/[id]` and all sub-routes (`/pitch`, `/review`, `/terms`, `/operate`, `/team`, `/growth`)

---

## Common Errors & Fixes

### `AUTH_URL missing`

**Symptom:** OAuth redirect fails, infinite redirect loops.

**Fix:**
- Set `AUTH_URL` to your exact deployed domain (no trailing slash)
- For preview deployments, you may need to add the preview URL to Google OAuth redirect URIs

### `OAuth redirect mismatch`

**Symptom:** Google shows "redirect_uri_mismatch" error.

**Fix:**
- In Google Cloud Console, add the exact redirect URI:
  `https://your-domain.com/api/auth/callback/google`
- Include `https://` and the exact domain
- If using preview deployments, add those URLs too

### `DATABASE_URL not reachable`

**Symptom:** 503 on `/api/health`, app crashes.

**Fix:**
- Verify `DATABASE_URL` is correct
- Ensure SSL is enabled for managed Postgres (add `?sslmode=require`)
- Check IP allowlist — some providers block Vercel IPs by default
- Run `npx prisma migrate deploy` to apply migrations

### `Prisma Client not generated`

**Symptom:** Build fails with "Cannot find module '@prisma/client'".

**Fix:**
- Ensure `postinstall: "prisma generate"` is in package.json
- Or use `npm run vercel-build` as the build command

### `Cron unauthorized`

**Symptom:** Cron requests return 401.

**Fix:**
- Set `CRON_SECRET` in Vercel environment variables
- Ensure the secret is ≥16 characters
- For Vercel Cron, the secret is automatically included in the Authorization header

### `No current market snapshot fallback`

**Symptom:** Simulation shows "no market snapshot" warning.

**Fix:**
- Run `npx tsx prisma/seed.ts` to seed market snapshots
- Or visit `/market` as an admin and click "Generate Snapshot"
- Or wait for the daily cron job to generate one

### `Missing external API keys`

**Symptom:** Market data shows only static signals.

**Fix:**
- This is normal — static mode works without API keys
- To enable external data, set `NEWS_API_KEY` and/or `FRED_API_KEY`
- Change `MARKET_DATA_PROVIDER_MODE` to `hybrid` or `external`

---

## Updating After Deployment

### Code Changes

1. Push to GitHub
2. Vercel auto-deploys

### Schema Changes

1. Create a migration locally:
   ```bash
   npm run db:migrate -- --name your_change
   ```
2. Push migration files to GitHub
3. Deploy the migration to production:
   ```bash
   npx prisma migrate deploy
   ```
4. Vercel auto-deploys the app

**Never run `prisma migrate reset` or `prisma db push` in production.**

---

## Security Checklist

- [ ] `DEMO_MODE_ENABLED=false` in production
- [ ] `AUTH_SECRET` is strong (≥32 random chars)
- [ ] `CRON_SECRET` is strong (≥32 random chars)
- [ ] No secrets in `.env.example` or README
- [ ] OAuth redirect URIs are exact matches
- [ ] Database uses SSL (`sslmode=require`)
- [ ] Admin emails are set for production snapshot generation
- [ ] Rate limiting configured (Upstash Redis recommended)

---

## Support

If you hit issues:

1. Check `/api/health` on your deployed app
2. Check Vercel deployment logs
3. Run `npm run smoke` against your deployed URL
4. Review this guide's Common Errors section
