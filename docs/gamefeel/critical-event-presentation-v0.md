# Critical Event Presentation v0

Phase 14B adds a focused in-run event presentation layer for moments that should feel urgent, tactical, and game-like.

## What Was Added

- `lib/gamefeel/critical-events.ts`
  - critical event tone/severity helpers
  - boardroom, rival, social, death-warning, and simulation-event presentation builders
  - stable display-key helper for one-session UI guards
- `components/game/EventRevealPanel.tsx`
  - large HUD event reveal for board summons, rival moves, viral spikes, strategy unlocks, acquisition offers, and ranking updates
- `components/game/EventImpactBanner.tsx`
  - compact warning/result banner for critical runway, risk, boardroom resolution, brand pressure, and season progress
- `components/game/PageReveal.tsx`
  - lightweight route entrance polish using existing animation utilities

## Event Types Supported

- `danger`
- `warning`
- `viral`
- `rival`
- `boardroom`
- `acquisition`
- `breakout`
- `death`
- `strategy`
- `leaderboard`
- `neutral`

Severity is normalized across existing systems so `critical`, `high`, `moderate`, `warning`, `minor`, and `low` can share one presentation layer.

## Boardroom Presentation

Open boardroom events now get a stronger “Board Summons” / “Investor Pressure” reveal before the response panel.

The reveal includes:

- pressure type
- severity
- board confidence
- investor patience
- founder control
- Enter Boardroom CTA
- Continue Operating CTA

Resolved boardroom events show a compact result banner and the existing reward panel. Boardroom resolution logic and effects are unchanged.

## Rival Presentation

The rivals page surfaces the latest major warning/critical rival move as a “Rival Move Detected” or “Rival Attack” reveal.

The reveal includes:

- rival name
- move type
- month
- severity
- View Rivals CTA
- Counter CTA

Defeated rivals still surface through the Phase 14A reward panel.

## Social Viral and Crisis Presentation

Social action results now route through critical event presentation:

- backfires and brand-risk increases render as “Brand Crisis”
- hype or viral momentum increases render as “Viral Spike”
- neutral posts render as “Arena Post Live”

The social page also shows a compact brand-risk warning when brand risk is already critical.

## Strategy, Leaderboard, and Acquisition Presentation

Strategy:

- Active synergies now show a tactical “Strategy Unlock” reveal with stack, synergy count, and month.

Leaderboard:

- Player ranking presence now shows “Arena Ranking Updated.”
- Season challenge progress appears in the sidebar as a compact event banner.

Growth/acquisition:

- Acquisition and acquihire offers now show “Acquisition Offer Incoming” with offer value, fit score, and expiry when the growth system exposes an offer.

## Death and Critical Runway Warnings

Operate now shows inline critical banners for:

- runway at or below two months
- risk score at or above 85
- investor score at or below 25
- zero revenue after month 6

These are visual warnings derived from existing state only. They do not change death conditions or simulation math.

## Route Polish

`PageReveal` is applied to major event routes:

- operate
- boardroom
- rivals
- social
- strategy
- documentary
- growth
- leaderboard

It uses the existing `pageTransition` utility and disables motion when reduced motion is requested.

## Reduced Motion Behavior

- Event reveal entrance animation is disabled under reduced motion.
- Critical pulse animation is disabled under reduced motion.
- Page reveal animation is disabled under reduced motion.
- No browser-only APIs are used in server helpers.

## Known Limitations

- One-session display guards are session-storage based and only suppress repeated client remounts. They are not persisted account achievements.
- Boardroom resolution banners currently use the returned narrative; exact post-resolution deltas are not exposed by the existing action payload.
- Rival attack presentation uses the latest warning/critical move history entry rather than a persisted “new since last viewed” marker.
- Social viral/crisis presentation is tied to action results and current brand-risk state, not a global notification queue.
- Acquisition presentation is shown on the growth route when deterministic offers are already available; no offer generation math was changed.

## Future Hooks

- Persisted notification ledger for one-time unlocks across devices.
- Stronger full-screen crisis overlays when boardroom or rival events are triggered immediately after month simulation.
- Dedicated “season objective completed” ceremony once season challenge completion has a reliable one-time trigger.
- More route-specific art direction for the boardroom, social feed, and rival intelligence screens.

## Future Economy Roadmap Note

Real-world infrastructure, deployment, and LLM cost burn should be researched and implemented later as an economy phase. That future work may model providers such as Render, Vercel, Replit, AWS, Google Cloud, LLM APIs, and GPU costs, but it is intentionally out of scope for this visual/game-feel phase.
