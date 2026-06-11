# Founder Arena PDF Deck Review Market

Phase 25A adds a backend-driven AI review market for real uploaded PDF pitch decks. Phase 25B extends the same market to manual pitch text and AI-generated structured decks; see `docs/ai-review/pitch-intake-ai-deck-generation.md` for the broader intake/access-gate contract. The reviewers are fictional in-game investment firms. They provide gameplay feedback only; they are not real investors, do not create real funding offers, and do not perform outreach.

## Architecture

- Client uploads a private PDF deck from the pitch console.
- `POST /api/vc-review-jobs` validates ownership, rate limits, PDF type/size, and review quota.
- The PDF is stored under `private-uploads/decks` by default, never in `public/`.
- Text is extracted from text-based PDFs with `unpdf`.
- The job enters `reviewing`, then each selected fictional firm reviews the extracted text.
- DeepSeek is used server-side when configured; otherwise local mock mode can exercise the flow.
- Firm outputs are validated with strict Zod schemas.
- The aggregate funding-market verdict is computed deterministically by backend code, not by the model.
- `GET /api/vc-review-jobs/:jobId` returns only a safe job view.

## Fictional Investment Firms

The firm catalog lives in `lib/deck-review/firms.ts`.

Current firms:

- `novaedge_ai_ventures`: AI, automation, agentic software, devtools. Aggressive technical investor.
- `fintrust_capital`: fintech, payments, compliance, wallets, B2B finance. Conservative regulated-market investor.
- `marketproof_partners`: SaaS, B2B, productivity, vertical software. Traction-focused seed investor.
- `frontier_consumer_fund`: consumer apps, gaming, social, creator tools. Growth and virality investor.
- `atlas_industrial_ventures`: logistics, supply chain, hardware-enabled software, deep tech. Operational infrastructure investor.
- `healthbridge_ventures`: health, wellness, medtech software. Risk-aware healthcare investor.
- `commercegrid_capital`: marketplaces, commerce, retail tech, B2B trade. Unit-economics investor.
- `climatestack_ventures`: climate, energy, infrastructure, ESG tooling. Long-horizon impact investor.

Each firm has:

- stable `id`
- public name and description
- sector focus
- stage focus
- check size range
- risk appetite
- thesis
- loves and deal breakers
- rubric weights
- tone
- private review instructions

The public firm endpoint strips `privateReviewInstructions`.

## API Contract

### List Firms

`GET /api/vc-review-firms`

Returns:

```json
{
  "firms": [
    {
      "id": "marketproof_partners",
      "name": "MarketProof Partners",
      "sectorFocus": ["saas", "b2b"],
      "checkSizeRange": "$250K - $2M",
      "riskAppetite": "balanced",
      "publicDescription": "..."
    }
  ],
  "disclaimer": "All investment firms in Founder Arena are fictional game entities..."
}
```

### Create Job

`POST /api/vc-review-jobs`

Auth required. Body is `multipart/form-data`:

- `startupId`: required.
- `deck`: required PDF file.
- `manualNotes`: optional, max 2,000 chars.
- `firmIds`: optional comma-separated firm IDs. When omitted, the backend auto-selects firms by startup sector.

Returns `202` on accepted readable deck:

```json
{
  "job": {
    "jobId": "clx...",
    "startupId": "clx...",
    "status": "reviewing",
    "selectedFirmIds": ["marketproof_partners"],
    "deckFileName": "deck.pdf",
    "deckPageCount": 10,
    "provider": null,
    "model": null,
    "errorCategory": null,
    "safeErrorMessage": null,
    "firmReviews": null,
    "aggregateReview": null
  }
}
```

### Get Job

`GET /api/vc-review-jobs/:jobId`

Auth required. Owner or configured admin only. Non-owners receive a not-found response to avoid job existence leaks.

Statuses:

- `uploaded`
- `extracting_deck`
- `reviewing`
- `completed`
- `failed`

Completed jobs return validated firm reviews and aggregate decision. In-progress jobs do not return raw deck text, notes, prompts, storage keys, hashes, or raw model payloads.

### Run Job

`POST /api/vc-review-jobs/:jobId/run`

Manual local/admin recovery endpoint. In development, the owner can run it. In production, configured admin access is required.

## PDF Limits

Implemented in `lib/deck-review/pdf.ts`.

- Max size: 15 MB.
- Max pages: 40.
- Max extracted text used/stored: 60,000 chars.
- Minimum extracted text: 200 chars.
- Accepted type: PDF extension or PDF MIME plus `%PDF-` magic bytes.
- Text-based PDFs only. Scanned/image-only PDFs fail clearly; OCR is out of scope for this phase.

## Security and Privacy

- DeepSeek keys are read only on the backend.
- No `NEXT_PUBLIC_DEEPSEEK_API_KEY` is allowed.
- Uploaded PDFs are stored outside `public/`.
- Storage keys are UUID-based and never derived from original filenames.
- Safe API views are rebuilt field by field and exclude:
  - `deckStorageKey`
  - `deckSha256`
  - `extractedText`
  - `extractedTextSha256`
  - `manualNotes`
  - prompts
  - raw provider payloads
- Public share/export surfaces should not query or expose `VcDeckReviewJob`.
- Audit logs contain only safe metadata: job IDs, hashes, counts, categories, provider/model label, duration, and success/failure category.
- Deck text is treated as untrusted prompt-injection input. Firm prompts instruct models to ignore deck-contained instructions.

## AI Provider

The deck review provider reuses the existing AI review runtime configuration in `lib/ai-review/config.ts` and layers deck-specific overrides in `lib/deck-review/config.ts`.

Relevant env vars:

```bash
DEEPSEEK_API_KEY=""
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-chat"

AI_REVIEW_ENABLED="true"
AI_REVIEW_PROVIDER="deepseek"
AI_REVIEW_MODE="direct"

DECK_REVIEW_ENABLED="true"
DECK_REVIEW_PROVIDER="deepseek"       # alias: VC_REVIEW_PROVIDER
DECK_REVIEW_MODEL="deepseek-reasoner" # alias: VC_REVIEW_MODEL
DECK_REVIEW_TIMEOUT_MS="45000"
DECK_REVIEW_MAX_ATTEMPTS_PER_FIRM="2"
DECK_REVIEW_MAX_FIRMS_PER_JOB="5"
DECK_REVIEW_MAX_JOBS_PER_USER_PER_DAY="10"
DECK_UPLOAD_DIR=""
```

Model selection is environment-configurable. No model ID or API key is put in client code.

When `DECK_REVIEW_PROVIDER=mock` or `VC_REVIEW_PROVIDER=mock`, the full job flow runs offline with deterministic mock firm reviews.

## Firm Review Schema

Each DeepSeek firm review must validate as strict JSON:

```json
{
  "decision": "pass | interested | conditional | term_sheet_ready",
  "score": 0,
  "confidence": 0,
  "checkSizeSuggestion": "string",
  "valuationView": "string",
  "whyTheyLikeIt": ["string"],
  "mainConcerns": ["string"],
  "dealBreakers": ["string"],
  "questionsForFounder": ["string"],
  "requiredMilestones": ["string"],
  "evidenceFromDeck": ["string"],
  "missingInformation": ["string"],
  "assumptionsMade": ["string"],
  "sectorFit": 0,
  "tractionScore": 0,
  "teamScore": 0,
  "marketScore": 0,
  "productScore": 0,
  "gtmScore": 0,
  "financialsScore": 0,
  "riskScore": 0,
  "summary": "string"
}
```

The backend attaches firm identity and provider metadata after validation.

Invalid model output is retried with one JSON repair prompt. Retryable provider failures use bounded retry/backoff.

## Aggregate Decision Schema

The aggregate review is computed server-side from validated firm reviews:

```json
{
  "overallDecision": "rejected | mixed | conditional | fundable",
  "overallScore": 0,
  "interestedFirmIds": ["string"],
  "passedFirmIds": ["string"],
  "strongestFitFirmId": "string",
  "fundingLikelihood": "low | medium | high",
  "topReasons": ["string"],
  "topRisks": ["string"],
  "bestNextMilestones": ["string"],
  "suggestedPitchFixes": ["string"],
  "playerFacingSummary": "string"
}
```

## Local Testing

Run offline validation:

```bash
npm run typecheck
npx vitest run tests/unit/deck-review.test.ts
npm test
```

Run a local mock deck-review flow:

```bash
DEMO_MODE_ENABLED=true
DECK_REVIEW_PROVIDER=mock
npm run dev
```

Then open a startup pitch page, upload a text-based PDF, and poll the job in the UI.

Run live DeepSeek only when a local server-side key is available:

```bash
DECK_REVIEW_PROVIDER=deepseek
DECK_REVIEW_MODEL=deepseek-reasoner
# VC_REVIEW_PROVIDER / VC_REVIEW_MODEL are accepted aliases.
DEEPSEEK_API_KEY=...
npm run dev
```

Do not commit uploaded PDFs, private upload directories, logs, or `.env` files.

## iOS Integration Contract

The native iOS app should call only the backend API:

1. Fetch `GET /api/vc-review-firms` to show selectable fictional firms.
2. Upload `multipart/form-data` to `POST /api/vc-review-jobs`.
3. Poll `GET /api/vc-review-jobs/:jobId`.
4. Render only the safe job view returned by the backend.

iOS must never contain:

- `DEEPSEEK_API_KEY`
- raw prompts
- provider URLs as secrets
- local deck storage paths
- raw extracted deck text

## Known Limitations

- OCR is not implemented. Scanned/image-only decks fail with a clear message.
- Jobs currently run with Next `after(...)` or manual `/run`; a durable external queue can be added later.
- Extracted deck text is stored privately in the database for job execution and retry. If stricter retention is required, a later phase can move extracted text to encrypted object storage or delete it after completion.
- Firm reviews are gameplay feedback, not legal, financial, or investment advice.

## Next Phase

- Native iOS PDF upload UI.
- iOS review status polling and firm-card result screen.
- Durable background worker for production review jobs.
- Admin panel counters for deck-review jobs and provider failure categories.
- Optional OCR pipeline after explicit privacy review.
