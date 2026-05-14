# Phase 26A — Security & Economy Hotfix

Date: 2026-05-09
Status: ✅ Lint/Typecheck/Test pass. Build not run in this sandbox (no DB at localhost:5432). Manual smoke against a deployed environment recommended.

This is **not** a feature phase. It's a critical hotfix addressing
security and economy issues discovered in the Phase 25 audit.

---

## What changed

### 1. Hire salary/effects tampering — FIXED (P0)

**Before:** `hireEmployeeAction` accepted a full `Candidate` object from
the client and persisted `salary`, `productImpact`, `revenueImpact`,
`riskImpact`, `investorImpact`, `moraleImpact` directly. A user could
post `{ salary: 1, productImpact: 999 }` and hire elite engineers for $1
with absurd impacts.

**After:** the action accepts only `candidateId` (legacy clients posting
a full `Candidate` are tolerated — only `id` is read).

- The candidate id format `cand-<month>-<index>` is parsed.
- The expected month is recomputed from the latest `simulationMonth`.
- Out-of-pool / wrong-month / unknown-id payloads are rejected.
- The candidate is **regenerated server-side** via
  `generateCandidateAtIndex(startupId, month, sector, index)`.
- Salary, monthly burn, and impacts come from `getCanonicalCandidateValues`,
  which reads `lib/economy/cost-engine.ts` for cost and
  `lib/economy/salary-bands.ts` for impacts (extended with `getRoleImpacts`).
- Role and seniority are validated against `isAllowedRole` /
  `isAllowedSeniority` (also new in `salary-bands.ts`).
- After insert, `recomputeStartupBaseBurn` runs in the same transaction.

**Display path** (`getTeamState`): every candidate the UI shows is
overlaid with the same canonical values, so the cost the user sees is
exactly what the server will charge.

**Files**: `lib/actions/team.ts`, `lib/team/candidates.ts`,
`lib/economy/salary-bands.ts`, `lib/economy/recompute-burn.ts` (new),
`tests/unit/economy/canonical-candidate.test.ts` (new).

---

### 2. Growth offer forgery — FIXED (P0)

**Before:** `resolveGrowthOfferAction` accepted a full `StrategicOffer`
from the client. A crafted POST with
`{ offerType: "acquisition", acquisitionPrice: 999000000 }` would
acquire the startup for $999M with no actor backing.

**After:** the action accepts only `offerId`.

- The offer set is **regenerated server-side** by calling `getGrowthState`,
  which builds the deterministic `offers` and `roundOffers` arrays from
  current startup state, market snapshot, and the strategic actor library.
- Resolution uses ONLY the matched server-generated offer; any client
  amount/equity/acquisitionPrice is ignored.
- Dead startups, acquired startups, and unknown offerIds are rejected.
- Idempotency: an existing `growth_offers` row with the same
  `actorId + offerType + headline` and status `accepted | rejected`
  blocks duplicate resolution. (No schema change needed because the
  offer set is deterministic — same `offerId` always rebuilds with the
  same identity columns.)

**Files**: `lib/actions/growth.ts`, `components/growth/GrowthOfferCard.tsx`,
`tests/unit/growth-offer-security.test.ts` (new).

---

### 3. Burn / base burn consistency — FIXED (P0)

**Definitions** (now matched in code and docs):

- `baseBurn` = active payroll + office cost. Stored in `startup.monthlyBurn`.
- `trueMonthlyBurn` = baseBurn + sector operating costs + active mission cost. Computed each month from cost-engine.
- `oneMonthTotalBurn` = trueMonthlyBurn + decision/event deltas after market multiplier.

**Before:**
- `acceptTermSheetAction` left `monthlyBurn = 0` after funding.
- `hireEmployeeAction` did `+= candidate.salary` (no office add).
- `fireEmployeeAction` and `changeOfficeSetupAction` did full recompute including office.
- Office cost was therefore silently missing from `startup.monthlyBurn`
  until a fire/office change forced a recompute. Inflated capital
  efficiency in `classifyFinalOutcome`.

**After:** a single helper, `recomputeStartupBaseBurn(db, startupId)`, is
the only writer of `startup.monthlyBurn` and `startup.officeMonthlyCost`.

- It loads active employees + workSetup, sums real persisted salaries,
  adds office cost, writes both fields.
- Called from: `acceptTermSheetAction`, `hireEmployeeAction`,
  `fireEmployeeAction`, `changeOfficeSetupAction` — all inside the
  same transaction as the underlying mutation.
- `finalizeStartup` and the operate `/operate` `FinalOutcome` component
  now compute `trueMonthlyBurn` via `calculateTotalBurn(...)` so capital
  efficiency in the final report and the leaderboard outcome
  reflect the burn the user actually fought.

**Files**: `lib/economy/recompute-burn.ts` (new), `lib/actions/team.ts`,
`lib/actions/terms.ts`, `lib/game/finalize-startup.ts`,
`app/(game)/startup/[id]/operate/page.tsx`,
`tests/unit/economy/burn-invariant.test.ts` (new).

---

### 4. Middleware public routes — FIXED (P1)

`middleware.ts` PUBLIC_PATHS / PUBLIC_PREFIXES updated to include:

- `/pricing`
- `/f/` (public founder profiles)
- `/api/health`

Logged-out users can now reach public marketing and share pages.
`/dashboard`, `/profile`, `/billing`, `/startup/...` remain protected.

---

### 5. /api/auth-debug — DELETED (P1)

`app/api/auth-debug/route.ts` is gone. It was anonymously readable and
leaked env-config presence/lengths and DB liveness. No replacement —
prefer `/api/health` for safe ops checks.

---

### 6. force-dynamic on DB-backed pages — FIXED (P1)

`export const dynamic = "force-dynamic"` added to every page that reads
mutable DB state, plus the JSON snapshot route:

- `app/(game)/{graveyard,leaderboard,market,dashboard,profile,billing}/page.tsx`
- `app/(game)/startup/[id]/{page,pitch,review,terms,operate,team,growth}/page.tsx`
- `app/(game)/startup/new/page.tsx`
- `app/s/[slug]/page.tsx`
- `app/f/[slug]/page.tsx`
- `app/pricing/page.tsx`
- `app/api/market/snapshot/route.ts`

**Before:** local build failed pre-rendering `/graveyard` because the
DB at `localhost:5432` was unavailable. On Vercel it would have built
once and then served a stale snapshot.

**After:** these pages are always rendered per request.

---

### 7. Growth pay-to-win — FIXED (P1)

**Before:** `lib/billing/plans.ts` declared `growthPhaseAccess: false`
for free users, while the same file's JSDoc said paid plans must NOT
gate score-affecting mechanics. Acquisitions and growth rounds feed the
leaderboard score and final outcome.

**After:** `growthPhaseAccess: true` for the free plan. `checkGrowthAccess`
always returns `{ allowed: true }` — the field is retained only for
future "deeper analysis copy" purposes. Pricing/feature copy updated.

Tests: `tests/unit/billing-fairness.test.ts` asserts free / pro / max
all get growth access.

---

### 8. Stub pages — REDIRECTED (P2)

- `/startup/[id]/term-sheet` → redirect to `/startup/[id]/terms`.
- `/startup/[id]/simulate` → redirect to `/startup/[id]/operate`.
- `/(game)/founder/[id]` → look up `founderProfile.publicSlug` and
  redirect to `/f/<slug>`, otherwise `notFound()`.

No more reachable placeholder pages.

---

### 9. Landing page fake stats — REMOVED (P2)

Hardcoded "1,247 OPERATIVES / 3,892 STARTUPS / 847 EXITS" replaced with
a closed-beta caption explaining what Founder Arena is.

---

### 10. Lint — CLEAN

Updated `eslint.config.mjs` with `argsIgnorePattern: "^_"` so
underscore-prefixed unused params don't warn. Removed dead imports
across dashboard, graveyard, leaderboard, profile, startup detail,
operate-client, GameCard, MetricPanel, simulation actions, mission
helpers. Final `npm run lint` reports `✔ No ESLint warnings or errors`.

---

## Security/economy rules now enforced

1. **Never trust client-supplied economy/gameplay numbers.** Server
   recomputes salary, impacts, and offer economics from canonical sources.
2. **Single source of truth for `startup.monthlyBurn`.** Only
   `recomputeStartupBaseBurn` writes it. baseBurn = active payroll +
   office, full stop.
3. **Final outcome uses true burn.** `classifyFinalOutcome` is fed the
   cost-engine total, never the stored baseBurn.
4. **Fairness: paid plans cannot improve outcome.** Growth phase is
   universally available.
5. **Public pages stay public, protected pages stay protected.**
   Middleware whitelist covers all public routes; default is protected.

---

## Tests added (all green, 25 new tests)

- `tests/unit/economy/burn-invariant.test.ts` — recomputeStartupBaseBurn
  math across remote / coworking / small_office / premium_office,
  empty payroll case (post-funding), error on missing startup.
- `tests/unit/economy/canonical-candidate.test.ts` — canonical values
  match cost engine + salary bands; unknown roles/seniorities rejected;
  region multipliers applied; `generateCandidateAtIndex` ↔ `generateCandidates`
  parity.
- `tests/unit/billing-fairness.test.ts` — free / pro / max / null user
  all allowed into growth phase.
- `tests/unit/growth-offer-security.test.ts` — offer set is
  deterministic; forged $999M acquisitionId is not in the regenerated
  set; tampered amount on a real offerId is overwritten by regeneration;
  offerId stable across runs.

Total: 23 → 27 test files; 410 → 435 tests passing.

---

## Manual test path (requires running app + DB)

1. As a free user, attempt to hire a candidate via DevTools, posting
   `{ id: "cand-1-0", salary: 1, productImpact: 999 }`. The server
   should ignore the `salary`/`productImpact` and persist cost-engine
   values. Check `employee.salary` in DB.
2. Hire any normal candidate; the displayed salary on the team page
   must equal the persisted `employee.salary`.
3. Accept a term sheet on a freshly funded startup with no employees
   and the default `small_office` workSetup. Verify
   `startup.monthlyBurn = 8000` and `startup.officeMonthlyCost = 8000`.
4. Fire an employee. Verify `startup.monthlyBurn` decreases by exactly
   their persisted `salary`.
5. Change office from `small_office` to `coworking`.
   `startup.monthlyBurn` should change by `-5000` (8000 → 3000) plus
   payroll, exactly once.
6. Run a simulation month. Inspect the resulting
   `simulationMonth.metadata.costBreakdown` — `baseBurn` should equal
   `startup.monthlyBurn` BEFORE the run; `total` should include
   operating + decision + market multiplier deltas.
7. As a malicious user, POST to `resolveGrowthOfferAction` with
   `{ offerId: "offer-frontier_ai_lab-999", action: "accept" }`. It
   must reject with "Offer is no longer available."
8. Accept a real offer once → `growth_offers` row created with
   status `accepted`. Try the same offerId again → "Offer has already
   been resolved."
9. Logged out, navigate to `/f/<some-existing-slug>` and `/pricing`.
   Both must render without redirecting to `/login`.
10. Logged out, navigate to `/dashboard`. Must redirect to `/login`.
11. `curl https://<host>/api/auth-debug` must return 404.
12. As a free user with a completed startup, navigate to
    `/startup/<id>/growth`. Must NOT show a paywall.
13. Visit `/`. Must show the closed-beta caption — no fake stats.
14. Visit `/(game)/founder/<userId>`, `/(game)/startup/<id>/term-sheet`,
    `/(game)/startup/<id>/simulate`. All three must redirect.

---

## Schema / migration changes

**None.** The hotfix uses deterministic regeneration + identity-column
matching for growth offers; no new fields were added. The existing
`growth_offers.actorId / offerType / headline` were sufficient for
idempotency.

---

## Remaining known risks (not fixed in this hotfix)

- **In-memory rate limiter** is still in use unless `UPSTASH_REDIS_REST_URL`
  is set. On Vercel each function instance is fresh, so the documented
  limits don't fire reliably. Phase 26B should either require Upstash
  in production or replace with a DB-backed limiter.
- **Mission "delayed" status** still reachable from `mission-progress.ts`
  with no UI handling. Low blast radius but worth fixing in Phase 26B.
- **Sector enum mismatch** between `lib/validations.ts`,
  `app/(game)/leaderboard/page.tsx`, and `lib/missions/mission-library.ts`
  (Web3 / Gaming categories exist downstream but aren't selectable from
  the create form). Phase 26B.
- **Privacy policy / AI disclosure** copy is still missing. Phase 26B.
- **No e2e tests.** All 435 tests are unit-level. Phase 26B should add
  Playwright coverage for the hire / growth-offer / login flows.

---

## Validation in this branch

Run from repo root:

```
npm run typecheck   # passes clean
npm run lint        # passes clean (0 warnings)
npm run test        # 435/435 passing
npm run build       # not validated in this sandbox (no DB at localhost:5432);
                    # force-dynamic should let build succeed without DB on Vercel.
```

`npm run smoke:db` and `npm run smoke` not run (no live DB / server in
sandbox).
