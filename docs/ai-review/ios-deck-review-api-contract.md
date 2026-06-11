# Founder Arena iOS Deck Review API Contract

Phase 25A.1 freezes the backend contract that the native iOS app should use for
AI investment firm deck review. The firms are fictional game entities. Results
are gameplay feedback, not real investment offers, financial advice, investor
outreach, CRM activity, or legal commitments.

## Auth Assumptions

- All deck review job routes require the same authenticated Founder Arena user
  session as the web game.
- iOS should call these endpoints with the app's authenticated session/token
  mechanism once mobile auth is wired.
- A user may only create and view jobs for startups they own.
- Configured admins may inspect safe job status, but never raw deck text,
  storage keys, prompts, or provider payloads.

## Endpoints

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

Creates a private deck review job and starts extraction/review.

Request:

- Method: `POST`
- Content type: `multipart/form-data`
- Fields:
  - `startupId`: required string.
  - `deck`: required PDF file.
  - `manualNotes`: optional string, max 2,000 characters after trimming.
  - `firmIds`: optional comma-separated firm IDs. Omit for auto-selection.

Upload limits:

- PDF only. Backend validates extension/MIME and `%PDF-` magic bytes.
- Max PDF size: 15 MB.
- Max pages: 40.
- Max extracted text: 60,000 characters.
- Minimum readable text: 200 characters.
- OCR is not supported. Scanned or image-only PDFs fail safely.

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
    "status": "reviewing",
    "selectedFirmIds": ["marketproof_partners", "novaedge_ai_ventures"],
    "deckFileName": "pitch.pdf",
    "deckPageCount": 1,
    "provider": null,
    "model": null,
    "errorCategory": null,
    "safeErrorMessage": null,
    "createdAt": "2026-06-11T19:00:00.000Z",
    "startedAt": null,
    "completedAt": null,
    "firmReviews": null,
    "aggregateReview": null
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
    "status": "completed",
    "selectedFirmIds": ["marketproof_partners", "novaedge_ai_ventures"],
    "deckFileName": "pitch.pdf",
    "deckPageCount": 1,
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
    }
  }
}
```

### `POST /api/vc-review-jobs/:jobId/run`

Manual runner for local development and admin recovery.

- Development: job owner may run.
- Production: configured admin only.
- iOS should not call this endpoint in normal gameplay.

## Job Statuses

- `uploaded`: row created and private file stored.
- `extracting_deck`: backend is parsing the text-based PDF.
- `reviewing`: readable text exists; firm reviewers are running.
- `completed`: validated firm reviews and aggregate review are available.
- `failed`: safe error is available through `errorCategory` and
  `safeErrorMessage`.

The `POST /api/vc-review-jobs` response may skip short-lived intermediate
states when extraction completes quickly. iOS should treat statuses as a state
machine, not as guaranteed animation frames.

## Error Categories

Possible job-level `errorCategory` values include:

- `deck_unreadable`
- `deck_too_large`
- `extraction_failed`
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
    "status": "failed",
    "selectedFirmIds": ["marketproof_partners"],
    "deckFileName": "scanned-deck.pdf",
    "deckPageCount": null,
    "provider": null,
    "model": null,
    "errorCategory": "extraction_failed",
    "safeErrorMessage": "This PDF contains no readable text (it may be a scanned or image-only export). Export a text-based PDF and try again — OCR is not supported yet.",
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

## iOS UI Flow Recommendation

1. Fetch `GET /api/vc-review-firms`.
2. Let the player choose auto-select or specific fictional firms.
3. Pick a PDF using the iOS document picker.
4. Upload with `POST /api/vc-review-jobs`.
5. Show status: uploading, extracting deck, reviewing, completed/failed.
6. Poll `GET /api/vc-review-jobs/:jobId`.
7. Show aggregate verdict first.
8. Show firm review cards with score, decision, reasons, concerns, questions,
   required milestones, and missing information.
9. Use copy that makes clear these are fictional in-game firms and not real
   funding decisions.

## Privacy and Security Rules

- The DeepSeek key remains server-side only.
- iOS must never receive or store model provider secrets.
- Uploaded PDFs are private backend files, not public URLs.
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
