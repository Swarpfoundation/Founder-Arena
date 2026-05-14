# Phase 23 — Monetization Foundation

## Overview

Added subscription billing, usage limits, speed tokens, and rewarded-ad placeholders to Founder Arena. All paid features are convenience/speed only — they do NOT affect game math, scores, or outcomes.

## Plans

| Plan | Price | Startups | AI Reviews | Cooldown | Growth | Tokens |
|------|-------|----------|------------|----------|--------|--------|
| Free | $0 | 3 | 3/mo | 2h | Locked | 0 |
| Pro | $9/mo | Unlimited | 20/mo | None | Unlocked | 5/mo |
| Max | $19/mo | Unlimited | Unlimited | None | Unlocked | 20/mo |

## Database Changes

Migration: `20260505143701_phase23_monetization`

New models:
- `Subscription` — Stripe subscription state synced via webhooks
- `CreditWallet` — speed tokens per user
- `UsageLedger` — monthly usage counters by action type
- `QueuedAction` — queued reviews for async processing

Updated `User` model: added `plan` enum (`free` | `pro` | `max`), default `free`.

## Key Files

### Entitlements & Limits
- `lib/billing/plans.ts` — Plan definitions and price ID mapping
- `lib/billing/entitlements.ts` — `checkStartupCreateEntitlement`, `checkAiReviewEntitlement`, `checkSimulationEntitlement`, `checkGrowthAccess`
- `lib/billing/usage.ts` — `recordUsage`, `getUsageForPeriod`
- `lib/billing/credits.ts` — Speed token wallet: `addTokens`, `spendToken`, `grantMonthlyTokens`
- `lib/billing/review-access.ts` — Review cooldown logic, first-review-is-free rule, token bypass

### Server Actions
- `lib/actions/startup.ts` — Updated `createStartupAction` with startup limit check. Updated `submitPitchForReviewAction` with billing + token bypass.
- `lib/actions/simulation.ts` — Updated `runMonthlySimulationAction` with simulation entitlement check.
- `lib/actions/growth.ts` — Updated `getGrowthState` with growth-phase plan gate.
- `lib/actions/review-queue.ts` — `checkReviewAccessAction`, `submitPitchForReviewWithBillingAction`
- `lib/actions/billing.ts` — `getBillingState`, `createCheckoutSessionAction`, `createBillingPortalAction`, `watchRewardedAdAction`

### Stripe Integration
- `lib/billing/stripe.ts` — Stripe client wrapper (server-side only)
- `app/api/webhooks/stripe/route.ts` — Webhook handler for checkout, invoices, subscriptions
- `app/api/checkout/route.ts` — Create checkout session API
- `app/api/billing/portal/route.ts` — Customer portal API

### UI
- `app/pricing/page.tsx` — Public pricing page with plan comparison
- `app/(game)/billing/page.tsx` — Subscription dashboard with usage meters, token balance, upgrade CTAs
- `app/(game)/startup/[id]/pitch/page.tsx` — Updated with review status panel, cooldown display, token bypass button
- `components/game/GameNav.tsx` — Added BILLING nav item

## Environment Variables

```bash
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_PRICE_PRO_MONTHLY=""
STRIPE_PRICE_PRO_YEARLY=""
STRIPE_PRICE_MAX_MONTHLY=""
STRIPE_PRICE_MAX_YEARLY=""
REWARDED_ADS_ENABLED="false"
REWARDED_ADS_SIMULATED="false"
```

## Fairness Rules

1. Paid plans improve speed/convenience only.
2. No plan affects: valuation, cash, burn, runway, risk score, investor score, market score, leaderboard score, final outcome.
3. First pitch review is always instant regardless of plan.
4. Deterministic game math remains authoritative.

## Webhook Events Handled

- `checkout.session.completed` — Create subscription record, set user plan, grant tokens
- `invoice.payment_succeeded` — Renew subscription, reset tokens
- `invoice.payment_failed` — Mark past_due
- `customer.subscription.updated` — Sync status/period/cancel flags
- `customer.subscription.deleted` — Downgrade to free

## Testing

- 357 unit tests passing
- TypeScript: 0 errors
- Build: successful
- Lint: clean (only pre-existing warnings)
