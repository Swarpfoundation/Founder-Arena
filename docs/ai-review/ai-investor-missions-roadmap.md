# Phase 25C: AI Investor Missions + Company Roadmap Engine

Founder Arena now turns AI investment-firm feedback into structured,
owner-only investor missions. These missions are game-world due-diligence
milestones: they help the player understand what fictional firms want to see
next, but they are not legal, financial, compliance, tax, investment, or
fundraising advice.

## Mission Model

Investor missions are stored privately on `VcDeckReviewJob` as validated JSON:

- `missionGenerationStatus`: `not_started`, `generating`, `completed`, `failed`
- `missionGenerationErrorCategory`
- `missionGenerationSafeErrorMessage`
- `investorMissions`
- `roadmapSummary`

Each mission contains:

- `id`
- `source`: `firm_review`, `aggregate_review`, `ai_roadmap`, `safety_gate`
- `firmId` optional
- `category`
- `title`
- `summary`
- `whyItMatters`
- `acceptanceCriteria`
- `evidenceSource`
- `priority`
- `status`
- `phaseSuggestion`
- `riskArea` optional

Mission categories:

- `compliance`
- `product`
- `traction`
- `gtm`
- `fundraising`
- `finance`
- `security`
- `operations`
- `market_research`
- `team`
- `legal_planning`

Mission priorities:

- `critical`
- `important`
- `optional`

Mission statuses:

- `proposed`
- `accepted`
- `completed`
- `dismissed`

Phase 25C only proposes missions. It does not implement a kanban board,
completion flow, or gameplay effects.

## Mission Schema

The AI provider must return strict JSON:

```json
{
  "missions": [
    {
      "source": "firm_review",
      "firmId": "fintrust_capital",
      "category": "compliance",
      "title": "Clarify fund custody authorization path",
      "summary": "Your pitch implies users may hold funds. Investors need to understand the custody, licensing, and compliance assumption map before funding.",
      "whyItMatters": "Fintech investors treat custody and licensing as a core funding risk.",
      "acceptanceCriteria": [
        "State whether the product is custodial or non-custodial",
        "Map the expected authorization or licensing path in the launch country",
        "Identify KYC/AML responsibility and operational owner",
        "Validate assumptions with a qualified legal or compliance reviewer"
      ],
      "evidenceSource": "startup_profile",
      "priority": "critical",
      "status": "proposed",
      "phaseSuggestion": "before_term_sheet",
      "riskArea": "fund custody / licensing"
    }
  ],
  "roadmapSummary": {
    "nextBestAction": "Clarify fund custody authorization path",
    "fundingBlockers": ["Unclear custody model"],
    "investorConfidencePath": ["Separate confirmed facts from assumptions"],
    "recommendedOrder": ["Clarify fund custody authorization path"]
  }
}
```

Validation rules:

- 3-8 missions per job.
- Missions must be specific to the startup and review feedback.
- Missions distinguish missing evidence from confirmed facts.
- Missions must not invent traction, customers, revenue, licenses, approvals,
  partnerships, or compliance status.
- Missions must not claim real funding or real investor action.
- Compliance and legal-planning missions must use planning language such as
  `clarify`, `map`, `identify`, `prepare`, `validate`, `investigate`,
  `document`, `assess`, `review`, or `outline`.

Blocked wording examples:

- `you are compliant`
- `legally compliant`
- `regulatory approval secured`
- `authorization granted`
- `license approved`
- `guaranteed funding`
- `investors will invest`

## Generation Flow

Mission generation runs after firm reviews and aggregate review complete.

Inputs:

- startup profile
- location/city/country
- website/product URL metadata
- sector and target customer
- PDF extracted text, manual pitch text, AI-generated deck text, or structured
  pitch deck draft evidence
- structured deck section kinds, order, evidence levels, bullets, and private
  speaker notes when the input type is `structured_pitch_deck`
- generated deck warnings/missing information if present
- missing or weak structured-deck evidence, such as absent funding ask, weak
  traction proof, missing GTM wedge, or compliance-sensitive problem/solution
  language
- selected firms
- firm review concerns, questions, deal breakers, and milestones
- aggregate review risks, pitch fixes, and best next milestones

Backend-26A note: when a deck generation or VC review job is created with
`startupId`, the backend first builds mission/review context from the stored
startup profile on that startup. Explicit `startupProfile` or `profile.*`
fields in the request can override the stored snapshot for that job only. This
lets native iOS-created startups carry profile fields such as problem, solution,
target customer, country, website, stage, traction summary, revenue summary,
team summary, and roadmap summary into investor missions without exposing the
private profile object publicly.

Flow:

1. Firm reviews are generated.
2. Aggregate funding-market verdict is computed deterministically.
3. `missionGenerationStatus` becomes `generating`.
4. Mock or DeepSeek mission generation runs.
5. Mission JSON is validated.
6. On success, job status becomes `completed` and missions are stored.
7. On mission failure, job status still becomes `completed`; the review result
   remains available with `missionGenerationStatus=failed`.

Access behavior:

- Mission generation is included in the already-authorized AI review.
- No additional credit is consumed for missions.
- Retrying a review job does not create a separate mission charge.

## API Contract

`GET /api/vc-review-jobs/:jobId` includes mission fields in the safe job view:

- `missionGenerationStatus`
- `missionCount`
- `missionGenerationErrorCategory`
- `missionGenerationSafeErrorMessage`
- `missions`
- `roadmapSummary`

`GET /api/vc-review-jobs/:jobId/missions` returns only mission fields for the
same owner/admin-safe job.

No API response returns:

- raw PDF text
- manual pitch text
- generated deck private JSON except generation owner endpoint
- private startup profile fields
- logo storage keys
- deck storage keys
- prompts
- raw provider output
- secrets

## iOS Integration Notes

Recommended mobile flow after a completed review:

1. Poll `GET /api/vc-review-jobs/:jobId`.
2. If `missionGenerationStatus=completed`, render the roadmap summary and
   mission cards.
3. If `missionGenerationStatus=generating`, show "Building investor missions".
4. If `missionGenerationStatus=failed`, still show firm review and aggregate
   verdict with a restrained mission failure note.
5. Treat missions as proposed due-diligence content, not deterministic game
   effects yet.

Suggested UI sections:

- Aggregate Verdict
- Firm Cards
- Investor Missions
- Roadmap Summary
- Funding Blockers

Safety copy:

> These are simulated investor due-diligence missions, not legal, financial,
> compliance, or investment advice.

## GitHub / Render Deployment Notes

GitHub target:

- `https://github.com/Swarpfoundation/Founder-Arena`

Render service:

- `srv-d8aua4ojs32c73buve70`

Do not deploy from this phase automatically. Before Render deployment, verify:

- `DATABASE_URL`
- `AUTH_SECRET` / session secrets used by the app
- `DEEPSEEK_API_KEY`
- `DECK_REVIEW_PROVIDER=deepseek` or `mock`
- `DECK_REVIEW_MODEL`
- `DECK_UPLOAD_DIR`
- `LOGO_UPLOAD_DIR`
- `DECK_AI_ACCESS_DEV_BYPASS` is not enabled in production

Commands:

- Build: `npm run build`
- Start: use the app's existing Render start command
- Validate Prisma: `npx prisma validate`
- Apply migrations: use the established Prisma migration workflow for Render

Production storage warning:

- Local `private-uploads` requires a persistent Render disk.
- Object storage is recommended later for production uploads and logos.
- Uploaded PDFs/logos must remain private; do not place them under `public/`.

## Future Phase 26

Future AI Game Director / Founder Destiny Engine should consume:

- startup profile
- firm review decisions
- aggregate verdict
- investor missions
- sprint history
- mission completion state

The AI may propose bounded narrative pressure and next events, but deterministic
game code should remain responsible for applying cash, valuation, risk,
funding, acquisition, and persistence effects.
