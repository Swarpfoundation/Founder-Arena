# Agent Guidelines — Founder Arena

## Hard Rules (read before changing anything)

1. **Never trust client-supplied economy/gameplay numbers.** Any server
   action that touches cash, salary, valuation, equity, acquisition price,
   impact deltas, or score MUST recompute those values server-side from
   the deterministic libraries (`lib/economy/*`, `lib/missions/*`,
   `lib/growth/strategic-offers.ts`). The client may only submit stable
   identifiers (startupId, candidateId, offerId, decisionIds, action).
2. **Single writer for `startup.monthlyBurn`.** Only
   `recomputeStartupBaseBurn(db, startupId)` (in `lib/economy/recompute-burn.ts`)
   may write `monthlyBurn` or `officeMonthlyCost`. Call it inside the same
   transaction as any team/office/funding mutation.
3. **Final outcome uses true burn.** `classifyFinalOutcome` is fed
   `calculateTotalBurn(...)` from the cost engine, not the stored baseBurn.
4. **Paid plans must NOT improve outcome.** No paywalled mechanic may
   affect leaderboard score, valuation, cash, risk, investor score, or
   final outcome. Paid plans only unlock convenience/quota.
5. **Public pages list lives in `middleware.ts`.** Add new public routes
   to PUBLIC_PATHS or PUBLIC_PREFIXES; default-deny otherwise.

## Stack & Environment

- Next.js 15.5.15 + TypeScript + Tailwind CSS v4 + shadcn/ui
- npm only (no yarn/pnpm)
- PostgreSQL via Docker (`postgres:16-alpine` on localhost:5432)
- Prisma ORM — **never run `prisma migrate reset`**, forward migrations only
- Auth.js v5 beta with PrismaAdapter, JWT session, Google/GitHub OAuth
- AI layer: `lib/ai/` — OpenAIProvider (`gpt-4o`) + MockProvider deterministic fallback
  - Phase 14: Added committee personas, market analyst, board updates, founder coaching
  - Prompt builders in `lib/ai/prompts/`
  - Schemas in `lib/ai/schemas.ts`
  - All AI calls wrapped with `withTiming` and safe logging
- Test runner: Vitest 3.2.4 with jsdom (currently **435 tests passing** — 27 files)
- Lint: `next lint` (deprecated but functional)
- Onboarding: `lib/onboarding/` — templates, progress logic, pitch drafts, demo samples
- Growth Phase (Phase 18): `lib/growth/` — Series A/B readiness, 15 strategic actors, offer generation, resolution
- SVG Asset System (Phase 19): `components/assets/` — 100+ original SVG icons, badges, marks, actor symbols.
- SVG Asset Deep Integration (Phase 20): All core gameplay surfaces use custom SVGs. Registry helpers in `lib/assets/`.
- Monetization (Phase 23): `lib/billing/` — subscription plans (free/pro/max), entitlements, usage limits, speed tokens, Stripe Checkout + webhooks, billing portal, rewarded-ad placeholders.
- AI Mission Roadmaps & Realistic Costs (Phase 24A): `lib/missions/` + `lib/economy/` — deterministic startup classification, 12-month mission roadmaps, progress engine, next-move recommendations, realistic salary bands, region multipliers, office/operating costs, unified cost calculator.
- AI Operations Advisor + Mission Integration (Phase 24B): AI advisor rendered on operate page, mission persistence + lazy backfill, mission achievements evaluated, VC review enriched with mission/funding adequacy, growth readiness considers mission completion, cost engine is source of truth for candidate salaries, mission history in monthly log, mission preview on startup profile.
- Security & Economy Hotfix (Phase 26A): server-side recomputation of hire and growth-offer economics; `recomputeStartupBaseBurn` as the single writer of `startup.monthlyBurn`; final outcome uses cost-engine true burn; growth phase universally available; `/f/` and `/pricing` made public; `/api/auth-debug` deleted; `force-dynamic` on every DB-backed page. See `docs/PHASE_26A_SECURITY_ECONOMY_HOTFIX.md`.

## Scripts

```bash
npm run {dev,build,lint,typecheck,test,db:migrate,db:generate,db:studio,db:seed}
```

## Design System (Phase 7+)

Dark fintech/game dashboard aesthetic. Do not introduce light themes.

### Colors
- Background: `#0a0f1e`
- Primary: cyan `#22d3ee`
- Accent: violet `#8b5cf6`
- Destructive: rose `#f43f5e`
- Success: emerald `#34d399`

### Utility Classes (defined in `app/globals.css`)
- `.glass` — `rgba(15,23,42,0.7)` background, `backdrop-filter: blur(12px)`, subtle border
- `.glow-cyan`, `.glow-violet`, `.glow-rose`, `.glow-emerald` — soft colored shadows
- `.text-gradient-cyan`, `.text-gradient-violet` — gradient text clips
- `.bg-grid` — subtle dot grid background pattern

### Game Components (`components/game/`)
Use these for all game UI instead of raw shadcn Card where possible:
- `GameCard` — Wrapper with `glow` and `variant` props
- `MetricPanel` — KPI with label, value, optional trend
- `StatusBadge` — Status with colored dot (accepts any status string)
- `LevelBadge` — Founder level badge
- `OutcomeBadge` — Outcome with icon and glow
- `ProgressBar` — Gradient progress bar
- `SectionHeader` — Title + subtitle + accent line
- `Sparkline` — SVG sparkline for number arrays

### Growth Components (`components/growth/`)
- `ReadinessScoreCard` — Readiness score with color-coded status
- `GrowthOfferCard` — Strategic offer display with terms/benefits/risks
- `GrowthOfferCardWrapper` — Interactive wrapper with accept/reject/counter/defer

### Onboarding Components (`components/onboarding/`)
- `StartupTemplatePicker` — Grid of 12 startup idea templates
- `NextBestAction` / `NextBestActionInline` — Guided CTA banner
- `FirstRunChecklist` — 8-step getting started checklist
- `ExplainerCard` / `ExplainerTooltip` / `ExplainerButton` / `ExplainerHint` — Concept helpers

### shadcn/ui Badge Variants
**Only** `default`, `secondary`, `destructive`, `outline` are valid. Do **not** use `"success"`, `"warning"`, etc.

### SVG Asset Conventions (Phase 19+)
All icons live in `components/assets/` and follow these rules:
- **Base wrappers**: `AssetBase` (stroke) and `FilledAssetBase` (fill) in `components/assets/base.tsx`
- **Props**: All accept `className`, `size` (default 24), and optional `title`
- **Accessibility**: `aria-hidden="true"` by default; `title` prop adds `role="img"` + `aria-label`
- **Theming**: Use `currentColor` — never hardcode hex colors in SVGs
- **ViewBox**: Always `0 0 24 24`
- **Registry helpers**: `lib/assets/` maps domain values (sector, outcome, achievement, event, actor) to components safely
- **Brand safety**: Never use official logos or trademarked marks. All marks are original geometric work.

## Important Patterns

### JSON Type Handling
Prisma Json fields require careful casting:
```ts
JSON.parse(JSON.stringify(obj)) as Prisma.InputJsonValue
// or
as unknown as Prisma.InputJsonValue
```

### Authentication
- `getCurrentUser()` — returns authenticated user or null
- `requireCurrentUser()` — throws if not authenticated (use in server actions)
- `getCurrentUserOrDevDemoUser()` — dev demo fallback only if `DEMO_MODE_ENABLED=true`
- `requireAuthRedirect()` — redirects to login (use in server components)

Deprecated: `requireUser()` in `lib/user.ts` still works but delegates to `getCurrentUserOrDevDemoUser()`.

### Demo Mode
Set `DEMO_MODE_ENABLED=true` for local development to allow anonymous demo user fallback.
**Never enable in production.** Middleware checks this flag.

### Deterministic Rules
All financial math, scoring, death conditions, candidate generation, team effects, market impact, and achievement logic are **deterministic pure functions**. AI is used **only** for analysis, explanation, summarization, critique, memos, board updates, and coaching feedback. AI must **never** directly set cash, burn, runway, valuation, leaderboard score, final outcome, or simulation state transitions.

### AI Prompt & Schema Conventions (Phase 14+)
- All prompts truncate user inputs at 500 chars safely
- All prompts include: "Deterministic game math is authoritative. Do not invent exact data sources."
- All structured AI outputs are parsed with Zod schemas
- OpenAI provider falls back to MockProvider on timeout, network error, or parse failure
- Never log raw prompts or full pitch text in production
- Safe metadata logged: provider, sector, schema name, durationMs, success/failure
- New AI data stored in existing JSON fields (no schema migrations needed):
  - `VcReview.rawResponse.committee` — committee reviews
  - `VcReview.rawResponse.coaching` — founder coaching (pitch)
  - `SimulationMonth.metadata.boardUpdate` — monthly board updates
  - `MarketSnapshot.metadata.aiNarrative` — market analyst briefs
  - `Startup.aiAnalysis.termSheetCoaching` / `finalCoaching` — coaching notes

### Market Snapshots
Seeded via `prisma/seed.ts` with 12 deterministic scenarios. Fallback used if no adapter snapshot exists.

### Market Data Adapter
Provider-adapter architecture in `lib/market-data/`:
- Providers → Normalizer → Interpreter → Snapshot Builder
- Static provider works without API keys
- External provider skeletons: NewsAPI, FRED
- Admin-only snapshot generation on `/market` page
- Simulation engine uses adapter snapshots first, falls back to seeded

### Onboarding & Templates (Phase 15+)
- Templates live in `lib/onboarding/startup-templates.ts`. All templates must have: id, name, sector, region, description, targetCustomer, problem, solution, monetizationModel, unfairAdvantage, fundingAsk, riskNote, whyInteresting.
- Pitch drafts are deterministic (no AI call). Generated in `lib/onboarding/pitch-draft.ts` from startup fields.
- Next best action logic is in `lib/onboarding/progress.ts`. Derives from actual startup state (pitch, reviews, term sheets, funding, sim months, employees).
- Demo sample cards only appear when `DEMO_MODE_ENABLED=true` or `NODE_ENV !== "production"`. Clearly labeled "Example". No fake DB entries.
- Empty states must explain what the area is and provide one useful CTA.

### Public Slugs
Generated via `generateSlugCandidate` + DB uniqueness check. Format: `{slugified-name}-{shortId}`.

### Public Data & Privacy (Phase 17+)
- Public pages (`/s/[slug]`, `/f/[slug]`, `/leaderboard`, `/graveyard`) must never expose: email, OAuth provider IDs, private pitch details, active private startups.
- Use `lib/public/public-profile.ts` and `lib/public/public-startup.ts` for centralized safe field selection.
- Founder profiles show only `completed`/`dead` startups. Active/draft startups remain private.
- Share text generation (`lib/social/share-text.ts`) uses real stored metrics only. No fake claims.
- Share components (`components/social/`) never use client secrets. Native Web Share API is optional fallback.

### Billing & Monetization (Phase 23+)
- Plans: `free` → `pro` ($9/mo) → `max` ($19/mo). Defined in `lib/billing/plans.ts`.
- Fairness rule: paid plans unlock convenience/speed ONLY. They must NEVER improve valuation, cash, risk score, investor score, market score, leaderboard score, or final outcome.
- Entitlements checked in server actions: `checkStartupCreateEntitlement`, `checkAiReviewEntitlement`, `checkSimulationEntitlement`, `checkGrowthAccess`.
- First pitch review is always instant regardless of plan.
- Speed tokens: bypass review cooldowns or unlock extra reviews. Earned via rewarded ads (simulated) or granted monthly with subscription.
- Stripe integration: `lib/billing/stripe.ts` (server-side only). Webhook handler at `app/api/webhooks/stripe/route.ts`.
- Billing page: `/billing`. Pricing page: `/pricing`.
- Required env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_MAX_MONTHLY`, `REWARDED_ADS_ENABLED`, `REWARDED_ADS_SIMULATED`.

## Database Models (Quick Reference)

Key models: `User`, `Startup`, `PitchDeck`, `VcReview`, `TermSheet`, `FundingRound`, `SimulationMonth`, `Employee`, `MarketSnapshot`, `MarketEvent`, `LeaderboardEntry`, `FounderAchievement`, `FounderProfile`, `Subscription`, `CreditWallet`, `UsageLedger`, `QueuedAction`.

Startup statuses: `draft` → `pitching` → `funded` → `active` → `completed` | `dead`
Term sheet statuses: `proposed` | `countered` | `accepted` | `rejected` | `expired`
SimulationMonth statuses: `active` | `dead` | `completed`

## Deployment

- Vercel deployment guide: `docs/VERCEL_DEPLOYMENT.md`
- Build command for Vercel: `npm run vercel-build` (runs `prisma generate && next build`)
- `postinstall` script runs `prisma generate` automatically
- Database migrations: `npm run db:deploy` (runs `prisma migrate deploy`)
- Cron: `vercel.json` configures daily cron at `GET /api/cron/generate-market-snapshot`
- Beta banner: set `APP_ENV=beta` to show "Closed Beta" badge in header

## When Modifying Code

1. Keep data fetching and business logic unchanged unless explicitly asked
2. Follow the existing dark theme design system
3. Use game components from `components/game/` for new UI
4. Run `npm run typecheck`, `npm run lint`, and `npm test` before finishing
5. Update this file if you change conventions, scripts, or schema
