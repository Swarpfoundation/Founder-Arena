# Rewarded Ads Persistent Consent Settings v0.1

Phase 18D makes ad privacy and rewarded-offer settings durable before any real
ad provider or CMP is integrated.

## Scope

Implemented:

- Server-side ad privacy settings.
- Compact consent/settings audit ledger.
- `/settings/ads` reads and updates account settings.
- Mock reward offers can be hidden or re-enabled server-side.
- Future real-ad consent can be revoked/reset as a placeholder state.
- Rewarded review offers respect persisted mock-off settings.

Not implemented:

- Google GPT script.
- AdMob SDK.
- CMP SDK.
- ATT prompt.
- Cookies or tracking.
- Production ad units.
- Provider secrets.
- Real provider verification callbacks.

## Persistence Model

No schema migration was added. Founder Arena reuses the existing `QueuedAction`
JSON fields as a compact account audit log:

- `actionType: adPrivacyAudit`
- `status: completed`
- `payload.auditEntry`: safe audit event
- `result.settings`: latest settings snapshot

The latest completed `adPrivacyAudit` row is the current settings source. Recent
rows form the audit history shown in `/settings/ads`.

This avoids storing ad privacy state in gameplay JSON fields and avoids a
migration before legal/CMP requirements are finalized.

## Settings Shape

`AdPrivacySettings` includes:

- `mockRewardOffersDisabled`
- `rewardedAdsOptOut`
- `realAdsDisabled: true`
- `consentStatus`
- `personalizationMode`
- `region`
- `lastUpdatedAt`
- `updatedBy`
- `version`

Real ads always remain disabled in v0.1.

## Audit Ledger

Audit actions:

- `settings_viewed`
- `mock_offers_disabled`
- `mock_offers_enabled`
- `future_real_ads_revoked`
- `future_real_ads_preference_recorded`
- `consent_reset`
- `cmp_future_placeholder`

Audit metadata is allowlisted. It may include only non-sensitive fields such as:

- surface
- mode
- provider
- placement
- source
- planId

It must not include user email, pitch text, financial plans, startup metrics, AI
prompts, review text, scores, or cloud/provider identifiers.

## Server Actions

Actions:

- `getAdPrivacySettingsAction`
- `updateMockRewardOfferPreferenceAction`
- `revokeFutureAdConsentAction`
- `resetAdPrivacySettingsAction`
- `recordAdSettingsViewedAction`

All actions require an authenticated user and write through the server-side
audit store. The client cannot enable real providers or grant rewards.

## Settings UI

Route:

- `/settings/ads`

The page displays:

- active provider: mock
- real providers: disabled
- Google GPT future status
- Pro/Max ad-free boundary
- consent gate status
- reward offer preference
- future real-ad revocation/reset actions
- recent consent/settings history
- data minimization rules

The browser-local preference remains as a fallback/sync mechanism for the mock
UI, but account settings are authoritative for authenticated users.

## Reward Flow Impact

If `mockRewardOffersDisabled` is true:

- rewarded review offers are blocked server-side
- the pitch page shows a disabled state with a link to `/settings/ads`
- review cooldown continues normally

No reward caps, acceleration amounts, subscription behavior, or economy values
changed.

## Real Provider Blocking

ConsentManager now evaluates persisted settings through
`adConsentStateFromSettings`. Real provider eligibility remains false for every
state because:

- no CMP exists
- no legal review has approved real ads
- no provider verification callback exists
- production providers are disabled/unsupported stubs

## Pro / Max Boundary

Pro and Max users remain ad-free. Rewarded review acceleration stays a Free-user
convenience path and does not affect gameplay outcomes.

## Next Steps

Before real provider integration:

1. Decide CMP vendor and region strategy.
2. Add legal-approved consent copy and audit fields.
3. Add provider verification callback design.
4. Confirm Google Ad Manager / GPT account eligibility.
5. Keep production ad units disabled until policy review is complete.
