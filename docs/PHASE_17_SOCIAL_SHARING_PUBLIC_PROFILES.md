# Phase 17: Social Sharing and Public Profiles

## Overview

Phase 17 improves virality, social sharing, and public identity in Founder Arena. Users can now share their startup results, founder profiles, leaderboard ranks, and achievement badges via copy-link and X/Twitter share intents. Public pages are privacy-safe and expose no private data.

## Public Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/s/[slug]` | Public startup result page | No |
| `/f/[slug]` | Public founder profile page | No |
| `/leaderboard` | Public leaderboard | No |
| `/graveyard` | Public graveyard memorial | No |
| `/profile` | Private profile (share CTA) | Yes |
| `/startup/[id]/operate` | Final report with share CTA | Yes |

## Schema Changes

Added `publicSlug String? @unique` to `FounderProfile` model.

Migration: `prisma/migrations/20260504115607_phase17_social_sharing_public_profiles/migration.sql`

```sql
ALTER TABLE "founder_profiles" ADD COLUMN "publicSlug" TEXT;
CREATE UNIQUE INDEX "founder_profiles_publicSlug_key" ON "founder_profiles"("publicSlug");
```

Slugs are generated automatically when a founder profile is created or first viewed.

## Architecture

### Public Data Helpers

| File | Purpose |
|------|---------|
| `lib/public/public-profile.ts` | `getPublicFounderProfileBySlug()` — safe field selection, no email/oauth exposure |
| `lib/public/public-startup.ts` | `getPublicStartupBySlug()` — safe field selection, simulation highlights |

Privacy rules enforced:
- Email never exposed
- OAuth provider IDs never exposed
- Private drafts/pitches never exposed
- Only `completed` / `dead` startups shown publicly
- Active private startups hidden

### Share Components

| Component | File | Features |
|-----------|------|----------|
| `ShareButtons` | `components/social/ShareButtons.tsx` | Copy link + X/Twitter share + native Web Share API (if supported) |
| `CopyLinkButton` | `components/social/CopyLinkButton.tsx` | Copies URL to clipboard with success feedback |
| `TwitterShareButton` | `components/social/TwitterShareButton.tsx` | Opens Twitter intent with pre-filled text |

### Share Text Generator

`lib/social/share-text.ts` generates contextual share text for:
- `startup_success` — "My startup X survived N months and reached a $YM valuation..."
- `startup_death` — "My startup X died in month N because of reason..."
- `leaderboard_rank` — "I ranked #N in category on Founder Arena..."
- `achievement` — "Unlocked 'Title' in Founder Arena..."
- `founder_profile` — "Level N founder in Founder Arena..."

Rules:
- Real stored metrics only
- Under 280 characters (X-friendly)
- URL appended separately

## Open Graph / Metadata

Dynamic metadata generated for:
- `/s/[slug]` — startup name, outcome, score, valuation
- `/f/[slug]` — founder name, level, best score, best valuation
- `/leaderboard` — static "Top performing startups"
- `/graveyard` — static "Startup Graveyard"

Twitter card: `summary`
OpenGraph type: `article` (startup), `profile` (founder)

## Page Enhancements

### `/s/[slug]` (Public Startup Result)
- Share buttons (copy link + X/Twitter)
- Startup story card: funding, team, product, burn, leaderboard score
- Simulation highlights: biggest crisis, key lesson
- Founder profile link (if public slug exists)
- Leaderboard card (if ranked)

### `/f/[slug]` (Public Founder Profile)
- Level badge, stats grid
- Share buttons
- Public achievements list
- Public startup history (links to `/s/[slug]`)
- Leaderboard placements
- CTA to play Founder Arena

### `/profile` (Private)
- "View Public Profile" button (links to `/f/[slug]`)
- Share buttons for public profile

### `/startup/[id]/operate` Final Report
- Share buttons when public slug exists
- Explanation that public page hides private pitch details

### `/graveyard`
- Share buttons on each dead startup card
- "View" link to public result page

## Testing

9 unit tests in `tests/unit/social.test.ts`:
- Share text generation for all 5 contexts
- Real metrics usage
- Length limit enforcement (≤280 chars)
- URL appending
- Truncation for overflow
- Twitter intent URL generation
- LinkedIn share URL generation

## Manual Test Path

1. Complete or open a completed startup
2. Open `/s/[slug]` — verify share buttons, no private pitch/email
3. Copy link — verify clipboard works
4. Open `/f/[slug]` — verify profile shows public achievements/startups only
5. Open `/leaderboard` — verify links work
6. Open `/graveyard` — verify share CTAs work
7. Open private final report — verify public share CTA works
8. Verify metadata generation does not crash on missing data
9. Verify unauthenticated users can view public pages

## Privacy Checklist

- [x] Email not exposed on public pages
- [x] OAuth provider IDs not exposed
- [x] Private pitch details not exposed
- [x] Active private startups not shown publicly
- [x] Only completed/dead startups in public history
- [x] Public data helpers centralize safe field selection

## Known Limitations

- No dynamic OG image generation (text-only metadata)
- No LinkedIn share button on all pages (only helper available)
- Leaderboard entries do not yet show founder public slug links (requires query enhancement)

## Next Phase Recommendation

Phase 18: **Engagement Loops & Retention** — daily challenges, streaks, email digests of top leaderboard moves, or push notifications for milestone achievements.
