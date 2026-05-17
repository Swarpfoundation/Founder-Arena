# Sprint Pacing Enhancements v0

Phase 15C turns the 12 Founder Week display refactor into a more readable game arc. The implementation is presentation-only: it adds phase helpers, banners, recap flavor, and Demo Day buildup without changing deterministic simulation math.

## 12 Founder Week Arc

Founder Arena now presents each run as a 12-sprint accelerator arc:

1. Weeks 1-3: Launch Signal
   - "Find your first signal before the arena notices."
   - Tone: first signal, early positioning, first decisions.

2. Weeks 4-6: Market Proof
   - "Proof compounds or the market moves on."
   - Tone: traction, proof, investor signal, early rival pressure.

3. Weeks 7-9: Survive or Scale
   - "Scale the signal or get crushed by burn."
   - Tone: runway pressure, strategic tradeoffs, boardroom risk.

4. Weeks 10-12: Demo Day Runway
   - "Every choice now feeds the Demo Day Verdict."
   - Tone: final push, leaderboard pressure, investor judgment.

## Components and Helpers

- `lib/game-time/time-scale.ts`
  - Adds phase progress, next phase, pressure level, milestone labels, next-action hints, and Demo Day countdown helpers.
- `components/game/SprintPhaseBanner.tsx`
  - Shows current week, phase, tagline, pressure label, phase progress, Demo Day countdown, and checkpoint/milestone.
- `components/game/StartupRunHud.tsx`
  - Adds compact phase/countdown guidance when the current step is available.
- `components/game/StatDeltaRecap.tsx`
  - Adds optional phase context to post-sprint recaps.

## Demo Day Buildup

Weeks 10-12 are labeled as Demo Day Runway. The banner and HUD use stronger danger/rose styling, Demo Day countdown copy, and final-act hints. Week 12 resolves as Demo Day Verdict, but the completion condition is unchanged.

## Checkpoints

Checkpoint labels are display-only:

- Week 1: First Signal
- Week 3: Launch Signal Checkpoint
- Week 6: Market Proof Checkpoint
- Week 9: Survive or Scale Checkpoint
- Week 12: Demo Day Verdict

Checkpoint panels are inline through `SprintPhaseBanner`; there is no modal spam or new persistent state.

## Monthly Finance Preservation

Founder Arena uses weekly/sprint gameplay pacing while preserving monthly financial accounting:

- Monthly Burn remains monthly.
- MRR remains monthly.
- salary/mo and office cost/mo remain monthly.
- runway remains measured in months.
- billing and review quotas remain monthly.

## No Math Changes

This phase does not change:

- simulation duration or completion checks
- death triggers
- event eligibility
- revenue, burn, salary, runway, or mission calculations
- scoring, career, leaderboard, funding, or term-sheet math
- Prisma schema or internal month-based field names

## Deferred Work

- True weekly economy rebalance remains a later design phase.
- Real infrastructure/deployment/LLM burn research remains deferred to a later economy phase.
- Future polish could add route transition pacing and richer phase-specific animations.
