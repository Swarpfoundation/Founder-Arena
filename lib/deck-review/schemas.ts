import { z } from "zod";
import { INVESTMENT_FIRM_IDS } from "./firms";

/**
 * Strict output contracts for the AI investment firm deck review.
 * Model output MUST validate against `firmReviewModelOutputSchema` (after one
 * repair attempt); the aggregate is computed deterministically server-side so
 * it can never be fabricated by the model.
 */

const score = z.coerce.number().min(0).max(100);
const boundedText = z.string().trim().min(1).max(600);
const boundedList = z.array(boundedText).max(8).default([]);

export const FIRM_DECISIONS = ["pass", "interested", "conditional", "term_sheet_ready"] as const;
export type FirmDecision = (typeof FIRM_DECISIONS)[number];

/** What the model must return for a single firm review. */
export const firmReviewModelOutputSchema = z.object({
  decision: z.enum(FIRM_DECISIONS),
  score,
  confidence: score,
  checkSizeSuggestion: z.string().trim().max(120).default(""),
  valuationView: z.string().trim().max(300).default(""),
  whyTheyLikeIt: boundedList,
  mainConcerns: boundedList,
  dealBreakers: boundedList,
  questionsForFounder: boundedList,
  requiredMilestones: boundedList,
  evidenceFromDeck: boundedList,
  missingInformation: boundedList,
  assumptionsMade: boundedList,
  sectorFit: score,
  tractionScore: score,
  teamScore: score,
  marketScore: score,
  productScore: score,
  gtmScore: score,
  financialsScore: score,
  riskScore: score,
  summary: z.string().trim().min(1).max(1200),
});

export type FirmReviewModelOutput = z.infer<typeof firmReviewModelOutputSchema>;

/** A firm review as stored/returned by the API: model output + identity + provenance. */
export const firmReviewSchema = firmReviewModelOutputSchema.extend({
  firmId: z.string().min(1),
  firmName: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1).optional(),
  durationMs: z.number().int().nonnegative().optional(),
  repaired: z.boolean().default(false),
});

export type FirmReview = z.infer<typeof firmReviewSchema>;

export const OVERALL_DECISIONS = ["rejected", "mixed", "conditional", "fundable"] as const;
export type OverallDecision = (typeof OVERALL_DECISIONS)[number];

export const FUNDING_LIKELIHOODS = ["low", "medium", "high"] as const;
export type FundingLikelihood = (typeof FUNDING_LIKELIHOODS)[number];

export const aggregateReviewSchema = z.object({
  overallDecision: z.enum(OVERALL_DECISIONS),
  overallScore: score,
  interestedFirmIds: z.array(z.string()),
  passedFirmIds: z.array(z.string()),
  strongestFitFirmId: z.string().nullable(),
  fundingLikelihood: z.enum(FUNDING_LIKELIHOODS),
  topReasons: z.array(z.string()).max(6),
  topRisks: z.array(z.string()).max(6),
  bestNextMilestones: z.array(z.string()).max(6),
  suggestedPitchFixes: z.array(z.string()).max(6),
  playerFacingSummary: z.string().min(1).max(1200),
});

export type AggregateReview = z.infer<typeof aggregateReviewSchema>;

/** Job lifecycle states exposed by the API. */
export const DECK_REVIEW_JOB_STATUSES = [
  "uploaded",
  "extracting_deck",
  "reviewing",
  "completed",
  "failed",
] as const;
export type DeckReviewJobStatus = (typeof DECK_REVIEW_JOB_STATUSES)[number];

export const DECK_REVIEW_ERROR_CATEGORIES = [
  "invalid_pdf",
  "extraction_failed",
  "deck_too_large",
  "deck_unreadable",
  "provider_not_configured",
  "provider_timeout",
  "provider_rate_limited",
  "provider_invalid_output",
  "provider_failed",
  "internal_error",
] as const;
export type DeckReviewErrorCategory = (typeof DECK_REVIEW_ERROR_CATEGORIES)[number];

export function isKnownFirmId(id: string): boolean {
  return (INVESTMENT_FIRM_IDS as string[]).includes(id);
}

/**
 * Parses possibly-messy model text into the strict firm review model output.
 * Accepts a raw JSON string (with or without markdown fences); returns the
 * zod result so callers can decide between repair and failure.
 */
export function parseFirmReviewModelOutput(rawText: string):
  | { ok: true; value: FirmReviewModelOutput }
  | { ok: false; error: string } {
  let jsonText = rawText.trim();
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) jsonText = fenced[1].trim();

  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    return { ok: false, error: "Model output contained no JSON object." };
  }
  jsonText = jsonText.slice(firstBrace, lastBrace + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "Model output was not valid JSON." };
  }

  const result = firmReviewModelOutputSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.slice(0, 3).map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    return { ok: false, error: `Model output failed schema validation (${issues.join("; ")}).` };
  }
  return { ok: true, value: result.data };
}
