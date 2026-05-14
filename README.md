# Founder Arena

Founder Arena is a web-based AI startup strategy game where users pitch startup ideas to AI investors, raise simulated funding, operate their company through 12 volatile months, and compete on a global leaderboard.

## Features

- **AI Pitch Review** — Get brutally honest feedback from AI VCs on your idea, market, and pitch deck.
- **Term Sheet Negotiation** — Negotiate valuation, dilution, and board control. Every clause matters.
- **Team & Office Management** — Hire engineers and marketers. Choose remote or premium office setups.
- **Operating Simulation** — Make monthly strategic decisions. Navigate cash burn, product development, and revenue growth.
- **Market Intelligence** — React to 12 deterministic macro scenarios. AI boom, recession, crypto winter, and more.
- **Leaderboard & Graveyard** — Compete globally. Learn from startups that didn't make it.
- **Public Share Pages** — Share your startup's result with a unique public URL.
- **Public Founder Profiles** — Share your founder journey, achievements, and best startups.
- **Social Sharing** — Copy link and X/Twitter share buttons on every public page.
- **Growth Phase** — Series A/B readiness, strategic offers from 15 fictional actors, acquisitions & partnerships.
- **SVG Asset System** — 100+ original vector icons, badges, and marks deeply integrated across all gameplay surfaces (sectors, metrics, outcomes, achievements, events, strategic actors).
- **Startup Templates** — 12 pre-built ideas to jumpstart your first pitch.
- **Guided First Run** — Checklist and next-best-action hints for new founders.
- **How to Play** — Comprehensive guide to game mechanics and strategy.

## Tech Stack

- **Framework**: Next.js 15 + TypeScript + Tailwind CSS v4
- **UI**: shadcn/ui primitives + custom game components
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js (NextAuth v5 beta) with Google/GitHub OAuth
- **AI Layer**: Provider-agnostic abstraction (OpenAI / Mock fallback)
- **Testing**: Vitest + jsdom

## Prerequisites

- Node.js 20+
- npm
- Docker (for local PostgreSQL)
- A Google or GitHub OAuth app (for production auth)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd founder-arena
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/founder_arena?schema=public"
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_URL="http://localhost:3000"

# OAuth (at least one required for real auth)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_GITHUB_ID="your-github-app-id"
AUTH_GITHUB_SECRET="your-github-app-secret"

# AI (optional — mock provider works without it)
OPENAI_API_KEY=""

# Development only — NEVER in production
DEMO_MODE_ENABLED="true"
```

### 3. Database

```bash
# Start PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed demo user and market snapshots
npm run db:seed
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run Vitest suite |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |
| `npm run smoke` | HTTP smoke tests (requires running server) |
| `npm run smoke:db` | DB connectivity & state checks |

## Project Structure

```
app/                    # Next.js App Router
  (auth)/               # Auth pages (login, register)
  (game)/               # Game pages (dashboard, leaderboard, etc.)
  api/                  # API routes
  s/[slug]/             # Public share pages
  page.tsx              # Landing page
components/
  ui/                   # shadcn/ui primitives
  game/                 # Reusable game UI components
lib/
  actions/              # Server actions
  ai/                   # AI provider abstraction
  auth.ts               # Auth.js configuration
  auth-helpers.ts       # Safe user/session helpers
  db.ts                 # Prisma client singleton
  errors.ts             # Structured error classes
  onboarding/           # Templates, progress, pitch drafts
  rate-limit.ts         # Rate limiting
  user.ts               # Legacy user helpers (deprecated)
  game/                 # Game logic
  market/               # Market intelligence engine
  simulation/           # Core simulation engine
  team/                 # Team management logic
prisma/
  schema.prisma         # Database schema
  seed.ts               # Seed script
tests/unit/             # Vitest unit tests
docs/                   # Documentation
```

## Design System

Founder Arena uses a dark fintech/game dashboard aesthetic:

- **Background**: Deep navy `#0a0f1e`
- **Primary accent**: Electric cyan `#22d3ee`
- **Secondary accent**: Violet `#8b5cf6`
- **Cards**: Glassmorphism with subtle borders
- **Glow effects**: `glow-cyan`, `glow-violet`, `glow-rose`, `glow-emerald`
- **Text gradients**: `text-gradient-cyan`, `text-gradient-violet`

Custom game components live in `components/game/`.

## Authentication

### OAuth Setup

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `{AUTH_URL}/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`

**GitHub:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth app
3. Set Authorization callback URL: `{AUTH_URL}/api/auth/callback/github`
4. Copy Client ID and Secret to `.env`

### Demo Mode (Development Only)

Set `DEMO_MODE_ENABLED=true` to allow browsing without OAuth setup. A shared demo user is created automatically. **Never enable in production.**

### Protected Routes

Middleware (`middleware.ts`) protects game routes in production. Unauthenticated users are redirected to `/login`.

Public routes: `/`, `/login`, `/pricing`, `/how-to-play`, `/market`, `/leaderboard`, `/graveyard`, `/s/[slug]`, `/f/[slug]`, `/api/health`, `/api/auth/*`.

## Monetization Fairness

Founder Arena enforces a strict fairness rule: **paid plans MUST NOT improve any score-affecting gameplay outcome**. They only unlock convenience and quota:

- More AI pitch reviews per month
- No review cooldown
- Unlimited startups
- Speed tokens for cooldown bypass
- Deeper analysis copy

Every plan — including Free — has full access to the simulation, growth phase, Series A/B rounds, acquisitions, and growth achievements when their startup qualifies. See `lib/billing/plans.ts` for the canonical rule.

## Market Data Adapter

Founder Arena includes a provider-adapter architecture for market intelligence:

- **Static Provider** (default): Deterministic signals based on month index. No API keys required.
- **Seeded Scenarios**: Phase 6 preset scenarios.
- **External Providers**:
  - **NewsAPI** — news articles mapped to market signals (requires `NEWS_API_KEY`)
  - **FRED** — Federal Funds Rate & Unemployment data (requires `FRED_API_KEY`)
  - **Crypto** — BTC/ETH 24h price change via CoinGecko (no key required)
- **Hybrid Mode** — combines external providers with static fallback

### Provider Modes

| Mode | Description |
|------|-------------|
| `static` | Deterministic signals only |
| `external` | External providers only |
| `hybrid` | External + static combined |
| `seeded` | Phase 6 preset scenarios |

Set `MARKET_DATA_PROVIDER_MODE` and `MARKET_DATA_EXTERNAL_FALLBACK` in `.env`.

### Generating Snapshots

Admins can generate new market snapshots from the `/market` page:
- Development: any authenticated user
- Production: only `ADMIN_EMAILS`

Snapshots are stored as `MarketSnapshot` + `MarketEvent` records and used by the simulation engine. External data is normalized, confidence-capped, and never directly controls gameplay.

## Deploy to Vercel

See the full deployment guide: [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md)

### Quick Start

1. **Push to GitHub**
2. **Import in Vercel** — [vercel.com/new](https://vercel.com/new)
3. **Add environment variables** in Vercel dashboard:
   - `DATABASE_URL` — PostgreSQL connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_URL` — your production domain
   - `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` — Google OAuth
   - `CRON_SECRET` — `openssl rand -base64 32`
   - `DEMO_MODE_ENABLED=false`
4. **Apply database migrations**:
   ```bash
   npx prisma migrate deploy
   ```
5. **Seed the database**:
   ```bash
   npx tsx prisma/seed.ts
   ```
6. **Deploy**

### OAuth Redirect URIs

- Google: `https://your-domain.com/api/auth/callback/google`
- GitHub: `https://your-domain.com/api/auth/callback/github`

### Production Checks

- [ ] `DEMO_MODE_ENABLED=false`
- [ ] `AUTH_SECRET` is strong (≥32 chars)
- [ ] `AUTH_URL` matches deployed domain exactly
- [ ] Database migrations applied
- [ ] Database seeded
- [ ] OAuth redirect URIs are exact matches

### Smoke Tests

```bash
# Local
npm run build && npm start &
npm run smoke

# Deployed
BASE_URL=https://your-domain.com npm run smoke
```

### Health Endpoint

`GET /api/health` returns safe application status (no secrets exposed):

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

Returns `503` if the database is unavailable.

### Cron Setup

Two cron endpoints are available:

| Endpoint | Method | Use Case |
|----------|--------|----------|
| `/api/cron/market-snapshot` | POST | External cron services (Bearer token) |
| `/api/cron/generate-market-snapshot` | GET | Vercel Cron (auto-protected by `CRON_SECRET`) |

A `vercel.json` with daily cron scheduling is included. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` to cron routes.

## Security

- JWT sessions with secure secrets
- Ownership checks on all data mutations
- Rate limiting on expensive AI actions
- Input validation with Zod
- Structured error handling (no stack traces to users in production)
- No API keys exposed to client
- All external provider calls are server-side with timeouts

## License

MIT
