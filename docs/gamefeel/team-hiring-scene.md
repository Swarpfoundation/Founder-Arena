# Team Hiring Scene

Phase 23F turns `/startup/[id]/team` into a game-native squad-building scene. The page should feel like a founder is drafting a high-stakes operating squad, not managing an HR table.

## Design Goal

The scene frames hiring as a strategic build decision:

- every recruit changes burn, runway, product speed, revenue pressure, risk, and investor confidence
- seniority and warning flags are visible before the player commits
- the office setup reads as a base choice with morale/productivity/burn tradeoffs
- hiring remains risky, but understandable

## Founder Squad Roster

Active employees are displayed as squad members with:

- role icon
- role and seniority
- skill rating
- salary/mo
- morale
- role impact tags such as Product, Engineering, Revenue, Risk, Compliance, Investor, Ops, and Support

Removed employees are shown as archived squad members. The existing fire action is unchanged.

## Candidate Draft Board

Candidates are presented as draft cards rather than HR rows. Each card shows:

- name
- role
- seniority
- skill rating
- salary/mo
- all-in burn/mo when available
- primary impact
- runway impact
- warning flag or runway warning
- bio
- inspect/recruit state

The server remains authoritative. The client still submits only the candidate ID through the existing hiring action, and the server recomputes salary and impact values.

## Hiring Impact Preview

Selecting a candidate updates the Hiring Console with:

- primary impact
- morale impact
- risk impact
- investor impact
- runway/burn summary
- hiring gate status

This is presentation only. It does not mutate candidate values or gameplay math.

## Office / Base Setup

Office choices are displayed as base setup cards:

- Remote First: lowest burn, lower morale/productivity
- Coworking Space: moderate cost, early signal
- Small Office: focused execution, higher burn
- Premium Office: morale and investor optics, heavy burn

The cards use the existing office setup constants and actions. No office cost, morale, productivity, or burn formulas changed.

## Team Coverage

The coverage panel explains current squad gaps:

- Product
- Engineering
- Revenue
- Risk / Security
- Compliance
- Investor / Ops
- Support

Coverage is display-only and does not introduce a new mechanic. It maps current roles into missing, partial, or strong coverage.

## Locked States

The page handles:

- not funded/active: Team Command Locked with links to VC Review and Terms
- no squad: No Squad Recruited
- no candidates: Candidate Pool Refreshing
- no capacity: Squad Capacity Full
- insufficient runway: Runway Too Low

## Logic Not Changed

This phase did not change:

- candidate generation
- candidate rotation
- salary bands or seniority multipliers
- office costs or modifiers
- hiring gates
- burn/runway calculations
- server actions
- schema
- simulation formulas

## Known Limitations

- Team coverage is explanatory only and intentionally does not affect simulation.
- Candidate portraits are role glyphs, not character art.
- The page does not add new hire negotiation or retention mechanics.

## Recommended Next Upgrade

Pitch Deck Console should be upgraded next so the pre-review submission flow matches the game-native title, dashboard, review, operate, startup builder, terms, and team scenes.
