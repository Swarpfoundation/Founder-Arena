# DeepSeek Private Beta Review Queue

Phase 19A adds a private-beta AI review pipeline for Founder Arena. It keeps Vercel as the default web host, adds a worker-ready queue path for Render, and keeps the existing mock review fallback intact.

This is not an ads phase. Real ads, CMPs, ATT prompts, tracking, and production ad units remain deferred.

## Architecture

| Layer | Files | Purpose |
| --- | --- | --- |
| Provider abstraction | `lib/ai-review/provider.ts`, `lib/ai-review/providers/*` | Select mock or DeepSeek without spreading provider logic through actions. |
| Queue layer | `lib/ai-review/review-queue.ts` | Stores review jobs in existing `QueuedAction` records with deterministic status payloads. |
| Persistence service | `lib/ai-review/review-service.ts` | Builds safe review input, calls the configured provider, validates output, and writes `VcReview`. |

`QueuedAction` is used for v0.1 to avoid schema churn during private beta. A dedicated `AIReviewJob` table can be added later if review volume grows.

## Direct Vercel Mode

Use direct mode for the founder and a few friends:

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=deepseek
AI_REVIEW_MODE=direct
AI_REVIEW_FALLBACK_TO_MOCK=true
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
```

In direct mode, the server action calls DeepSeek from the server, validates the JSON response, writes the review, and redirects to the review page. The request uses a timeout and can fall back to mock if configured.

## Worker-Ready Mode

Use queued worker mode when several testers may submit reviews close together:

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=deepseek
AI_REVIEW_MODE=queued_worker
AI_REVIEW_FALLBACK_TO_MOCK=true
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
```

The server action enqueues one active job per startup. The review page shows `queued`, `running`, `retrying`, `completed`, or `failed` state. A worker later claims jobs, calls the provider, writes `VcReview`, and marks the job complete.

## Weekly Submission Limits

Phase 20A limits Free users to 3 VC review submissions per UTC calendar week. Pro and Max bypass the weekly Free cap. Referral submission credits can let Free users submit after the weekly cap, and credits are consumed only after a review submission/job creation succeeds. Provider retries do not consume extra quota.

## Worker Commands

```bash
npm run review:check-env
npm run review:queue:inspect
npm run review:worker:once
npm run review:worker
```

`review:check-env` validates provider mode, key presence, worker env requirements, and ad-paused flags without printing secrets. `review:queue:inspect` prints counts and safe job metadata only. `review:worker:once` processes at most one queued job and exits. `review:worker` polls until stopped.

## Render Worker Setup

1. Create a Render Background Worker.
2. Use the same repository and branch as the Vercel app.
3. Set build command to `npm install`.
4. Set start command to `npm run review:worker`.
5. Add the same database and auth environment variables as Vercel.
6. Add only server-side AI variables:

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=deepseek
AI_REVIEW_MODE=queued_worker
AI_REVIEW_FALLBACK_TO_MOCK=true
AI_REVIEW_MAX_ATTEMPTS=3
AI_REVIEW_TIMEOUT_MS=25000
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

Do not add DeepSeek keys to any client-exposed `NEXT_PUBLIC_*` variable.

Before inviting testers, use the copy-paste checklist in `docs/ai-review/private-beta-deployment-hardening.md`.

## Review Status Lifecycle

| Status | Meaning |
| --- | --- |
| `queued` | Job is waiting for a worker. |
| `running` | Worker claimed the job and is generating the review. |
| `retrying` | Provider failed in a retryable way; worker will try again after backoff. |
| `completed` | `VcReview` was written. |
| `failed` | Max attempts were exhausted or the job was invalid. |
| `cancelled` | Reserved for future admin/user cancellation. |

## Retry And Failure Behavior

- Provider timeouts, rate limits, invalid JSON, and 5xx-style failures are retryable.
- Default max attempts: `3`.
- Backoff starts around 30 seconds and caps at 15 minutes.
- Stale `running` worker locks are reclaimed and retried when attempts remain.
- Missing provider configuration falls back to mock only when `AI_REVIEW_FALLBACK_TO_MOCK=true`.
- The app never fakes DeepSeek success. Fallback reviews are marked in `rawResponse.privateBetaAIReview`.

## Data Minimization

Sent to DeepSeek:

- startup name
- sector
- region
- stage
- classification when available
- funding ask
- monetization model
- pitch deck fields needed for review

Not sent:

- user email
- auth/session details
- billing data
- ad reward ledger
- internal cash, burn, runway, valuation, and score fields
- secrets or environment values
- raw provider logs

The safe input builder lives in `lib/ai-review/safe-input.ts`.

## Private Beta Guardrails

| Variable | Purpose |
| --- | --- |
| `AI_REVIEW_ENABLED` | Main kill switch. When not `true`, legacy review behavior remains. |
| `AI_REVIEW_PROVIDER` | `mock` or `deepseek`. |
| `AI_REVIEW_MODE` | `direct`, `queued_worker`, or `mock`. |
| `AI_REVIEW_FALLBACK_TO_MOCK` | Allows mock fallback when DeepSeek fails or is missing. |
| `AI_REVIEW_MAX_DAILY_PER_USER` | Private beta daily review cap. |
| `AI_REVIEW_MAX_ATTEMPTS` | Queue retry cap. |
| `AI_REVIEW_TIMEOUT_MS` | Provider request timeout. |
| `AI_REVIEW_TEMPERATURE` | Low-temperature review generation setting. Default `0.2` keeps rubric judgments consistent. |
| `DEEPSEEK_API_KEY` | Server-only DeepSeek key. |
| `DEEPSEEK_MODEL` | Model override. |
| `DEEPSEEK_BASE_URL` | Base URL override. |
| `ADS_DISABLED` | Optional private-beta ad placement hide switch. |

## Review Quality Rubric

Phase 19C adds deterministic VC decision guardrails on top of provider output. DeepSeek can recommend accept, conditional, or reject, but the final decision is checked against score thresholds, missing-information rules, funding-ask plausibility, prompt-injection detection, and required explanation fields.

The normalized review stores `reviewQuality` in `VcReview.rawResponse`, including dimension evidence, concerns, final decision, model recommendation, rule reasons, and quality flags. Rejected startups do not receive misleading term sheets. See `docs/ai-review/vc-review-quality-rubric.md` for the full rubric and golden calibration fixture list.

## No-Ads Decision

Rewarded ads remain mock-only and can be hidden during private beta with:

```bash
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

This does not remove mock ad code. It keeps private beta testing focused on real AI/VC review quality.

## Local Testing Flow

1. Set `AI_REVIEW_ENABLED=true`.
2. Start with `AI_REVIEW_PROVIDER=mock` and `AI_REVIEW_MODE=direct`.
3. Submit a pitch and verify the review still completes.
4. Switch to `AI_REVIEW_PROVIDER=deepseek` with `DEEPSEEK_API_KEY`.
5. Test direct mode with one startup.
6. Switch to `AI_REVIEW_MODE=queued_worker`.
7. Submit a pitch, open the review page, and confirm queued status.
8. Run `npm run review:worker:once`.
9. Refresh the review page.

## Known Limitations

- Queue storage uses `QueuedAction`, not a dedicated review job table.
- Weekly review usage and referral credits use existing `UsageLedger` and compact `QueuedAction` ledgers instead of dedicated referral tables.
- There is no admin queue dashboard yet.
- Direct mode depends on Vercel function timing and should be kept to small private beta volume.
- Provider usage/cost metadata is stored only if the provider returns it.
- Existing non-review AI features still use the older `lib/ai` provider resolver.

## Kill Switch

```bash
AI_REVIEW_ENABLED=false
```

The app returns to the existing review path.
