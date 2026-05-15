# Rival Founder / Nemesis System v0.1

## Overview

The Rival Founder system transforms Founder Arena from a solo startup simulator into a competitive founder roguelike. Each run generates 2–3 deterministic rival startups that evolve, make moves, react to player social actions, affect gameplay metrics, and appear in the Arena Feed throughout the 12-month simulation.

Rivals create meaningful competitive pressure — not as background noise, but as real opponents with identities, strategies, and momentum of their own.

---

## Domain Models

### RivalFounderProfile

The human behind each rival startup.

| Field | Type | Description |
|---|---|---|
| id | string | Deterministic cuid-style identifier |
| name | string | Full name (from deterministic pool) |
| personality | string | Archetype description text |
| archetype | RivalArchetype | Strategic type (see below) |
| aggression | 0–100 | How often/aggressively they act |
| ethics | 0–100 | Low ethics = more ruthless moves |
| mediaSkill | 0–100 | Effectiveness of attention grabs |
| fundraisingSkill | 0–100 | Probability of raise_round moves |
| productSkill | 0–100 | Speed and quality of product moves |
| salesSkill | 0–100 | Revenue and customer conversion effectiveness |
| catchphrase | string? | Signature quote for flavor |

### RivalStartup

The rival company snapshot, updated monthly.

| Field | Type | Description |
|---|---|---|
| id | string | Unique per startup run |
| name | string | Company name |
| founder | RivalFounderProfile | Identity |
| sector | string | Same as or adjacent to player sector |
| fundingStatus | bootstrapped / seed / series_a | Starting state |
| productProgress | 0–100 | Grows each month |
| traction | 0–100 | User/market traction |
| hype | 0–100 | Decays like player's |
| trust | 0–100 | Narrative credibility |
| risk | 0–100 | Internal risk level |
| investorHeat | 0–100 | Investor attention |
| mediaPresence | 0–100 | Media visibility |
| rivalryScore | 0–100 | Hostility toward player; increases with confrontations |
| relationshipToPlayer | RivalRelationship | Derived from rivalryScore |
| isDefeated | boolean | True if rival collapsed |
| latestMoveType / latestMoveTitle / latestMoveMonth | — | Most recent action summary |

---

## Rival Archetypes

| Archetype | Personality | Primary Threat |
|---|---|---|
| **copycat** | Fast follower, mirrors positioning | Copies your launch messaging; steals ICP positioning |
| **hype_founder** | Narrative-over-product, masters investor perception | Dominates press cycles; fundraises aggressively |
| **enterprise_killer** | B2B-focused direct sales machine | Poaches enterprise accounts; price wars |
| **technical_genius** | Ships product faster than anyone | Forces product race; sets technical bar |
| **predator_vc_backed** | Well-capitalized aggressor | Investor comparisons; team/customer poaching |
| **community_builder** | Builds loyalty moat | Sticky narrative; slow but compounding |
| **regulatory_operator** | Wins via compliance | Locks regulated verticals; enterprise trust |
| **chaos_founder** | Unpredictable, high variance | Wild press moments; brand risk attacks |

---

## Generation Rules

**When:** Generated on the first simulation month if none exist.

**Count:** 3 rivals for funded/active startups, 2 for early stage.

**Selection algorithm:**
1. First rival: archetype aligned with player's sector (via affinity table)
2. Second rival: deliberately contrasting archetype (not in sector pool)
3. Third rival: another sector-aligned archetype (if available)

**Determinism:** Seed is `rivalSeed(startupId + sector)`. All stats, names, and identities are reproducible for the same startup.

**Difficulty scaling:** Rival traction gets a modest boost based on player's investorScore, avoiding trivial opponents.

**Name pools:** 24 first names × 22 last names = 528 founder combos. 24 prefixes × 24 suffixes = 576 company names.

---

## Monthly Move Logic

### Move selection

Each rival has a probability of acting per month:
- Base: 40% chance
- +Up to 35% from aggression stat
- Adjusted by player state (see triggers below)

Move type is selected via **weighted random** using a deterministic seed (`rivalSeed(rivalId + month)`). Preferred moves get 3× weight; conditional boosts apply based on game state.

### Social action triggers

| Player action | Rival reaction boost |
|---|---|
| `competitor_callout` | +4 weight to `founder_callout`, +2 to `poach_attention` |
| `launch_announcement` | +2 to `copy_positioning`, +2 to `poach_attention` |
| `product_demo_tiktok` | +2 to `ship_feature` |
| High player hype (>60) | +2 to `poach_attention` |
| Low player trust (<40) | +1 to `market_narrative_shift` |
| High player brand risk (>50) | +2 to `founder_callout` |

### Move types

| Move | Description | Primary effect on player |
|---|---|---|
| launch_beta | Rival launches beta product | -userGrowth, -socialHype |
| raise_round | Rival closes new funding | -investorScore, +brandRisk |
| ship_feature | Rival ships major feature | -userGrowth, -revenue |
| copy_positioning | Rival copies player's ICP/messaging | -socialHype, +brandRisk |
| poach_attention | Rival captures news cycle | -socialHype, +brandRisk |
| price_war | Rival slashes prices targeting player users | -revenue, -investorScore |
| enterprise_push | Rival moves upmarket | -revenue, -investorScore |
| viral_campaign | Rival runs influencer/viral play | -socialHype, -userGrowth |
| founder_callout | Rival attacks player publicly | -socialTrust, +brandRisk |
| security_fumble | Rival has incident (mistake) | +revenue, +userGrowth (player benefits) |
| compliance_win | Rival achieves cert/approval | -investorScore |
| partnership_announcement | Rival signs distribution deal | -investorScore, -socialHype |
| customer_poach | Rival targets player's users | -revenue, -userGrowth |
| market_narrative_shift | Rival reframes the category | -socialTrust, +brandRisk |

### Defense mechanics

- **Trust defense**: If player trust > 60, negative social effects are ×0.7
- **Revenue defense**: If player revenue > 20,000, investor comparison effects are ×0.5
- **Brand risk amplifier**: If player brandRisk > 50, all negative effects are ×1.3
- **Aggression factor**: All effects are multiplied by `rival.aggression / 100`

### Rival self-development

Each month a rival makes a move, their own stats change:
- `traction += rivalTractionDelta`
- `hype += rivalHypeDelta`
- `productProgress += 2` (organic progress)

On months they don't act, hype decays ×0.9 and rivalryScore drops by 2.

---

## Arena Feed Integration

Every rival move generates an `ArenaFeedItem` with:
- `category: "rival"` (or `"crisis"` for mistakes, `"reaction"` for security_fumble)
- `source: "rival"`
- Severity mapping: `security_fumble` → positive; high-impact moves → critical/warning

Counter-actions also generate feed items with `source: "founder"`.

Rival feed items appear in the existing Arena Feed at `/startup/[id]/social` alongside social layer items.

---

## Counterplay System

6 counter-actions available at `/startup/[id]/rivals`:

| Action | Cost | Key Effect | Risk |
|---|---|---|---|
| Counter-Positioning Thread | $1,500 | +8 trust, +5 hype, -6 brandRisk, -5 rivalryScore | Low |
| Accelerate Beta | $8,000 | +12 productProgress, +6 hype, -8 rival hype | High |
| Customer Proof Campaign | $3,500 | +10 trust, +$3K revenue, -5 rival traction | Low |
| Enterprise Discount Offensive | $5,000 | +$4K revenue, -8 rival traction | Medium |
| Quiet Execution | FREE | -10 brandRisk, +6 productProgress, -8 rivalryScore | Low |
| Founder Debate | $2,000 | +12 hype, +8 brandRisk, -10 rivalryScore/-hype | High |

**Availability gates:**
- Cash requirement (most cost cash)
- Revenue gates (customer proof, enterprise discount)
- Product progress gate (accelerate beta: requires 30%+)
- Trust gate (founder debate: requires trust 40+)
- Rivalry score gate (founder debate: requires a rival at 30+ rivalry)
- Archetype targeting (some actions require a specific rival archetype to be active)

---

## Simulation Effects

Rival player effects feed directly into the monthly simulation result **after** the social layer but **before** the death check:

- `revenueDelta` → added to `result.revenue`
- `investorScoreDelta` → added to `result.investorScoreAfter`
- `riskScoreDelta` → added to `result.riskScoreAfter`
- `userGrowthDelta` → added to `result.userGrowth`
- `valuationDelta` → added to `result.valuation`
- `socialHypeDelta` / `socialTrustDelta` / `brandRiskDelta` → applied to decayed social metrics

**Balance targets:**
- Max revenue impact per month: ~$3,000 (single rival at full aggression)
- Max investor score impact per month: ±3
- Max risk score impact per month: ±3
- Effects compound if ignored: accumulated monthly moves stack

---

## End-of-Run Comparison

When a run completes (status: `completed` or `dead`), the rivals page shows a final comparison panel:

- Player valuation/revenue/outcome displayed
- Each rival shows: final valuation estimate, archetype, final outcome, relationship, summary text
- `playerWon: true` when player valuation > rival valuation estimate
- Summary text is archetype-specific and relationship-aware

Rival final outcomes:
- `DEFEATED` — collapsed during the run
- `ACQUIRED` — bought (future: acquisition offer integration)
- `BREAKOUT` / `SERIES_A_READY` — successful rival
- `HIGH_RISK_FAILURE` — overextended, high risk
- `EARLY_STAGE` — still bootstrapping

---

## Balancing Rules

1. Single move: max ±5 on any score metric, max ±$3K revenue
2. Rival pressure compounds: ignored rivals accumulate traction and become more aggressive
3. Strong trust defends against narrative attacks (×0.7 multiplier)
4. Strong revenue defends against investor pressure (×0.5 multiplier)
5. High brand risk makes attacks more dangerous (×1.3 multiplier)
6. Rivals make mistakes (`security_fumble`) — benefits the player
7. Rival hype decays monthly when they don't act (×0.9)
8. Rivalry score decays slowly over time (−2/month without conflict)

---

## UI

- Route: `/startup/[id]/rivals`
- Access: RIVALS tab in startup action bar (6th tab, rose accent)
- Shows: rival cards (expandable), latest moves feed, counter-actions panel, end-of-run comparison
- Threat level: CRITICAL / HIGH / MODERATE / LOW based on combined rivalry + hype + traction

---

## iOS Port Notes

All gameplay logic is in pure TypeScript with no Next.js-specific imports:
- `lib/rivals/types.ts` → model structs for Swift
- `lib/rivals/rival-catalog.ts` → name pools + archetype defs → port to Swift enums/structs
- `lib/rivals/rival-generator.ts` → port `rivalSeed` and `generateRivals` to Swift (same hash function)
- `lib/rivals/rival-engine.ts` → `applyRivalMoves` and `checkCounterActionAvailability` → pure Swift functions
- `lib/rivals/rival-comparison.ts` → pure text generation, trivially portable
- Rival state stored in `SocialState.rivalProfiles` JSON → on iOS, decode as `[RivalStartup]` from JSON column

The hash function `rivalSeed` is a djb2 variant — portable to any language in ~5 lines.

---

## Future Work: Persistent Nemesis

Not implemented in v0.1. Design intent for future seasons:

- A rival with rivalryScore > 75 at run end becomes a persistent nemesis
- Nemesis carries forward to the next run with a memory of past moves
- Player's founder profile stores `nemesisFounderId` and `nemesisHistory`
- Nemesis gets a slight stat boost based on how competitive the last run was
- "Expect her in future seasons" style callbacks in the comparison screen

This requires `FounderProfile` extensions + a cross-run persistence store.

---

## Achievements (Documented, Not Yet Implemented)

5 rival-related achievements to add in a future pass:

| Key | Title | Condition |
|---|---|---|
| first_rival | First Rival | Encounter your first rival (auto on month 1) |
| beat_the_copycat | Beat the Copycat | Outpace a copycat rival in both product and valuation |
| survived_price_war | Survived a Price War | Endure a price_war move without dying |
| public_comeback | Public Comeback | Execute founder_debate successfully (no backfire) |
| nemesis_defeated | Nemesis Defeated | Have a rival reach isDefeated state |

These fit cleanly into the existing `evaluateAchievementsOnFinalization` flow in `lib/game/achievements.ts`.
