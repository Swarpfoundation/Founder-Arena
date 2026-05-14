# Phase 18: Growth Rounds and Strategic Exits

## Overview

Phase 18 introduces late-stage growth mechanics that extend the Founder Arena simulation beyond the initial 12-month operating period. After completing a strong simulation, founders can now enter the **Growth Phase** to explore:

- **Series A/B readiness** scoring
- **Strategic actor system** with 15 fictionalized archetypes
- **Growth round offers** (investment, acquisition, partnership)
- **Founder decision system** (accept, reject, counter, defer)
- **Growth achievements** and enhanced leaderboard scoring
- **Public page updates** for acquired/exited startups

## Architecture

```
lib/growth/
  types.ts              # Growth types, interfaces, enums
  eligibility.ts        # Readiness calculations (Series A/B, acquisition, strategic fit)
  actor-library.ts      # 15 fictionalized strategic actor archetypes
  strategic-offers.ts   # Deterministic offer generation engine
  offer-resolution.ts   # Offer acceptance/rejection/counter resolution
  offer-actions.ts      # Server actions for growth phase CRUD

app/(game)/startup/[id]/growth/page.tsx  # Growth phase UI
components/growth/
  ReadinessScoreCard.tsx      # Readiness score visualization
  GrowthOfferCard.tsx         # Offer display card
  GrowthOfferCardWrapper.tsx  # Interactive offer wrapper with actions
```

## Deterministic Rules

All growth mechanics are **pure deterministic functions**:

- **Eligibility scores** are calculated from startup state (revenue, valuation, product progress, team size, etc.)
- **Offer generation** uses `seededRandom(seed)` where `seed = hashString(startupId + actorId + monthCount)`
- **Offer resolution** produces bounded, reproducible outcomes
- **AI is never used** to set cash, valuation, equity, or scores directly

## Strategic Actors (15 Fictionalized Archetypes)

| ID | Display Name | Actor Type | Inspired By |
|---|---|---|---|
| `frontier_ai_lab` | OmniAI Labs | frontier_ai | frontier AI research laboratories |
| `cloud_hyperscaler` | Northstar Cloud | cloud_hyperscaler | cloud computing hyperscalers |
| `mobile_platform` | Titan Mobile | mobile_platform | mobile operating system platforms |
| `enterprise_giant` | Apex Dynamics | enterprise_giant | enterprise software conglomerates |
| `payments_network` | VaultPay Network | payments_network | payment network processors |
| `ecommerce_giant` | Atlas Commerce | ecommerce_giant | global e-commerce platforms |
| `streaming_platform` | Horizon Stream | streaming_platform | video streaming platforms |
| `cybersecurity_firm` | Crimson Cyber | cybersecurity_firm | cybersecurity vendors |
| `healthcare_system` | Helix Health | healthcare_system | healthcare technology systems |
| `chip_manufacturer` | Silicon Forge | chip_manufacturer | semiconductor manufacturers |
| `auto_mobility` | Vehiculus Motors | auto_mobility | automotive/EV manufacturers |
| `fintech_platform` | Ledger Bank | fintech_platform | digital banking platforms |
| `social_network` | Nexus Social | social_network | social media platforms |
| `logistics_giant` | Meridius Logistics | logistics_giant | global logistics providers |
| `consulting_firm` | Keystone Advisory | consulting_firm | management consulting firms |

### Brand Safety

- All names are **fictionalized**. No real company logos, marks, or implied endorsements.
- `inspiredByCategory` references real-world categories **neutrally**.
- Every actor includes a `disclaimer`: "Fictional entity inspired by the [category]. Not affiliated with any real company."

## Eligibility Engine

### Series A Readiness (0–100)

| Factor | Threshold | Points |
|---|---|---|
| Revenue | $50K+ | 20 |
| Revenue | $20K+ | 12 |
| Revenue | $5K+ | 5 |
| Product | 80%+ | 15 |
| Product | 50%+ | 8 |
| Valuation | $5M+ | 15 |
| Valuation | $2M+ | 8 |
| Investor Score | 70+ | 15 |
| Investor Score | 50+ | 8 |
| Risk Score | ≤30 | 10 |
| Risk Score | ≤50 | 5 |
| Capital Efficiency | ≥1.5x | 10 |
| Capital Efficiency | ≥1x | 5 |
| Team Size | 5+ | 10 |
| Team Size | 3+ | 5 |
| Crisis Survival | — | 5 |

**Status bands**: `not_ready` (<35), `borderline` (35–54), `ready` (55–74), `strong` (75+)

### Series B Readiness

Higher thresholds: $200K+ revenue, $20M+ valuation, 95%+ product, 80+ investor score, 10+ team, 2x+ capital efficiency.

### Acquisition Readiness

Focuses on product/IP asset (70%+), meaningful valuation ($3M+), proven revenue ($10K+), team acquihire potential (3+), clean risk profile, and investor validation.

## Offer Generation

For each strategic actor with fit score ≥30, the engine generates an offer:

1. **Filter** actors by strategic fit (≥30)
2. **Determine offer type** based on actor preferences and startup readiness
3. **Calculate economics** using seeded random within bounded ranges:
   - Series A: $2M–$15M
   - Series B: $10M–$50M
   - Acquisition: 1.5x–4x current valuation
   - Partnership: non-cash benefits + 10% valuation boost
4. **Sort** by fit score descending
5. **Cap** at 5 offers maximum

## Offer Resolution

| Action | Effect |
|---|---|
| **Accept (investment)** | Cash ↑, equity dilution, status → `funded`, funding round created |
| **Accept (acquisition)** | Cash ↑ by acquisition price, status → `acquired`, exit recorded |
| **Accept (partnership)** | Valuation +10%, no cash change, status → `funded` |
| **Reject** | Small negative valuation signal (-2%), independence preserved |
| **Counter (fit ≥60)** | Actor accepts with 5% improved terms |
| **Counter (fit <60)** | Actor rejects counter |
| **Defer** | Expiry extended, no immediate effect |

## Growth Achievements

| Key | Title | XP | Condition |
|---|---|---|---|
| `series_a_ready` | Series A Ready | 200 | Readiness score ≥75 |
| `raised_series_a` | Raised Series A | 400 | Close a Series A round |
| `strategic_backing` | Strategic Backing | 250 | Receive strategic actor offer |
| `acquisition_offer` | Acquisition Offer | 300 | Receive acquisition offer |
| `successful_exit` | Successful Exit | 600 | Accept acquisition or IPO |
| `rejected_lowball` | Rejected Lowball | 150 | Counter/reject offer <2x valuation |
| `platform_partner` | Platform Partner | 350 | Accept strategic partnership |
| `capital_efficient_scale` | Capital Efficient Scale | 300 | Growth round with <20% dilution |

## UI Flow

1. **Startup Profile** → "Enter Growth Phase" link (visible when `status === "completed"`)
2. **Dashboard** → "Enter Growth Phase" link on completed startup cards
3. **Operate Final Report** → "Growth Phase Unlocked" card with CTA
4. **Growth Route** (`/startup/[id]/growth`):
   - Readiness score cards (Series A, Series B, Acquisition)
   - Strategic actor cards
   - Offer cards with Accept/Reject/Counter/Defer actions
   - Counter form for term negotiation

## Database Schema

```prisma
model GrowthOffer {
  id               String   @id @default(cuid())
  startupId        String
  actorId          String
  actorName        String
  actorType        String
  offerType        String
  status           String   @default("proposed")
  headline         String
  amount           Int?
  equityPercent    Decimal? @db.Decimal(5, 2)
  acquisitionPrice Int?
  valuation        Int?
  terms            Json?
  benefits         Json?
  risks            Json?
  counterTerms     Json?
  expiresAt        DateTime?
  resolvedAt       DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  startup          Startup  @relation(fields: [startupId], references: [id], onDelete: Cascade)
  @@index([startupId])
  @@map("growth_offers")
}
```

`FundingRound` also gained `investorType String? @default("vc")` and `investorName String?`.

## Public Pages

- `/s/[slug]` — If startup is `acquired`, shows acquisition price and acquirer name. Hides private pitch details.
- Share text supports `acquisition` and `exit` contexts.

## Testing

`tests/unit/growth.test.ts` (34 tests):
- Eligibility calculations (Series A/B, acquisition, strategic fit)
- Strategic actor validation (15 actors, required fields, brand safety)
- Offer generation (determinism, bounds, sorting, filtering)
- Offer resolution (accept/reject/counter/defer for all offer types)

## Migration Notes

Applied via forward migration SQL:
```sql
CREATE TABLE "growth_offers" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id TEXT NOT NULL REFERENCES "Startup"(id) ON DELETE CASCADE,
  ...
);
ALTER TABLE "funding_rounds" ADD COLUMN "investor_type" TEXT DEFAULT 'vc';
ALTER TABLE "funding_rounds" ADD COLUMN "investor_name" TEXT;
```

## Validation

- ✅ `npm run typecheck` — passes
- ✅ `npm run lint` — passes (no warnings)
- ✅ `npm test` — 343 tests passing
