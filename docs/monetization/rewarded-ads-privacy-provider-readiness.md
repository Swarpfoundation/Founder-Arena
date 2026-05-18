# Rewarded Ads Privacy / Consent / Provider Readiness v0.1

Access date for all sources: 2026-05-17.

## 1. Executive Summary

Founder Arena should not integrate real rewarded ads until a consent and
provider-verification layer exists. Phase 18A's mock flow is policy-safe in
principle because it is optional, disclosed before start, skippable, Free-user
only, and rewards only review cooldown convenience.

Recommended web path:

1. Build a consent/privacy abstraction first.
2. Add a provider adapter interface with `mock` as the only active provider.
3. Add Google Ad Manager / Google Publisher Tag rewarded ads as the first real
   web candidate only after consent and legal review.
4. Use AdMob only for future native iOS/Android apps, not the current web app.
5. Require server-side verification or a provider webhook for real rewards.

Do not add real SDKs, ad unit IDs, cookies, CMPs, ATT prompts, or tracking in
this phase.

## 2. Official Source List

| Source | URL | Official? | Key relevance |
|---|---|---:|---|
| Google Publisher Tag rewarded ad sample | https://developers.google.com/publisher-tag/samples/display-rewarded-ad | Official | GPT supports web rewarded ad events including ready, granted, closed, and video-completed. |
| Google Ad Manager rewarded ad policies | https://support.google.com/admanager/answer/7496282 | Official | Reward disclosure, opt-in, skip/no path, and promised reward requirements. |
| Google consent management requirements | https://support.google.com/admanager/answer/13554020 | Official | Google-certified CMP / IAB TCF requirements for EEA, UK, and Switzerland personalized ads. |
| Google AdMob rewarded ad overview | https://support.google.com/admob/answer/7372450 | Official | AdMob rewarded ad units are app-oriented. |
| Google AdMob Android rewarded guide | https://developers.google.com/admob/android/rewarded | Official | Android rewarded implementation and test ad requirements. |
| Google AdMob iOS rewarded guide | https://developers.google.com/admob/ios/rewarded | Official | iOS rewarded implementation and optional SSV flow. |
| Google AdMob server-side verification | https://support.google.com/admob/answer/9603226 | Official | SSV validates completed rewarded ad views using callback URLs. |
| Google Play ads policy | https://support.google.com/googleplay/android-developer/answer/9857753 | Official | Disruptive ads restrictions and rewarded ad opt-in exception. |
| Google H5 Games Ads | https://adsense.google.com/intl/en_in/start/h5-games-ads/ | Official | Web game rewarded/interstitial ad program; account approval required. |
| Google User Messaging Platform overview | https://support.google.com/admob/answer/10113209 | Official | UMP is Google’s mobile consent path for AdMob/Ad Manager apps. |
| Apple User Privacy and Data Use | https://developer.apple.com/app-store/user-privacy-and-data-use/ | Official | ATT required when third-party SDKs track across apps/sites. |
| Apple App Privacy Details | https://developer.apple.com/app-store/app-privacy-details/ | Official | App Privacy labels and tracking definition. |
| ICO cookies and similar technologies | https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/ | Official regulator | UK cookie/storage consent guidance. |
| European Commission data protection explained | https://commission.europa.eu/law/law-topic/data-protection/data-protection-explained_en | Official regulator | Cookie IDs and re-identifiable pseudonymous data can be personal data. |
| Google Play Families policy | https://support.google.com/googleplay/android-developer/answer/9893335 | Official | Required only if targeting children or Families audience. |
| FTC COPPA FAQ | https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions | Official regulator | Child-directed services and behavioral advertising risk. |
| Unity Ads rewarded docs | https://docs.unity.com/en-us/grow/ads/unity-sdk/rewarded-ads | Official | Rewarded ad completion callbacks in Unity Ads. |
| Unity LevelPlay S2S callbacks | https://docs.unity.com/grow/levelplay/platform/settings/server-to-server-callback | Official | Server-to-server reward callback support. |
| AppLovin MAX rewarded docs | https://developers.applovin.com/en/max/unity/ad-formats/rewarded-ads/ | Official | Rewarded ad format and S2S callback configuration. |
| AppLovin MAX S2S Rewarded Callback API | https://support.axon.ai/en/max/advanced-features/s2s-rewarded-callback-api | Official | S2S callback protects against fraudulent reward grants. |
| IAB Europe TCF | https://iabeurope.eu/transparency-consent-framework/ | Official industry framework | Consent signal framework used by Google-certified CMP requirements. |

## 3. Current Phase 18A Mock System Summary

Phase 18A added:

- `mock` provider only
- optional Free-user review cooldown acceleration
- explicit opt-in and continue-without-ad UI
- 5-second mock modal
- server-side start/complete/cancel actions
- idempotent completion
- per-review cap of 2 accelerators
- daily cap of 6 accelerators
- JSON ledger in `VcReview.rawResponse.rewardedReviewAcceleration`

No production ad provider, SDK, tracking, consent platform, ATT prompt, cookies,
or production ad unit IDs are active.

## 4. Policy Requirements for Rewarded Ads

Policy claims in this section are based on Google Ad Manager rewarded ad
policies, official, accessed 2026-05-17.

- Rewards must be disclosed clearly and accurately before each rewarded ad.
- Rewarded ads must require affirmative, unambiguous opt-in.
- Users must be able to skip/dismiss or select a no/decline path.
- Skipping or declining must not block normal app usage.
- The promised reward must be delivered after the required ad action is
  completed.
- Direct monetary rewards are not allowed for Google-served rewarded ads.
- Non-monetary in-platform rewards are acceptable when non-transferable.

Founder Arena fit:

- Review cooldown acceleration is an in-platform convenience reward.
- It is not cash, transferable value, valuation, revenue, score, or leaderboard
  advantage.
- The existing "Continue Without Ad" path is required and should remain.

Required real-ad copy before every ad:

> Watch a rewarded sponsor video to reduce this review wait from 30 minutes to
> 15 minutes. Ads are optional. Skipping does not block your review.

Do not use manipulative copy such as "watch to support us" or "required to
continue."

## 5. Consent / GDPR / EEA / UK / Switzerland Requirements

Policy claims in this section use Google consent requirements, ICO cookie
guidance, European Commission data protection guidance, and IAB Europe TCF
materials; all official or regulator/industry framework sources, accessed
2026-05-17.

Google publisher products require a Google-certified CMP integrated with IAB TCF
for personalized ads to users in the EEA, UK, and Switzerland. Google states
that if those requirements are not met, publishers are not eligible to serve
personalized ads in those regions.

Implications for Founder Arena web:

- Do not load a real ad provider script before consent state is known for users
  who may be in regulated regions.
- Use a Google-certified CMP / TCF-compatible flow before personalized ads.
- Store a consent audit record with version, region, timestamp, mode,
  vendor/framework identifiers, and revocation timestamp if applicable.
- Provide a settings route to revoke or change consent.
- If consent is declined, use no ads or provider-supported limited/contextual
  ads only after legal/CMP review confirms the exact path.
- Disclose cookies/local storage/ad identifiers and third-party processing in
  the privacy policy.

Legal review required:

- Whether contextual/non-personalized rewarded ads can run without consent for
  each region/provider.
- Whether consent is required for frequency capping, fraud prevention, local
  storage, or provider SDK storage.
- Whether a consent wall or ad-supported access model is acceptable for Founder
  Arena. Current product direction should avoid consent walls.

## 6. Apple ATT / iOS Future Requirements

Policy claims in this section use Apple User Privacy and Data Use and App
Privacy Details, official, accessed 2026-05-17.

Apple requires ATT permission when an app uses third-party services that pass
unique identifiers or create a shared identity for tracking across apps and
websites for ad targeting, ad measurement, or data broker sharing. Apple also
requires App Privacy details that disclose data collected and whether it is
linked to the user or used for tracking.

Implications:

- Future iOS apps using AdMob/Unity/AppLovin SDKs must complete privacy label
  disclosures.
- ATT is likely required for personalized ads or cross-app/site tracking.
- Contextual/non-tracking ads may be possible without ATT, but the SDK's actual
  data behavior and Apple review guidance must be checked.
- Developers are responsible for third-party SDK behavior.
- Mobile apps need a consent/settings screen and a "no ads for paid users"
  boundary before launch.

## 7. Android / Google Play Requirements

Policy claims in this section use Google Play ads policy, Google Play Families
policy, and Google AdMob Android documentation, official, accessed 2026-05-17.

Google Play restricts disruptive ads but makes an explicit exception for
rewarded ads that users opt into. Rewarded ads must not be forced into core
simulation flow or shown unexpectedly.

Android implications:

- Use AdMob rewarded ads for native Android if mobile ships.
- Always test with test ad unit IDs during development; Google warns live
  production ads in testing can risk account suspension.
- If Founder Arena ever targets children or Families, Families ads policies and
  certified SDK requirements become relevant. Current product should be
  positioned for adults/founders, not children.
- COPPA review is needed if the product becomes child-directed or knowingly
  collects data from under-13 users.

## 8. Provider Comparison

| Provider | Web | iOS | Android | Rewarded support | Server verification | Consent fit | Complexity | Founder Arena fit | Risk |
|---|---:|---:|---:|---:|---:|---|---|---|---|
| Google Publisher Tag / Ad Manager | Yes | No native | No native | Yes | Web callbacks; server verification path must be designed per account/product | Strong Google CMP/TCF ecosystem | Medium | Best first web candidate | Medium |
| Google H5 Games Ads | Yes, application/approval path | Android WebView note only | Android WebView note only | Yes | Program-specific; confirm during approval | Google ecosystem | Medium-high | Candidate if Founder Arena is accepted as an H5 game | Medium-high |
| Google AdMob | Not primary web path | Yes | Yes | Yes | Official SSV | Google UMP/CMP ecosystem | Medium | Best future mobile default | Medium |
| Unity Ads | Weak for web app; Unity-centric | Yes | Yes | Yes | S2S callback options through Unity/LevelPlay | CMP integration requires design | Medium-high | Defer unless Unity/mobile build exists | Medium-high |
| AppLovin MAX | Not ideal for web app | Yes | Yes | Yes | S2S callback API | Requires CMP/mobile consent setup | High | Defer as mediation/mobile option | Medium-high |
| ironSource / LevelPlay | Not first web choice | Yes | Yes | Yes | S2S reward callbacks | Requires CMP/mobile consent setup | High | Defer as mediation layer | Medium-high |
| Chartboost / Liftoff / Mintegral | Mostly mobile/game network path | Yes | Yes | Usually yes | Varies | Requires vendor review | High | Defer until mobile ad strategy | High |

Recommendation:

- Web: Google Ad Manager/GPT rewarded ads first, or H5 Games Ads only if the
  product is accepted and the API better matches game moments.
- Mobile: AdMob rewarded ads first because the existing product already has
  Google-oriented policy references and SSV is documented.
- Defer mediation networks until inventory/revenue scale justifies complexity.

## 9. Recommended Web Provider Path

Use Google Publisher Tag / Google Ad Manager rewarded ads as the initial real web
provider candidate.

Reasons:

- Official GPT sample supports web rewarded ad lifecycle events:
  `RewardedSlotReadyEvent`, `RewardedSlotGrantedEvent`,
  `RewardedSlotClosedEvent`, and video-completed events.
- Google Ad Manager has explicit rewarded ad policies for disclosure, opt-in,
  decline path, and reward delivery.
- Consent requirements are well documented through Google's CMP/TCF ecosystem.

Implementation caveats:

- Do not trust client-side `RewardedSlotGrantedEvent` alone for valuable
  rewards.
- If no server-side verification is available for the web path/account, mark
  rewards as `completed_pending_verification` and use lower-value rewards, or do
  not launch real rewards until a secure verification path exists.
- Confirm Ad Manager account eligibility, web rewarded inventory availability,
  and whether H5 Games Ads is a better fit.

## 10. Recommended Mobile Provider Path

Use Google AdMob rewarded ads for future native iOS/Android.

Reasons:

- Official AdMob docs support rewarded ads on iOS and Android.
- AdMob supports server-side verification callbacks for completed rewarded ad
  views.
- Google UMP provides a mobile consent path for AdMob/Ad Manager.

Mobile prerequisites:

- App Store privacy labels.
- ATT review and implementation if tracking is used.
- Google Play ads policy review.
- Test ad unit usage during development.
- Separate mobile provider adapter from web provider adapter.

## 11. Consent Architecture

Recommended future interfaces:

```ts
type AdPersonalizationMode =
  | "unknown"
  | "denied"
  | "limited"
  | "non_personalized"
  | "personalized";

interface ConsentSnapshot {
  userId: string;
  region: "unknown" | "us" | "eea" | "uk" | "switzerland" | "other";
  mode: AdPersonalizationMode;
  cmpProvider: "none" | "google_certified_cmp_future" | "custom_future";
  tcfStringPresent: boolean;
  consentVersion: string;
  collectedAt: string;
  revokedAt?: string;
}
```

Required behavior:

- Default to `unknown`, not personalized.
- Gate real ad loading on consent status.
- Keep consent state separate from reward ledger.
- Provide a settings route for revocation.
- Avoid sending startup/game private data to CMP or ad providers.

## 12. Provider Adapter Architecture

Recommended future interface:

```ts
interface RewardedAdProviderAdapter {
  provider: "mock" | "google_gpt_web_future" | "admob_ios_future" | "admob_android_future";
  canLoad(input: { placement: string; consent: ConsentSnapshot }): Promise<boolean>;
  load(input: { placement: string; ledgerEntryId: string }): Promise<{ loadId: string }>;
  show(input: { loadId: string }): Promise<"shown" | "no_inventory" | "failed">;
  destroy(input: { loadId: string }): void;
}
```

Provider states:

- unavailable
- consent_required
- no_inventory
- loading
- ready
- showing
- completed_client
- completed_pending_verification
- rewarded
- failed

The active production provider should be configured server-side. The client
should never receive production secrets.

## 13. Reward Verification Architecture

Real rewards must remain server-authoritative.

Recommended flow:

1. Server creates ledger entry: `started`.
2. Client loads/shows ad using provider adapter.
3. Provider completion event marks client state as completed.
4. If SSV/webhook is available, provider calls server callback.
5. Server validates provider signature/payload, ledger ID, placement, user, cap,
   expiry, and replay state.
6. Server grants reward once and marks ledger `rewarded`.

If provider verification is unavailable:

- Do not grant high-value rewards from client callbacks alone.
- Consider only cosmetic/non-competitive rewards.
- Or keep mock mode until verification exists.

Idempotency:

- Ledger IDs must be single-use.
- Provider callbacks can arrive twice; repeated callbacks return success without
  applying a second reward.
- Completion actions must be rate-limited.

## 14. Fraud / Abuse Prevention

Risks:

- Client-forged completion.
- Replayed ledger IDs.
- Multiple tabs starting concurrent sessions.
- Daily cap bypass through refresh/retry.
- Provider callback spoofing.
- Automated reward farming.

Controls:

- Server-generated ledger IDs and idempotency keys.
- Server-side caps by user, review, placement, and day.
- Pending-session reservation counts against per-review cap.
- Short ledger expiry window.
- SSV/webhook signature verification where available.
- Rate limits on start and complete.
- Device/session risk logging without invasive fingerprinting unless reviewed.
- Audit trails for suspicious reward velocity.
- Do not expose reward values or cap logic as client-trusted inputs.

## 15. Product UI Requirements

Before every real ad:

- Show exact reward.
- Show exact action required.
- Show optional nature.
- Show continue-without-ad path.
- Show "no inventory" fallback if no ad is available.
- Do not imply the ad is required.
- Do not imply real sponsor endorsements.

Ad failure:

- Do not punish the user.
- Keep original review timer.
- Offer retry only within rate limits.
- Offer Pro/Max upgrade as an ad-free convenience option.

User closes ad:

- No reward unless provider confirms completion.
- Normal usage continues.

Server completion failure:

- Keep ledger `completed_pending_verification` or `failed`.
- Provide retry/reconcile path.
- Never grant twice.

## 16. Data Minimization Rules

Never send to ad providers:

- pitch deck text
- financial plan
- private founder notes
- user email unless provider account requirements explicitly require and legal
  approves
- startup cash, valuation, burn, runway, or internal scoring
- private investor/boardroom/rival state
- raw AI prompts or generated private review text

Allowed provider context:

- placement ID
- coarse product context, such as `review_queue_acceleration`
- ledger ID or opaque custom data token
- coarse consent mode
- non-sensitive user pseudonymous ID only if required for SSV and privacy review
  approves

## 17. Pro / Max No-Ads Boundary

Paid users should not see rewarded ad offers by default.

Rules:

- Pro/Max remain ad-free convenience plans.
- Free users may use optional rewards within caps.
- Review acceleration remains Free-only because Pro/Max already remove review
  cooldowns.
- Any future rewarded placement must be non-competitive and capped globally.
- Ads must not affect startup outcomes, leaderboard, valuation, cash, risk,
  investor score, funding decisions, death checks, or career scoring.

## 18. Phase 18C Implementation Recommendation

Recommended next phase:

Phase 18C — Consent & Provider Interface Foundation

Scope:

- Add TypeScript interfaces for consent snapshots and provider adapters.
- Add server-side consent state model or JSON placeholder.
- Add user-facing privacy/ad settings route.
- Keep `mock` as the only active provider.
- Add no real SDKs.
- Add no real ad unit IDs.
- Add tests for consent gating, provider state transitions, and Pro/Max no-ads.

Do not integrate GPT/Ad Manager until consent and legal review are complete.

Phase 18C status:

- Implemented the consent/provider interface foundation.
- Mock remains the only active provider.
- Real Google GPT and AdMob adapters are still disabled/unsupported stubs.
- Added `/settings/ads` as an Ad Privacy / Rewards Settings surface.
- Added safe context/data minimization helpers.
- No CMP, ATT prompt, tracking, cookies, production ad units, or real SDKs were added.

Phase 18D status:

- Added server-side ad privacy settings and a compact consent/settings audit ledger.
- Reused existing `QueuedAction` JSON fields to avoid a premature schema migration.
- `/settings/ads` now reads and updates persisted account settings.
- Mock rewarded offers can be disabled/enabled persistently.
- Real providers remain blocked by default.
- No CMP, ATT prompt, tracking, cookies, production ad units, provider callbacks, or real SDKs were added.

## 19. What Not To Implement Yet

Do not implement:

- Google GPT or Ad Manager scripts
- H5 Games Ads API
- AdMob SDK
- Unity/AppLovin/LevelPlay SDKs
- production ad unit IDs
- CMP SDK
- ATT prompt
- cookies/tracking tags
- analytics SDKs
- provider sponsorship copy
- client-only reward grants
- real mobile ads

## 20. Open Legal / Product Questions

Legal/counsel review:

- Exact GDPR/ePrivacy consent basis for rewarded ads by region.
- Whether limited/contextual ads can be served without consent for chosen
  provider.
- Whether the product needs age-gating or under-13 exclusion.
- Privacy policy updates for ad providers and consent storage.
- App Store privacy label details for future iOS.
- ATT prompt copy and timing if mobile uses tracking.
- Google Play Data Safety form details for Android.

Product review:

- Whether ads should be fully hidden for Pro/Max or visible only in settings.
- Whether daily cap should be global across future placements.
- Whether "sponsor video" wording is acceptable before real sponsors exist.
- Whether no-inventory should offer a speed-token upsell or only wait normally.
- Whether real ads belong in investor demos at all; recommendation: no.
