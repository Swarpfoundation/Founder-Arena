# Private Beta Deployment Hardening

Phase 19B verifies the DeepSeek review pipeline for the founder and a small private beta group. The goal is operational safety, not new gameplay.

Real ads remain paused. Do not enable ad SDKs, CMPs, ATT prompts, tracking, or production ad units for this beta.

## Mode A: Mock Direct Baseline

Use this first after every deploy.

### Vercel env

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=mock
AI_REVIEW_MODE=direct
AI_REVIEW_FALLBACK_TO_MOCK=true
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

### Expected behavior

- Pitch submission creates a VC review using the mock provider.
- No DeepSeek key is required.
- Review page completes immediately.
- Rewarded mock ad offers are hidden.

## Mode B: DeepSeek Direct

Use this only for founder-only or very small friend testing.

### Vercel env

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=deepseek
AI_REVIEW_MODE=direct
AI_REVIEW_FALLBACK_TO_MOCK=true
AI_REVIEW_MAX_DAILY_PER_USER=20
AI_REVIEW_TIMEOUT_MS=25000
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
AI_REVIEW_TEMPERATURE=0.2
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

### Expected behavior

- DeepSeek is called only from the server action.
- The browser never receives the API key.
- Malformed JSON, timeouts, and rate limits fail safely.
- If fallback is enabled, the review is marked as mock fallback in `rawResponse.privateBetaAIReview`.
- UI does not hang indefinitely; errors are user-safe.

## Mode C: DeepSeek Queued Worker

Use this for friend testing once multiple people may submit reviews.

### Vercel env

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=deepseek
AI_REVIEW_MODE=queued_worker
AI_REVIEW_FALLBACK_TO_MOCK=true
AI_REVIEW_MAX_DAILY_PER_USER=20
AI_REVIEW_MAX_ATTEMPTS=3
AI_REVIEW_TIMEOUT_MS=25000
AI_REVIEW_TEMPERATURE=0.2
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

### Render worker env

Use the same database and auth settings as Vercel:

```bash
DATABASE_URL=...
AUTH_SECRET=...
AUTH_URL=...
```

Then add review worker settings:

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=deepseek
AI_REVIEW_MODE=queued_worker
AI_REVIEW_FALLBACK_TO_MOCK=true
AI_REVIEW_MAX_ATTEMPTS=3
AI_REVIEW_TIMEOUT_MS=25000
AI_REVIEW_TEMPERATURE=0.2
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
AI_REVIEW_WORKER_POLL_MS=5000
```

### Expected behavior

- Vercel enqueues one `aiReview` job per startup/pitch version.
- Review page shows `queued`, `running`, `retrying`, `completed`, or `failed`.
- Render worker claims one job at a time.
- Stale `running` locks are reclaimed after the lock timeout and retried when attempts remain.
- Queue inspection never prints prompt text or secrets.

## Operational Commands

Run before inviting testers:

```bash
npm run review:check-env
npm run typecheck
npm test
npm run lint
npm run build
```

Admin private beta dashboard:

```text
/admin/private-beta
```

Set `ADMIN_EMAILS` or `ADMIN_USER_IDS` server-side before using it. The dashboard shows queue counts, recent safe job metadata, referral activity, weekly submission usage, beta feedback, audit entries, and key-presence booleans without exposing secrets or prompts.

Phase 21B adds protected queue recovery actions:

- retry failed/retrying review job
- reclaim stale running review job
- cancel queued/running/retrying/failed review job

Every action writes a compact admin audit entry. Completed jobs remain immutable from the dashboard.

Inspect queue state without exposing prompts:

```bash
npm run review:queue:inspect
```

Run a live DeepSeek provider smoke against a synthetic pitch without mutating app data:

```bash
npm run review:deepseek:smoke
```

This script prints only provider, model, duration, decision, score, quality flags, and whether usage metadata was returned. It does not print API keys, raw provider payloads, prompts, or private user pitch data.

Process exactly one queued job:

```bash
npm run review:worker:once
```

Run the continuous worker:

```bash
npm run review:worker
```

## Render Background Worker Setup

1. Create a Render Background Worker.
2. Connect the Founder Arena repo and private-beta branch.
3. Build command:

```bash
npm install
```

4. Start command:

```bash
npm run review:worker
```

5. Add Vercel-matching `DATABASE_URL`, `AUTH_SECRET`, and app URL settings.
6. Add server-only DeepSeek variables.
7. Do not add any `NEXT_PUBLIC_DEEPSEEK_*` variable.
8. Deploy.
9. Submit one queued review from Vercel.
10. Watch Render logs for a `completed` worker result.

## Smoke Checklist

### Founder/operator

1. Run `npm run review:check-env` locally with mock direct mode.
2. Submit one mock direct review.
3. Switch Vercel to DeepSeek direct mode.
4. Submit one DeepSeek direct review.
5. Switch Vercel to queued worker mode.
6. Submit one queued review.
7. Run `npm run review:worker:once` locally or on Render.
8. Confirm the review completes.
9. Run `npm run review:deepseek:smoke` once before using live direct/queued mode.
10. Invite 1-3 friends only after the deployed Vercel review UI and feedback submission path are manually verified.
11. Watch Render logs and queue inspect output during the first test window.

### Friend tester

1. Sign in.
2. Create a startup.
3. Fill the pitch.
4. Submit VC review.
5. If queued, continue exploring Founder Arena.
6. Refresh review status after a minute.
7. Open completed review.
8. Continue to term sheet and Week 1.
9. Report startup ID, review status, and visible error copy if anything fails.

## Rollback / Kill Switch

Immediate rollback:

```bash
AI_REVIEW_ENABLED=false
```

Mock-only beta:

```bash
AI_REVIEW_ENABLED=true
AI_REVIEW_PROVIDER=mock
AI_REVIEW_MODE=direct
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

Stop worker:

- Stop the Render Background Worker service, or set `AI_REVIEW_ENABLED=false` and redeploy.

## Secret Safety

- Never commit `DEEPSEEK_API_KEY`.
- Never create `NEXT_PUBLIC_DEEPSEEK_API_KEY`.
- Do not log pitch prompts, raw provider payloads, auth details, or billing data.
- Queue inspection prints IDs, statuses, attempts, and timestamps only.

## VC Review Quality Smoke

After deployment, verify one review from each path shows:

- final decision and model recommendation
- score-based rubric explanation
- evidence and concerns for every scoring dimension
- rejection reasons or conditional requirements when not accepted
- no term sheet for rejected startups
- quality flags when guardrails adjust the model recommendation

Use `docs/ai-review/vc-review-quality-rubric.md` when triaging friend beta feedback.

If a tester reports bad review quality, use the review page feedback form. Feedback appears in `/admin/private-beta` and does not automatically re-run or change the review.

## Ads Paused

Private beta should use:

```bash
ADS_DISABLED=true
REWARDED_ADS_ENABLED=false
```

`/settings/ads` can remain available, but real providers stay disabled and mock rewarded offers are hidden from the review flow.

## Known Limitations

- Queue storage is still `QueuedAction`, not a dedicated `AIReviewJob` table.
- Direct Vercel mode is suitable only for low volume.
- Live DeepSeek smoke requires a real key in the deployment environment.
- Render worker verification requires a reachable production or staging database.
- Feedback status updates are not implemented yet; the admin inbox is read-only.
