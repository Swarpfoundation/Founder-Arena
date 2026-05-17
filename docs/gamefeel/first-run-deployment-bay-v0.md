# First-Run Deployment Bay v0

Phase 14C improves the earliest Founder Arena path so the first 30 seconds and first playable loop feel like entering a game, not filling out a SaaS form.

Time-scale note: Founder Arena now frames the operating loop as 12 Founder Weeks / 12 sprints while preserving monthly financial accounting for burn, MRR, salaries, and runway.

Phase 15C adds phase pacing on top of this first-run path: Launch Signal, Market Proof, Survive or Scale, and Demo Day Runway.

## What Changed

- Home route now includes a compact 30-second loop visualization.
- `/startup/new` is reframed as Startup Deployment Bay.
- Startup creation now shows:
  - founder brief
  - run seed
  - arena conditions
  - market risk
  - investor interest
  - prominent template presets
  - Deploy Into Arena CTA
- Added `MonthOneBriefing` for newly funded startups before the first sprint simulation.
- Extended `StartupRunHud` with:
  - current phase
  - phase rail: Pitch -> Fund -> Operate -> Story
  - next recommended action CTA
- Pitch page now reads as Pitch Deck Console / Investor Entry Ritual.
- Terms accepted state now points clearly to Enter Week 1 and Build Team.
- Early empty states were tightened for Social, Rivals, Strategy, Career, Leaderboard, and Story contexts.

## 30-Second Demo Path

1. Home: explain startup roguelike positioning.
2. Deployment Bay: choose a template and deploy.
3. Pitch Deck Console: show investor ritual.
4. Terms: show capital vs control.
5. Week 1 Briefing: show the first playable decision loop.

The message should be:

"Deploy a startup, pitch investors, close funding, survive sprint pressure, then turn the run into story, legacy, and ranking."

## First-Run Flow

1. Start at `/startup/new`.
2. Pick a startup template or build custom.
3. Deploy into the arena.
4. Build the pitch.
5. Submit to review.
6. Negotiate terms.
7. Enter Week 1.
8. Run the sprint and read the recap.
9. Inspect Social, Rivals, Strategy, and Boardroom.

## Week 1 Briefing

The briefing appears only when:

- startup status is `funded` or `active`
- no simulation months have run yet

It links to:

- Run Sprint 1
- Team setup if no active team exists
- Arena systems once the first recap exists

It does not auto-run the simulation or skip choices.

## Funding Ritual

Pitch and terms are now framed as a sequence:

- Pitch Deck Console
- VC Review Chamber
- Term Sheet Negotiation
- Week 1

Review and terms visual treatment from Phase 14A is preserved.

## Reduced Motion

New route and briefing polish reuse existing reduced-motion-aware components:

- `PageReveal`
- `EventRevealPanel`
- `StartupRunHud`

No new animation dependency was added.

## Known Limitations

- Startup creation is still the existing validated form underneath the visual treatment.
- The demo path still depends on real seeded or user-created data for final results.
- The HUD next action is phase-aware, but not a persistent quest tracker.
- Week 1 Briefing is route-level and appears on startup overview/operate, not a global overlay.

## Future Roadmap

- Add a demo-safe seeded run command or fixture.
- Add a one-click local demo reset for presenters.
- Add a stronger first-time camera/transition between deployment, pitch, and funding.
- Add persisted tutorial dismissal state.
- Research real-world infrastructure and LLM cost burn later as a separate economy phase.
