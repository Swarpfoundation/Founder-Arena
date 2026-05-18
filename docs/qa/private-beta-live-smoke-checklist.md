# Private Beta Live Smoke Checklist

Phase 22A verifies the private-beta launch path before inviting friends.

This is a deployment QA checklist. It does not add gameplay systems, real ads, AWS, analytics, telemetry, or payment integrations.

## Current Phase 22A Smoke Results

Date: 2026-05-18

Verified locally with `.env` loaded:

- `npm run review:check-env`: passed with server-side DeepSeek key present, no `NEXT_PUBLIC_DEEPSEEK_API_KEY`, ads hidden.
- `npm run review:queue:inspect`: passed after CLI server-only fix; queue was empty.
- `npm run review:worker:once`: passed; worker exited safely with `idle`.
- `npm run review:deepseek:smoke`: passed; live DeepSeek returned a valid normalized review for a synthetic pitch.

Live DeepSeek smoke safe summary:

```json
{
  "ok": true,
  "provider": "deepseek",
  "model": "deepseek-chat",
  "decision": "conditional",
  "modelRecommendation": "conditional",
  "overallScore": 55,
  "qualityFlags": [],
  "usagePresent": true
}
```

The smoke script does not print prompts, pitch text beyond the synthetic test fixture, API keys, raw provider payloads, or secrets.

## Preflight Env

Required private-beta settings:

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=deepseek
AI_REVIEW_MODE=queued_worker
AI_REVIEW_FALLBACK_TO_MOCK=true
AI_REVIEW_MAX_ATTEMPTS=3
AI_REVIEW_TIMEOUT_MS=25000
AI_REVIEW_TEMPERATURE=0.2
DEEPSEEK_API_KEY=server-side-only
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
ADMIN_EMAILS=founder@example.com
```

Never configure:

```bash
NEXT_PUBLIC_DEEPSEEK_API_KEY
```

Run:

```bash
set -a; source .env; set +a; npm run review:check-env
```

Expected:

- env check OK
- DeepSeek key present as boolean only
- no public DeepSeek key
- ads hidden

## Mock Direct Smoke

Use for baseline:

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=mock
AI_REVIEW_MODE=direct
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

Manual deployed app steps:

1. Sign in as founder test account.
2. Create a test startup.
3. Fill pitch.
4. Submit VC review.
5. Confirm review completes without DeepSeek key dependency.
6. Confirm review UI renders rubric fields.
7. Confirm no rewarded ad offer appears.
8. Confirm `/admin/private-beta` shows no queue failures.

Status in Phase 22A: covered by existing unit tests and env smoke; deployed UI flow remains manual.

## DeepSeek Direct Smoke

Use only for founder-only or tiny friend testing:

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=deepseek
AI_REVIEW_MODE=direct
AI_REVIEW_FALLBACK_TO_MOCK=true
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

Automated safe provider check:

```bash
set -a; source .env; set +a; npm run review:deepseek:smoke
```

Expected:

- returns `ok: true`
- provider is `deepseek`
- decision is valid
- score is valid
- no API key printed
- no raw provider payload printed

Manual deployed app steps:

1. Submit one real review from Vercel direct mode.
2. Confirm browser never receives key.
3. Confirm completed review shows final decision, model recommendation, dimension evidence/concerns, and rationale.
4. Confirm fallback is marked if used.
5. Confirm failed provider response shows safe user copy.

Status in Phase 22A: live provider smoke passed; deployed Vercel direct UI smoke remains manual.

## Queued Worker Smoke

Use for friend testing:

```bash
AI_REVIEW_MODE=queued_worker
```

Safe local queue commands:

```bash
set -a; source .env; set +a; npm run review:queue:inspect
set -a; source .env; set +a; npm run review:worker:once
```

Expected:

- queue inspect prints counts and safe job metadata only
- worker once processes one job or exits with `idle`
- no prompt text, API keys, or provider payloads printed

Manual deployed app steps:

1. Submit one queued review.
2. Confirm review page shows `queued`.
3. Confirm admin dashboard shows queued job.
4. Run worker once.
5. Confirm job becomes completed, retrying, or failed safely.
6. Confirm review page updates.

Status in Phase 22A: queue inspect and worker once passed against an empty queue; real queued job processing remains manual.

## Render Worker Smoke

Render manual checklist:

1. Confirm Render Background Worker env matches Vercel database/auth env.
2. Confirm server-only DeepSeek vars are set.
3. Confirm no `NEXT_PUBLIC_DEEPSEEK_API_KEY`.
4. Start worker with:

```bash
npm run review:worker
```

5. Submit one queued review from Vercel.
6. Watch Render logs for safe output only.
7. Confirm job completes or retries safely.
8. Stop worker or roll back if needed.

Status in Phase 22A: Render access was not available in this workspace, so live Render verification is pending.

## Admin Dashboard Smoke

Manual deployed app steps:

1. Visit `/admin/private-beta` as non-admin and confirm denial.
2. Visit as configured admin and confirm access.
3. Confirm queue health panel loads.
4. Confirm referral panel loads.
5. Confirm weekly submission panel loads.
6. Confirm env readiness masks secrets.
7. Confirm no raw prompt or private pitch text appears.
8. Confirm audit and feedback panels load.

Status in Phase 22A: dashboard code and tests pass; deployed auth-path smoke remains manual.

## Admin Action Smoke

Use test/safe jobs only.

Expected:

- failed/retrying job can be retried
- stale running job can be reclaimed
- queued/running/retrying/failed job can be cancelled
- completed job cannot be retried/cancelled
- every mutation creates an audit entry
- repeated safe actions do not duplicate jobs or reviews

Status in Phase 22A: helper tests cover transitions and audit payloads; live job action smoke requires test jobs and remains manual.

## Feedback Smoke

Manual deployed app steps:

1. Open a completed review.
2. Click `Report review quality`.
3. Submit a short message.
4. Confirm user sees success.
5. Confirm `/admin/private-beta` feedback inbox shows the report.
6. Confirm review decision did not change.
7. Confirm no raw prompt/private pitch text appears.

Status in Phase 22A: tests cover safe payloads and summaries; deployed UI submission remains manual.

## Referral and Weekly Limit Smoke

Manual deployed app steps:

1. Open `/referrals` and copy a referral link.
2. Visit `/r/[code]`.
3. Confirm referral capture path continues to signup/auth.
4. Submit reviews as a Free user until 3 weekly submissions are used.
5. Confirm the 4th Free submission is blocked unless credits are available.
6. Confirm a submission credit is consumed once.
7. Confirm Pro/Max bypass remains active.

Status in Phase 22A: existing tests cover quota/referral rules; deployed auth flow remains manual.

## Ads Paused Smoke

Required settings:

```bash
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

Expected:

- rewarded mock offers hidden from review flow
- `/settings/ads` says real ads are disabled
- no GPT/AdMob/CMP/ATT/tracking scripts are present

Status in Phase 22A: env check passed with ads hidden; no real ad integrations were added.

## Rollback Plan

Fastest rollback:

```bash
AI_REVIEW_ENABLED=false
```

Mock-only fallback:

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=mock
AI_REVIEW_MODE=direct
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

Stop queued worker:

- stop Render Background Worker, or
- set `AI_REVIEW_ENABLED=false`, or
- switch Vercel to mock direct mode.

## Go / No-Go

GO for inviting 1-3 friends only after:

- build passes
- tests pass
- live DeepSeek smoke passes
- deployed Vercel review flow is manually verified
- admin dashboard is verified as admin-only
- feedback submission is verified in deployed app
- ads are hidden
- rollback env is known

Current Phase 22A recommendation:

- Code and local live DeepSeek provider smoke are GO.
- Full friend invite remains conditional until one deployed Vercel UI review and one deployed feedback submission are manually verified.

## Known Limitations

- Local smoke cannot prove Vercel auth/session behavior.
- Render worker verification requires Render access.
- Queue was empty during local worker-once smoke, so real queued job processing remains manual.
- Admin action smoke requires safe test jobs.
- Referral signup attribution requires auth-provider flow smoke in deployment.
