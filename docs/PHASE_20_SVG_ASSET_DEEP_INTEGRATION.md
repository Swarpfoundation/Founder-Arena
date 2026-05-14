# Phase 20: SVG Asset Deep Integration

## Overview

Phase 20 deeply integrates the Phase 19 SVG asset system across all core gameplay surfaces. The goal was visual consistency — every page now uses original vector assets instead of emoji or generic Lucide icons where a custom asset exists.

## Pages Updated

### 1. App Shell (`app/layout.tsx`)
- **Replaced**: `Gamepad2` Lucide icon → `FounderArenaMark` SVG in header

### 2. Landing Page (`app/page.tsx`)
- **Replaced**: `Gamepad2` in hero CTA → `FounderArenaLogo` SVG
- **Replaced**: `Sparkles` in badge → `FounderArenaLogo` SVG

### 3. Dashboard (`app/(game)/dashboard/page.tsx`)
- **Added**: Sector icons on startup cards via `getSectorIcon()`

### 4. Startup Profile (`app/(game)/startup/[id]/page.tsx`)
- **Replaced**: Metric icons — `DollarSign`→`MetricCashIcon`, `Wallet`→`MetricCashIcon`, `Flame`→`MetricBurnIcon`, `TrendingUp`→`MetricRevenueIcon`, `Briefcase`→`MetricProductIcon`, `BarChart3`→`MetricInvestorIcon`, `ShieldAlert`→`MetricRiskIcon`
- **Added**: Sector icon on sector badge via `getSectorIcon()`

### 5. Operate Page (`app/(game)/startup/[id]/operate/page.tsx`)
- **Replaced**: Top metric icons — `DollarSign`→`MetricCashIcon`, `Flame`→`MetricBurnIcon`, `TrendingUp`→`MetricRevenueIcon`, `Award`→`MetricValuationIcon`

### 6. Operate Client (`app/(game)/startup/[id]/operate/operate-client.tsx`)
- **Replaced**: `CATEGORY_ICONS` map (11 Lucide icons) → `getEventCategoryIcon()`
- **Replaced**: `SEVERITY_COLORS` icons (`Shield`, `AlertTriangle`) → `getSeverityIcon()`

### 7. Growth Page (`app/(game)/startup/[id]/growth/page.tsx`)
- **Replaced**: `Skull`→`OutcomeDeadIcon`, `Trophy`→`OutcomeAcquiredIcon`
- **Replaced**: Metric icons — `TrendingUp`→`MetricValuationIcon`, `DollarSign`→`MetricCashIcon`/`MetricRevenueIcon`, `Zap`→`MetricProductIcon`

### 8. Growth Offer Card (`components/growth/GrowthOfferCard.tsx`)
- **Added**: Actor mark next to actor name via `getActorIcon()`
- **Replaced**: `DollarSign`→`MetricCashIcon`, `TrendingUp`→`MetricValuationIcon`

### 9. Team Page (`app/(game)/startup/[id]/team/page.tsx`)
- **Replaced**: `Wallet`→`MetricPayrollIcon`, `Smile`→`MetricMoraleIcon`, `Zap`→`MetricProductivityIcon`

### 10. Leaderboard (`app/(game)/leaderboard/page.tsx`)
- **Added**: Sector icons on list-row badges via `getSectorIcon()`

### 11. Graveyard (`app/(game)/graveyard/page.tsx`)
- **Replaced**: `Cross`→`OutcomeDeadIcon` (cause of death), `DollarSign`→`MetricCashIcon`, `TrendingDown`→`MetricValuationIcon`

### 12. Market Page (`app/(game)/market/page.tsx`)
- **Added**: Sector icons on hot/cold sector chips via `getSectorIcon()`

### 13. Profile (`app/(game)/profile/page.tsx`)
- **Replaced**: Achievement emojis → SVG achievement badges via `getAchievementIcon()`

### 14. Public Founder (`app/f/[slug]/page.tsx`)
- **Replaced**: Achievement emojis → SVG achievement badges via `getAchievementIcon()`
- **Replaced**: `Skull`→`OutcomeDeadIcon`, `Trophy`→`MetricTrophyIcon`, `DollarSign`→`MetricValuationIcon`, `Award`→`AchievementFirstPitchIcon`
- **Added**: Sector icons on startup history badges

### 15. Public Startup (`app/s/[slug]/page.tsx`)
- **Already integrated**: Sector icon via `getSectorIcon()` (from Phase 19)
- **OutcomeBadge**: Now renders SVG instead of emoji (auto-upgraded)

### 16. How-to-Play (`app/how-to-play/page.tsx`)
- **Replaced**: `Rocket`→`GrowthPhaseUnlockedIcon`, `FileText`→`GrowthSeriesAIcon`
- **Replaced**: All `Skull` death bullets → `OutcomeDeadIcon`

### 17. OutcomeBadge (`components/game/OutcomeBadge.tsx`)
- **Replaced**: All emoji icons → SVG `Outcome*Icon` components via `getOutcomeIcon()`
- Affects: leaderboard, graveyard, public pages, profile, startup cards everywhere

### 18. LevelBadge (`components/game/LevelBadge.tsx`)
- **Replaced**: `Zap`→`MetricProductivityIcon` (large size only)

### 19. Favicon (`app/icon.tsx`)
- **Created**: Next.js icon route using `FounderArenaMark` SVG

## Asset Registry Hardening

No registry changes needed — all mappings were already complete from Phase 19. Verified:
- All 15 strategic actor IDs map to marks
- All 10 canonical sectors map to icons
- All 9 outcome keys map to badges
- All 28 achievement keys map to badges
- All 11 event categories + 3 severities map to icons

## Accessibility

- All integrated SVGs use `aria-hidden="true"` by default (decorative)
- `title` prop available for meaningful icons
- Color is not the only status indicator (OutcomeBadge retains text labels)
- Icons scale cleanly from 12px to 64px

## Remaining Lucide Usage

Lucide icons are intentionally kept where:
1. **Navigation arrows**: `ArrowLeft`, `ChevronRight`
2. **UI affordances**: `Loader2`, `RefreshCw`, `Clock`, `Check`
3. **Generic states**: `Lock`, `ExternalLink`, `Percent`
4. **No Phase 19 equivalent**: `Calendar`, `Users`, `Rocket`, `Target`, `BrainCircuit`, `Lightbulb`, `BookOpen`, `Flame`, `Snowflake`, `Info`, `Signal`, `CalendarClock`, `BarChart3`
5. **MetricPanel trend arrows**: `TrendingUp`, `TrendingDown`, `Minus` (internal component)
6. **Readiness status**: `CheckCircle2`, `XCircle`, `AlertTriangle`, `Zap` (status badges)

## Files Changed

**Modified components:**
- `components/game/OutcomeBadge.tsx`
- `components/game/LevelBadge.tsx`
- `components/growth/GrowthOfferCard.tsx`
- `app/(game)/startup/[id]/operate/operate-client.tsx`

**Modified pages:**
- `app/layout.tsx`
- `app/page.tsx`
- `app/(game)/dashboard/page.tsx`
- `app/(game)/startup/[id]/page.tsx`
- `app/(game)/startup/[id]/operate/page.tsx`
- `app/(game)/startup/[id]/growth/page.tsx`
- `app/(game)/startup/[id]/team/page.tsx`
- `app/(game)/leaderboard/page.tsx`
- `app/(game)/graveyard/page.tsx`
- `app/(game)/market/page.tsx`
- `app/(game)/profile/page.tsx`
- `app/f/[slug]/page.tsx`
- `app/s/[slug]/page.tsx`
- `app/how-to-play/page.tsx`

**New files:**
- `app/icon.tsx`

## Validation

- ✅ `npm run typecheck` — passes
- ✅ `npm run lint` — no warnings/errors
- ✅ `npm test` — 357 tests passing
- ✅ `npm run build` — successful (including `/icon` route)
- ✅ DB smoke — passed

## Disk Usage

- No cleanup needed. Disk at 44% (13G / 32G total).

## Known Limitations

- Event category/severity icons integrated in operate-client but not yet in monthly history resolved event cards
- Team role icons (`Role*Icon`) and office icons (`Office*Icon`) not yet integrated into `team-client.tsx` employee cards
- MetricPanel internal trend arrows (`TrendingUp`/`TrendingDown`/`Minus`) still use Lucide
- How-to-play macro indicator cards still use Lucide icons

## Next Phase Recommendation

**Phase 21: Team Client + Event History Integration**
- Integrate role icons into `team-client.tsx` employee/candidate cards
- Integrate office setup icons into office selection UI
- Integrate event/severity icons into monthly history resolved event display
- Add dedicated trend arrow SVGs to MetricPanel
