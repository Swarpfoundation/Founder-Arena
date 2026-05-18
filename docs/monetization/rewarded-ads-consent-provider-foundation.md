# Rewarded Ads Consent & Provider Foundation v0.1

Phase 18C adds the internal architecture needed before Founder Arena can safely
integrate real rewarded ads. It does not enable real ads.

## Scope

Implemented:

- Consent state types.
- ConsentManager helpers.
- Rewarded ad provider adapter interface.
- Mock rewarded provider adapter.
- Future provider stubs for Google GPT web and AdMob mobile.
- Safe rewarded ad context builder.
- Ad Privacy / Rewards Settings page.
- Mock reward flow routed through the provider interface.

Not implemented:

- Google GPT script.
- AdMob SDK.
- CMP SDK.
- ATT prompt.
- Cookies or tracking.
- Real ad units.
- Provider API keys.
- Real server-side verification callbacks.

## ConsentManager

Modules:

- `lib/monetization/consent/types.ts`
- `lib/monetization/consent/consent-manager.ts`

Consent defaults to:

- `region: unknown`
- `status: unknown`
- `personalizationMode: unknown`
- `source: system_default`

Real rewarded ads are blocked by default. Even recorded mock preferences do not
make real ads eligible. EEA/UK/Switzerland decisions always require a certified
CMP / TCF implementation and legal review before any real provider can load.

Mock rewarded ads remain allowed because the mock provider does not contact
external ad networks, store tracking identifiers, use cookies, or run provider
SDKs.

## Provider Adapter

Module:

- `lib/monetization/rewarded-ads/provider.ts`

Providers:

- `mock` — active
- `google_gpt_web_future` — disabled
- `admob_ios_future` — unsupported in web runtime
- `admob_android_future` — unsupported in web runtime

Provider adapters expose:

- `getStatus`
- `start`
- `complete`
- `cancel`

Provider results do not grant rewards directly. The server-side reward ledger
remains the source of truth.

## Mock Reward Flow

Existing Phase 18A behavior is preserved:

- Free-user-only offer eligibility.
- Optional opt-in UI.
- Continue Without Ad path.
- 5-second mock modal.
- Per-review cap of 2.
- Daily cap of 6.
- Server-side ledger and idempotent completion.

The server now calls the mock provider adapter during start, complete, and cancel
actions. This prepares the shape for future real provider integration while
keeping all reward grants server-authoritative.

## Settings UI

Route:

- `/settings/ads`

The page shows:

- active provider: mock only
- real ads: disabled
- Pro/Max ad-free boundary
- consent gate status
- data minimization rules
- browser-local toggle to hide mock reward offers

Phase 18D update:

- authenticated users now get server-side settings persistence and a compact audit ledger
- the latest settings snapshot is stored in existing `QueuedAction.result`
- safe audit entries are stored in existing `QueuedAction.payload`
- browser local storage remains only as a mock UI fallback/sync mechanism

The mock-off fallback key is:

- `founder-arena.mock-reward-offers-disabled`

This is intentionally not legal consent and is not a CMP substitute.

## Data Minimization

Module:

- `lib/monetization/rewarded-ads/safe-context.ts`

Allowed context:

- placement
- reward type
- ledger ID
- provider ID
- generic route context
- app mode

Forbidden context:

- pitch text
- pitch deck
- financial plan
- funding ask
- email or private founder identity
- startup cash, revenue, valuation, burn, runway
- investor, market, or risk scores
- AI prompts
- internal scoring values

## Phase 18D Readiness

Before real Google GPT / Ad Manager integration:

1. Select CMP vendor.
2. Add consent audit persistence.
3. Add revocation/settings persistence.
4. Complete legal review for EEA/UK/Switzerland and US privacy obligations.
5. Confirm Ad Manager rewarded web account eligibility.
6. Design server-side verification or pending-verification handling.
7. Add provider test ads only; no production units until policy review.

## Safety Boundary

Rewarded ads remain convenience-only. They must not affect:

- cash
- revenue
- valuation
- risk score
- investor score
- market score
- VC decision quality
- funding terms
- death checks
- leaderboard score
- career score
