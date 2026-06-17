# Founder Arena iOS Deck Review API Contract

Phase 25B extends the backend contract that the native iOS app should use for
AI investment firm deck review. The firms are fictional game entities. Results
are gameplay feedback, not real investment offers, financial advice, investor
outreach, CRM activity, or legal commitments.

## Auth Assumptions

- All deck review job routes require the same authenticated Founder Arena user
  session as the web game.
- iOS should authenticate with the backend mobile token exchange, then call
  protected endpoints with `Authorization: Bearer <token>`.
- A user may only create and view jobs for startups they own.
- Configured admins may inspect safe job status, but never raw deck text,
  storage keys, prompts, or provider payloads.

### Mobile Auth Contract

Native iOS should use `ASWebAuthenticationSession`:

1. Generate random `state` and optional PKCE verifier/challenge.
2. Open:

```text
https://api.founderarena.xyz/api/mobile-auth/start?provider=google&redirect_uri=founderarena://auth-callback&state=<state>&code_challenge=<challenge>&code_challenge_method=S256
```

3. Receive:

```text
founderarena://auth-callback?code=<one-time-code>&state=<state>
```

4. Verify `state`.
5. `POST /api/mobile-auth/exchange`.
6. Store the returned bearer token in Keychain.
7. Send `Authorization: Bearer <token>` on protected API calls.

See `docs/auth/mobile-auth-token-exchange.md` for the complete endpoint
contract and security invariants.

Backend middleware intentionally lets `/api/mobile-auth/*` reach route handlers.
Protected API requests with `Authorization: Bearer <token>` also reach route
handlers, where the token is validated and owner authorization is enforced.
Invalid or missing API auth returns JSON `401`; native clients should not expect
an HTML `/login` redirect for API calls.

## Endpoints

### `GET /api/startups`

Lists the current user's backend startups. Requires browser session or mobile
bearer token.

Response:

```json
{
  "startups": [
    {
      "id": "clx_startup_id",
      "name": "VaultPay",
      "sector": "Fintech",
      "region": "Europe",
      "founderStyle": null,
      "currentMonth": 0,
      "status": "draft",
      "fundingStage": "prototype",
      "country": "United Kingdom",
      "countryCode": "GB",
      "city": "London",
      "stage": "prototype",
      "cash": 0,
      "monthlyBurn": 0,
      "valuation": 0,
      "profile": {
        "companyName": "VaultPay",
        "oneLinePitch": "Compliance-aware wallet infrastructure for marketplaces.",
        "description": "Wallet infrastructure for marketplaces that may hold customer funds before payouts.",
        "problem": "Marketplace operators need a clearer custody and payout authorization path.",
        "solution": "VaultPay maps fund custody assumptions, KYC ownership, and payout operations.",
        "targetCustomer": "marketplace operators",
        "market": "B2B marketplaces in regulated payment flows",
        "businessModel": "SaaS plus transaction usage fees",
        "websiteUrl": "https://vaultpay.example",
        "city": "London",
        "country": "United Kingdom",
        "countryCode": "GB",
        "socialLinks": [{ "platform": "github", "url": "https://github.com/example/vaultpay" }],
        "currentStage": "prototype",
        "realLifeStartup": true,
        "fundingGoal": "$1.5M seed",
        "tractionSummary": "Three design partners",
        "revenueSummary": "Pre-revenue",
        "teamSummary": "Payments operator and infrastructure engineer",
        "roadmapSummary": "Pilot custody-model review before launch"
      },
      "createdAt": "2026-06-12T10:00:00.000Z",
      "updatedAt": "2026-06-12T10:00:00.000Z"
    }
  ]
}
```

Safe response notes:

- Only the authenticated user's startups are returned.
- No difficulty field is returned.
- No owner identifiers, private AI analysis, deck review payloads, deck storage
  keys, private logo storage keys, prompts, or raw provider output are returned.
- Profile fields are owner/admin-safe startup metadata intended for mobile
  hydration and review context.

### `POST /api/startups`

Creates a normal backend startup owned by the authenticated user so iOS has a
`startupId` for deck generation and VC review jobs.

Request:

```json
{
  "name": "VaultPay",
  "sector": "FinTech",
  "country": "UK",
  "countryCode": "GB",
  "city": "London",
  "founderStyle": "Technical",
  "oneLinePitch": "Compliance-aware wallet infrastructure for marketplaces.",
  "targetCustomer": "marketplace operators",
  "description": "Optional company summary",
  "problem": "Optional investor-readable problem statement, at least 20 chars.",
  "solution": "Optional investor-readable solution statement, at least 20 chars.",
  "businessModel": "Optional business model",
  "market": "Optional market summary",
  "websiteURL": "https://vaultpay.example",
  "socialLinks": [{ "platform": "github", "url": "https://github.com/example/vaultpay" }],
  "stage": "prototype",
  "realLifeStartup": true,
  "fundingGoal": "$1.5M seed",
  "unfairAdvantage": "Optional founder background",
  "fundingAsk": 500000,
  "tractionSummary": "Optional traction summary",
  "revenueSummary": "Optional revenue summary",
  "teamSummary": "Optional team summary",
  "roadmapSummary": "Optional roadmap summary"
}
```

The backend maps mobile-friendly sectors and country/region values into the
existing startup model. Unknown sectors use the safe `Other` fallback.
`websiteUrl`, `websiteURL`, and social link URLs must be HTTP(S). `countryCode`
must be a two-letter ISO-style code. See
`docs/api/startup-profile-sync.md` for the full profile sync contract.

Response:

```json
{
  "startup": {
    "id": "clx_startup_id",
    "name": "VaultPay",
    "sector": "Fintech",
    "region": "Europe",
    "founderStyle": null,
    "currentMonth": 0,
    "status": "draft",
    "fundingStage": "prototype",
    "country": "United Kingdom",
    "countryCode": "GB",
    "city": "London",
    "stage": "prototype",
    "cash": 0,
    "monthlyBurn": 0,
    "valuation": 0,
    "profile": {
      "companyName": "VaultPay",
      "oneLinePitch": "Compliance-aware wallet infrastructure for marketplaces.",
      "description": "Optional company summary",
      "targetCustomer": "marketplace operators",
      "websiteUrl": "https://vaultpay.example",
      "realLifeStartup": true
    },
    "createdAt": "2026-06-12T10:00:00.000Z",
    "updatedAt": "2026-06-12T10:00:00.000Z"
  }
}
```

### `GET /api/startups/:startupId`

Returns one safe startup view for the owner or configured admin. Non-owners get
`404`.

Backend-26A stores the richer mobile startup profile on the backend startup.
Deck generation and VC review jobs automatically use that stored profile as
private review context when a request omits `startupProfile`; explicit request
profile fields can override the stored snapshot for that job only.

### `PATCH /api/startups/:startupId`

Updates safe startup/profile fields for the owner or configured admin. Mobile
clients should use this after a local `StartupProfile` edit when they already
have a backend `startup.id`.

Request is partial; omitted fields are unchanged:

```json
{
  "oneLinePitch": "Compliance-aware wallet infrastructure for marketplaces.",
  "problem": "Marketplace operators need a clearer custody and payout authorization path before launch.",
  "solution": "VaultPay maps fund custody assumptions, KYC ownership, and payout operations.",
  "city": "London",
  "country": "United Kingdom",
  "countryCode": "GB",
  "websiteUrl": "https://vaultpay.example",
  "socialLinks": [{ "platform": "github", "url": "https://github.com/example/vaultpay" }],
  "roadmapSummary": "Validate authorization assumptions before pilot onboarding."
}
```

Response is the same safe startup view shape as `GET /api/startups/:startupId`.
The endpoint rejects unknown/forbidden fields such as `cash`, `valuation`,
`status`, `ownerId`, `userId`, `difficulty`, review payloads, prompts, provider
output, storage keys, and timestamps. Empty strings or `null` clear optional
profile fields where safe. Logo upload/serving remains deferred.

### Recommended iOS Startup Flow

1. Login through mobile auth.
2. Call `GET /api/mobile-auth/me`.
3. Call `GET /api/startups`.
4. If no backend startup exists for the current local run, call
   `POST /api/startups`.
5. If a backend startup exists and local profile fields changed, call
   `PATCH /api/startups/:startupId` with the changed safe fields. If PATCH
   fails, keep local edits and retry later.
6. Use the returned backend `startup.id` as `startupId` when creating
   deck-generation and VC review jobs.

### `GET /api/vc-review-firms`

Returns the public fictional firm catalog. This route is public because it
contains no user, startup, deck, prompt, or private partner instructions.

Response:

```json
{
  "firms": [
    {
      "id": "marketproof_partners",
      "name": "MarketProof Partners",
      "sectorFocus": ["SaaS", "B2B", "productivity", "vertical software"],
      "checkSizeRange": "$250K-$1.5M",
      "stageFocus": "Pre-seed to seed",
      "riskAppetite": "Moderate",
      "thesis": "Backs narrow B2B products with painful workflows and early proof of retention.",
      "whatTheyLove": ["specific customer pain", "early revenue", "retention evidence"],
      "dealBreakers": ["broad market claims without GTM proof"],
      "rubricWeights": {
        "sectorFit": 15,
        "traction": 25,
        "team": 10,
        "market": 15,
        "product": 15,
        "gtm": 15,
        "financials": 5
      },
      "tone": "traction-focused seed investor",
      "publicDescription": "A seed firm that wants clear customer pain, measurable usage, and believable GTM proof."
    }
  ],
  "disclaimer": "All investment firms in Founder Arena are fictional game entities. Reviews are gameplay feedback, not real funding offers or financial advice."
}
```

### `POST /api/vc-review-jobs`

Creates a private review job from one of four input modes and starts firm review.

Request:

- Method: `POST`
- Content type: `multipart/form-data`
- Fields:
  - `startupId`: required string.
  - `inputType`: `pdf_upload`, `manual_pitch`, `ai_generated_deck`, or `structured_pitch_deck`.
  - `deck`: required for `pdf_upload`.
  - `pitchText`: required for `manual_pitch`.
  - `generatedDeckJobId`: required for `ai_generated_deck`.
  - `structuredDeck`: required JSON string for `structured_pitch_deck`.
  - `manualNotes`: optional string, max 2,000 characters after trimming.
  - `firmIds`: optional comma-separated firm IDs. Omit for auto-selection.
  - `startupProfile` JSON object or `profile.<field>` multipart fields.
  - `logo`: optional private PNG/JPEG/WebP logo file.

Upload limits:

- PDF only. Backend validates extension/MIME and `%PDF-` magic bytes.
- Max PDF size: 15 MB.
- Max pages: 40.
- Max extracted text: 60,000 characters.
- Minimum readable text: 200 characters.
- OCR is not supported. Scanned or image-only PDFs fail safely.
- Manual pitch text: minimum 300 characters, max 30,000 characters.
- Structured pitch deck:
  - `title`: required, max 160 characters.
  - `oneLinePitch`: optional, max 280 characters.
  - `notes`: optional, max 2,000 characters.
  - `sections`: required, 1-20 sections.
  - each section uses one of:
    `title`, `problem`, `solution`, `product`, `market`, `targetCustomer`,
    `businessModel`, `traction`, `goToMarket`, `competition`, `team`,
    `fundingAsk`, `roadmap`.
  - each section has `headline` max 240 characters, up to 8 bullets of max
    260 characters each, `speakerNote` max 1,200 characters, and
    `evidenceLevel`: `missing`, `weak`, `adequate`, or `strong`.
- Startup logo: max 2 MB; stored privately.

JSON clients may also submit `structured_pitch_deck` as `application/json`:

```json
{
  "inputType": "structured_pitch_deck",
  "startupId": "clx_startup_id",
  "selectedFirmIds": ["fintrust_capital", "marketproof_partners"],
  "startupProfile": {
    "companyName": "VaultPay",
    "sector": "fintech payments"
  },
  "structuredDeck": {
    "title": "VaultPay Investor Dossier",
    "oneLinePitch": "Compliance-aware wallet operations for marketplaces.",
    "sections": [
      {
        "kind": "problem",
        "headline": "Marketplaces struggle with fund custody assumptions.",
        "bullets": ["Payout responsibility is unclear", "KYC/AML ownership needs definition"],
        "speakerNote": "This is a founder-authored draft section.",
        "evidenceLevel": "weak"
      }
    ],
    "notes": "Draft from the in-game pitch deck builder."
  }
}
```

iOS `PitchDeckDraft` maps directly:

- `title` → `structuredDeck.title`
- `oneLinePitch` → `structuredDeck.oneLinePitch`
- `sections[].kind` → `structuredDeck.sections[].kind`
- `sections[].headline` → `structuredDeck.sections[].headline`
- `sections[].bullets` → `structuredDeck.sections[].bullets`
- `sections[].speakerNote` → `structuredDeck.sections[].speakerNote`
- `sections[].evidenceLevel` → `structuredDeck.sections[].evidenceLevel`
- `notes` → `structuredDeck.notes`

Response:

- `202` when accepted and review is in progress.
- `422` when the PDF is valid but unreadable/textless.
- `400`, `401`, `404`, `409`, `413`, or `429` for validation/auth/rate issues.

Accepted response shape:

```json
{
  "job": {
    "jobId": "clx_job_id",
    "startupId": "clx_startup_id",
    "reviewInputType": "pdf_upload",
    "status": "reviewing",
    "selectedFirmIds": ["marketproof_partners", "novaedge_ai_ventures"],
    "deckFileName": "pitch.pdf",
    "deckPageCount": 1,
    "sourceSummary": "PDF deck · 12000 extracted chars",
    "deckSummary": null,
    "accessUsedCredit": false,
    "provider": null,
    "model": null,
    "errorCategory": null,
    "safeErrorMessage": null,
    "missionGenerationStatus": "not_started",
    "missionCount": 0,
    "missionGenerationErrorCategory": null,
    "missionGenerationSafeErrorMessage": null,
    "missions": null,
    "roadmapSummary": null,
    "createdAt": "2026-06-11T19:00:00.000Z",
    "startedAt": null,
    "completedAt": null,
    "firmReviews": null,
    "aggregateReview": null
  }
}
```

For `structured_pitch_deck`, the raw deck sections, bullets, speaker notes,
and notes are stored privately. The safe job view may return only:

```json
{
  "deckSummary": {
    "title": "VaultPay Investor Dossier",
    "oneLinePitch": "Compliance-aware wallet operations for marketplaces.",
    "sectionCount": 12,
    "sectionKinds": ["problem", "solution", "market"],
    "evidenceSummary": {
      "missing": 1,
      "weak": 4,
      "adequate": 6,
      "strong": 1
    }
  }
}
```

### `GET /api/vc-review-jobs/:jobId`

Polls a safe job view. Owner/admin only.

Completed response shape:

```json
{
  "job": {
    "jobId": "clx_job_id",
    "startupId": "clx_startup_id",
    "reviewInputType": "ai_generated_deck",
    "status": "completed",
    "selectedFirmIds": ["marketproof_partners", "novaedge_ai_ventures"],
    "deckFileName": "pitch.pdf",
    "deckPageCount": 1,
    "sourceSummary": "MercuryOps Investor Deck · 12 generated slides",
    "accessUsedCredit": true,
    "provider": "deepseek",
    "model": "deepseek-reasoner",
    "errorCategory": null,
    "safeErrorMessage": null,
    "createdAt": "2026-06-11T19:00:00.000Z",
    "startedAt": "2026-06-11T19:00:02.000Z",
    "completedAt": "2026-06-11T19:00:30.000Z",
    "firmReviews": [
      {
        "firmId": "marketproof_partners",
        "firmName": "MarketProof Partners",
        "decision": "interested",
        "score": 76,
        "confidence": 72,
        "checkSizeSuggestion": "$500K seed check",
        "valuationView": "Seed valuation depends on retention proof.",
        "whyTheyLikeIt": ["Clear customer pain"],
        "mainConcerns": ["Needs retention evidence"],
        "dealBreakers": [],
        "questionsForFounder": ["What is current retention?"],
        "requiredMilestones": ["Show cohort retention"],
        "evidenceFromDeck": ["14 paying customers"],
        "missingInformation": ["CAC and payback"],
        "assumptionsMade": ["Assumes customers are retained"],
        "sectorFit": 85,
        "tractionScore": 72,
        "teamScore": 65,
        "marketScore": 70,
        "productScore": 74,
        "gtmScore": 68,
        "financialsScore": 55,
        "riskScore": 42,
        "summary": "MarketProof is interested, but wants stronger retention proof.",
        "provider": "deepseek",
        "model": "deepseek-reasoner",
        "durationMs": 8100,
        "repaired": false
      }
    ],
    "aggregateReview": {
      "overallDecision": "mixed",
      "overallScore": 68,
      "interestedFirmIds": ["marketproof_partners"],
      "passedFirmIds": [],
      "strongestFitFirmId": "marketproof_partners",
      "fundingLikelihood": "medium",
      "topReasons": ["Clear customer pain"],
      "topRisks": ["Needs retention evidence"],
      "bestNextMilestones": ["Show cohort retention"],
      "suggestedPitchFixes": ["Add retention and CAC evidence"],
      "playerFacingSummary": "The funding market is interested but wants stronger proof before a clean term sheet."
    },
    "missionGenerationStatus": "completed",
    "missionCount": 3,
    "missionGenerationErrorCategory": null,
    "missionGenerationSafeErrorMessage": null,
    "missions": [
      {
        "id": "prove_customer_pain_and_retention_signal",
        "source": "firm_review",
        "firmId": "marketproof_partners",
        "category": "traction",
        "title": "Prove customer pain and retention signal",
        "summary": "MercuryOps needs stronger evidence that finance operators repeatedly feel the problem and return to the product.",
        "whyItMatters": "The funding market rewards repeatable demand evidence more than broad market claims.",
        "acceptanceCriteria": [
          "Document three concrete customer pain examples",
          "Add one retention or repeat-usage signal",
          "Separate confirmed customer evidence from assumptions"
        ],
        "evidenceSource": "firm_feedback",
        "priority": "important",
        "status": "proposed",
        "phaseSuggestion": "next_sprint",
        "riskArea": "retention proof"
      }
    ],
    "roadmapSummary": {
      "nextBestAction": "Prove customer pain and retention signal",
      "fundingBlockers": ["Needs retention evidence"],
      "investorConfidencePath": ["Close the highest-priority diligence blocker"],
      "recommendedOrder": ["Prove customer pain and retention signal"]
    }
  }
}
```

### `GET /api/vc-review-jobs/:jobId/missions`

Returns only the safe investor mission subset for a completed review job.
Owner/admin only.

```json
{
  "jobId": "clx_job_id",
  "startupId": "clx_startup_id",
  "missionGenerationStatus": "completed",
  "missionCount": 3,
  "missionGenerationErrorCategory": null,
  "missionGenerationSafeErrorMessage": null,
  "missions": [],
  "roadmapSummary": {
    "nextBestAction": "Prove customer pain and retention signal",
    "fundingBlockers": [],
    "investorConfidencePath": [],
    "recommendedOrder": []
  }
}
```

### `POST /api/vc-review-jobs/:jobId/run`

Manual runner for local development and admin recovery.

- Development: job owner may run.
- Production: configured admin only.
- iOS should not call this endpoint in normal gameplay.

### `POST /api/deck-generation-jobs`

Generates a structured professional deck JSON from startup profile and founder
request text. Owner only.

Request:

- Method: `POST`
- Content type: `multipart/form-data`
- Fields:
  - `startupId`: required.
  - `requestText`: required, minimum 80 characters, max 4,000 characters.
  - startup profile fields.
  - optional private `logo`.

Response includes a safe owner-only `generatedDeck`:

```json
{
  "job": {
    "jobId": "clx_generation_job",
    "startupId": "clx_startup_id",
    "status": "completed",
    "provider": "mock",
    "model": "mock",
    "errorCategory": null,
    "safeErrorMessage": null,
    "accessUsedCredit": false,
    "createdAt": "2026-06-11T19:00:00.000Z",
    "startedAt": "2026-06-11T19:00:00.000Z",
    "completedAt": "2026-06-11T19:00:02.000Z",
    "generatedDeck": {
      "deckTitle": "MercuryOps Investor Deck",
      "oneLinePitch": "MercuryOps helps finance operators reconcile board metrics.",
      "slides": [
        {
          "slideNumber": 1,
          "title": "Title / One-line pitch",
          "headline": "MercuryOps helps finance operators reconcile board metrics.",
          "bullets": ["Focused customer pain", "AI workflow wedge"],
          "speakerNote": "Open with the clearest customer pain."
        }
      ],
      "generatedWarnings": ["Replace assumptions with evidence before investor review."],
      "missingInfo": ["Retention evidence"],
      "qualityScore": 70
    }
  }
}
```

### `GET /api/deck-generation-jobs/:jobId`

Returns the safe generated deck job. Owner/admin only.

## Job Statuses

- `uploaded`: row created and private file stored.
- `extracting_deck`: backend is parsing the text-based PDF.
- `reviewing`: readable text exists; firm reviewers are running.
- `completed`: validated firm reviews and aggregate review are available.
- `failed`: safe error is available through `errorCategory` and
  `safeErrorMessage`.
- Deck generation jobs use `generating`, `completed`, and `failed`.
- Mission generation uses `not_started`, `generating`, `completed`, and
  `failed`. A review job may be `completed` even if mission generation failed.

The `POST /api/vc-review-jobs` response may skip short-lived intermediate
states when extraction completes quickly. iOS should treat statuses as a state
machine, not as guaranteed animation frames.

## Error Categories

Possible job-level `errorCategory` values include:

- `deck_unreadable`
- `deck_too_large`
- `extraction_failed`
- `invalid_pitch`
- `invalid_profile`
- `access_required`
- `provider_not_configured`
- `provider_timeout`
- `provider_rate_limited`
- `provider_invalid_output`
- `provider_failed`
- `unknown`

Sample scanned/image-only failure:

```json
{
  "job": {
    "jobId": "clx_job_id",
    "startupId": "clx_startup_id",
    "reviewInputType": "pdf_upload",
    "status": "failed",
    "selectedFirmIds": ["marketproof_partners"],
    "deckFileName": "scanned-deck.pdf",
    "deckPageCount": null,
    "sourceSummary": null,
    "accessUsedCredit": false,
    "provider": null,
    "model": null,
    "errorCategory": "extraction_failed",
    "safeErrorMessage": "This PDF contains no readable text (it may be a scanned or image-only export). Export a text-based PDF and try again — OCR is not supported yet.",
    "missionGenerationStatus": "not_started",
    "missionCount": 0,
    "missionGenerationErrorCategory": null,
    "missionGenerationSafeErrorMessage": null,
    "missions": null,
    "roadmapSummary": null,
    "createdAt": "2026-06-11T19:00:00.000Z",
    "startedAt": null,
    "completedAt": "2026-06-11T19:00:03.000Z",
    "firmReviews": null,
    "aggregateReview": null
  }
}
```

## Fields Intentionally Not Returned

No iOS or frontend API response may include:

- `deckStorageKey`
- private storage path
- PDF URL
- raw PDF bytes
- `deckSha256`
- `extractedText`
- `extractedTextSha256`
- `manualNotes`
- `startupProfile`
- `logoUploadKey`
- private logo paths
- raw manual pitch text
- raw generated deck JSON on review jobs
- raw mission prompt text
- raw prompts
- raw provider payloads
- API keys
- private firm review instructions

## Polling Strategy

Recommended iOS behavior:

1. Submit the PDF with `POST /api/vc-review-jobs`.
2. If response is `202`, show the returned status immediately.
3. Poll `GET /api/vc-review-jobs/:jobId` every 2-3 seconds while status is
   `uploaded`, `extracting_deck`, or `reviewing`.
4. Stop polling when status is `completed` or `failed`.
5. Back off polling after 30 seconds and show a recoverable "still reviewing"
   state.
6. Do not cache private deck files on-device longer than the upload session.

For AI deck mode, first call `POST /api/deck-generation-jobs`, preview the
returned generated deck, then submit `generatedDeckJobId` to
`POST /api/vc-review-jobs`.

## Access Required Contract

AI deck generation and investment firm review are server-gated. If the user is
not Pro/Max, admin, dev-bypassed, or holding a rewarded/referral credit, the
server returns `402`:

```json
{
  "error": "AI deck generation and investment firm review require Pro/Max or one rewarded/referral review credit.",
  "errorCategory": "access_required",
  "upgradeRequired": true,
  "rewardedCreditAvailable": false,
  "requiredAction": "premium_or_reward_credit",
  "availableCredits": 0,
  "planId": "free"
}
```

## iOS UI Flow Recommendation

1. Fetch `GET /api/vc-review-firms`.
2. Let the player choose auto-select or specific fictional firms.
3. Collect startup profile fields.
4. Pick PDF, write manual pitch, or generate deck.
5. Upload with `POST /api/vc-review-jobs`.
6. Show status: uploading, extracting deck, reviewing, completed/failed.
7. Poll `GET /api/vc-review-jobs/:jobId`.
8. Show aggregate verdict first.
9. Show firm review cards with score, decision, reasons, concerns, questions,
   required milestones, and missing information.
10. If `missionGenerationStatus=completed`, show investor missions and roadmap
    summary. If it failed, keep the review visible and show a restrained mission
    failure note.
11. Use copy that makes clear these are fictional in-game firms and not real
   funding decisions.
12. For missions, use: "These are simulated investor due-diligence missions,
    not legal, financial, compliance, or investment advice."

## Privacy and Security Rules

- The DeepSeek key remains server-side only.
- iOS must never receive or store model provider secrets.
- Uploaded PDFs are private backend files, not public URLs.
- Uploaded logos are private backend files, not public URLs.
- Deck text is private backend data and should never be displayed unless a
  future product decision explicitly adds a redacted preview.
- Public share pages must not include deck text, prompts, raw model output,
  notes, or storage keys.
- AI output may be shown only after backend schema validation.

## Known Limitations

- OCR is not implemented.
- Live provider availability depends on server-side `DEEPSEEK_API_KEY`.
- The manual run endpoint is a local/admin recovery path, not a mobile product
  endpoint.
