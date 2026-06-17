# Phase 25B: Pitch Intake, AI Deck Generation, Startup Profile, and Access Gate

Founder Arena now supports four backend review inputs for the fictional AI
investment firm market:

1. PDF pitch deck upload.
2. Manual pitch text.
3. AI-generated professional deck.
4. Structured pitch deck draft from the native in-game builder.

This phase prepares the backend and web test UI for future native iOS intake.
It does not add iOS code, OCR, real investor outreach, CRM, email sending,
payment provider changes, or the future AI Game Director.

## Input Modes

### `pdf_upload`

- Existing PDF behavior.
- Requires a text-based PDF file in the `deck` multipart field.
- Max file size: 15 MB.
- Max pages: 40.
- OCR is not supported.
- PDF is stored privately under `DECK_UPLOAD_DIR` or
  `private-uploads/decks`.

### `manual_pitch`

- Requires `pitchText`.
- Minimum length: 300 characters.
- Maximum length: 30,000 characters.
- No PDF is required.
- The pitch text is stored privately as `extractedText` on the review job and
  never returned through the safe API view.

### `ai_generated_deck`

- Uses a completed `VcDeckGenerationJob`.
- Submit `generatedDeckJobId` to `POST /api/vc-review-jobs`.
- The generated deck JSON is converted to review text server-side.
- The generated deck is stored privately on the review job for future gameplay
  consumption, but raw generated deck JSON is not exposed through public share
  pages.

### `structured_pitch_deck`

- Uses a founder-authored `PitchDeckDraft` from the native app.
- Submit `structuredDeck` to `POST /api/vc-review-jobs`.
- No PDF file and no manual pitch text are required.
- The backend validates the deck JSON strictly, preserves section order, and
  converts sections into private review evidence for fictional firm prompts.
- Raw section bullets, speaker notes, and deck notes are stored privately on the
  review job and are not returned in normal safe job responses.
- Safe job responses may return only a `deckSummary` with title, one-line
  pitch, section count, section kinds, and evidence-level counts.

Structured deck validation:

- `title`: required, max 160 characters.
- `oneLinePitch`: optional, max 280 characters.
- `notes`: optional, max 2,000 characters.
- `sections`: 1-20 sections.
- allowed section kinds:
  `title`, `problem`, `solution`, `product`, `market`, `targetCustomer`,
  `businessModel`, `traction`, `goToMarket`, `competition`, `team`,
  `fundingAsk`, `roadmap`.
- allowed evidence levels: `missing`, `weak`, `adequate`, `strong`.
- section `headline`: max 240 characters.
- section `bullets`: up to 8 bullets, max 260 characters each.
- section `speakerNote`: max 1,200 characters.

## Startup Profile Metadata

Review and generation APIs accept private startup profile context:

- `companyName`
- `city`
- `country`
- `websiteUrl`
- `logo`
- `sector`
- `targetCustomer`
- `currentStage`
- `shortDescription`
- `realLifeStartup`
- `founderGoal`
- `fundingGoal`
- `existingProductUrl`
- `tractionSummary`
- `revenueSummary`
- `teamSummary`

Validation rules:

- URLs must be valid URLs.
- Text fields are trimmed, bounded, and stripped of angle brackets.
- Logo uploads must be PNG, JPEG, or WebP.
- Logo max size is 2 MB.
- Logos are stored privately under `LOGO_UPLOAD_DIR` or
  `private-uploads/logos`.

Safe API views may return high-level source summaries, but they do not return:

- `logoUploadKey`
- private logo paths
- raw pitch text
- extracted PDF text
- storage keys
- raw prompts
- raw provider output

## AI Deck Generation

Endpoint:

`POST /api/deck-generation-jobs`

Multipart fields:

- `startupId` required.
- `requestText` required, minimum 80 characters, max 4,000 characters.
- Startup profile fields may be submitted as `profile.<field>` fields or as a
  `startupProfile` JSON object.
- Optional `logo` file.

Response:

```json
{
  "job": {
    "jobId": "clx_generation_job",
    "startupId": "clx_startup",
    "status": "completed",
    "provider": "mock",
    "model": "mock",
    "errorCategory": null,
    "safeErrorMessage": null,
    "accessUsedCredit": false,
    "createdAt": "2026-06-11T21:00:00.000Z",
    "startedAt": "2026-06-11T21:00:00.000Z",
    "completedAt": "2026-06-11T21:00:02.000Z",
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
      "missingInfo": ["Retention evidence", "Revenue details"],
      "qualityScore": 70
    }
  }
}
```

Deck schema:

- `deckTitle`
- `oneLinePitch`
- `slides[]`
  - `slideNumber`
  - `title`
  - `headline`
  - `bullets[]`
  - `speakerNote`
- `generatedWarnings[]`
- `missingInfo[]`
- `qualityScore`

Recommended slide order:

1. Title / One-line pitch
2. Problem
3. Solution
4. Product
5. Market
6. Target Customer
7. Business Model
8. Traction or Validation
9. Go-to-Market
10. Competition / Differentiation
11. Team
12. Funding Ask / Use of Funds

Rules enforced in prompt/schema:

- Do not invent traction, revenue, customers, licenses, or team credentials.
- Missing evidence must be called out in `missingInfo`.
- No real funding claims.
- No legal/medical/financial claims without evidence.
- Output must validate as strict JSON.
- Mock mode returns deterministic valid deck JSON.

## Access Gate

Expensive AI actions are server-gated:

- AI deck generation.
- AI investment firm review.

Allowed:

- `pro` or `max` users.
- Configured admin users.
- Free users with at least one `submission_credit`.
- Development-only bypass if `DECK_AI_ACCESS_DEV_BYPASS=true` and
  `NODE_ENV !== production`.

Blocked response:

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

Credit behavior:

- A free user with credits spends exactly one `submission_credit` when the AI
  action starts.
- Credit spend is stored in the existing referral reward ledger as a negative
  `submission_credit`.
- Idempotency keys are scoped to the generation/review job ID, so retrying the
  same backend job does not double-spend.
- Manual form editing is free because no AI action runs.

No real ad SDK/provider was added. The gate reuses the existing rewarded /
referral credit abstraction.

## API Summary

### Generate Deck

`POST /api/deck-generation-jobs`

Creates a generated deck job and returns safe owner-only generated deck JSON.

## Phase 25C Investor Missions

After a PDF, manual pitch, or AI-generated deck review completes, the backend
also generates owner-only investor missions:

- firm-specific due-diligence milestones
- aggregate company roadmap summary
- funding blockers
- next best actions
- recommended order

Mission generation is included in the already-authorized review action and does
not consume a second rewarded/submission credit. If mission generation fails,
the firm review and aggregate verdict remain available.

See `docs/ai-review/ai-investor-missions-roadmap.md` for the mission schema,
safety rules, API fields, iOS implications, and Render/GitHub deployment notes.

`GET /api/deck-generation-jobs/:jobId`

Returns the safe generated deck job. Owner/admin only.

### Submit to AI Firms

`POST /api/vc-review-jobs`

Common fields:

- `startupId`
- `inputType`: `pdf_upload`, `manual_pitch`, or `ai_generated_deck`
- `manualNotes`
- `firmIds`
- profile fields
- `logo`

Mode-specific fields:

- `pdf_upload`: `deck`
- `manual_pitch`: `pitchText`
- `ai_generated_deck`: `generatedDeckJobId`

Safe review job response includes:

- `reviewInputType`
- `sourceSummary`
- `accessUsedCredit`
- existing safe status/result fields

It never includes raw private input text, profile private fields, logo storage
keys, prompts, or provider payloads.

## iOS Implications

Recommended future iOS flow:

1. Fetch fictional firms.
2. Let player choose input mode.
3. Collect private profile fields.
4. For AI deck mode, call `POST /api/deck-generation-jobs`.
5. Preview generated slides from the safe owner response.
6. Submit `generatedDeckJobId` or manual/PDF input to `POST /api/vc-review-jobs`.
7. Poll `GET /api/vc-review-jobs/:jobId`.
8. Render aggregate verdict and firm review cards.
9. Show access-required UI if the server returns `402`.

## Future Phase 26: AI Game Director / Founder Destiny Engine

The new data model stores profile context, selected firms, firm decisions,
aggregate verdicts, required milestones, top risks, and suggested next moves.
Phase 26 can use this data to generate bounded founder destiny events:

- AI proposes narrative pressure and investor reactions.
- The deterministic game engine applies only allowed structured effects.
- AI never directly sets cash, burn, runway, valuation, leaderboard score, or
  final outcome.

## Known Limitations

- OCR is still not supported.
- Generated deck output is structured JSON, not a rendered PDF.
- Logo files are private backend files; there is no auth-safe image serving
  endpoint yet.
- Live DeepSeek smoke still requires server-side `DEEPSEEK_API_KEY` and
  `DATABASE_URL`.
