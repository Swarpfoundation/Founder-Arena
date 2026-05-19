# Founder Arena Phase 23A: Game Shell + Title Screen + Run Select

## Design Goal

Phase 23A shifts Founder Arena's first impression away from a premium SaaS dashboard and toward a tactical startup roguelike in a cyber-fintech war room.

The gameplay systems were already deep. This phase changes the presentation frame:

- `/` behaves like a game title screen.
- `/dashboard` behaves like a run-select / command-deck screen.
- Protected gameplay surfaces can use a persistent HUD bar.
- Current objectives are presented as player goals, not dashboard reminders.

No gameplay math, funding logic, scoring, DeepSeek review behavior, auth protection, referral rewards, billing behavior, ad behavior, or database schema was changed.

## Title Screen

The public landing route remains `/` and remains auth-aware.

Logged-out players see:

- Private beta build framing.
- Founder Arena title treatment.
- Start New Run / Login path through the existing auth flow.
- Demo, How To Play, and Arena links.
- Short run loop: Deploy -> Pitch -> Fund -> Sprint -> Survive -> Demo Day.

Logged-in players see:

- Press Start / Continue Founder Arena as the primary action.
- Deploy New Run as the secondary action.
- Career, Arena, and Demo quick links.
- No primary Login CTA.

This preserves the login-loop fix while making the first viewport feel like a game boot/title screen rather than a marketing page.

## Dashboard Command Deck

`/dashboard` now presents the player's startups as operation slots.

The screen prioritizes:

- Current objective.
- Active operation slot.
- Resume Operation CTA.
- Active incidents.
- Founder signal / XP.
- Quick gates for new run, career, leaderboard, and referrals.
- Operation slots for active, setup, and archived runs.

The previous KPI-first dashboard layout was replaced by a run-select structure. Portfolio value and monthly revenue still exist, but they are secondary deck stats rather than the main identity of the page.

## Persistent HUD

`GameHudBar` was added as a reusable protected-page HUD primitive.

It can show:

- Current startup / active operation.
- Founder Week / 12.
- Current phase.
- Runway.
- Incident count.
- Current objective.
- Quick links for Operate, Infrastructure, and Boardroom.

Phase 23A wires it into the command deck and startup profile. Startup subroutes still keep their existing `StartupRunHud`; wider layout-level HUD integration is deferred until it can be done without over-fetching private data in the root client layout.

## Objective Logic

`lib/game/objectives.ts` adds display-only objective helpers.

Current objective examples:

- Draft startup -> Complete the pitch deck.
- Pitching with pending review -> Check review.
- Investable review without accepted terms -> Review terms.
- Funded with no simulation months -> Run Sprint 1.
- Active run -> Resume operation for the current Founder Week.
- Open infra event -> Resolve infrastructure incident.
- Open boardroom event -> Answer the board.
- Finalized run -> Review the final story.

The helper returns title, description, CTA, href, severity, and category. It has no side effects and does not change gameplay state.

## Components Added

- `GameScene`: high-level scene wrapper for major gameplay pages.
- `SceneTitle`: consistent cinematic scene header.
- `ObjectiveTracker`: current objective panel.
- `GameHudBar`: compact in-game HUD.
- `RunSlotCard`: save-slot style startup/run card.

These components are intended to support later scene upgrades without duplicating one-off HUD markup.

## What Remains SaaS-Like

Several screens still need deeper scene treatment:

- VC Review still contains report-like cards below the new rubric verdict.
- Pitch creation is still a long form, even though it has deployment-bay framing.
- Terms still reads like a finance document.
- Team, infrastructure, and market pages still contain table/card sections.
- Admin screens should remain operational rather than theatrical.

## Phase 23B Recommendation

The next strongest upgrade is **VC Review Verdict Chamber**.

Recommended scope:

- Animated accept / conditional / reject verdict stamp.
- Investor partner chamber layout.
- Stronger "why this decision happened" presentation.
- Term sheet as unlocked/locked reward.
- Rejection/conditional next-action panel.

This would improve the first major emotional payoff after a player creates and submits a startup.
