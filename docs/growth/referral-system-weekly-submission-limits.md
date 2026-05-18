# Referral System + Weekly Submission Limits

Phase 20A adds private-beta growth loops without cash payouts or pay-to-win rewards.

The system limits Free users around VC review submission, not startup drafting. It also gives each founder a referral link that awards non-cash Founder Points and extra VC review submission credits when a referred founder joins.

## Product Rules

Allowed rewards in v0.1:

- Founder Points
- VC review submission credits
- future cosmetic/profile badges

Disallowed rewards:

- cash
- crypto
- gift cards
- withdrawable balances
- marketplace credits with monetary value
- valuation, revenue, investor score, risk score, leaderboard score, VC-decision, death-prevention, or funding-quality boosts

Founder Points have no cash value. Submission credits are convenience rewards only.

## Weekly Review Submission Limit

Founder Arena uses a UTC calendar-week window from Monday 00:00 UTC to the following Monday 00:00 UTC.

| Plan | VC Review Submissions |
| --- | --- |
| Free | 3 per calendar week |
| Pro | Unlimited |
| Max | Unlimited |

Free users can still create startup drafts. The quota applies when submitting a startup for VC review.

Submission credits let Free users submit after the weekly cap. Credits are consumed only when the review submission succeeds:

- queued-worker mode: after a review job is created
- direct mode: after a review is generated and stored
- legacy/mock path: after the review is created

Provider retries do not consume more credits. Re-submitting the same active queued job is blocked by the review queue.

## Submission Credit Storage

Submission credits are stored as compact non-cash reward ledger entries in existing `QueuedAction` records:

- action type: `referralReward`
- type: `submission_credit`
- positive amount: earned credit
- negative amount: spent credit
- idempotency key: prevents duplicate grants/spends

The available balance is computed from the ledger. Credits do not modify cash, valuation, score, revenue, investor score, risk score, funding quality, or leaderboard outcome.

## Referral Codes

Each user gets one stable referral code generated server-side from a hash of the user id:

- short and shareable
- does not expose email or user id
- not an auth secret
- stable unless a future regeneration feature is added

Referral links use:

```text
/r/CODE
```

The public `/r/[code]` route stores a short-lived HTTP-only referral cookie and redirects to sign-in.

## Attribution Flow

1. Visitor opens a referral link.
2. App stores the referral code in `fa_referral_code`.
3. User signs in.
4. Dashboard/referrals page attempts server-side attribution.
5. Server validates code, self-referral, existing attribution, and reward idempotency.
6. Both users receive signup rewards.

v0.1 rewards immediately after authenticated attribution:

| Recipient | Reward |
| --- | --- |
| Referrer | 100 Founder Points + 1 VC review submission credit |
| Referred founder | 100 Founder Points + 1 VC review submission credit |

First-review referral bonus is deferred until more beta abuse data exists.

## Anti-Abuse Guardrails

- self-referral rejected
- one referrer per user
- signup reward idempotent per referred user
- reward ledger idempotency keys
- no client-trusted reward amounts
- no cash value
- no gameplay stat impact
- no invasive IP/device fingerprinting in v0.1

Future admin review can add suspicious-pattern tools before any higher-value rewards exist.

Phase 21A adds the first read-only admin review surface at `/admin/private-beta`. It shows referral counts, top masked referrers, duplicate reward key warnings, referral spikes, and heavy credit usage without IP/device fingerprinting.

## UI

Referral dashboard:

- `/referrals`
- referral code and link
- copy-link button
- points, credits, signups, qualified referrals
- reward ledger
- no-cash-value disclaimer

Pitch submission UI:

- weekly submissions remaining
- reset date
- submission credits available
- upgrade CTA when capped
- referral CTA when capped

## Privacy / Data Minimization

Referral ledgers store only account ids, code, reward type, amount, reason, timestamps, idempotency keys, and safe metadata.

They do not store pitch text, VC review text, startup financials, cash, burn, runway, valuation, internal scores, auth provider tokens, payment details, IP addresses, or device fingerprints.

## Future Work

- referral abuse dashboard
- referral milestone badges
- first-review qualification reward if abuse remains low
- admin manual adjustments
- referral invite landing page

Cash payouts, crypto, gift cards, and KYC/tax workflows remain intentionally deferred.

## Private Beta Checklist

- Create a referral link from `/referrals`.
- Open it in a private browser.
- Sign in as a different test user.
- Confirm both users receive points and one submission credit.
- Confirm the referred user cannot be attributed to a second referrer.
- Submit three Free VC reviews in one calendar week.
- Confirm the fourth is blocked without credits.
- Confirm one credit allows the fourth submission.
- Confirm Pro/Max bypass the weekly cap.
