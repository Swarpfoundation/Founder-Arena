# Founder Arena — MVP Implementation Plan

## 1. Product Scope

### 1.1 What We Are Building
Founder Arena is a web-based AI-powered startup simulation game. The MVP flow:

1. **Landing** — Discover the game, sign up / log in.
2. **Dashboard** — View active startups, stats, and leaderboard preview.
3. **Create Startup** — Define name, tagline, sector, stage, target market, and monetization model.
4. **Startup Profile** — View/edit startup details, see current status.
5. **Pitch Builder** — Compose a multi-section pitch (Problem, Solution, Market, Business Model, Traction, Team, Ask).
6. **AI VC Review** — Submit pitch to an AI VC agent; receive Accept / Reject / Revise / Funding Proposal with memo.
7. **Term Sheet Negotiation** — Negotiate valuation, amount, equity, board seat, liquidation preference.
8. **12-Month Operating Simulation** — Run month-by-month decisions on hiring, product, marketing, spending.
9. **Market Snapshot Impact** — Monthly market conditions affect outcomes (deterministic for MVP, extensible to real data).
10. **Leaderboard** — Rank startups by valuation, revenue, growth, survival time.
11. **Startup Graveyard** — Memorial for failed startups with post-mortem.
12. **Founder Profile** — User profile with stats, achievements, history.

### 1.2 MVP Boundaries
- Web app only (desktop + responsive).
- No mobile app.
- No real-time news API integration yet.
- AI used for analysis, scoring, narrative, and feedback only.
- Core simulation logic is deterministic and rule-based.
- No payment processing.
- No real fundraising or securities.

---

## 2. Technical Architecture

### 2.1 Recommended Stack
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 15 (App Router)** | Full-stack React, SSR/SSG, API routes, server actions, Vercel-ready. |
| Language | **TypeScript** | Type safety across frontend and backend. |
| Styling | **Tailwind CSS** | Utility-first, rapid UI iteration, minimal CSS files. |
| Components | **shadcn/ui** | Accessible, composable, copy-paste components; no runtime dependency lock-in. |
| Database | **PostgreSQL** | Reliable relational store for structured simulation data. |
| ORM | **Prisma** | Type-safe schema, migrations, excellent DX with Next.js. |
| Auth | **NextAuth.js v5 (Auth.js)** | OAuth (Google, GitHub) + email/password, JWT sessions, fits Next.js seamlessly. |
| AI | **Provider-agnostic SDK** | OpenAI GPT-4o as primary; fallback to deterministic mock mode when no key is present. |
| State Management | **React Server Components + Server Actions + URL state** | Minimize client-side state; use `nuqs` for complex URL state if needed. |
| Validation | **Zod** | Schema validation for forms, API inputs, and AI structured outputs. |
| Testing | **Vitest** (unit) + **Playwright** (E2E) | Fast unit tests; E2E for critical flows. |
| Deployment | **Vercel** (app) + **Neon / Supabase / Railway** (PostgreSQL) | Standard, cost-effective MVP hosting. |

### 2.2 Directory Structure (Proposed)
```
founder-arena/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (login, register)
│   ├── (game)/                   # Game group (dashboard, startup, simulation)
│   │   ├── dashboard/
│   │   ├── startup/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Startup profile
│   │   │   │   ├── pitch/
│   │   │   │   ├── review/
│   │   │   │   ├── term-sheet/
│   │   │   │   └── simulate/
│   │   ├── leaderboard/
│   │   ├── graveyard/
│   │   └── founder/
│   ├── api/                      # API routes (webhooks, external)
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   └── game/                     # Domain-specific components
├── lib/
│   ├── db/                       # Prisma client, schema, migrations
│   ├── auth.ts                   # Auth.js configuration
│   ├── ai/                       # AI abstraction layer
│   ├── simulation/               # Simulation engine
│   ├── market/                   # Market snapshot system
│   └── utils.ts
├── types/
├── hooks/
├── public/
├── docs/
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── unit/
│   └── e2e/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Database Model Plan

### 3.1 Entity Relationship Diagram (Conceptual)
```
User 1-->* Startup
Startup 1--1 PitchDeck
Startup 1--* VcReview
Startup 1--* FundingRound
FundingRound 1--1 TermSheet
Startup 1--* SimulationMonth
Startup 1--* Employee
SimulationMonth *--1 MarketSnapshot
MarketSnapshot 1--* MarketEvent
Startup 1--* LeaderboardEntry
User 1--* FounderAchievement
```

### 3.2 Prisma Schema (MVP)

```prisma
// User / Founder profile (extends NextAuth User)
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  startups      Startup[]
  achievements  FounderAchievement[]
}

model Startup {
  id                String   @id @default(cuid())
  userId            String
  name              String
  tagline           String
  sector            String
  stage             String   // idea, mvp, early, growth
  targetMarket      String
  monetizationModel String
  status            String   @default("draft") // draft, pitching, funded, simulating, dead, exited
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User             @relation(fields: [userId], references: [id])
  pitchDeck         PitchDeck?
  vcReviews         VcReview[]
  fundingRounds     FundingRound[]
  simulationMonths  SimulationMonth[]
  employees         Employee[]
  leaderboardEntries LeaderboardEntry[]
}

model PitchDeck {
  id            String   @id @default(cuid())
  startupId     String   @unique
  problem       String
  solution      String
  market        String
  businessModel String
  traction      String?
  team          String?
  ask           String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  startup       Startup  @relation(fields: [startupId], references: [id], onDelete: Cascade)
}

model VcReview {
  id              String   @id @default(cuid())
  startupId       String
  decision        String   // accept, reject, revise, proposal
  memo            String   @db.Text
  scoreProblem    Int?
  scoreSolution   Int?
  scoreMarket     Int?
  scoreTeam       Int?
  scoreBusiness   Int?
  overallScore    Int?
  feedback        String?  @db.Text
  createdAt       DateTime @default(now())

  startup         Startup  @relation(fields: [startupId], references: [id], onDelete: Cascade)
  fundingRound    FundingRound?
}

model FundingRound {
  id            String   @id @default(cuid())
  startupId     String
  vcReviewId    String   @unique
  stage         String   // pre_seed, seed, series_a
  amountAsked   Int      // in thousands
  amountOffered Int?     // in thousands
  valuationPre  Int?     // in thousands
  valuationPost Int?     // in thousands
  equityPercent Decimal? @db.Decimal(5, 2)
  status        String   @default("pending") // pending, negotiated, accepted, rejected
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  startup       Startup    @relation(fields: [startupId], references: [id], onDelete: Cascade)
  vcReview      VcReview   @relation(fields: [vcReviewId], references: [id])
  termSheet     TermSheet?
}

model TermSheet {
  id                    String   @id @default(cuid())
  fundingRoundId        String   @unique
  proposedValuation     Int      // in thousands
  proposedAmount        Int      // in thousands
  proposedEquity        Decimal  @db.Decimal(5, 2)
  boardSeat             Boolean  @default(false)
  liquidationPreference Decimal  @default(1.0) @db.Decimal(3, 1)
  antiDilution          Boolean  @default(false)
  founderResponse       String?  // accept, counter, reject
  counterValuation      Int?
  counterAmount         Int?
  counterEquity         Decimal? @db.Decimal(5, 2)
  status                String   @default("offered") // offered, countered, accepted, rejected
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  fundingRound          FundingRound @relation(fields: [fundingRoundId], references: [id], onDelete: Cascade)
}

model SimulationMonth {
  id                String   @id @default(cuid())
  startupId         String
  monthNumber       Int      // 1-12
  cashStart         Int      // in thousands
  cashEnd           Int      // in thousands
  burnRate          Int      // in thousands
  revenue           Int      // in thousands
  runwayMonths      Int
  productProgress   Int      // 0-100
  userGrowth        Int
  employeeCount     Int
  marketingSpend    Int      // in thousands
  productSpend      Int      // in thousands
  hiringSpend       Int      // in thousands
  marketCondition   String   // bullish, neutral, bearish
  eventsTriggered   String[] // IDs of MarketEvents applied
  aiSummary         String?  @db.Text
  decisionsLocked   Boolean  @default(false)
  createdAt         DateTime @default(now())

  startup           Startup  @relation(fields: [startupId], references: [id], onDelete: Cascade)
  marketSnapshot    MarketSnapshot? @relation(fields: [marketSnapshotId], references: [id])
  marketSnapshotId  String?
}

model Employee {
  id          String   @id @default(cuid())
  startupId   String
  role        String   // engineer, designer, sales, marketing, ops
  level       String   // junior, mid, senior, lead
  salary      Int      // annual in thousands
  hiredMonth  Int
  firedMonth  Int?
  productivity Decimal @default(1.0) @db.Decimal(3, 2)
  createdAt   DateTime @default(now())

  startup     Startup  @relation(fields: [startupId], references: [id], onDelete: Cascade)
}

model MarketSnapshot {
  id          String   @id @default(cuid())
  month       DateTime @unique // YYYY-MM-01
  condition   String   // bullish, neutral, bearish
  description String   @db.Text
  sectorTrends Json?   // { "saas": 1.1, "fintech": 0.9 }
  createdAt   DateTime @default(now())

  events      MarketEvent[]
  simulations SimulationMonth[]
}

model MarketEvent {
  id              String   @id @default(cuid())
  marketSnapshotId String
  name            String
  description     String   @db.Text
  sectorImpact    Json?    // { "saas": -0.05 }
  globalImpact    Decimal  @default(0.0) @db.Decimal(4, 3)
  type            String   // positive, negative, neutral
  createdAt       DateTime @default(now())

  marketSnapshot  MarketSnapshot @relation(fields: [marketSnapshotId], references: [id], onDelete: Cascade)
}

model LeaderboardEntry {
  id          String   @id @default(cuid())
  startupId   String
  score       Int
  valuation   Int      // in thousands
  revenue     Int      // in thousands
  survivalMonths Int
  rank        Int?
  category    String   // overall, sector, weekly
  createdAt   DateTime @default(now())

  startup     Startup  @relation(fields: [startupId], references: [id], onDelete: Cascade)
}

model FounderAchievement {
  id          String   @id @default(cuid())
  userId      String
  type        String   // first_pitch, first_funding, survived_12_months, unicorn, etc.
  title       String
  description String
  unlockedAt  DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 4. Route Map

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Landing page | Public |
| `/login` | Sign in | Public |
| `/register` | Sign up | Public |
| `/dashboard` | Founder dashboard | Required |
| `/startup/new` | Create startup wizard | Required |
| `/startup/[id]` | Startup profile | Required |
| `/startup/[id]/pitch` | Pitch builder | Required |
| `/startup/[id]/review` | AI VC review result | Required |
| `/startup/[id]/term-sheet` | Term sheet negotiation | Required |
| `/startup/[id]/simulate` | Simulation control center | Required |
| `/startup/[id]/simulate/month/[month]` | Month detail view | Required |
| `/leaderboard` | Global leaderboard | Public |
| `/graveyard` | Failed startups memorial | Public |
| `/founder/[id]` | Public founder profile | Public |
| `/founder/me` | Edit own profile | Required |
| `/api/ai/vc-review` | Trigger VC review | Required |
| `/api/ai/simulate-month` | Run month simulation | Required |
| `/api/market/snapshot` | Fetch market snapshot | Public |
| `/api/webhooks/*` | External service hooks | Secret |

---

## 5. API / Service Map

### 5.1 Server Actions (Primary)
All mutations go through Next.js Server Actions to minimize boilerplate.

| Action | Input | Output | Description |
|--------|-------|--------|-------------|
| `createStartup` | `StartupCreateSchema` | `Startup` | Create new startup draft |
| `updateStartup` | `StartupUpdateSchema` | `Startup` | Update startup metadata |
| `savePitchDeck` | `PitchDeckSchema` | `PitchDeck` | Save pitch sections |
| `submitPitchForReview` | `startupId` | `VcReview` | Trigger AI VC review |
| `negotiateTermSheet` | `TermSheetUpdateSchema` | `TermSheet` | Accept/counter/reject |
| `runSimulationMonth` | `startupId, month, decisions` | `SimulationMonth` | Advance one month |
| `hireEmployee` | `startupId, role, level` | `Employee` | Add employee |
| `fireEmployee` | `employeeId` | `Employee` | Remove employee |
| `updateFounderProfile` | `UserUpdateSchema` | `User` | Update profile |

### 5.2 API Routes (When Needed)
- `/api/ai/vc-review` — Streaming response for VC memo generation.
- `/api/ai/simulate-month` — Async simulation with AI narrative.
- `/api/market/snapshot` — Returns current or historical market snapshot.

### 5.3 Core Services

#### `services/startup.service.ts`
- CRUD for startups.
- Validation rules (e.g., max 3 active startups per user in MVP).

#### `services/pitch.service.ts`
- Save/retrieve pitch decks.
- Validate pitch completeness before review submission.

#### `services/vc-review.service.ts`
- Orchestrate AI review generation.
- Parse structured output into `VcReview` record.
- Enforce review cooldowns / max attempts.

#### `services/term-sheet.service.ts`
- Generate deterministic term sheet baselines.
- Validate negotiation bounds.

#### `services/simulation.service.ts`
- The rules engine. See Section 6.

#### `services/leaderboard.service.ts`
- Compute and cache rankings.
- Handle category filtering.

---

## 6. Simulation Engine Rules

### 6.1 Design Principle
**Deterministic, transparent, and testable.** AI generates narrative and explanations; numbers come from rules.

### 6.2 State Variables Per Month
- `cash`: Available capital (thousands USD)
- `burnRate`: Monthly net cash outflow
- `revenue`: Monthly recurring revenue
- `runway`: `cash / burnRate` (months)
- `productProgress`: 0-100
- `users`: Active user count
- `employees`: List with role/level/salary
- `marketCondition`: bullish (+10% revenue/growth), neutral (0%), bearish (-10%)
- `investorConfidence`: 0-100 (affects future fundraising)

### 6.3 Monthly Decision Inputs
Each month the founder sets:
1. `hiringSpend` — recruitment budget
2. `productSpend` — engineering/tools budget
3. `marketingSpend` — growth budget
4. `employeeCountDelta` — net hires/fires

### 6.4 Monthly Calculation Order
```
1. Start with previous month cashEnd as cashStart.
2. Apply market condition multiplier to revenue.
3. Apply any MarketEvent multipliers.
4. Calculate total salaries from Employee table.
5. burnRate = salaries + hiringSpend + productSpend + marketingSpend - revenue
6. cashEnd = cashStart - burnRate
7. runwayMonths = cashEnd / max(burnRate, 1)
8. productProgress += (productSpend * engineerCount * 0.5) / 1000
   capped at 100, requires engineers to grow
9. userGrowth += (marketingSpend * marketConditionMultiplier) / (CAC estimate)
   CAC varies by sector (config table)
10. If cashEnd <= 0 → status = "dead", trigger graveyard.
11. If month == 12 → status = "completed", calculate final score.
12. AI generates narrative summary based on the numbers.
```

### 6.5 Death Conditions
- `cashEnd <= 0` at any month → immediate failure.
- `investorConfidence < 20` AND `runway < 3` → death at month end.
- `productProgress < 30` at month 6 → likely death (AI narrative warning; hard death at month 9 if still < 30).

### 6.6 Scoring & Leaderboard
Final score formula (MVP):
```
score = (valuationPost * 0.4) + (revenue * 12 * 0.3) + (productProgress * 1000) + (survivalMonths * 500)
```
- Valuation derived from last funding round or rule-based estimate.
- Leaderboard recalculated on simulation completion.
- Categories: `overall`, `sector`, `weekly`.

---

## 7. Market Intelligence Architecture

### 7.1 Current State (MVP)
No live news API. Instead:
- A seeded `MarketSnapshot` table with historical-inspired synthetic data.
- Monthly snapshots pre-generated for 24 months.
- Each snapshot has 0-3 `MarketEvent` records.
- Simulation pulls the snapshot for the corresponding simulated month.

### 7.2 Future Integration Path
```
┌─────────────────┐
│  News API / RSS │  (Future: Polygon, NewsAPI, RSS feeds)
└────────┬────────┘
         │
┌────────▼────────┐
│  ETL Worker     │  (Future: Cron job or Vercel Cron)
│  - Fetch headlines
│  - Classify sentiment
│  - Tag sectors
│  - Generate MarketEvent rows
└────────┬────────┘
         │
┌────────▼────────┐
│  MarketSnapshot │  (Existing table — no schema change needed)
└─────────────────┘
```

### 7.3 Extensibility Checklist
- [ ] `MarketSnapshot.sectorTrends` is JSON — accommodates new sectors without migration.
- [ ] `MarketEvent.sectorImpact` is JSON — accommodates new sectors without migration.
- [ ] ETL worker can write directly to `MarketSnapshot` and `MarketEvent`.
- [ ] Simulation engine reads snapshot by `month` date — deterministic and replaceable.

---

## 8. AI Agent Architecture

### 8.1 Provider-Agnostic Interface
```typescript
// lib/ai/ai-provider.ts
interface AIProvider {
  generateText(options: GenerateOptions): Promise<string>;
  generateStructured<T extends z.ZodSchema>(options: GenerateOptions & { schema: T }): Promise<z.infer<T>>;
}

// lib/ai/openai-provider.ts
class OpenAIProvider implements AIProvider { ... }

// lib/ai/mock-provider.ts
class MockProvider implements AIProvider { ... } // deterministic fallback for local dev

// lib/ai/index.ts
export const ai = process.env.OPENAI_API_KEY 
  ? new OpenAIProvider() 
  : new MockProvider();
```

### 8.2 AI Use Cases
| Use Case | Input | Output | Model |
|----------|-------|--------|-------|
| VC Review | PitchDeck + MarketSnapshot | Decision + Memo + Scores | GPT-4o |
| Term Sheet Narrative | TermSheet + Startup | Investor letter | GPT-4o |
| Monthly Summary | SimulationMonth + Decisions | Narrative paragraph | GPT-4o mini |
| Post-Mortem | Dead startup history | Graveyard epitaph | GPT-4o mini |
| Achievement Title | Achievement context | Creative title | GPT-4o mini |

### 8.3 Deterministic Fallback (Mock Provider)
When no API key is configured:
- VC Review returns a random decision with a template memo.
- Scores are derived from simple heuristics (pitch length, keyword matching).
- Narratives are template-based with variable substitution.
- **Goal:** App is fully functional offline; AI just enhances quality when connected.

### 8.4 Structured Output
All AI calls that must write to the database use `generateStructured` with Zod schemas to guarantee parseable output.

---

## 9. Implementation Phases

### Phase 0: Foundation (Week 1)
- [ ] Initialize Next.js 15 project with TypeScript, Tailwind, App Router.
- [ ] Install and configure: Prisma, Auth.js, shadcn/ui, Zod, Vitest.
- [ ] Set up PostgreSQL connection (local Docker for dev).
- [ ] Write initial Prisma schema and run first migration.
- [ ] Configure Auth.js with Google + Credentials providers.
- [ ] Set up basic layout, navigation, and theme.
- [ ] Add lint, typecheck, test, and build scripts.
- [ ] Write CI workflow (GitHub Actions) for lint + typecheck + test.

**Deliverable:** A runnable empty shell with auth and DB connected.

### Phase 1: Startup & Pitch (Week 2)
- [ ] Landing page (`/`).
- [ ] Dashboard (`/dashboard`).
- [ ] Create startup flow (`/startup/new`).
- [ ] Startup profile page (`/startup/[id]`).
- [ ] Pitch builder (`/startup/[id]/pitch`).
- [ ] Pitch validation and completeness check.
- [ ] Seed a few test market snapshots.

**Deliverable:** Users can create startups and build pitches.

### Phase 2: AI VC Review & Term Sheet (Week 3)
- [ ] Implement AI provider abstraction + mock provider.
- [ ] VC review server action + API route.
- [ ] VC review page (`/startup/[id]/review`).
- [ ] Display AI memo, scores, and decision.
- [ ] Term sheet generation service (deterministic rules).
- [ ] Term sheet negotiation page (`/startup/[id]/term-sheet`).
- [ ] Funding round creation on acceptance.

**Deliverable:** Users can submit pitches, get AI feedback, and negotiate funding.

### Phase 3: Simulation Engine (Week 4)
- [ ] Implement simulation rules engine.
- [ ] Employee model and hire/fire actions.
- [ ] Monthly decision form (spending + hiring).
- [ ] Simulation month runner service.
- [ ] Simulation control center (`/startup/[id]/simulate`).
- [ ] Month detail view with charts.
- [ ] Death detection and graceful failure handling.
- [ ] AI monthly summary integration.

**Deliverable:** Users can run the 12-month simulation.

### Phase 4: Market, Leaderboard, Graveyard, Polish (Week 5)
- [ ] Market snapshot display in simulation.
- [ ] Event trigger logic and narrative injection.
- [ ] Leaderboard computation and caching.
- [ ] Leaderboard page (`/leaderboard`).
- [ ] Startup graveyard page (`/graveyard`).
- [ ] Founder profile + achievements.
- [ ] Responsive polish, error boundaries, loading states.
- [ ] E2E tests for critical flows.

**Deliverable:** Complete MVP with all target modules.

### Phase 5: Hardening & Launch Prep (Week 6)
- [ ] Performance audit (DB queries, bundle size).
- [ ] Security audit (auth, input validation, rate limiting).
- [ ] Add rate limiting on AI routes.
- [ ] Add basic analytics (Vercel Analytics or Plausible).
- [ ] Documentation update.
- [ ] Deploy to staging.
- [ ] Bug fixes from dogfooding.

**Deliverable:** Production-ready MVP.

---

## 10. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI API costs / rate limits | High | Medium | Mock provider fallback; aggressive caching of AI outputs; rate limiting per user. |
| Simulation balance feels unfair | High | Medium | Extensive unit tests for rule engine; expose formulas to users; iterate based on playtests. |
| DB schema changes mid-build | Medium | High | Start with Prisma migrations from day one; avoid JSON fields where relations are clearer; keep schema normalized. |
| Auth complexity | Medium | Medium | Use Auth.js (well-documented for Next.js); start with OAuth only; add credentials later if needed. |
| Scope creep to real-time market data | Medium | Medium | Explicitly defer in product scope; architect JSON extensibility fields now; do not build ETL in MVP. |
| No existing codebase = full rebuild | Medium | High | This is expected; the audit confirms a clean slate. Follow Phase 0 strictly to avoid yak shaving. |
| Testing gaps in simulation logic | High | Medium | Write unit tests for `simulation.service.ts` alongside implementation; maintain >80% coverage for engine. |

---

## 11. Audit Summary (Pre-Implementation)

**Current Repository State:**
- Framework: None (empty repository).
- Package Manager: None.
- App Structure: Only `README.md`.
- Existing Routes: None.
- Existing Auth: None.
- Existing Database: None.
- Existing ORM/Migrations: None.
- Existing API: None.
- Existing UI: None.
- Existing Environment Variables: None.
- Existing Test/Lint/Build Commands: None.
- Next.js Suitability: Repo is a clean slate. Next.js full-stack is the recommended and optimal choice.
- Risks: Only risk is scope management and ensuring the stack is initialized correctly before feature work begins.

**Commands Used for Audit:**
```bash
pwd && ls -la
find . -type f -not -path './.git/*'
```

**Detected Stack:** Empty repository. No constraints.

**Validation Status:** N/A — no code to validate yet.

---

*Plan Version: 1.0*
*Date: 2026-05-02*
*Next Step: Execute Phase 0 — initialize Next.js project and configure foundational tooling.*
