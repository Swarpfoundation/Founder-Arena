# Private Beta Ops Dashboard

Phase 21A added a read-only admin dashboard for monitoring Founder Arena private beta operations. Phase 21B adds minimal protected queue actions, admin audit entries, and a beta feedback inbox.

Route:

```text
/admin/private-beta
```

The dashboard is intentionally compact and safe. It helps the founder inspect DeepSeek review queue health, perform safe job recovery actions, review referral activity, monitor weekly submission usage, triage tester feedback, and verify private beta environment readiness before inviting more testers.

## Admin Access Setup

Configure one or both server-side env vars:

```bash
ADMIN_EMAILS=founder@example.com,ops@example.com
ADMIN_USER_IDS=user_id_1,user_id_2
```

Rules:

- route is protected by normal auth middleware
- helper also checks admin email/user id server-side
- if no admin env is configured, the page shows a safe denied state
- normal users cannot view operational data

## Panels

### Review Queue Health

Shows:

- queued jobs
- running jobs
- retrying jobs
- failed jobs
- completed jobs in the last 24h
- oldest queued job age
- stale running job count
- recent job safe metadata

Recent job rows include masked job/startup ids, status, provider, mode, attempts, queued timestamp, processed timestamp, and safe error category.

Eligible rows expose protected admin actions:

- retry failed/retrying job
- reclaim stale running job
- cancel queued/running/retrying/failed job

Every mutation is admin-gated, idempotent, non-destructive, and written to the admin audit log.

### Admin Audit

Shows recent queue actions with masked admin/target ids, action type, target type, previous status, next status, reason, and timestamp.

Audit entries never include raw prompts, pitch text, provider payloads, API keys, auth/session data, private email, or billing data.

### Feedback Inbox

Shows private beta feedback submitted by testers:

- open feedback count
- type/category/rating/status
- masked user/startup/review ids
- safe message preview
- decision, score, provider when supplied by the feedback form

Feedback is private to admins and does not automatically change review decisions, term sheets, scores, or gameplay state.

### Referral Overview

Shows:

- total referral codes
- total attributions
- successful referrals
- rejected referrals
- pending attributions
- Founder Points granted
- submission credits granted/spent
- top referrers by masked id

### Referral Abuse Signals

Warning-only signals:

- many attributions from one code in 24h
- repeated rejected attributions
- fast submission-credit earning
- heavy submission-credit spending
- duplicate reward idempotency keys

No IP tracking, device fingerprinting, or invasive analytics are used.

### Weekly Submission Usage

Shows:

- current UTC calendar-week window
- total reviews submitted this week
- Free users near cap
- Free users at/over cap
- credits spent this week
- Pro/Max bypass count
- top users by submissions with masked ids

### Private Beta Readiness

Shows:

- `AI_REVIEW_ENABLED`
- `AI_REVIEW_PROVIDER`
- `AI_REVIEW_MODE`
- DeepSeek key presence as boolean only
- accidental `NEXT_PUBLIC_DEEPSEEK_API_KEY` presence as boolean only
- `ADS_DISABLED`
- `REWARDED_ADS_ENABLED`
- review timeout and max attempts
- queue inspect / worker command reminders

## Safe Data Rules

Never shown:

- DeepSeek API key
- env secret values
- raw prompt text
- full pitch deck text
- raw provider logs
- raw provider payloads
- auth/session tokens
- billing data
- private emails in tables
- ad provider data

Allowed:

- masked ids
- statuses
- timestamps
- counts
- safe error categories
- provider/mode names
- plan ids
- boolean key presence

## Review Queue Monitoring

Before inviting testers:

1. Confirm `AI_REVIEW_ENABLED=true`.
2. Confirm intended provider/mode.
3. Confirm DeepSeek key is present only server-side.
4. Confirm no public DeepSeek key is present.
5. Submit one review.
6. Watch queued/running/completed counts.
7. If using worker mode, verify `npm run review:worker:once`.
8. Confirm failed jobs expose only safe error categories.

Phase 22A also adds `npm run review:deepseek:smoke` for a synthetic live DeepSeek provider check before using real friend pitches.

## Referral Abuse Review

Before expanding referral rewards:

1. Check top referrers.
2. Check referral spike warnings.
3. Check repeated rejected attribution warnings.
4. Check fast credit earning.
5. Check heavy credit spend.
6. Manually review only account-level data already present in the app.

Do not add IP/device fingerprinting without privacy/legal review.

## Weekly Submission Usage Review

Use the weekly panel to confirm:

- Free users can hit the 3-review weekly cap.
- Credits are being spent as expected.
- Pro/Max bypass count is visible.
- Top submitters are not creating extreme review load.

## Admin Actions v0.1

Phase 21B implements only review queue recovery actions:

- retry failed AI review job
- reclaim stale running job
- cancel stuck/invalid queued review job

These actions mutate only the existing `aiReview` QueuedAction state. They do not delete jobs, create duplicate reviews, alter review decisions, or mutate gameplay math.

Deferred actions:

- disable referral code
- reject attribution
- mark feedback reviewed/resolved/ignored
- bulk queue actions

## What Is Intentionally Not Added

- public admin routes
- analytics SDKs
- telemetry SDKs
- cash payouts
- crypto/token payouts
- gift cards
- KYC/tax flows
- real ads
- CMP/ATT/tracking
- client-side DeepSeek calls
- raw prompt/pitch inspection
