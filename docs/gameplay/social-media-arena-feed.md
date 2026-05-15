# Social Media & Arena Feed — v0.1

**Feature:** Social Media & Arena Feed  
**Phase:** v0.1 — Web implementation  
**No real social media APIs are used. All content is deterministic, in-game, and local.**

---

## Overview

The Social layer turns Founder Arena from a passive startup simulator into a public narrative battlefield.

Each month the player can take one social/media action — posting a founder thread, demoing the product on TikTok, launching across all channels, or managing a crisis. These actions update public-facing social metrics, generate an Arena Feed of posts and reactions, and apply real modifiers to the monthly simulation (revenue, risk, investor score, user growth, valuation).

The world watches. Investors react. Rivals respond. Press asks questions. And the startup's public narrative becomes a game resource — one that can be built, leveraged, or destroyed.

---

## Domain Models

### SocialMetrics

| Field | Range | Description |
|---|---|---|
| `followers` | 0–∞ | Total follower count across channels |
| `hype` | 0–100 | Excitement and market buzz — decays quickly |
| `trust` | 0–100 | Credibility with customers and investors — slow to build |
| `sentiment` | 0–100 | Public tone: 50 = neutral, 100 = very positive |
| `brandRisk` | 0–100 | Accumulated reputational risk — slowly heals |
| `viralMomentum` | 0–100 | Active spread of content — decays fast |
| `founderReputation` | 0–100 | Founder-specific credibility — most persistent |
| `communityStrength` | 0–100 | Loyalty and engagement depth of the community |

### SocialAction (catalog)

Each action has: `id`, `title`, `description`, `channel`, `channelLabel`, `cost`, `effects`, `riskLevel`, gate conditions, optional backfire condition, and `tags`.

### ArenaFeedItem

Each feed item has: `id`, `month`, `category` (post/reaction/press/viral/crisis/rival/milestone), `title`, `body`, `severity` (positive/neutral/warning/critical), `source` (founder/investor/customer/rival/journalist/community), optional `effects`.

### SocialPost

The founder's post record: `id`, `month`, `actionId`, `channel`, `content`, `tone`, `engagement`, `sentiment`, `tags`.

### ActionTakenRecord

Persisted per-month action log: `month`, `actionId`, `postId`, `effects`, `didBackfire`.

---

## Database

The `social_state` table stores all social data per startup (1:1 with `startups`):
- All 8 metric columns (integers)
- `feedItems` (JSON array)
- `actionsTaken` (JSON array)
- `lastActionMonth` (integer — 1-per-month gate)

---

## Action Catalog (10 actions)

| Action | Channel | Cost | Risk | Key Effect |
|---|---|---|---|---|
| Founder X Thread | X | $1K | Low | +hype, +followers, +rep |
| Product Demo TikTok | TikTok | $2K | Medium | +viral, +growth; backfires if product < 50% |
| Instagram Behind-the-Scenes | Instagram | $1.5K | Low | +trust, +community, +morale |
| Launch Announcement | X/Instagram/TikTok | $5K | High | +hype, +viral, +revenue; backfires if product < 70% |
| Founder Transparency Post | X/Blog | $500 | Low | +trust, +rep, −brandRisk, −hype |
| Influencer Collaboration | TikTok/Instagram | $8K | High | +viral, +followers; backfires if trust low |
| Crisis Response | X | FREE | Medium | −brandRisk, +trust; only when brandRisk ≥ 40 |
| Customer Testimonial Campaign | X/Instagram | $3K | Low | +trust, +revenue, +community |
| Investor Update Post | LinkedIn/X | $500 | Medium | +investorScore, +rep; backfires if trust low |
| Competitor Callout | X | $1K | High | +hype, +viral, +brandRisk; rival reacts |

---

## How Social Metrics Affect Simulation

Applied each month in `runMonthlySimulationAction` after the core engine runs:

| Condition | Effect |
|---|---|
| `viralMomentum > 40` | +$2,500 revenue, +400 user growth |
| `viralMomentum > 70` | +$2,000 more revenue, +300 user growth, +$50K valuation |
| `trust > 70` | −3 risk score |
| `hype > 60 AND trust > 50` | +2 investor score, +$1,500 revenue |
| `brandRisk > 60` | +5 risk score |
| `brandRisk > 80` | +5 more risk, −3 investor score |
| `founderReputation > 60` | +3 investor score |
| `communityStrength > 50` | +$2,000 revenue, +150 user growth |
| `followers > 5,000` | +$1,000 revenue |

---

## Monthly Decay

Applied every month in the simulation transaction:

| Metric | Decay |
|---|---|
| `hype` | ×0.85 (fades quickly) |
| `viralMomentum` | ×0.65 (collapses fast) |
| `brandRisk` | −4 (slowly heals) |
| `trust` | −1 (stable but drifts) |
| `sentiment` | drifts toward 50 |
| `communityStrength` | −1 (slow decay) |
| `founderReputation` | no decay (most persistent) |
| `followers` | stable (never decreases) |

**Passive brand-risk escalation:** If `hype > 70 AND trust < 35`, brand risk increases by 6 each month automatically.

---

## Arena Feed

The feed is a timestamped log of:
- **Player posts** — what the founder posted, the content, channel
- **Customer reactions** — positive or mixed, based on trust + product
- **Investor reactions** — based on investor score and metrics
- **Rival reactions** — triggered by high-hype actions (launch, callout, influencer)
- **Press activity** — pickup for viral moments, scrutiny for backfires
- **Viral milestones** — when viralMomentum spikes
- **Crisis warnings** — when brandRisk crosses thresholds
- **Monthly passive events** — generated automatically each simulation month

---

## Balance Philosophy

- **No action is guaranteed to succeed.** Every high-upside action has a backfire condition.
- **Trust is harder to build than hype.** Hype decays fast; trust is stable.
- **High hype + low trust is dangerous.** It actively escalates brand risk each month.
- **Viral success creates pressure.** Support tickets, rival attention, press scrutiny.
- **Crisis response is not a reset.** It reduces damage but does not erase it.
- **Investor updates only work if the numbers do.** Posting with weak metrics invites scrutiny.
- **Social actions cost cash.** They have opportunity cost against burn rate.
- **1 action per month.** No stacking. Choices matter.

---

## iOS Port Notes

The following models/logic should be ported cleanly to SwiftUI (no web-specific dependencies):

| File | iOS equivalent |
|---|---|
| `lib/social/types.ts` | `Sources/FounderArena/Social/Models.swift` |
| `lib/social/social-actions.ts` | `SocialActionCatalog.swift` |
| `lib/social/metrics-engine.ts` | `SocialMetricsEngine.swift` |
| `lib/social/feed-generator.ts` | `ArenaFeedGenerator.swift` |
| `lib/social/post-content.ts` | `PostContentGenerator.swift` |

The Prisma `SocialState` model maps directly to a Core Data entity or a server-side record (if using the same backend). All logic in `metrics-engine.ts` is pure and has no web/Node dependencies.

---

## Rival / Nemesis System — Future Integration

The current implementation includes minimal rival hooks:
- High-hype actions (launch, callout, influencer) generate rival reaction feed items from a static string pool.
- Rival reactions are deterministic based on month + startup seed.

**Future Rival System integration:**
When the Rival Founder / Nemesis System is built, social media connects as follows:
1. Rival startups watch your `hype` level — if yours exceeds theirs, they react.
2. `competitor_callout` triggers a specific rival response (copy narrative, counter-launch, poach).
3. Rival social actions can be driven by the same `SOCIAL_ACTION_CATALOG` from the NPC's perspective.
4. A rival's `viralMomentum` can reduce your `sentiment` passively.
5. The Arena Feed becomes a shared timeline showing both your actions and rival reactions chronologically.

---

## Safety Statement

> **No real social media APIs are used.**  
> No Twitter/X API, Instagram API, TikTok API, LinkedIn API, or any external social platform.  
> No OAuth flows, no real user accounts, no real posting, no API keys for social platforms.  
> All content is generated deterministically in-game from static string pools.  
> All data is stored locally in the game's PostgreSQL database.
