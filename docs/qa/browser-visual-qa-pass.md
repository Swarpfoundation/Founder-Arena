# Browser Visual QA Pass

Phase 24A checks the Founder Arena player journey after the Phase 23 game-scene upgrades. This pass is intentionally QA/polish only: no gameplay math, backend systems, schema, DeepSeek behavior, ads, payments, referrals, or leaderboard rules were changed.

## Environment Used

Date: 2026-05-19

Local tooling:

- Next.js dev server via `npm run dev`
- Demo-mode dev server via `DEMO_MODE_ENABLED=true npm run dev`
- Existing HTTP smoke script: `node scripts/smoke.mjs`
- Local route probes with Node `fetch`
- Static responsive code review for 1440, 1280, 768, 390, and 360px layout risks

Browser automation status:

- No Playwright/Cypress dependency is installed.
- No Chromium/Chrome binary was available in the workspace.
- No screenshots were captured.
- This pass used local rendered-route smoke checks plus code-level responsive review rather than pixel screenshots.

## Routes Checked

Public and entry routes:

- `/` - 200
- `/login` - 200 after warm compile
- `/demo` - 200
- `/how-to-play` - 200
- `/market` - 200
- `/leaderboard` - 200
- `/graveyard` - 200
- `/s/demo-civicgraph-breakout` - 200 with public-safe poster
- `/f/demo-founder-arena` - 200 with public-safe founder card
- `/r/testcode` - 307 to `/login?callbackUrl=/dashboard`

Unauthenticated protected-route behavior:

- `/dashboard` - 307 to login
- `/startup/new` and startup subroutes - 307 to login
- `/career`, `/profile`, `/referrals`, `/settings/ads` - 307 to login
- `/admin/private-beta` - 307 to login before server-side admin checks

Demo-mode protected-route QA:

- `/dashboard` - 200 after demo fallback fix
- `/startup/new` - 200
- `/startup/demo-active-month-one` - 200
- `/startup/demo-active-month-one/pitch` - 200
- `/startup/demo-active-month-one/review` - 200
- `/startup/demo-active-month-one/terms` - 200
- `/startup/demo-active-month-one/team` - 200
- `/startup/demo-active-month-one/operate` - 200
- `/startup/demo-active-month-one/social` - 200
- `/startup/demo-active-month-one/rivals` - 200
- `/startup/demo-active-month-one/strategy` - 200
- `/startup/demo-active-month-one/boardroom` - 200
- `/startup/demo-active-month-one/infrastructure` - 200
- `/startup/demo-active-month-one/growth` - 200
- `/startup/demo-finalized-breakout/documentary` - 200
- `/career` - 200
- `/profile` - 200
- `/referrals` - 200
- `/settings/ads` - 200
- `/admin/private-beta` - 200 safe admin/denied-state route render in demo mode

## Viewports Checked

Because no browser binary was available, viewport work was a static responsive review rather than screenshot verification.

Reviewed breakpoints:

- Desktop: 1440px
- Laptop: 1280px
- Tablet: 768px
- Mobile: 390px
- Narrow mobile: 360px

Focus areas:

- Oversized title/poster typography
- Long uppercase labels and outcome stamps
- Public share cards on mobile
- Profile identity card on mobile
- Protected route HUD and side-panel stacking

## Issues Found

1. Local demo-mode protected routes could 500.

   `middleware.ts` intentionally lets routes through when `DEMO_MODE_ENABLED=true`, but `requireCurrentUser()` still rejected anonymous users. This made `/dashboard` fail in local demo QA even though demo mode is meant to provide an anonymous demo user fallback.

2. Team page passed Prisma Decimal objects into a client component.

   The Team Command page rendered successfully but logged React warnings because employee `productivity` was still a Prisma Decimal when passed to `TeamCommand`.

3. Career page emitted a missing key warning.

   Older demo career JSON can omit `sector` inside `sectorStats` values. The sector mastery helper used `stat.sector` directly, producing undefined keys/labels.

4. Mobile title/poster typography had overflow risk.

   The title screen, public share posters, and Founder ID hero used very large uppercase text with tight/negative tracking. On 360-390px widths, long names or outcome stamps could overflow.

## Fixes Made

- `requireCurrentUser()` and `requireAuthRedirect()` now use the existing dev demo-user fallback in local demo mode. Production behavior is unchanged.
- Team page serializes employee `productivity` to a number before passing employees into the client Team Command scene.
- Team Command now uses a client-safe employee type with numeric `productivity`.
- Career sector mastery now falls back to the sector JSON key when older career stats omit a `sector` field.
- Title screen mobile typography was reduced from immediate 6xl to 5xl with safer tracking.
- Public share startup/founder names and outcome stamps now use safer mobile text sizing, normal tracking, and `break-words`.
- Founder ID hero display name now uses safer mobile text sizing, normal tracking, and `break-words`.

## Deferred Issues

Priority: medium

- Real screenshot QA remains pending because no browser automation stack or local browser binary was available.
- `/operate` can trigger AI advisor generation in local demo mode, which makes route QA slower and logs safe fallback validation noise. This is not a UI blocker, but a future smoke mode could disable advisor generation for visual QA.
- Admin dashboard table overflow was route-smoked but not visually inspected in a browser at mobile width.

Priority: low

- Some older secondary routes still use `tracking-tight` or more SaaS-like headings. They did not block this pass, but a later polish sweep can normalize typography across every legacy surface.

## Privacy Checks

Public route string checks were run for:

- `/`
- `/market`
- `/leaderboard`
- `/s/demo-civicgraph-breakout`
- `/f/demo-founder-arena`

No secret names or raw internal fields were found. Public share pages intentionally include a safety sentence saying the view hides private pitch/review details; this is copy, not exposed private content.

Checked forbidden examples:

- demo email
- DeepSeek key name
- auth secret name
- Stripe secret name
- `rawResponse`
- admin user IDs

## Go / No-Go

Founder-only deployed smoke: GO

Reasons:

- Public routes render.
- Protected routes redirect unauthenticated users.
- Demo-mode protected journey renders after the fallback fix.
- Public share pages render with public-safe data.
- The most visible mobile overflow risks found in the new game surfaces were fixed.
- Typecheck, tests, lint, and build pass.

Friend beta with 1-3 testers: GO after founder performs deployed browser smoke.

Required founder smoke before invites:

- Sign in on the deployed domain.
- Create one startup.
- Save pitch.
- Submit one queued DeepSeek review.
- Confirm Render worker processes it.
- Confirm `/profile`, `/dashboard`, `/startup/new`, `/startup/[id]/pitch`, `/startup/[id]/review`, `/startup/[id]/team`, `/startup/[id]/operate`, `/career`, and `/admin/private-beta` look acceptable on phone and desktop.

## Commands Run

```bash
npm run dev
node scripts/smoke.mjs
DEMO_MODE_ENABLED=true npm run dev
npm test -- tests/unit/auth-demo-mode.test.ts tests/unit/career-scene.test.ts tests/unit/team-scene.test.ts
npm run typecheck
```

Final verification also ran:

```bash
npm test
npm run lint
npm run build
```
