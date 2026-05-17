# Founder Career Record & Legacy System v0.1

## Overview

The Career Record transforms Founder Arena from a series of isolated startup runs into a persistent founder journey. Every startup you launch — whether it dies, pivots, exits, or breaks out — leaves a permanent mark on your **Founder Career Record**.

Your career record tracks legacy stats, reputation, sector mastery, playstyle history, rival encounters, and achievement badges across all your runs. Repeated play is rewarded: seasoned founders earn higher reputation scores, better titles, and rare legacy badges that are impossible to earn in a single run.

---

## Career Stats

| Stat | Description |
|---|---|
| **Reputation Score** | Composite 0–100 score reflecting overall founder quality |
| **Founder Title** | Narrative label earned by career performance |
| **Founder Rank** | Mechanical progression tier (rookie → arena_legend) |
| **Total Startups** | Lifetime count of startups launched |
| **Completed Startups** | Runs that reached a final outcome (not abandoned) |
| **Dead Startups** | Runs ending in HIGH_RISK_FAILURE or DEAD |
| **Founder Weeks Played** | Cumulative Founder Weeks across all runs |
| **Total Revenue Generated** | Cumulative revenue across all runs |
| **Best Valuation** | Single-run highest valuation reached |
| **Best Monthly Revenue** | Single-run best monthly revenue |
| **Total Acquisitions** | Count of ACQUISITION or ACQUIHIRE outcomes |
| **Total Breakouts** | Count of BREAKOUT outcomes |
| **Total Series A Ready** | Count of SERIES_A_READY outcomes |
| **Total Survived 12 Weeks** | Count of runs reaching Week 12+ |
| **XP / Level** | Experience and level progression |

---

## Founder Ranks

Ranks advance based on career performance thresholds:

| Rank | Requirement |
|---|---|
| `rookie` | Starting rank |
| `builder` | 3+ completed runs |
| `operator` | 5+ completed runs AND ≥40% survival rate |
| `closer` | 1+ breakout OR 1+ acquisition |
| `veteran` | 10+ completed runs |
| `arena_legend` | 3+ breakouts OR (2+ acquisitions AND 10+ completed) |

---

## Founder Titles

Titles are narrative labels computed from career achievement patterns:

| Condition | Title |
|---|---|
| Rank: arena_legend | Arena Legend |
| 2+ breakouts | Breakout Founder |
| 2+ acquisitions | Exit Artist |
| Dominant playstyle: Product-Led (2+ runs) | Product Architect |
| Dominant playstyle: Hype Machine (2+ runs) | Hype Machine |
| Dominant playstyle: Enterprise Closer (2+ runs) | Enterprise Closer |
| Dominant playstyle: Technical Moat (2+ runs) | Technical Founder |
| Dominant playstyle: Regulated Operator (2+ runs) | Compliance Operator |
| Rank: veteran, no specialty | Veteran Founder |
| Rank: closer | Strategic Closer |
| Rank: operator | Operating Founder |
| Rank: builder | Serial Builder |
| Default | Rookie Founder |

---

## Reputation Score (0–100)

The reputation score is a composite of five components:

```
reputation = runBase + outcomeBonus + survivalBonus + scoreBonus + diversityBonus
```

| Component | Max | Formula |
|---|---|---|
| **runBase** | 25 | `min(25, completedRuns * 5)` |
| **outcomeBonus** | 25 | `breakouts*10 + seriesAReady*5 + acquisitions*8`, capped at 25 |
| **survivalBonus** | 20 | `(survived12 / completedRuns) * 20`, 0 if no runs |
| **scoreBonus** | 15 | `min(15, floor(bestScore / 1000))` |
| **diversityBonus** | 15 | `min(15, distinctPlaystyles * 3 + distinctSectors * 2)` |

---

## Sector Mastery

Each startup run contributes to sector mastery stats. Tracked per sector:

- `runs`: total runs in this sector
- `survived`: runs reaching Week 12+
- `bestScore`: highest score achieved
- `acquisitions`: acquisitions in this sector
- `breakouts`: breakouts in this sector

The Career page displays a sorted panel of all sectors with at least one run, ranked by best score.

---

## Playstyle Mastery

Each finalized startup contributes playstyle data based on the dominant and secondary archetypes from the Strategy Stack. Tracked per playstyle:

- `dominant`: times this was the primary playstyle
- `secondary`: times this was a secondary playstyle
- `wins`: runs with a positive outcome (not HIGH_RISK_FAILURE / DEAD)
- `bestScore`: highest score while this was dominant

The Career page shows all playstyles with at least 1 dominant run, sorted by dominant count.

---

## Rival Legacy

Rival encounters are tracked across runs:

- `rivalsFaced`: total rivals encountered across all runs
- `rivalsDefeated`: rivals eliminated or surpassed
- `timesBeaten`: times your startup was outcompeted
- `mostDangerousRival`: name of the rival that appeared most across career
- Win rate % is derived from rivals faced/defeated

---

## Legacy Badges

Badges are permanent achievements that unlock based on career milestones. Once earned they cannot be lost.

| Badge | Rarity | Unlock Condition |
|---|---|---|
| `first_run_completed` | Common | Complete your first startup |
| `first_death` | Common | Experience your first startup death |
| `iron_will` | Common | 3+ dead startups (you kept going) |
| `serial_founder` | Rare | 5+ completed runs |
| `first_acquisition` | Rare | First acquisition exit |
| `first_breakout` | Rare | First breakout outcome |
| `exit_artist` | Legendary | 2+ acquisitions |
| `cockroach_founder` | Rare | Survive 12 Founder Weeks in 3+ runs |
| `product_led_master` | Common | 3+ dominant product-led runs |
| `hype_machine_master` | Common | 3+ dominant hype-machine runs |
| `rival_killer` | Rare | Defeat rivals in 3+ separate runs |
| `enterprise_closer` | Rare | 2+ enterprise-closer dominant wins |
| `technical_moat` | Common | 3+ technical-moat dominant runs |
| `regulated_operator` | Common | 2+ regulated-operator dominant runs |
| `arena_legend` | Legendary | Achieve arena_legend rank |

---

## Recent Runs Timeline

The last 10 finalized startup runs are stored in the career record. Each entry includes:

- `startupId`: link to the startup page
- `startupName`
- `outcome`: final outcome string
- `sector`
- `playstyle`: dominant archetype
- `score`
- `months`: run duration
- `reputationDelta`: how much reputation changed from this run
- `completedAt`: ISO timestamp

The timeline displays newest-first on the Career page with color-coded outcome chips.

---

## Career Update Flow

Career updates are triggered automatically when a startup is finalized:

```
finalize-startup.ts
  └─ updateFounderCareer(userId, CareerUpdateInput)
       ├─ getOrCreateFounderProfile (lib/game/profile.ts)
       ├─ profileToSnapshot (converts DB row to CareerProfileSnapshot)
       ├─ buildCareerUpdates (pure computation — lib/career/career-engine.ts)
       │    ├─ Idempotency check: skip if startupId already in completedStartupIds
       │    ├─ Update cumulative stats
       │    ├─ Update sector/playstyle/rival stats
       │    ├─ Check badge unlocks (badge-catalog.ts)
       │    ├─ Recompute rank, title, reputation
       │    └─ Return CareerFieldUpdates
       └─ db.founderProfile.update (persists all 19 career fields)
```

Career updates are **best-effort**: if the career update fails, the startup finalization still succeeds. This prevents career tracking bugs from blocking gameplay.

---

## Idempotency

Each finalized startup is tracked by its ID in the `completedStartupIds` JSON array. If `finalize-startup.ts` is called again for the same startup (e.g. due to a retry), the career engine detects the duplicate and returns unchanged stats. This prevents double-counting stats or re-awarding badges.

---

## Next Challenge System

The career page displays a personalized next challenge suggestion computed deterministically from career gaps:

1. No runs yet → "Deploy your first startup"
2. Never survived 12 Founder Weeks → "Survive to Week 12"
3. Rival encountered but never defeated → "Defeat a rival"
4. No breakout → "Reach breakout trajectory"
5. No acquisition → "Engineer an acquisition exit"
6. Untried sectors → name specific missing sector
7. Untried playstyles → name specific missing playstyle
8. Close to rank advance → "X more runs to reach [rank]"
9. Default → "Pursue arena legend status"

---

## Engineering Reference

### Key Files

| File | Purpose |
|---|---|
| `lib/career/types.ts` | All TypeScript types for the career system |
| `lib/career/badge-catalog.ts` | Badge definitions (15 badges) |
| `lib/career/career-engine.ts` | Pure computation: rank, title, reputation, updates |
| `lib/career/career-recommendations.ts` | Next challenge suggestion logic |
| `lib/career/index.ts` | Re-exports |
| `lib/game/career-record.ts` | DB layer: read profile + persist updates |
| `lib/actions/career.ts` | Server actions for career page data |
| `app/(game)/career/page.tsx` | Server component (SSR career page) |
| `app/(game)/career/career-client.tsx` | Client component (all Career UI panels) |
| `tests/unit/career.test.ts` | Unit tests (~65 tests) |

### DB Fields Added to FounderProfile

19 new fields added via migration `20260516015106_add_career_fields_v1`:

```
reputationScore, founderTitle, founderRank, totalMonthsPlayed,
totalRevenueGenerated, bestMonthlyRevenue, bestOutcome, bestStartupId,
lastCompletedStartupId, totalAcquisitions, totalBreakouts, totalSeriesAReady,
totalSurvived12, sectorStats (JSON), playstyleStats (JSON), rivalStats (JSON),
legacyBadges (JSON), completedStartupIds (JSON), recentRuns (JSON)
```

### CareerUpdateInput Shape

```typescript
interface CareerUpdateInput {
  startupId: string;
  startupName: string;
  outcome: string;        // BREAKOUT | ACQUISITION | ACQUIHIRE | SERIES_A_READY | HIGH_RISK_FAILURE | DEAD | etc.
  sector: string;
  finalScore: number;
  finalValuation: number;
  finalMonthlyRevenue: number;
  monthsPlayed: number;
  dominantPlaystyle?: string;
  secondaryPlaystyle?: string;
  rivalsFaced?: string[];
  rivalsDefeated?: string[];
  mostDangerousRivalName?: string;
}
```

---

## Navigation

The Career Record is accessible via:
- **GameNav**: LEGACY menu item (Star icon)
- **Dashboard**: after startup finalization, "View career legacy" link appears in the Final Result section
- Direct URL: `/career`
