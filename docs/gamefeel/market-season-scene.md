# Market / Season Scene

Phase 23H turns the Market page into the Arena Market Map: a game-native macro battlefield that helps players read investor climate, sector momentum, and season context before choosing their next sprint action.

## Design Goal

The Market page should feel like live arena intelligence, not a static data report. It keeps the same deterministic market snapshots, scenario metadata, season catalog, and leaderboard data, but presents them as tactical readouts:

- Macro Radar for broad conditions.
- Sector Heat Map for sector-specific pressure.
- Scenario Dossier for the current market state.
- Season Command for active Arena Season context.
- Opportunity / Threat Feed for fast pre-sprint reading.
- Active Startup Context for authenticated players only.

## Macro Radar

Macro factors are displayed as tactical gauges using existing snapshot metadata:

- VC climate
- Inflation pressure
- Geopolitical risk
- Consumer spending
- Enterprise spending
- AI demand
- Crypto sentiment
- Regulation pressure
- Supply chain pressure
- Energy prices

High or low values are mapped into display-only labels such as Tailwind, Stable, and Pressure. This does not change market math, event eligibility, or simulation outcomes.

## Sector Heat Map

Supported sectors are presented as arena cards with momentum, risk, and opportunity language:

- SaaS
- Fintech
- Healthtech
- AI / ML
- E-commerce
- Consumer
- Enterprise
- Climate
- EdTech
- Other

Each card uses existing sector trend values where available. Missing trend data falls back to a neutral `1.00x` presentation.

## Scenario Dossier

The current market snapshot is framed as a scenario dossier with:

- Scenario label.
- Bullish / Neutral / Bearish direction.
- Source mode.
- Confidence when available.
- Active market event when present.

This is a presentation wrapper around existing snapshot fields.

## Season Command Panel

The Season Command panel uses the existing Arena Season catalog and leaderboard entry count. It links to the Arena Leaderboard but does not change season scoring, categories, ranking, or challenge rules.

## Active Startup Context

`/market` remains public. Logged-out players see generic market and season intelligence only.

When a user is authenticated, the page may show a lightweight context card for that user’s latest active/funded/pitching/draft startup:

- Startup name.
- Sector pressure summary.
- Links back to Operate, Strategy, and Rivals.

This is owner-only context and does not expose private startup data to logged-out users.

## Admin Controls

Existing admin market snapshot controls remain available only to admin users. Provider status and raw signal panels are still gated by the existing admin email check.

## Logic Not Changed

This phase does not change:

- Market snapshot generation.
- Market scenario formulas.
- Macro factor values.
- Sector trend values.
- Event triggers or eligibility.
- Simulation math.
- Infrastructure burn.
- Rival, social, boardroom, or strategy mechanics.
- Leaderboard scoring.
- Arena Season rules.
- Auth, ads, referrals, DeepSeek, or admin systems.

## Known Limitations

- Sector heat language is display-only and intentionally broad.
- Active startup context does not yet include a full live rival/infra/boardroom threat merge.
- No real external market data feed was added.
- No browser visual QA was added in this phase.

## Next Recommended Upgrade

Founder Career Scene is the next high-value polish target. It would turn career/profile progression into a legacy room instead of a profile report.
