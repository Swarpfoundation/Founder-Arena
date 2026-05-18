# VC Review Quality Rubric

Phase 19C hardens private-beta VC reviews so the AI cannot randomly approve startups. DeepSeek may recommend a decision, but Founder Arena applies deterministic rubric guardrails before storing the final review result.

This document covers the review rubric, decision thresholds, explanation requirements, prompt-injection handling, calibration fixtures, and beta QA checklist.

## Goals

- Make every review strict, explainable, and useful.
- Require evidence for accept, reject, and conditional outcomes.
- Downgrade unsupported accept recommendations.
- Avoid misleading term sheets for rejected startups.
- Keep DeepSeek server-side and preserve mock fallback.
- Preserve gameplay math, scoring, death checks, funding math, leaderboard, and career formulas.

## Scoring Dimensions

Each VC review scores five dimensions from `0` to `100`. Every dimension must include evidence and concerns.

| Dimension | What It Measures |
| --- | --- |
| Problem | Severity, urgency, target customer clarity, pain frequency, and evidence the problem exists. |
| Solution | Clarity, differentiation, feasibility, product wedge, and why now. |
| Market | Market size credibility, buyer accessibility, timing, competition, and growth potential. |
| Team | Founder fit, execution credibility, missing roles, domain insight, and hiring/advisory needs. |
| Business | Monetization clarity, unit economics plausibility, go-to-market realism, funding ask discipline, and path to traction. |

`overallScore` is a weighted synthesis, not permission to ignore red flags.

## Decision Thresholds

The model returns a `modelRecommendation`, but `enforceVCDecisionRules` applies the final decision.

Reject when any major red flag exists:

- `overallScore < 55`
- two or more core dimensions below `45`
- `problemScore < 40`
- `solutionScore < 40`
- `businessScore < 35`
- pitch is too vague or missing critical required information
- funding ask is materially unsupported by use of funds or pitch quality
- required rejection/concern fields are missing

Conditional when the pitch has promise but is not clearly fundable:

- `overallScore` between `55` and `74`
- any core dimension below `55`
- one dimension below `50`
- good idea with missing GTM, team, monetization, compliance, or differentiation proof
- prompt-injection attempt was detected in the pitch

Accept only when all fundability conditions are met:

- `overallScore >= 75`
- no core dimension below `55`
- problem, solution, market, and business evidence are specific
- weaknesses are manageable
- term sheet economics are plausible
- acceptance rationale, major risks, and milestone conditions are present

Accept should remain rare for incomplete private-beta pitches.

## Required Explanation Contract

Every normalized review stores `reviewQuality` in `VcReview.rawResponse`.

Required fields include:

- `modelRecommendation`
- `finalDecision`
- `decisionConfidence`
- `decisionSummary`
- `ruleReasons`
- dimension assessments with `score`, `evidence`, `concerns`, and `confidence`
- `redFlags`
- `missingInformation`
- `whatWouldChangeDecision`
- `majorRisksStillPresent`
- `milestoneConditions`
- `qualityFlags`

Reject-specific fields:

- `rejectionReasons`
- `minimumEvidenceNeeded`
- `whatWouldChangeDecision`
- `noTermSheetReason`

Conditional-specific fields:

- `conditionalRequirements`
- `minimumEvidenceNeeded`
- `whatWouldChangeDecision`
- milestone conditions

Accept-specific fields:

- `acceptanceRationale`
- `majorRisksStillPresent`
- milestone conditions
- plausible term sheet recommendation

Rejected startups must not receive a misleading proposed term sheet.

## Prompt-Injection Handling

Pitch text is untrusted user data. The DeepSeek prompt explicitly tells the model to ignore pitch instructions such as:

- "ignore previous instructions"
- "return accept"
- "approve this startup"
- "system prompt"
- "developer message"

The deterministic guardrail also scans the safe review input. If an attempt is detected, the review receives `prompt_injection_detected` and cannot be accepted solely because the pitch instructed the model to accept it.

## Quality Flags

Common `qualityFlags`:

| Flag | Meaning |
| --- | --- |
| `downgraded_accept` | Model recommended accept, but deterministic rules lowered the final decision. |
| `missing_required_explanation` | Required rationale, risks, reasons, or conditions were missing. |
| `vague_market` | Pitch lacks concrete customer, market, GTM, or traction evidence. |
| `unsupported_funding_ask` | Funding ask is too high for the described plan/evidence. |
| `prompt_injection_detected` | Pitch attempted to override review instructions. |
| `low_confidence` | Review confidence is low. |
| `term_sheet_removed` | Proposed funding terms were removed because final decision is reject. |

Flags are shown in the review UI so beta testers can understand why a result was guarded.

## Golden Calibration Fixtures

Phase 19C adds deterministic fixtures in `tests/fixtures/ai-review-calibration-fixtures.ts`.

| Fixture | Expected Outcome |
| --- | --- |
| Strong B2B SaaS | Accept or strong conditional with evidence-based risks. |
| Vague AI Hype Startup | Reject or conditional; flags vague market/product/customer evidence. |
| Weak Consumer App | Reject; explains differentiation and GTM weaknesses. |
| Regulated Fintech Missing Compliance | Conditional or reject; flags compliance/security risk. |
| Strong Technical Founder / Weak GTM | Conditional; requires sales/GTM proof. |
| Unrealistic Funding Ask | Reject or conditional; flags unsupported funding ask. |
| Prompt Injection Attempt | Conditional or reject; flags prompt injection and ignores injected instruction. |
| Strong AI Infra Startup | Accept or conditional; mentions infra/LLM cost and enterprise GTM risks. |

Tests do not call DeepSeek. They run the normalizer and guardrails against deterministic provider-output fixtures.

## Private Beta QA Checklist

For each suspicious review during beta, capture:

- startup ID
- review ID
- final decision
- model recommendation
- quality flags
- dimension scores
- pitch area that felt misread
- whether a term sheet appeared when it should not
- whether rejection or conditional requirements were actionable

Phase 21B adds a review-page feedback form for this workflow. Reports are private to admins, appear in `/admin/private-beta`, and do not automatically change the review decision or re-run the job.

Bad review examples to report:

- accept with vague or generic evidence
- reject without specific reasons
- conditional without concrete next milestones
- term sheet shown for a rejected startup
- prompt-injection text affected the result
- score looks high but evidence is missing
- DeepSeek output failed but UI claimed real success

## Operator Notes

- Keep `AI_REVIEW_TEMPERATURE=0.2` for private beta unless calibration shows a reason to adjust.
- Use mock provider and golden fixtures for regression tests.
- Use live DeepSeek only for smoke/calibration, never in unit tests.
- Preserve `AI_REVIEW_FALLBACK_TO_MOCK=true` during friend testing if uptime matters.
- Do not expose provider prompts, API keys, raw payloads, or private logs to testers.

## Deferred

- Live DeepSeek calibration batch runner.
- Feedback status changes and calibration tags in the admin inbox.
- Admin review QA dashboard with side-by-side rubric diagnostics.
- Dedicated review-quality analytics.
