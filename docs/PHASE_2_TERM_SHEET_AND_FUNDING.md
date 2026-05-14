# Phase 2: Term Sheet Negotiation & Funding Activation

## Implemented Flow

```
VC Review (proposal/accept)
  → Term Sheet Generation (deterministic rules)
    → /startup/[id]/terms
      → Accept → FundingRound + Startup funded
      → Counter → Negotiation Engine → Accept / Revise / Reject
      → Reject → Term sheet closed, startup unfunded
```

## What Was Implemented

### 1. Data Model Changes
Migration: `20260502191000_add_term_sheet_and_funding_v2`

**TermSheet model (rewritten):**
- `startupId` — direct ownership link
- `vcReviewId` — optional link to originating review
- `status` — `proposed` | `countered` | `accepted` | `rejected` | `expired`
- `proposedAmount`, `proposedEquity`
- `preMoneyValuation`, `postMoneyValuation`
- `founderSalaryCap`
- `boardSeat`, `boardObserver`
- `liquidationPreference`
- `proRataRights`
- `milestoneRequirements`
- `investorNotes`
- `founderCounter` (Json)
- `negotiationHistory` (Json)
- `expiresAt`

**FundingRound model (rewritten):**
- `startupId`
- `vcReviewId` — optional
- `termSheetId` — optional, unique
- `roundType` — `angel` | `pre_seed` | `seed` | `series_a`
- `amountRaised`, `equitySold`
- `preMoneyValuation`, `postMoneyValuation`
- `investorName`
- `status`, `closedAt`

### 2. Term Sheet Generation Service
`lib/terms/generate-term-sheet.ts`

Deterministic rules based on:
- **Overall score** → better score = lower equity ask
- **Risk score** → higher risk = higher liquidation preference (1.0x → 2.0x) and more equity
- **Market score** → influences investment amount
- **Sector** → deep-tech (AI/ML, Healthtech, Climate, EdTech) triggers milestone requirements
- **Funding ask** → caps and scales proposed amount

Output:
- Pre-money and post-money valuation
- Board seat / observer terms
- Pro-rata rights
- Founder salary cap (deterministic by sector hash)
- Milestone strings for regulated sectors
- 14-day expiration

### 3. Negotiation Engine
`lib/terms/negotiation.ts`

Evaluates founder counter-offers:
- **Accept counter** — if founder offers equal or worse terms for themselves, or within 10-15% flexibility band (higher for high-scoring startups)
- **Reject counter** — if too aggressive (more money + less equity) and overall score < 70
- **Revise terms** — meet-in-the-middle on amount and equity; preserve other terms

Negotiation history is appended to `TermSheet.negotiationHistory` as JSON.

### 4. Routes

| Route | Purpose |
|-------|---------|
| `/startup/[id]/terms` | Term sheet display, accept/reject/counter |
| `/startup/[id]/operate` | Funded company placeholder (simulation unlocks Phase 3) |

### 5. Server Actions
`lib/actions/terms.ts`

- `getOrCreateTermSheet` — fetches existing or generates new from latest VC review
- `getTermSheet` — fetches latest term sheet for a startup
- `submitCounterOfferAction` — validates counter, runs negotiation engine, updates DB
- `acceptTermSheetAction` — validates, creates FundingRound, updates Startup cash/stage/status in a transaction
- `rejectTermSheetAction` — marks term sheet rejected

### 6. Page Updates

**VC Review (`/startup/[id]/review`):**
- Investable decisions (`proposal`, `accept`) show "Review Term Sheet" or "View Term Sheet" CTA
- Non-investable decisions show disabled "Term Sheet — Not Available" button
- Links back to pitch revision

**Startup Profile (`/startup/[id]`):**
- Shows FundingRound card if funded
- Shows TermSheet card if exists and not yet funded
- Shows Latest Review card if no term sheet yet
- Primary CTA adapts: Build Pitch → Submit for Review → Review Term Sheet → Operate Company

**Dashboard (`/dashboard`):**
- Status badges updated to show `funded` as success variant
- Cash and valuation visible on cards

### 7. Operating Center Placeholder
`/startup/[id]/operate`
- Displays funded metrics (cash, valuation, stage, status)
- Shows latest funding round details
- Clearly states: "Full 12-month simulation unlocks in Phase 3"
- Disabled "Start Simulation" button

### 8. Tests
`tests/unit/terms.test.ts`

- Term sheet generation for high/low-risk startups
- Liquidation preference scaling
- Milestone inclusion for deep-tech sectors
- Post-money = pre-money + amount math validation
- Counter-offer acceptance, rejection, and revision
- Meet-in-the-middle math for revised terms

## Negotiation Rules Summary

| Scenario | Outcome |
|----------|---------|
| Founder asks for less money OR more equity | Accept |
| Counter within 10-15% (score-dependent) | Accept |
| Aggressive counter (more money + less equity) + score < 70 | Reject |
| Everything else | Revise (meet in middle) |

## How to Test Locally

1. Ensure DB is running:
   ```bash
   docker start founder-arena-db
   ```

2. Reset and seed if needed:
   ```bash
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```

3. Create a startup, build a pitch, submit for review.
4. If review is `proposal` or `accept`, visit `/startup/[id]/terms`.
5. Try accept, counter-offer, and reject flows.
6. On accept, verify startup cash increases and status becomes `funded`.

## Known Limitations

- Term sheet expiration is stored but not enforced by a cron job.
- No email notifications on term sheet events.
- Only one counter-offer round is fully supported (history is stored but multi-round UI is basic).
- Operating simulation is a placeholder only.
- No multiple investors per round.

## Next Phase Recommendation

**Phase 3: 12-Month Operating Simulation**
- Monthly decision forms (hiring, product, marketing spend)
- Simulation rules engine (cash, burn, runway, product progress, user growth)
- Market snapshot impact per month
- Death conditions and survival tracking
- AI monthly summary generation
