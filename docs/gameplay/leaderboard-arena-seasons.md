# Leaderboard & Arena Seasons v0.1

Phase 13 of Founder Arena. Transforms the single-player roguelike into a competitive arena with seasonal leaderboards, season challenges, and a public arena feed.

---

## Overview

Every completed run (dead or survived) is automatically submitted to the leaderboard. Runs are organized into **Arena Seasons** — time-bound competitive brackets. The first season is **Beta Season 1**.

The leaderboard at `/leaderboard` shows:

- **Season Banner** — season name, tagline, status, lore, total entries
- **Category Tabs** — 10 ranking categories (Overall, Revenue, Valuation, Survival + 6 sector tabs)
- **Podium** — top 3 entries with glow cards
- **List** — entries 4–50 with sector icon, playstyle, founder title, score
- **Player Position Panel** — your best rank in this category (requires completed run)
- **Season Challenges** — 5 challenges with progress bars (requires completed run)
- **Arena Feed** — deterministic narrative feed from top entries

---

## Arena Seasons

Defined statically in `lib/seasons/season-catalog.ts`.

### ArenaSeason fields

| Field | Type | Description |
|-------|------|-------------|
| slug | string | URL-safe identifier (e.g. `beta-season-1`) |
| name | string | Display name |
| tagline | string | One-line dramatic tagline |
| status | `active` \| `ended` \| `upcoming` | Season state |
| startDate | string | ISO date |
| endDate | string \| null | null if ongoing |
| challenges | SeasonChallenge[] | 5 challenges |
| lore | string | Short flavour text |

---

## Leaderboard Categories

| Category | Score Encoding | Description |
|----------|---------------|-------------|
| `overall` | leaderboardScore | Combined score formula |
| `revenue` | monthly revenue | Highest revenue generators |
| `valuation` | valuation | Highest valuations |
| `survival` | survivalMonths × 1000 | Longest-surviving startups |
| `ai` | leaderboardScore | AI sector only |
| `fintech` | leaderboardScore | Fintech sector only |
| `web3` | leaderboardScore | Web3 sector only |
| `gaming` | leaderboardScore | Gaming sector only |
| `saas` | leaderboardScore | SaaS sector only |
| `healthcare` | leaderboardScore | Healthcare sector only |
| `{playstyle}` | leaderboardScore | Per-playstyle bracket (growth-hacker, etc.) |

All entries have enriched metadata:
- `dominantPlaystyle` / `secondaryPlaystyle`
- `founderTitle` / `founderRank`
- `documentaryTagline`
- `rivalsSummary`, `boardroomSummary`
- `boardroomEventsResolved`, `rivalsDefeated`
- `socialTrust`

---

## Season Challenges

Five challenges per season. Progress is calculated from the player's most recent `overall` leaderboard entry metadata.

| ID | Category | Requirement | Reward |
|----|----------|-------------|--------|
| `product_led_breakout` | product | 80%+ product progress | +200 bonus score |
| `cockroach_survival` | survival | 12 months survived | +150 bonus score |
| `rival_killer` | rivalry | 2+ rivals defeated | +100 bonus score |
| `boardroom_survivor` | boardroom | 3+ boardroom events resolved | +120 bonus score |
| `trust_moat` | community | Social trust ≥ 75 | +80 bonus score |

---

## Public Arena Feed

Deterministic narrative feed generated from top 20 leaderboard entries. Categories:

- `leaderboard_move` — top 3 entries
- `outcome_achieved` — BREAKOUT, SERIES_A_READY, ACQUISITION_TARGET, etc.
- `season_milestone` — 12-month survivors
- `new_entry` — all other entries

No external APIs. Seeded via `djb2(startupId + rank + score)`.

---

## Architecture

### New files

```
lib/seasons/
  types.ts           — ArenaSeason, SeasonChallenge, SeasonChallengeProgress, ArenaFeedPublicItem, LeaderboardPageData
  season-catalog.ts  — BETA_SEASON_1 constant, 5 challenge definitions, getCurrentSeason(), calculateChallengeProgress()
  arena-public-feed.ts — generatePublicArenaFeed()
  index.ts           — re-exports

lib/actions/
  leaderboard.ts     — getLeaderboardPageData(), getStartupRankingData()

tests/unit/
  seasons.test.ts    — ~35 tests covering all public APIs

docs/gameplay/
  leaderboard-arena-seasons.md
```

### Modified files

- `lib/game/finalize-startup.ts` — writes enriched metadata to `overall` entry; adds `revenue`, `valuation`, `survival`, `{playstyleSlug}` categories
- `app/(game)/leaderboard/page.tsx` — full arena experience rewrite
- `app/(game)/startup/[id]/page.tsx` — "View Arena Ranking" link in Final Result section

---

## Integration with Other Systems

- **Strategy Stack (Phase 9C)** — `dominantPlaystyle` drives the playstyle leaderboard category
- **Boardroom Battles (Phase 12)** — `boardroomEventsResolved` and `boardroomSummary` in metadata, drives `boardroom_survivor` challenge
- **Founder Career Record (Phase 10)** — `founderTitle`, `founderRank` in metadata
- **Founder Documentary (Phase 11)** — `documentaryTagline` in metadata
- **Rival Founder System (Phase 9B)** — `rivalsDefeated`, `rivalsSummary` in metadata, drives `rival_killer` challenge

---

## Constraints

- No new database tables. Leaderboard entries stored in existing `LeaderboardEntry` model.
- No external APIs. All narrative is deterministic.
- Player position panel and challenge progress require authentication (optional — gracefully hidden when not logged in).
- Deterministic feed: same leaderboard → same arena feed.
