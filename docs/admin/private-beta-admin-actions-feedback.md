# Private Beta Admin Actions and Feedback

Phase 21B adds the minimum operational controls needed before inviting friends into Founder Arena private beta.

The scope is intentionally narrow:

- protected queue actions for AI review jobs
- admin audit entries for every queue mutation
- private tester feedback capture
- feedback inbox inside `/admin/private-beta`
- no gameplay formula changes
- no raw prompt or pitch inspection

## Admin Queue Actions

Admin actions are available only on `/admin/private-beta` after normal auth and server-side `ADMIN_EMAILS` / `ADMIN_USER_IDS` checks.

### Retry Failed Review Job

Allowed for:

- `failed`
- `retrying`
- already `queued` as an idempotent no-op

Behavior:

- moves the existing `aiReview` QueuedAction back to `queued`
- clears worker lock fields
- clears retry delay and safe error
- increases `maxAttempts` only enough to make a manual retry possible
- does not create a duplicate job
- does not create or modify a VC review directly
- writes an admin audit entry

Completed jobs cannot be retried.

### Reclaim Stale Running Job

Allowed for:

- `running` jobs whose worker lock is stale under the existing review-queue stale-lock rule
- already reclaimed lock-expiry jobs as an idempotent no-op

Behavior:

- uses the existing stale-lock transition logic
- moves the job to `retrying` or `failed` depending on attempts
- clears worker lock fields
- records a safe lock-expiry error
- writes an admin audit entry

Fresh running jobs are rejected to avoid racing a healthy worker.

### Cancel Review Job

Allowed for:

- `queued`
- `running`
- `retrying`
- `failed`
- already `cancelled` as an idempotent no-op

Behavior:

- marks the existing job as `cancelled`
- clears worker lock and retry delay fields
- keeps the job for auditability
- does not delete startup, pitch, or review data
- writes an admin audit entry

Completed jobs cannot be cancelled.

## Admin Audit Log

Admin actions are stored as compact `QueuedAction` records with action type:

```text
adminBetaAudit
```

Audit payloads include:

- admin user id
- action type
- target type
- target id
- previous status
- next status
- safe reason
- allowlisted metadata
- timestamp

Audit payloads intentionally exclude:

- raw prompts
- pitch text
- provider payloads
- API keys
- secrets
- auth/session tokens
- user email
- billing data

The dashboard displays recent actions with masked identifiers and status transitions.

## Beta Feedback Capture

Feedback is stored as private `QueuedAction` records with action type:

```text
betaFeedback
```

Supported feedback types:

- `ai_review_quality`
- `bug_report`
- `gameplay_balance`
- `confusing_ui`
- `referral_issue`
- `other`

AI review quality categories include:

- review too harsh
- review too generous
- explanation unclear
- rejection reason wrong
- score seems inconsistent
- term sheet missing or wrong
- provider output broken
- other

Feedback fields:

- user id
- startup id when owned by the user
- review id when owned by the user
- type
- category
- optional 1-5 rating
- sanitized message
- status
- safe context
- timestamp

Safe context can include route, startup id, review id, final decision, score, and provider name. It does not include raw prompts or pitch text.

## Review Quality Workflow

When a tester reports a review:

1. The feedback is stored privately.
2. The user sees a confirmation.
3. The review decision is not changed.
4. The job is not automatically re-run.
5. Admins can inspect the feedback inbox later.
6. Future rubric changes should be made through tests and calibration fixtures, not one-off mutation.

This keeps feedback useful without creating hidden manual outcome changes.

## Rate Limits and Abuse Guardrails

Phase 21B uses account-level guardrails only:

- feedback requires auth
- feedback messages are capped at 2000 characters
- HTML/control characters are stripped
- users are capped at 5 feedback submissions per hour
- startup/review ids are accepted only when owned by the submitter
- admin queue actions are admin-only and audited

No IP tracking, device fingerprinting, analytics SDKs, or telemetry SDKs are added.

## Admin Dashboard Additions

`/admin/private-beta` now includes:

- queue action buttons for eligible jobs
- recent admin audit entries
- feedback inbox with open count
- recent feedback rows with masked ids
- type/category/rating/status
- safe message preview

The dashboard still excludes raw provider payloads, prompts, pitch text, secrets, private emails, and billing details.

## What Did Not Change

Phase 21B does not change:

- review rubric thresholds
- DeepSeek provider behavior
- review queue reward/cooldown logic
- referral reward rules
- weekly submission limits
- gameplay math
- scoring
- death conditions
- funding formulas
- leaderboard/career formulas

It also does not add cash payouts, crypto, gift cards, KYC, tax forms, real ads, CMP, ATT, tracking, analytics, payment SDKs, or client-side DeepSeek calls.

## Future Roadmap

If private beta volume grows, consider:

- dedicated `AIReviewJob` table
- dedicated `BetaFeedback` table
- feedback status mutations with audit
- admin QA dashboard for review calibration
- live DeepSeek calibration smoke runner
- safer admin bulk operations with confirmation
