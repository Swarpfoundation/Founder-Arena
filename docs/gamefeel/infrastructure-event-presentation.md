# Founder Arena Phase 16G: Infrastructure Event Presentation v0.1

Phase 16G makes infrastructure incidents feel like Founder Arena events instead of isolated Infra Console rows.

This is presentation and cross-system polish only. It does not increase event damage, add instant death, change thresholds, or integrate with live provider APIs.

## Arena Feed Integration

Infrastructure events now create Arena Feed entries when they trigger and when they resolve.

Trigger entries:

- category: `infrastructure`
- title pattern: `Infrastructure Warning: {event title}`
- body explains the trigger reason using gameplay language
- links are represented by deterministic ids and the Infra Console route in UI copy

Resolution entries:

- category: `operations`
- title pattern: `Infra Response Resolved: {response title}`
- body summarizes the selected response and effect summary
- severity reflects whether the response mostly reduced risk/trust pressure or accepted more risk

Feed ids are deterministic and idempotent, so retries do not spam the feed.

## Critical Reveal Presentation

Open infra events can render through existing game-feel components:

- `EventRevealPanel`
- `EventImpactBanner`

Reveal presentation is used for:

- critical infra events
- cloud credit cliffs
- LLM token bill shock
- prototype stack outgrown near the late run
- compliance infrastructure audit

The reveal shows:

- title
- severity
- trigger reason
- Founder Week
- affected area
- CTA to Infra Console
- secondary CTA to Operate

Reduced-motion behavior comes from the existing shared components.

## Operate / Infra Console

Operate now gives the player clearer urgency:

- active infra event banner
- trigger reason
- "resolve before the next sprint" guidance
- CTA to Infra Console

Infra Console now gives the player clearer context:

- open event panel
- response options with effect preview
- warning-first explanation
- event timeline grouped by Founder Week
- selected response and effect summary
- CTA back to Operate

## Cross-System Awareness

Phase 16G keeps hooks light.

Implemented:

- Strategy signals: selected infra responses can emit small playstyle signals.
- Documentary timeline: major infrastructure feed entries can appear in the Founder Documentary.
- Social feed: trigger and resolution entries appear in Arena Feed.
- Boardroom/Social hints: UI copy explains future pressure without changing current pressure math.

Deferred:

- boardroom infra hearings
- rival attacks on infra reliability
- social backlash chains from outages
- strategy synergies that change response effectiveness
- live outage chains

## Safety

Phase 16G does not add:

- external APIs
- pricing APIs
- provider SDKs
- cloud credentials
- OAuth
- analytics
- telemetry
- payment integrations
- API keys or secrets
- LLM calls

Phase 16G does not change:

- death thresholds
- scoring formulas
- funding or term-sheet formulas
- leaderboard formulas
- career formulas
- event damage values

Provider names remain gameplay archetypes unless a real partnership exists. Infrastructure costs remain gameplay estimates, not exact provider billing.
