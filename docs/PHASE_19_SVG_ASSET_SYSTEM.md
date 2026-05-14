# Phase 19: SVG Asset System

## Overview

Phase 19 introduces a production-ready SVG asset system for Founder Arena. All assets are original vector work — no raster images, no external copyrighted logos, no official company marks.

The system provides:
- **Brand assets** (logo, wordmark, mark)
- **Sector icons** (12 sectors)
- **Metric icons** (16 core metrics)
- **Event category + severity icons** (14 icons)
- **Outcome badge icons** (9 outcomes)
- **Achievement badge icons** (28 achievements)
- **Growth/funding icons** (9 round/offer types)
- **Strategic actor marks** (15 fictional actors)
- **Team/office icons** (14 role + office types)

## Asset Architecture

```
components/assets/
  base.tsx              # AssetBase / FilledAssetBase SVG wrappers
  index.ts              # Central export registry
  wrappers.tsx          # IconCircle, AssetBadgeShell reusable containers
  brand/
    FounderArenaLogo.tsx
    FounderArenaMark.tsx
    FounderArenaWordmark.tsx
  icons/
    Sector*Icon.tsx      # 12 sector icons
    Metric*Icon.tsx      # 16 metric icons
    Event*Icon.tsx       # 11 event category icons
    Severity*Icon.tsx    # 3 severity markers
    Growth*Icon.tsx      # 9 growth/funding icons
  badges/
    Outcome*Icon.tsx     # 9 outcome badge icons
    Achievement*Icon.tsx # 28 achievement badge icons
  actors/
    Actor*Icon.tsx       # 15 strategic actor marks
  team/
    Role*Icon.tsx        # 10 role icons
    Office*Icon.tsx      # 4 office setup icons

lib/assets/
  sector-icon-map.ts
  outcome-icon-map.ts
  achievement-icon-map.ts
  event-icon-map.ts
  actor-icon-map.ts
  index.ts
```

## Design Conventions

- **ViewBox**: `0 0 24 24` for all icons
- **Stroke-based**: `stroke="currentColor"`, `strokeWidth={1.5}` for line icons
- **Fill-based**: `fill="currentColor"` for filled badges
- **Sizing**: `size` prop defaults to 24, maps to `width`/`height`
- **Accessibility**: `aria-hidden="true"` by default; `title` prop adds `<title>` + `role="img"`
- **Theming**: All icons use `currentColor` — works with any Tailwind text color
- **Consistency**: All icons share the same visual language (geometric, minimal, sharp)

## Usage Examples

### Direct Component Import
```tsx
import { SectorAiIcon, MetricCashIcon } from "@/components/assets";

<SectorAiIcon className="w-5 h-5 text-cyan-400" size={20} />
<MetricCashIcon className="text-emerald-400" />
```

### Registry Lookup
```tsx
import { getSectorIcon, getAchievementIcon } from "@/lib/assets";

const SectorIcon = getSectorIcon("AI / ML");
< SectorIcon className="w-4 h-4" size={16} />

const AchievementIcon = getAchievementIcon("breakout_startup");
<AchievementIcon className="w-8 h-8 text-violet-400" size={32} />
```

### With Wrapper
```tsx
import { IconCircle } from "@/components/assets/wrappers";
import { MetricTrophyIcon } from "@/components/assets";

<IconCircle size={40} glow="cyan">
  <MetricTrophyIcon className="text-cyan-400" size={20} />
</IconCircle>
```

## Mapping Helpers

| Helper | Input | Fallback |
|---|---|---|
| `getSectorIcon(sector)` | string | `SectorSaaSIcon` |
| `getOutcomeIcon(outcome)` | string \| null | `OutcomeDeadIcon` |
| `getAchievementIcon(key)` | string \| null | `AchievementFirstPitchIcon` |
| `getEventCategoryIcon(category)` | string \| null | `EventOperationalIcon` |
| `getSeverityIcon(severity)` | string \| null | `SeverityMinorIcon` |
| `getActorIcon(actorId)` | string \| null | `ActorEnterpriseGiantIcon` |

All helpers are case-insensitive and safe for null/undefined input.

## Asset Count Summary

| Category | Count |
|---|---|
| Brand | 3 |
| Sector Icons | 14 (includes aliases) |
| Metric Icons | 16 |
| Event Category Icons | 11 |
| Severity Icons | 3 |
| Outcome Badge Icons | 9 |
| Achievement Badge Icons | 28 |
| Growth/Funding Icons | 9 |
| Strategic Actor Marks | 15 |
| Team Role Icons | 10 |
| Office Setup Icons | 4 |
| **Total Unique SVG Components** | **~108** |

## Brand Safety

- **No real company logos** used anywhere in the asset system
- All strategic actor marks are abstract geometric symbols
- Achievement and outcome icons use original geometric compositions
- Sector icons use generic industry symbols (not trademarked motifs)
- All assets are original SVG work created for Founder Arena

## UI Integration Points

| Page | Assets Integrated |
|---|---|
| `app/layout.tsx` | FounderArenaMark in header |
| `app/page.tsx` | FounderArenaLogo in hero CTA |
| `app/(game)/dashboard/page.tsx` | Sector icons on startup cards |
| `app/(game)/startup/[id]/page.tsx` | Sector icon + metric icons (valuation, cash, burn, revenue, product, investor, market, risk, payroll) |
| `app/(game)/profile/page.tsx` | Achievement badge icons |
| `app/s/[slug]/page.tsx` | Sector icon on public badge |

## Accessibility

- All SVG components accept an optional `title` prop
- When `title` is provided, the SVG gets `role="img"` and `aria-label`
- When no `title` is provided, `aria-hidden="true"` is used
- All icons scale cleanly from 12px to 64px+

## Testing

`tests/unit/assets.test.ts` (14 tests):
- Sector icon mapping (canonical sectors, case-insensitivity, fallback)
- Outcome icon mapping (all engine outcomes, null fallback)
- Achievement icon mapping (all 28 keys, unknown fallback)
- Event category + severity mapping (all categories/severities)
- Actor icon mapping (all 15 actors, unknown fallback)

## Validation

- ✅ `npm run typecheck` — passes
- ✅ `npm run lint` — no warnings/errors
- ✅ `npm test` — 357 tests passing (343 baseline + 14 new)
- ✅ `npm run build` — successful
- ✅ DB smoke — passed

## Disk Usage

- No cleanup needed. Disk at 44% usage (13G used / 32G total).
- Asset system adds ~150KB of source code, negligible build impact.

## Known Limitations

- Achievement badges on the profile page use a single consistent style (circular frame + inner symbol). Future phases could introduce tiered styles (bronze/silver/gold frames).
- Not all 35 Lucide icon usages have been replaced — only the highest-value visual touchpoints were updated to avoid over-refactoring.
- Event category icons are not yet integrated into the operate page event cards (Phase 16 components still use Lucide). This is a safe future enhancement.
- Strategic actor marks are shown via mapping helper but not yet integrated into growth page cards (they can be added via `getActorIcon(actor.id)`).

## Next Phase Recommendations

- **Phase 20**: Integrate actor marks into growth page cards, integrate event/severity icons into operate page event cards, add tiered achievement badge frames.
- Consider adding an `icon.tsx` / `favicon.ico` route for the brand mark.
