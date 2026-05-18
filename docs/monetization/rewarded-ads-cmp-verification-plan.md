# Rewarded Ads CMP & Provider Verification Implementation Plan v0.1

Access date for cited sources: 2026-05-17.

## 1. Executive Summary

Founder Arena should pause real rewarded ads until three prerequisites are
complete:

1. A Google-certified CMP is selected and configured for web.
2. Real-provider reward verification is designed and approved.
3. Legal/product review confirms consent, privacy policy, age/COPPA posture, and
   Google Ad Manager account eligibility.

Recommended sequence:

1. Keep `mock` as the only active provider.
2. Select a Google-certified, IAB TCF-compatible CMP.
3. Add CMP integration in disabled/test mode with no ad scripts loaded until
   consent is known.
4. Add provider verification scaffolding and lifecycle states.
5. Only then test Google Ad Manager / GPT rewarded ads with test inventory.

Do not grant review cooldown acceleration from client-only rewarded events unless
Google confirms an account/product path with secure server verification or the
reward is downgraded to a low-value cosmetic reward.

## 2. Current State

Implemented:

- Mock rewarded review acceleration.
- Consent state types and ConsentManager.
- Rewarded ad provider adapter interface.
- Future disabled provider stubs.
- Server-side settings and audit ledger via `QueuedAction`.
- `/settings/ads`.
- Safe context builder.

Still disabled:

- Google GPT / Ad Manager.
- AdMob iOS / Android.
- CMP SDK.
- Tracking/cookies.
- Production ad units.
- Provider callbacks.

Active provider:

- `mock` only.

## 3. CMP Decision Framework

Sources:

- Google consent management requirements for EEA/UK/Switzerland publishers:
  https://support.google.com/admanager/answer/13554020
- Google certified CMP list:
  https://support.google.com/adsense/answer/13554116
- IAB Europe TCF:
  https://iabeurope.eu/transparency-consent-framework/
- Cookiebot TCF support:
  https://support.cookiebot.com/hc/en-us/articles/360007652694-Cookiebot-CMP-and-the-Transparency-and-Consent-Framework-TCF
- Didomi API docs:
  https://developers.didomi.io/cmp/web-sdk/reference/api
- Didomi Google/TFC troubleshooting:
  https://support.didomi.io/troubleshooting-google-ad-manager-and-tcf
- Usercentrics GPP docs:
  https://support.usercentrics.com/hc/en-us/articles/15719416898076-GPP-Documentation

Selection criteria:

| Criterion | Requirement |
|---|---|
| Google certification | Must appear on Google certified CMP list for publisher products. |
| IAB TCF | Must support current TCF signals required by Google. |
| Regions | Must cover EEA, UK, and Switzerland. |
| Script blocking | Must allow ad scripts to remain unloaded until consent state is available. |
| Revocation | Must expose a user-accessible settings/reopen API. |
| Auditability | Must provide consent state, timestamps, framework/vendor metadata, and revocation state. |
| Developer fit | Must work with a Next.js web app without relying on broad tag-manager side effects. |
| Cost | Must be viable for a small startup before ad revenue is proven. |
| Non-personalized mode | Must document whether limited/non-personalized ads are supported and how signals are passed. |

## 4. CMP Provider Comparison

| CMP candidate | Google-certified / TCF fit | Revocation/settings | Dev complexity | Startup fit | Notes |
|---|---|---|---|---|---|
| Google Funding Choices / Privacy & Messaging | Native Google ecosystem; verify current certified status/account availability | Good for Google ad products | Low-medium | Strong first candidate if available in Ad Manager account | Lowest vendor sprawl, but may be less flexible outside Google. |
| Cookiebot / Usercentrics | Google-certified and TCF-oriented per vendor docs / Google list | Mature preference center | Medium | Strong fallback | Good documentation; validate pricing and Next.js loading pattern. |
| Didomi | TCF and Google ad product docs available | Mature API | Medium | Strong if budget allows | Strong developer API; likely more enterprise oriented. |
| OneTrust | Common enterprise CMP; verify Google-certified config | Mature | High | Heavy for current stage | Strong compliance posture but likely overkill early. |
| Quantcast Choice | TCF-focused; verify current Google certification | Ad-tech oriented | Medium | Possible | Good ad-tech fit; evaluate product UX and pricing. |
| Sourcepoint | Publisher/ad-tech focused; verify current certification | Mature | High | Possible later | Better for mature publisher monetization. |

Recommended initial CMP path:

1. First check whether Google Funding Choices / Privacy & Messaging is available
   in Founder Arena's Google Ad Manager account and supports the needed web flow.
2. If not, shortlist Cookiebot/Usercentrics and Didomi.
3. Choose the lowest-complexity Google-certified CMP that:
   - supports IAB TCF for EEA/UK/Switzerland
   - exposes a reliable revoke/settings API
   - can block GPT until consent is resolved
   - has acceptable startup pricing

Fallback if selection is deferred:

- Keep real providers blocked.
- Keep mock-only rewards.
- Continue using `/settings/ads` as the non-legal preference surface.

Open legal questions:

- Whether contextual/non-personalized rewarded ads can be shown without consent
  in each relevant region.
- Whether frequency capping, fraud prevention, or provider storage itself
  requires consent.
- Whether Founder Arena needs age gating before any ad integration.

## 5. Consent Flow Design

### A. First Visit / Unknown Region

- Real providers blocked.
- Mock provider allowed.
- No GPT, CMP, ad tracking, or provider script loaded before region/consent
  strategy is known.
- `/settings/ads` explains real ads disabled.

### B. EEA / UK / Switzerland

- CMP required before personalized ads.
- No personalized ad request before valid CMP signal.
- If consent denied:
  - do not request personalized ads
  - either block real rewarded ads or request limited/contextual mode only after
    legal and CMP vendor review
- Revocation must:
  - update persisted `AdPrivacySettings`
  - append immutable audit event
  - prevent future real provider loads
  - expose settings reopen path

### C. US / Other

- Real providers still blocked until legal review.
- Future settings should support opt-out/revocation.
- Avoid claiming CCPA/CPRA compliance until counsel reviews exact data flows.

### D. Paid Users

- Pro/Max users do not see rewarded ad offers.
- Real ad scripts should not load for Pro/Max unless a future non-reward
  surface is explicitly approved.
- `/settings/ads` should state the ad-free boundary.

### E. Free Users

- Optional reward offer can appear only when:
  - review cooldown is active
  - per-review/daily caps allow it
  - persisted settings allow mock/real rewards
  - consent/provider eligibility allows the selected provider
- Continue Without Ad must always remain visible.

## 6. Provider Verification Design

Sources:

- Google Publisher Tag rewarded sample:
  https://developers.google.com/publisher-tag/samples/display-rewarded-ad
- Google Publisher Tag rewarded reference:
  https://developers.google.com/publisher-tag/reference
- Google Ad Manager web rewarded trafficking:
  https://support.google.com/admanager/answer/9116812
- AdMob SSV Android:
  https://developers.google.com/admob/android/ssv
- AdMob rewarded policies:
  https://support.google.com/admanager/answer/7496282

Required lifecycle states:

- offered
- started
- loaded
- shown
- completed_client
- completed_pending_verification
- verified
- rewarded
- failed
- cancelled
- expired

Server remains source of truth. Client provider events never grant rewards
directly.

### Google GPT / Ad Manager Web Caveat

GPT rewarded ads expose events such as:

- rewarded slot ready
- rewarded slot granted
- rewarded slot closed
- video completed

Google web documentation says publishers should listen to the granted event to
determine reward grant timing. This is a client event. The current docs reviewed
do not provide an AdMob-style signed server-side verification flow for GPT web.

Plan:

- Treat `rewardedSlotGranted` as `completed_client`.
- Move ledger to `completed_pending_verification`.
- Do not grant review cooldown acceleration from GPT web unless:
  - Google/Ad Manager account support confirms a secure verification path, or
  - the reward is reclassified as a low-value cosmetic/non-competitive reward
    after product review.
- Never send private startup data in GPT targeting/custom data.

### AdMob Future Mobile SSV

AdMob SSV callbacks include signed callback parameters and public-key
verification. Future mobile flow:

1. Mobile client sets opaque custom data with server-generated ledger token.
2. AdMob calls server SSV endpoint after completion.
3. Server verifies signature/public key, timestamp, ad unit, transaction ID,
   custom data, reward item, and reward amount.
4. Server grants reward idempotently.
5. Callback retries return success without double-granting.

## 7. Fraud / Abuse Prevention

Controls to implement before real ads:

- Ledger entry expiry, recommended 10-15 minutes after start.
- One active rewarded ad session per user/review/placement.
- Pending-start cap, count `started`, `loaded`, `shown`, and
  `completed_pending_verification` against per-review cap.
- Daily cap remains 6 across all rewarded placements.
- Per-review cap remains 2 accelerators.
- Idempotency key per ledger entry.
- Replay protection by provider transaction ID and ledger ID.
- Rate limits:
  - start: e.g. 6/hour/user
  - client-complete: e.g. 10/hour/user
  - provider callback: route-specific burst protection
- Multiple-tab protection:
  - server rejects new starts when active session exists
  - client listens for state refresh after start/complete
- Suspicious velocity audit:
  - repeated failures
  - many pending sessions
  - callback mismatch
  - daily cap attempts
- No reward grants from client-only events for competitive/convenience rewards
  unless legally/product-approved as low-risk.

## 8. Backend Endpoint Plan

Future-only endpoints/actions. Do not add production routes until provider/CMP
implementation begins.

### POST `/api/rewards/rewarded/start`

Request:

- placement
- startupId/reviewId where applicable

Server computes:

- authenticated user
- plan eligibility
- caps
- consent/provider status
- ledger token

Response:

- ledgerEntryId
- provider
- load token / public placement metadata
- expiresAt
- status

Forbidden:

- client-provided reward value
- startup scores/metrics
- pitch/review text

### POST `/api/rewards/rewarded/client-complete`

Request:

- ledgerEntryId
- provider event id if available

Behavior:

- mark `completed_client`
- for real providers, mark `completed_pending_verification`
- never grant production review acceleration from this alone

### POST `/api/rewards/provider/google-gpt/callback`

Future only. Add only if Google/account supports server verification or a secure
server-to-server reconciliation path.

Behavior:

- verify provider authenticity
- map opaque token to ledger
- mark `verified`
- grant reward idempotently

### POST `/api/rewards/provider/admob/ssv`

Future mobile only.

Behavior:

- verify AdMob signature/public key
- validate transaction ID
- validate custom data / ledger ID
- validate reward item/amount
- grant once

### GET `/api/ads/consent/status`

Returns safe consent/provider status:

- no private user/startup data
- no TCF raw string unless intentionally exposed to client

### POST `/api/ads/consent/sync`

Future CMP sync:

- CMP provider
- consent mode
- region
- framework metadata/reference
- safe audit metadata only

### POST `/api/ads/consent/revoke`

Revokes future real ads and writes audit event.

## 9. Data Model Plan

Current `QueuedAction` tradeoff:

- Good enough for Phase 18D mock settings and compact audit.
- Avoids premature migration before CMP/provider fields stabilize.
- Not ideal for production real ads because reward ledgers need stronger
  indexes, lifecycle queries, and provider transaction uniqueness.

Recommended production tables before real ads:

### `AdPrivacySetting`

- userId
- region
- consentStatus
- personalizationMode
- cmpProvider
- tcfStringReference or hashed metadata
- consentVersion
- realAdsDisabled
- mockRewardOffersDisabled
- timestamps

### `AdConsentAuditEntry`

- userId
- action
- previous/next consent status
- previous/next personalization mode
- region
- cmpProvider
- consentVersion
- safe metadata
- createdAt

Immutable append-only audit.

### `AdRewardLedger`

- userId
- startupId optional
- reviewId optional
- placement
- rewardType
- provider
- lifecycle status
- providerTransactionId unique nullable
- ledgerTokenHash
- callbackPayloadHash
- idempotencyKey unique
- startedAt / expiresAt / verifiedAt / rewardedAt
- failure reason

Recommended path:

- Keep `QueuedAction` for mock settings until real provider implementation.
- Add dedicated tables before production real ads or mobile SSV.

## 10. Product / UI Requirements

Required states before real ads:

- pre-ad disclosure
- consent required
- consent denied
- no inventory
- ad failed
- ad closed/incomplete
- completed pending verification
- reward granted
- reward denied
- provider disabled
- Pro/Max ad-free
- privacy settings/revocation

Copy rules:

- Say "optional".
- State exact reward.
- State "Continue without ad" clearly.
- No fake sponsor names.
- No "required to continue".
- No "support us" pressure.
- No "guaranteed instant review" unless the actual rule does that.

Recommended disclosure:

> Watch an optional rewarded ad to reduce this review wait. Skipping does not
> block your review. Rewards are granted only after the ad provider verifies
> completion.

## 11. Legal / Policy Checklist

Before any real provider:

- Privacy policy updated for ad providers and CMP.
- Cookie/ad storage disclosure completed.
- CMP vendor contract/config reviewed.
- Google Ad Manager account eligibility confirmed.
- Rewarded ad policy reviewed against exact UI.
- EEA/UK/Switzerland consent reviewed.
- US privacy opt-out posture reviewed.
- Age/COPPA posture reviewed.
- App Store Privacy Labels drafted for future mobile.
- ATT strategy drafted for future iOS.
- Google Play Data Safety drafted for future Android.
- Test ad units only before production.
- Production ad unit approval before launch.
- Security review of callback verification.

## 12. Implementation Phases

### Phase 18F — CMP Selection & Consent Sync Scaffold

- Select CMP.
- Add CMP adapter interface.
- Add consent sync server action/API.
- Keep real providers disabled.
- Add tests for consent sync and revocation.

### Phase 18G — Reward Verification Lifecycle Tables

- Add dedicated `AdRewardLedger` table.
- Add lifecycle states.
- Add expiry/idempotency/rate-limit tests.
- Keep mock provider active only.

### Phase 18H — Google GPT Test Integration

- Load GPT only after CMP/legal approval.
- Use test ad units only.
- Mark client completion as pending verification.
- Do not grant review acceleration unless verification is approved.

### Phase 18I — Mobile AdMob SSV Plan / Native App Only

- Future iOS/Android only.
- Add AdMob SSV endpoint with signature verification.
- No web runtime impact.

## 13. Do Not Implement Yet

Do not implement yet:

- Google GPT script.
- Google Ad Manager production ad units.
- Google Funding Choices / CMP SDK.
- Third-party CMP SDK.
- AdMob SDK.
- ATT prompt.
- Tracking cookies.
- Analytics SDK.
- Production rewarded ad callbacks.
- Client-only reward grant.
- Pay-to-win rewards.
- Provider custom data containing startup or founder private data.
