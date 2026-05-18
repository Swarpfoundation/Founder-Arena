# Rewarded Review Acceleration v0.1

Phase 18A adds a mock-only foundation for optional rewarded advertising. It does
not integrate a real ad provider, SDK, tracking pixel, consent manager, ATT
prompt, CMP, or live sponsor inventory.

Private beta note: Phase 19A pauses real ads work while Founder Arena validates
DeepSeek-powered VC reviews with friends. The mock rewarded acceleration system
remains intact, but deployments can hide rewarded placements with
`ADS_DISABLED=true` or `REWARDED_ADS_ENABLED=false`.

## Monetization Philosophy

Founder Arena's primary monetization remains Pro and Max subscriptions. Paid
plans remove review cooldown friction and add convenience quota, but they do not
improve startup cash, revenue, valuation, risk, investor score, leaderboard
score, or final outcome.

Free users may optionally use mock rewarded sponsor videos to reduce VC review
cooldown time. This is a convenience reward only.

Allowed reward in v0.1:

- Review Queue Accelerator

Disallowed rewarded-ad outcomes:

- Revenue, valuation, cash, investor score, market score, or risk changes
- Better VC decisions or guaranteed term sheets
- Leaderboard advantage
- Death prevention
- Unlimited AI reviews

## Mock Provider Design

The provider is always `mock`. Ledger entries are stored server-side in the
review's `rawResponse.rewardedReviewAcceleration` JSON state.

Each ledger entry records:

- provider and placement
- reward type
- status
- before/after ready times
- timestamps
- idempotency key
- `mockMode: true`

The client can only submit stable identifiers such as `startupId`, `reviewId`,
and `ledgerEntryId`. The server recomputes eligibility, caps, and reward effect.

Phase 18C routes the mock flow through the rewarded ad provider adapter
interface. The mock adapter is the only active provider. Future Google GPT web
and AdMob mobile adapters exist only as disabled/unsupported stubs until consent,
legal review, and provider verification are complete.

## Acceleration Rules

The current implementation accelerates the existing review cooldown:

- First rewarded accelerator moves the wait toward 15 minutes.
- Second rewarded accelerator moves the wait toward 5 minutes.
- Maximum 2 rewarded accelerators per review cooldown.
- Daily cap: 6 rewarded accelerators.
- Rewards cannot make waits negative.
- Rewards cannot reduce below the minimum review-ready time.
- Repeated completion calls are idempotent and do not apply multiple rewards.

If the remaining wait is already below the current accelerator tier, the reward
is not offered.

## Free vs Pro/Max

Free users can see the optional mock reward offer when a VC review cooldown is
active and the reward would reduce the wait.

Pro and Max users do not need the ad path because their plans remove review
cooldowns. The UI should route them toward subscription convenience rather than
rewarded ads.

## User Experience Requirements

The offer must disclose the reward before starting:

> Watch a rewarded sponsor video to reduce this review wait from 30 minutes to
> 15 minutes. Ads are optional. Skipping does not block your review.

The mock modal must clearly say:

- Mock rewarded sponsor video
- No real ad network
- No tracking
- No real sponsor inventory

The user always has a continue-without-ad or cancel path.

## Future Provider Integration

Real rewarded ads require a separate privacy and consent phase before any SDK is
added. That phase must cover:

- Provider selection and verification callbacks
- Server-side reward validation
- Fraud and replay protection
- GDPR/EEA CMP requirements
- iOS ATT requirements if mobile apps exist
- Privacy policy and consent copy
- Age-appropriate ad policy review

Do not add live provider calls or real sponsor claims until that work is done.

Current privacy surface:

- `/settings/ads` explains mock-only status, real-provider blocking, Pro/Max
  ad-free boundaries, and data minimization rules.
- Authenticated users can persistently hide or re-enable mock reward offers.
- A browser-local mock preference remains only as fallback/sync behavior.
- Mock preferences are not legal ad consent and are not a CMP substitute.

## Anti-Pay-To-Win Boundary

Rewarded ads are allowed only for convenience and presentation rewards. They
must never improve competitive startup outcomes or leaderboard performance.
