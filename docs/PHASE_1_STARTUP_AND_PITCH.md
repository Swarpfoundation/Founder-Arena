# Phase 1: Startup & Pitch Implementation

## What Was Implemented

### 1. Dashboard (`/dashboard`)
- Displays the current founder profile via demo-user fallback.
- Lists all startups belonging to the current user with:
  - Name, sector, stage, status badges
  - Valuation and cash metrics
  - Creation date
  - Empty state with CTA when no startups exist
- CTA to create a new startup.

### 2. Create Startup (`/startup/new`)
- Real multi-section form with fields:
  - Startup name, one-line description
  - Sector (dropdown from constants), region, target customer
  - Problem, solution, business model, unfair advantage
  - Funding ask (numeric, $25K–$10M)
- Client-side Zod validation with clear error messages.
- On submit:
  - Validates via `createStartupSchema`
  - Calls `ai.analyzeStartupIdea()` (OpenAI or deterministic MockProvider)
  - Creates `Startup` row with AI-generated scores and valuation estimate
  - Stores structured AI analysis in `startup.aiAnalysis` (Json)
  - Redirects to startup profile

### 3. Startup Profile (`/startup/[id]`)
- Displays startup overview (problem, solution, business model, unfair advantage)
- Shows AI idea analysis card with:
  - Investor, market, risk, timing scores
  - Strengths and risks list
- Shows current game metrics (valuation, cash, burn, revenue, product progress)
- Shows latest VC review preview if available
- CTA to build/edit pitch deck
- Access control: only the owning user can view

### 4. Pitch Builder (`/startup/[id]/pitch`)
- Multi-section form covering:
  - Problem, solution, market size
  - Product, business model, go-to-market, competition
  - Team, financial plan, funding ask, use of funds
- Client-side Zod validation with minimum lengths
- Upserts `PitchDeck` row on save
- Pre-populates existing pitch deck data
- "Submit for Review" button triggers AI VC review

### 5. AI VC Review (`/startup/[id]/review`)
- Displays the latest `VcReview` for the startup
- Shows:
  - Decision badge (proposal / revise / reject)
  - Overall score and section scores
  - Investor memo
  - Strengths, weaknesses, market timing, milestones
  - Investment proposal amount and equity if applicable
- CTA to revise pitch or return to profile
- Term sheet button is disabled with "Coming Next Phase" label

### 6. AI Provider Layer
- Updated `AIProvider` interface with:
  - `analyzeStartupIdea()` → `StartupAnalysis`
  - `reviewPitch()` → `VcReviewResult`
- Added strongly typed Zod schemas:
  - `startupAnalysisSchema`
  - `vcReviewSchema`
- `MockProvider` implements both methods with deterministic, input-seeded scoring:
  - Scores derived from hash of name + sector
  - Consistent results for identical inputs
  - Generates realistic mock summaries, strengths, risks, and milestones
- `OpenAIProvider` uses GPT-4o with JSON-mode prompts

### 7. Demo User Helper
- `lib/user.ts` provides `getCurrentUserOrDemoUser()`:
  - Attempts NextAuth session first
  - Falls back to deterministic demo user (`demo@founderarena.local`)
  - Auto-creates demo user if not present
- `requireUser()` throws if no user can be resolved
- Clearly documented as temporary until full auth is completed

### 8. Server Actions
- `lib/actions/startup.ts` contains all server-side mutations:
  - `createStartupAction` — creates startup + runs AI analysis
  - `getUserStartups` — lists user startups
  - `getStartupById` — fetches startup with pitch deck and reviews
  - `savePitchDeckAction` — upserts pitch deck
  - `submitPitchForReviewAction` — calls AI review + stores VcReview
  - `getLatestVcReview` — fetches latest review

### 9. Tests
- `tests/unit/validations.test.ts`:
  - Valid startup data acceptance
  - Short name rejection
  - Funding ask below minimum rejection
  - Valid pitch deck acceptance
  - Short problem description rejection
- `tests/unit/ai.test.ts`:
  - Deterministic scoring from `MockProvider.analyzeStartupIdea`
  - Consistency across identical inputs
  - Structured output validation for `reviewPitch`

## Routes Added/Updated

| Route | Status | Notes |
|-------|--------|-------|
| `/dashboard` | Updated | Real data, dynamic |
| `/startup/new` | Updated | Full create form |
| `/startup/[id]` | Updated | Profile + AI analysis |
| `/startup/[id]/pitch` | Updated | Pitch builder + submit |
| `/startup/[id]/review` | Updated | VC review display |

## DB Schema / Migration Changes

Migration: `20260502190523_add_phase1_fields`

### Added to `Startup`:
- `description` (String)
- `region` (String)
- `problem` (String, Text)
- `solution` (String, Text)
- `unfairAdvantage` (String, Text)
- `fundingAsk` (Int)
- `cash` (Int, default 0)
- `monthlyBurn` (Int, default 0)
- `revenue` (Int, default 0)
- `valuation` (Int, default 0)
- `productProgress` (Int, default 0)
- `investorScore` (Int?)
- `marketScore` (Int?)
- `riskScore` (Int?)
- `aiAnalysis` (Json?)

### Updated `PitchDeck`:
- Renamed conceptually: `market` → expanded to `marketSize`, `product`, `goToMarket`, `competition`, `financialPlan`, `useOfFunds`
- Added fields: `marketSize`, `product`, `goToMarket`, `competition`, `financialPlan`, `useOfFunds`

### Updated `VcReview`:
- Added: `proposedAmount`, `proposedEquity`, `strengths`, `weaknesses`, `marketTiming`, `milestones`, `rawResponse`

## AI Provider Behavior

### When `OPENAI_API_KEY` is set:
- Uses `OpenAIProvider` with GPT-4o
- Structured JSON output via schema-driven prompts
- Real analysis based on input content

### When `OPENAI_API_KEY` is missing:
- Falls back to `MockProvider`
- Deterministic scores based on string hash of inputs
- Consistent across identical inputs
- Generates plausible mock narratives
- App remains fully functional offline

## How to Test Locally

1. Ensure PostgreSQL is running (Docker container from Phase 0):
   ```bash
   docker start founder-arena-db
   ```

2. Seed demo user and market data:
   ```bash
   npx tsx prisma/seed.ts
   ```

3. Run dev server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000/dashboard`
   - You will be auto-assigned the demo user
   - Create a startup, build a pitch, submit for review

5. Run tests:
   ```bash
   npm run test
   ```

## Known Limitations

- Auth is demo-user only. OAuth providers are configured but not required.
- Term sheet negotiation is not implemented (disabled button with "Coming Next Phase").
- Operating simulation is not implemented.
- Leaderboard and graveyard are placeholder pages.
- AI provider structured output for OpenAI uses simple JSON parsing (no function calling yet).
- No rate limiting on AI routes.
- No email/password auth yet.

## Next Phase Recommendation

**Phase 2: AI VC Review & Term Sheet**
- Enable the term sheet negotiation flow
- Add funding round creation on acceptance
- Implement deterministic term sheet generation rules
- Add term sheet counter-offer logic
