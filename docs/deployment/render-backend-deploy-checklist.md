# Render Backend Deploy Checklist

Founder Arena backend target:

- GitHub repo: `https://github.com/Swarpfoundation/Founder-Arena`
- Render service id: `srv-d8aua4ojs32c73buve70`

This checklist covers the web/backend API, AI investment firm deck review,
pitch intake, AI deck generation, and investor mission pipeline. It does not
cover native iOS deployment.

## Release Rules

- Do not commit `.env`, API keys, uploaded PDFs/logos, generated private decks,
  local database files, or logs.
- Do not create any `NEXT_PUBLIC_DEEPSEEK_*` variable.
- Do not deploy with `DECK_AI_ACCESS_DEV_BYPASS=true`.
- Do not expose `private-uploads/` through Next static files or `public/`.
- Do not enable OCR; scanned PDFs should fail safely.
- Do not claim real investor outreach, real funding, legal advice, or
  regulatory approval.

## Local Preflight

Run from a clean worktree:

```bash
git status --short
git log --oneline -n 10
git remote -v
npm run typecheck
npm test
npm run lint
npm run build
DATABASE_URL="postgresql://user:password@localhost:5432/founder_arena?schema=public" npx prisma validate
```

The placeholder `DATABASE_URL` command validates the Prisma schema shape only.
Use the real production `DATABASE_URL` only when running migrations or live
database smokes.

## Render Commands

Recommended build command:

```bash
npm ci && npm run db:deploy && npm run build
```

If Render already runs `npm ci` automatically for the service, use:

```bash
npm run db:deploy && npm run build
```

Start command:

```bash
npm run start
```

Migration command:

```bash
npm run db:deploy
```

Prisma generate is already covered by `postinstall`.

## Required Render Environment Variables

Set real values in Render; do not commit them.

Core:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_APP_URL` if share links must point at the Render domain

Auth providers:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

Mobile iOS auth:

- `MOBILE_AUTH_ENABLED=true`
- `MOBILE_AUTH_ALLOWED_REDIRECT_URIS=founderarena://auth-callback`
- `MOBILE_AUTH_CODE_TTL_SECONDS=300`
- `MOBILE_AUTH_TOKEN_TTL_DAYS=30`

AI review:

- `DEEPSEEK_API_KEY`
- `DECK_REVIEW_PROVIDER=deepseek`
- `DECK_REVIEW_MODEL` or `VC_REVIEW_MODEL`
- `DECK_REVIEW_ENABLED=true` or compatible `AI_REVIEW_ENABLED=true`
- `DECK_REVIEW_TIMEOUT_MS`
- `DECK_REVIEW_MAX_ATTEMPTS_PER_FIRM`
- `DECK_REVIEW_MAX_FIRMS_PER_JOB`
- `DECK_REVIEW_MAX_JOBS_PER_USER_PER_DAY`

Private upload storage:

- `DECK_UPLOAD_DIR`
- `LOGO_UPLOAD_DIR`

Recommended if running multiple instances:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional billing/access systems:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_MAX_MONTHLY`
- `STRIPE_PRICE_MAX_YEARLY`
- `REWARDED_ADS_ENABLED`
- `REWARDED_ADS_SIMULATED`

Admin/ops:

- `ADMIN_EMAILS`
- `CRON_SECRET`
- `APP_ENV`

## Private Upload Storage Warning

The deck review system stores PDFs under `DECK_UPLOAD_DIR` and logos under
`LOGO_UPLOAD_DIR`. By default these resolve under local `private-uploads/`.

On Render, local filesystem storage may be ephemeral unless the service has a
persistent disk mounted. For private beta, either:

- mount a persistent disk and point `DECK_UPLOAD_DIR` / `LOGO_UPLOAD_DIR` at
  directories on that disk, or
- accept that uploads may be lost on redeploy/restart and use the system only
  for temporary review testing.

Production should move these private files to authenticated object storage in a
future phase. Do not place uploads under `public/`.

## Mock Smoke Procedure

These are covered by the deck-review unit tests and should pass without live
credentials:

- manual pitch review + missions
- AI-generated deck + review + missions
- PDF extraction + review + missions
- access gate behavior
- safe response redaction

Run:

```bash
npx vitest run tests/unit/deck-review.test.ts
```

## Live DeepSeek Smoke Procedure

Only run when `DATABASE_URL` and `DEEPSEEK_API_KEY` are present.

Use fictional, non-sensitive startup data. Capture only safe summary fields:

- provider/model label
- job status
- firm count
- aggregate decision
- mission count
- safe error category if failed

Do not print:

- raw pitch/deck text
- manual notes
- prompts
- raw provider output
- API keys
- storage keys
- private profile/logo values

Suggested live checks:

1. Set `DECK_REVIEW_PROVIDER=deepseek`.
2. Limit selected firms to 1-3 for cost control.
3. Submit a small text-based PDF or manual pitch.
4. Poll `GET /api/vc-review-jobs/:jobId`.
5. Confirm `status=completed`.
6. Confirm firm reviews and aggregate review validate.
7. Confirm `missionGenerationStatus=completed` or a safe mission failure.
8. Confirm safe GET responses exclude private fields.

If missing credentials, report the missing env names only.

## Deployment Verification

After Render deploy:

1. Open `/api/health`.
2. Sign in on the deployed domain.
3. Create or open a startup.
4. Open the pitch page.
5. Fetch AI firms.
6. Run a mock-mode review first if production AI is disabled.
7. Run one live DeepSeek review with fictional data when ready.
8. Confirm result displays aggregate verdict, firm cards, investor missions,
   and roadmap summary.
9. Confirm scanned/image-only PDFs fail safely.
10. Confirm logs do not contain prompts, deck text, storage keys, or secrets.

## GitHub Push Checklist

Do not push until founder approval.

Before push:

```bash
git status --short
git log --oneline -n 10
git remote -v
git push origin main
```

Expected remote:

```text
origin  https://github.com/Swarpfoundation/Founder-Arena.git
```

## Rollback Notes

- Prefer Render's previous successful deploy rollback for app code issues.
- If a migration was applied, evaluate database rollback manually before
  reverting code.
- To disable live AI review without redeploying code, set
  `DECK_REVIEW_PROVIDER=mock` or disable the deck review feature env.
- To stop upload risk, temporarily hide the pitch page or disable review access
  while preserving existing data.
