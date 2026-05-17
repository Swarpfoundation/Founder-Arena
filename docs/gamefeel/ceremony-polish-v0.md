# Ceremony Polish v0

Phase 14A adds a focused game-feel layer to make critical Founder Arena moments feel more like game state changes and less like dashboard updates.

## What Changed

- Added shared ceremony helpers in `lib/gamefeel/ceremony.ts`.
- Added reusable game-feel components:
  - `GameCeremonyModal`
  - `RewardPopup`
  - `StatDeltaRecap`
  - `StartupRunHud`
- Upgraded final result presentation on startup profile and operate final report.
- Added post-month after-action recap data from the simulation action without changing simulation math.
- Reskinned VC review and term sheet pages away from generic card treatment.
- Added startup-local run HUD navigation across core startup routes.

## End-of-Run Ceremony

Finalized runs now render a larger verdict panel with:

- outcome-specific tone
- animated score/valuation/revenue/month stat reveal
- documentary, career, arena, public record, and replay CTAs
- unlock chips for documentary/career/leaderboard state
- positive-outcome confetti guarded by session storage

Death outcomes use rose danger styling and avoid celebratory confetti.

## Post-Month Delta Recap

`runMonthlySimulationAction` now returns a visual recap payload containing:

- safe before/after stat deltas
- event, rival, boardroom, mission, strategy, and social highlights when available
- a recommended next route

This only returns presentation data computed from values the action already calculates. It does not alter deterministic simulation behavior.

## Reward Popup Triggers Implemented

Implemented lightweight reward panels for:

- social post live / brand crisis
- rival defeated
- boardroom survived
- strategy synergy active
- founder documentary generated
- final result rival/boardroom legacy summaries

Some future hooks remain better served by persisted one-time display state.

## Review and Terms Treatment

The VC review route now opens with a “VC Review Chamber” verdict panel and stronger score treatment.

The term sheet route now opens with “Capital vs Control” framing, dilution load, and control warnings for board rights, observer access, high dilution, and salary caps.

Generic shadcn `Badge` variants were reduced back to the allowed variants.

## Startup-Local HUD

`StartupRunHud` provides compact run-loop navigation:

- Overview
- Operate
- Team
- Social
- Rivals
- Strategy
- Boardroom
- Story
- Career
- Arena

The HUD shows current route, locked states before funding/finalization, finalized status, and boardroom alert support.

## Reduced Motion

Major animation components read `useReducedMotion`.

- Count-up and motion entrance effects are disabled or simplified for reduced-motion users.
- Confetti is not fired when reduced motion is enabled.
- Death pulse animation is suppressed when reduced motion is enabled.

## Known Limitations

- Reward popups are mostly inline/dismissible, not persisted one-time achievements.
- The HUD is route-level rather than a single shared startup layout wrapper.
- Post-month recap depends on action-return payload and appears after the client action finishes.
- Review and terms pages still contain some legacy `Card` sections, but the visual shell is now sharper and game-native.

## Future Visual Roadmap

- Persisted one-time unlock notifications for badges, rank changes, and season challenge completions.
- A true full-screen end-of-run ceremony with explicit replay comparison.
- Route-specific art direction for social/rivals/strategy/boardroom.
- Stronger first-run “deployment bay” flow for A16Z demos.
- Real-world infrastructure, deployment, and LLM burn modeling should be handled later as an economy phase, not as part of ceremony or visual polish.
