# Terms Negotiation Scene

Phase 23E turns `/startup/[id]/terms` into a game-native negotiation scene. It is presentation-only: term-sheet generation, funding math, cap table values, startup status transitions, and server actions are unchanged.

## Design Goal

The player should understand that accepting capital is a strategic choice:

- cash extends runway,
- equity dilution reduces founder ownership,
- board rights increase investor pressure,
- liquidation preference affects exit priority,
- milestones create execution pressure,
- accepting terms unlocks the operating phase.

## Negotiation Hero / Deal Stamp

The page now starts with a large deal stamp:

- `OFFER LIVE`
- `COUNTER LIVE`
- `CAPITAL SECURED`
- `DEAL DECLINED`
- `TERMS LOCKED`
- `INVESTOR VERDICT PENDING`

The stamp shows capital amount and equity sold when a term sheet exists.

## Deal Board

The Deal Board displays the existing term sheet fields:

- investment amount,
- equity requested,
- pre-money valuation,
- post-money valuation,
- liquidation preference,
- pro-rata rights,
- board seat,
- board observer,
- founder salary cap,
- milestone requirements,
- investor notes.

No values are recalculated or changed in this phase.

## Founder Control Meter

The control meter is a display-only dilution/risk visualization.

It shows:

- founder ownership after the round,
- equity sold,
- investor influence,
- risk warnings.

Risk labels are presentation-only:

- under 10% equity: low dilution,
- 10-20%: normal seed dilution,
- 20-30% or board seat: high control risk,
- over 30% or board seat plus liquidation preference above 1x: severe control risk.

## Clause Risk Cards

Clause cards explain finance/legal concepts in game terms:

- Board seat: investor gets formal governance influence.
- Board observer: investor watches boardroom decisions without voting.
- Pro-rata rights: investor can maintain ownership in future rounds.
- Liquidation preference: investor may get paid first in an exit.
- Founder salary cap: limits founder compensation while funded.
- Milestone requirements: execution conditions are attached to investor confidence.

These cards do not alter the terms.

## Runway Injection Panel

The runway panel presents funding as an unlock:

- team hiring,
- Week 1 operations,
- founder sprint loop,
- board/investor expectations.

It does not change cash logic. Existing `acceptTermSheetAction` still performs the funding transaction.

## Negotiation Console

For live offers, the console keeps the existing actions:

- Accept Capital,
- Counter Offer,
- Decline Deal.

Accepted/declined/locked/pending states show route CTAs instead of mutation buttons.

Counter-offer fields remain the existing backend inputs:

- requested investment amount,
- offered equity percent,
- founder salary cap,
- board seat accepted,
- board observer accepted,
- notes.

## State Handling

Supported states:

- live proposed/countered term sheet,
- accepted term sheet,
- rejected term sheet,
- no term sheet,
- pending VC review.

Partial term sheet data is formatted safely where possible.

## Logic Not Changed

Phase 23E does not change:

- term-sheet generation,
- accept/reject/counter server actions,
- funding amount,
- equity math,
- valuation math,
- cap table behavior,
- startup status transitions,
- VC review guardrails,
- DeepSeek,
- ads,
- referrals,
- auth,
- infrastructure,
- leaderboard,
- career,
- admin systems,
- Prisma schema.

## Known Limitations

- This is still the existing client-side page and server-action flow underneath.
- The control meter is approximate display logic, not a cap table engine.
- No new negotiation mechanics were added.

## Next Recommended Scene Upgrade

Good follow-up candidates:

- Team Hiring Scene,
- Pitch Deck Console,
- Market / Season Scene.
