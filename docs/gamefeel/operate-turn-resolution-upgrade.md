# Operate Turn Resolution Upgrade

Phase 23C turns the Operate page into the main playable command turn for Founder Arena. It is a UI/game-feel phase only: simulation formulas, action values, gates, death checks, scoring, funding, leaderboard, career, DeepSeek, ads, referrals, and billing are unchanged.

## Design Goal

Operate should feel like the founder is inside a tactical startup war room:

- choose sprint actions,
- scan threats,
- commit the command turn,
- watch the sprint resolve,
- understand what changed,
- pick the next objective.

The page should no longer read as a generic dashboard with a submit button.

## Operations Command Scene

The server page now uses the shared `GameScene` and `GameHudBar` shell.

The header shows:

- current Founder Week / Demo Day status,
- current objective,
- cash/runway/burn context,
- active incident count,
- startup run HUD and sprint phase banner.

Locked/finalized states keep the existing routing and final ceremony behavior.

## Action Deck

`ActionDeck` and `ChoiceCard` render sprint decisions as game choices.

Each choice card displays:

- action name,
- tactical description,
- cash cost,
- burn delta,
- upside,
- tradeoff,
- effect preview,
- tags such as Product, Revenue, Investor, Risk Down, Risk Up, Survival, Enterprise, Security, and Hype.

Locked cards are display-only and explain the same existing gates:

- unaffordable cash cost,
- minimum product progress,
- early sprint lockout for launch/enterprise choices.

The server action still validates all decisions. Client presentation is not authoritative.

## Threat Radar

`ThreatRadar` summarizes the top active dangers or opportunities before the player ends a sprint.

Current safe sources:

- runway pressure,
- high risk score,
- low investor score,
- no revenue near Demo Day,
- pending sprint event,
- open infrastructure incident,
- high-urgency next moves.

No IP, device, analytics, or invasive tracking data is added.

## End Sprint Console

`EndSprintConsole` replaces the generic run button.

It shows:

- whether a sprint can run,
- selected action count,
- whether an event response is still required,
- what the sprint will resolve,
- critical runway warning when applicable.

The existing server action remains the only source of truth for simulation execution.

## Sprint Resolution Sequence

After a sprint completes, `SprintResolutionSequence` stages the debrief before the existing `StatDeltaRecap`.

Stages are derived from returned recap data:

1. Action Executed
2. Financial Movement
3. Product / Traction Movement
4. Incident Scan
5. Next Objective or Final Verdict Ready

No new events are invented. If the recap does not contain a category, that stage is omitted.

## Pending State

The pending overlay now says `Resolving Sprint` and shows static/animated processing lines:

- Processing burn and revenue
- Checking market pressure
- Scanning rivals
- Updating board confidence
- Calculating runway

Reduced-motion users still receive the same information without requiring animation timing.

## Finalization Integration

Death, completion, acquisition, and Demo Day flows continue through the existing final ceremony and CTA logic.

The debrief sequence can show `Final Verdict Ready`, but final outcome classification and leaderboard/career updates remain unchanged.

## Logic Not Changed

Phase 23C does not change:

- simulation math,
- decision costs/effects/gates,
- death conditions,
- final outcome thresholds,
- funding or term-sheet logic,
- leaderboard or career formulas,
- infrastructure burn formulas,
- boardroom/rival/social/strategy event logic,
- DeepSeek provider/prompt/rubric,
- ads,
- auth,
- billing,
- referrals.

## Future Improvements

Good next scene upgrades:

- Startup Creation Founder Builder,
- Terms Negotiation Scene,
- Team Hiring Scene.
