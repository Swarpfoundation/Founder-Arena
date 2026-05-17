# Investor Demo Readiness — QA Checklist

## Local Setup

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev

# Open in browser
http://localhost:3000
```

## Test Commands

```bash
# Full test suite (949+ tests)
npx vitest run

# Typecheck
npx tsc --noEmit

# Production build
npx next build

# Specific test files
npx vitest run tests/unit/demo.test.ts
npx vitest run tests/unit/seasons.test.ts
npx vitest run tests/unit/boardroom.test.ts
```

## Routes to Verify Before Demo

| Route | Purpose | Expected |
|-------|---------|----------|
| `/` | Landing page | Logo, CTAs, "See how it works" link |
| `/demo` | Investor demo page | Core loop, systems grid, checklist |
| `/dashboard` | Command center | Startup cards or deploy CTA |
| `/startup/new` | Create startup | Form with sector/name/description |
| `/startup/[id]` | Overview | Stats, action bar, final result if done |
| `/startup/[id]/operate` | Run simulation | Monthly sim panel |
| `/startup/[id]/social` | Arena Feed | Social metrics or locked state |
| `/startup/[id]/rivals` | Rival founders | Rival cards or locked state |
| `/startup/[id]/strategy` | Strategy stack | Archetype display or locked state |
| `/startup/[id]/boardroom` | Boardroom | Open event or clear state |
| `/startup/[id]/documentary` | Documentary | Narrative or locked state |
| `/career` | Career legacy | Founder title, rank, run history |
| `/leaderboard` | Arena rankings | Season banner, category tabs |

## Sample Run Checklist

Pre-demo verification steps:

- [ ] At least one completed startup run exists in the account
- [ ] That run has a public slug (`/s/[slug]` works)
- [ ] That run has a leaderboard entry (check `/leaderboard`)
- [ ] That run has a documentary (`/startup/[id]/documentary` loads)
- [ ] Career page shows founder title and at least 1 run
- [ ] At least one active/funded startup exists (to show in-progress state)
- [ ] Active startup has simulation months (so charts show data)

## 3-Minute Demo Flow

1. Open `/demo` (30 sec) — pitch + systems overview
2. Navigate to `/leaderboard` (30 sec) — show season + top entry
3. Open a completed run overview (30 sec) — show Run Legacy block + CTAs
4. Open `/startup/[id]/documentary` (30 sec) — walk narrative arc
5. Open `/career` (30 sec) — show founder title + rank
6. Open `/startup/[id]/boardroom` of active run (30 sec) — show event or trigger conditions

## 5-Minute Demo Flow

All of the above, plus:

7. Open `/startup/[id]/rivals` (60 sec) — show rival cards, rivalry scores
8. Open `/startup/[id]/strategy` (30 sec) — show founder archetype
9. Open `/startup/[id]/social` (30 sec) — show arena feed, hype/trust metrics

## Known Limitations

- **Run creation takes time.** A full 12-month run requires multiple monthly simulation clicks. For demo purposes, pre-create a completed run.
- **Boardroom events are threshold-based.** They don't fire on demand. Pre-run scenarios or show the clear-state explanation panel.
- **Documentary requires a finalized run.** Prepare a completed startup ahead of the demo.
- **Leaderboard is empty by default.** Complete at least one run before showing the leaderboard.
- **Mobile layout is desktop-first.** Show on desktop/laptop for best results.
- **No anonymous/public access.** Users must be logged in to see game routes.

## Do Not Claim Section

Before any investor or public demo, confirm the following statements are NOT made:

| Claim | Reality |
|-------|---------|
| "We post real social media content" | Arena Feed is 100% simulated |
| "Real-time multiplayer" | Competition is async (leaderboard) |
| "Matches with real investors" | VC reviews are AI simulations |
| "AI generates full video documentaries" | Documentary uses structured templates + AI coaching text |
| "Payments are live" | Verify billing status before claiming |
| "iOS app is shipped" | Verify iOS status before claiming |
| "X,000 users" | Only state verified signup/play numbers |
| "AI runs the simulation" | Simulation is a deterministic rules engine |

## System Status Quick Reference

| System | Status | Notes |
|--------|--------|-------|
| Simulation Engine | Live | Deterministic, 12-month roguelike |
| Arena Feed / Social | Live | Simulated social pressure |
| Rival Founders | Live | Sector-matched AI rivals |
| Strategy Stack | Live | Emergent archetype from decisions |
| Boardroom Battles | Live | Threshold-triggered pressure events |
| Founder Documentary | Live | Generated at finalization |
| Career Record | Live | Multi-run progression |
| Arena Seasons | Live | Beta Season 1, 8 leaderboard categories |
| Growth Phase | Live | Post-completion expansion |
| Real Social Posting | NOT live | Not planned |
| Real Payments | Verify | Check billing config |
| iOS App | Verify | Confirm before claiming |
