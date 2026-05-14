# Phase 15: Onboarding, Guided First Run, and Gameplay Education

## Goal
Improve first-time user activation by reducing friction from signup to first operating month. A new user should understand and complete this loop quickly:

**Create startup → pitch → VC review → term sheet → funding → operate first month**

## What Changed

### 1. Onboarding Audit & UX Fixes
- Added helper text and examples under form fields on `/startup/new`
- Added pitch quality hints under each pitch builder field
- Improved empty states on dashboard, profile, leaderboard, graveyard, and market pages
- All empty states now explain what the area is and provide a useful CTA

### 2. Startup Idea Templates
- **File**: `lib/onboarding/startup-templates.ts`
- **Component**: `components/onboarding/StartupTemplatePicker.tsx`
- 12 high-quality templates covering diverse sectors:
  1. AI compliance copilot (AI / ML)
  2. Stablecoin remittance platform (Fintech)
  3. Web3 wallet security tool (Fintech)
  4. Vertical SaaS for clinics (Healthtech)
  5. AI sales assistant (AI / ML)
  6. Climate/energy optimization SaaS (Climate)
  7. Gaming creator economy tool (Consumer)
  8. Logistics visibility platform (Enterprise)
  9. Consumer finance app (Fintech)
  10. Developer tool for API testing (SaaS)
  11. Healthcare AI triage assistant (Healthtech)
  12. Marketplace for local services (Consumer)

Each template includes: name, sector, region, description, target customer, problem, solution, business model, unfair advantage, recommended funding ask, risk note, and why it is interesting in the game.

### 3. Create Startup UX Upgrade
- Route: `/startup/new`
- Users can now start blank OR choose a template
- Template picker pre-fills all form fields
- Sector-based funding ask guidance appears when a sector is selected
- Helper text and examples under each field
- Zod validation preserved
- Templates are optional

### 4. Pitch Builder Assistance
- Route: `/startup/[id]/pitch`
- **File**: `lib/onboarding/pitch-draft.ts`
- Added "Use suggested pitch draft" button when no pitch exists
- Deterministic draft generated from startup fields (no external AI call)
- Draft covers all 11 pitch sections with sector-aware market size estimates
- Section quality hints visible under each field:
  - Problem: be specific
  - Market: name buyer and budget
  - Go-to-market: start narrow
  - Use of funds: match funding ask

### 5. How-to-Play Page
- Route: `/how-to-play`
- Comprehensive guide covering:
  - What Founder Arena is
  - The 4-step game loop
  - How AI VC scoring and committee personas work
  - How funding negotiation works (accept / counter / reject)
  - How monthly simulation decisions affect metrics
  - How market scenarios affect sector-specific startups
  - Leaderboard scoring formula and outcome multipliers
  - Why startups die (5 death conditions)
  - Tips for better outcomes
- Linked from landing page, nav bar, mobile menu, and footer

### 6. First-Run Checklist
- **File**: `lib/onboarding/progress.ts`
- Component: `components/onboarding/FirstRunChecklist.tsx`
- Appears on `/dashboard` for users with ≤2 startups
- 8 checklist items derived from real user data:
  1. Create your first startup
  2. Build your pitch deck
  3. Submit to AI VC
  4. Review term sheet
  5. Accept or reject funding
  6. Run your first operating month
  7. Hire your first team member
  8. Check leaderboard / profile
- Progress bar shows completion percentage
- Checklist disappears when all items are complete

### 7. Guided CTA System
- **File**: `lib/onboarding/progress.ts`
- Component: `components/onboarding/NextBestAction.tsx`
- Displays the next logical action on:
  - `/dashboard`
  - `/startup/[id]`
  - `/startup/[id]/pitch`
  - `/startup/[id]/review`
  - `/startup/[id]/terms`
  - `/startup/[id]/operate`
  - `/startup/[id]/team`
- Urgency levels: high (rose), medium (cyan), low (default)
- Examples:
  - No startup → Create startup
  - No pitch → Build pitch
  - No review → Submit to AI VC
  - Funded but no month → Run first month
  - Active with team → Continue operating
  - Completed/dead → Start new startup

### 8. Demo/Sample Public Content
- **File**: `lib/onboarding/demo-samples.ts`
- Static sample cards shown on empty leaderboard and graveyard pages
- Only visible when `DEMO_MODE_ENABLED=true` or `NODE_ENV !== "production"`
- Clearly labeled with "Example" badge
- No fake database entries seeded

### 9. Empty State Improvements
Improved empty states for:
- Dashboard no startups
- Leaderboard no entries (+ sample cards in dev)
- Graveyard no dead startups (+ sample cards in dev)
- Profile no achievements
- Profile no startups
- Profile no leaderboard placements
- Market no snapshots

### 10. Tooltips / Explainer Cards
- **File**: `components/onboarding/ExplainerCard.tsx`
- Lightweight inline explainers for 10 game concepts:
  - Runway, Burn, Valuation
  - Investor Score, Risk Score
  - Market Difficulty, Product Progress
  - Final Score, Equity Dilution, Term Sheet
- Three display modes:
  - `ExplainerTooltip`: hover to reveal
  - `ExplainerButton`: click to toggle card
  - `ExplainerHint`: inline helper text

### 11. Landing Page Activation Update
- Added "Try a startup template" CTA linking to `/startup/new`
- Added "How it works" section with link to `/how-to-play`
- Better explanation of the full loop

### 12. Navigation Updates
- Added "How to Play" link to desktop nav, mobile menu, and footer

## Routes Updated
| Route | Change |
|-------|--------|
| `/` | New CTAs for templates and how-to-play |
| `/how-to-play` | New page |
| `/dashboard` | First-run checklist + next best action |
| `/startup/new` | Template picker + helper text |
| `/startup/[id]` | Next best action inline |
| `/startup/[id]/pitch` | Draft button + quality hints |
| `/startup/[id]/review` | Next best action inline |
| `/startup/[id]/terms` | Guided CTAs based on status |
| `/startup/[id]/operate` | Next best action inline |
| `/startup/[id]/team` | Next best action inline |
| `/leaderboard` | Improved empty state + sample cards |
| `/graveyard` | Improved empty state + sample cards |
| `/profile` | Empty states for achievements/history/placements |
| `/market` | Improved empty state |

## Files Changed
- `lib/onboarding/startup-templates.ts` (new)
- `lib/onboarding/pitch-draft.ts` (new)
- `lib/onboarding/progress.ts` (new)
- `lib/onboarding/demo-samples.ts` (new)
- `components/onboarding/StartupTemplatePicker.tsx` (new)
- `components/onboarding/NextBestAction.tsx` (new)
- `components/onboarding/FirstRunChecklist.tsx` (new)
- `components/onboarding/ExplainerCard.tsx` (new)
- `app/how-to-play/page.tsx` (new)
- `app/page.tsx` (updated)
- `app/layout.tsx` (updated)
- `app/(game)/dashboard/page.tsx` (updated)
- `app/(game)/startup/new/page.tsx` (updated)
- `app/(game)/startup/[id]/page.tsx` (updated)
- `app/(game)/startup/[id]/pitch/page.tsx` (updated)
- `app/(game)/startup/[id]/review/page.tsx` (updated)
- `app/(game)/startup/[id]/terms/page.tsx` (updated)
- `app/(game)/startup/[id]/operate/page.tsx` (updated)
- `app/(game)/startup/[id]/team/page.tsx` (updated)
- `app/(game)/leaderboard/page.tsx` (updated)
- `app/(game)/graveyard/page.tsx` (updated)
- `app/(game)/profile/page.tsx` (updated)
- `app/(game)/market/page.tsx` (updated)
- `tests/unit/onboarding.test.ts` (new)
- `docs/PHASE_15_ONBOARDING_GUIDED_FIRST_RUN.md` (new)
- `README.md` (updated)
- `AGENTS.md` (updated)

## DB Schema / Migration Changes
**None.** No schema changes were required. All new data is computed or stored in existing JSON/text fields.

## Demo/Sample Data Rules
- Sample cards only render when `DEMO_MODE_ENABLED=true` or `NODE_ENV !== "production"`
- Clearly labeled with "Example" badge
- No fake database entries seeded
- No fake achievements created

## Manual Test Path
1. Open `/` — verify template CTA and how-to-play link
2. Open `/how-to-play` — verify all sections render
3. Log in or use dev demo mode
4. Open `/dashboard` as new user — verify checklist and next action
5. Click "Create startup" — verify template picker works
6. Select a template — verify form fills correctly
7. Create startup — verify redirect to profile
8. Open pitch builder — verify draft button appears
9. Use draft — verify all sections populate
10. Submit VC review
11. Verify next-best-action moves to terms
12. Accept/reject terms
13. Run first operating month
14. Verify checklist updates on dashboard
15. Verify empty states still look good

## Known Limitations
- First-run checklist appears for users with ≤2 startups; power users never see it
- Sample cards are static UI only (no DB entries)
- Pitch draft is template-based, not AI-generated (by design for speed/reliability)
- Template picker requires JavaScript (client component)

## Next Phase Recommendation
**Phase 16: Retention & Depth**
- Email digest of market changes
- Founder coaching inbox (aggregate all AI coaching notes)
- Startup comparison tool (compare two runs side-by-side)
- Advanced achievements and streaks
- Seasonal events and limited-time market scenarios
- Social sharing improvements (Twitter/X cards, more shareable stats)
