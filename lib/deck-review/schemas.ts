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

const optionalProfileText = (max = 300) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z.string().trim().max(max).optional()
  );

const optionalHttpUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string()
    .trim()
    .url()
    .max(300)
    .refine((value) => /^https?:\/\//i.test(value), "URL must start with http:// or https://")
    .optional()
);

const optionalCountryCode = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z]{2}$/.test(value), "Country code must be a 2-letter ISO code.")
    .optional()
);

export const REVIEW_INPUT_TYPES = ["pdf_upload", "manual_pitch", "ai_generated_deck", "structured_pitch_deck"] as const;
export type ReviewInputType = (typeof REVIEW_INPUT_TYPES)[number];

export const startupProfileSocialLinkSchema = z.object({
  platform: optionalProfileText(40),
  url: optionalHttpUrl,
}).strict().refine((value) => Boolean(value.url), {
  message: "Social link URL is required.",
  path: ["url"],
});

export const startupProfileSchema = z.object({
  companyName: optionalProfileText(120),
  oneLinePitch: optionalProfileText(240),
  city: optionalProfileText(80),
  country: optionalProfileText(80),
  countryCode: optionalCountryCode,
  websiteUrl: optionalHttpUrl,
  logoUploadKey: optionalProfileText(240),
  sector: optionalProfileText(80),
  targetCustomer: optionalProfileText(240),
  currentStage: optionalProfileText(80),
  shortDescription: optionalProfileText(600),
  problem: optionalProfileText(1000),
  solution: optionalProfileText(1000),
  market: optionalProfileText(500),
  businessModel: optionalProfileText(500),
  unfairAdvantage: optionalProfileText(1000),
  socialLinks: z.array(startupProfileSocialLinkSchema).max(8).default([]),
  realLifeStartup: z.coerce.boolean().default(false),
  founderGoal: optionalProfileText(300),
  fundingGoal: optionalProfileText(300),
  existingProductUrl: optionalHttpUrl,
  tractionSummary: optionalProfileText(500),
  revenueSummary: optionalProfileText(500),
  teamSummary: optionalProfileText(500),
  roadmapSummary: optionalProfileText(700),
}).strict();

export type StartupProfile = z.infer<typeof startupProfileSchema>;

export const generatedDeckSlideSchema = z.object({
  slideNumber: z.coerce.number().int().min(1).max(30),
  title: z.string().trim().min(1).max(80),
  headline: z.string().trim().min(1).max(180),
  bullets: z.array(z.string().trim().min(1).max(180)).min(1).max(6),
  speakerNote: z.string().trim().min(1).max(700),
});

export const generatedDeckSchema = z.object({
  deckTitle: z.string().trim().min(1).max(140),
  oneLinePitch: z.string().trim().min(1).max(240),
  slides: z.array(generatedDeckSlideSchema).min(8).max(14),
  generatedWarnings: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
  missingInfo: z.array(z.string().trim().min(1).max(240)).max(10).default([]),
  qualityScore: score,
});

export type GeneratedDeck = z.infer<typeof generatedDeckSchema>;

export const STRUCTURED_DECK_SECTION_KINDS = [
  "title",
  "problem",
  "solution",
  "product",
  "market",
  "targetCustomer",
  "businessModel",
  "traction",
  "goToMarket",
  "competition",
  "team",
  "fundingAsk",
  "roadmap",
] as const;
export type StructuredDeckSectionKind = (typeof STRUCTURED_DECK_SECTION_KINDS)[number];

export const STRUCTURED_DECK_EVIDENCE_LEVELS = ["missing", "weak", "adequate", "strong"] as const;
export type StructuredDeckEvidenceLevel = (typeof STRUCTURED_DECK_EVIDENCE_LEVELS)[number];

export const structuredDeckSectionSchema = z.object({
  kind: z.enum(STRUCTURED_DECK_SECTION_KINDS),
  headline: z.string().trim().max(240).default(""),
  bullets: z.array(z.string().trim().min(1).max(260)).max(8).default([]),
  speakerNote: z.string().trim().max(1_200).default(""),
  evidenceLevel: z.enum(STRUCTURED_DECK_EVIDENCE_LEVELS).default("missing"),
}).strict().superRefine((section, ctx) => {
  if (!section.headline && section.bullets.length === 0 && !section.speakerNote) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Deck section must include a headline, bullet, or speaker note.",
    });
  }
});

export const structuredPitchDeckSchema = z.object({
  title: z.string().trim().min(1).max(160),
  oneLinePitch: z.string().trim().max(280).default(""),
  sections: z.array(structuredDeckSectionSchema).min(1).max(20),
  notes: z.string().trim().max(2_000).default(""),
}).strict();

export type StructuredPitchDeck = z.infer<typeof structuredPitchDeckSchema>;

export const structuredPitchDeckSummarySchema = z.object({
  title: z.string(),
  oneLinePitch: z.string().nullable(),
  sectionCount: z.number().int().nonnegative(),
  sectionKinds: z.array(z.enum(STRUCTURED_DECK_SECTION_KINDS)),
  evidenceSummary: z.object({
    missing: z.number().int().nonnegative(),
    weak: z.number().int().nonnegative(),
    adequate: z.number().int().nonnegative(),
    strong: z.number().int().nonnegative(),
  }),
});

export type StructuredPitchDeckSummary = z.infer<typeof structuredPitchDeckSummarySchema>;

export function parseGeneratedDeckModelOutput(rawText: string):
  | { ok: true; value: GeneratedDeck }
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

  const result = generatedDeckSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.slice(0, 3).map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    return { ok: false, error: `Generated deck failed schema validation (${issues.join("; ")}).` };
  }
  return { ok: true, value: result.data };
}

export const MANUAL_PITCH_MIN_CHARS = 300;
export const MANUAL_PITCH_MAX_CHARS = 30_000;
export const GENERATED_DECK_REQUEST_MAX_CHARS = 4_000;

export function validateManualPitchText(value: unknown):
  | { ok: true; text: string }
  | { ok: false; message: string } {
  if (typeof value !== "string") {
    return { ok: false, message: "Pitch text is required." };
  }
  const text = value.trim();
  if (text.length < MANUAL_PITCH_MIN_CHARS) {
    return { ok: false, message: `Pitch text must be at least ${MANUAL_PITCH_MIN_CHARS} characters.` };
  }
  if (text.length > MANUAL_PITCH_MAX_CHARS) {
    return { ok: false, message: `Pitch text must be ${MANUAL_PITCH_MAX_CHARS} characters or less.` };
  }
  return { ok: true, text };
}

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

export const MISSION_GENERATION_STATUSES = ["not_started", "generating", "completed", "failed"] as const;
export type MissionGenerationStatus = (typeof MISSION_GENERATION_STATUSES)[number];

export const INVESTOR_MISSION_SOURCES = ["firm_review", "aggregate_review", "ai_roadmap", "safety_gate"] as const;
export type InvestorMissionSource = (typeof INVESTOR_MISSION_SOURCES)[number];

export const INVESTOR_MISSION_CATEGORIES = [
  "compliance",
  "product",
  "traction",
  "gtm",
  "fundraising",
  "finance",
  "security",
  "operations",
  "market_research",
  "team",
  "legal_planning",
] as const;
export type InvestorMissionCategory = (typeof INVESTOR_MISSION_CATEGORIES)[number];

export const INVESTOR_MISSION_EVIDENCE_SOURCES = [
  "deck",
  "manual_pitch",
  "startup_profile",
  "firm_feedback",
  "missing_information",
] as const;
export type InvestorMissionEvidenceSource = (typeof INVESTOR_MISSION_EVIDENCE_SOURCES)[number];

export const INVESTOR_MISSION_PRIORITIES = ["critical", "important", "optional"] as const;
export type InvestorMissionPriority = (typeof INVESTOR_MISSION_PRIORITIES)[number];

export const INVESTOR_MISSION_STATUSES = ["proposed", "accepted", "completed", "dismissed"] as const;
export type InvestorMissionStatus = (typeof INVESTOR_MISSION_STATUSES)[number];

export const INVESTOR_MISSION_PHASES = [
  "before_review",
  "before_term_sheet",
  "next_sprint",
  "demo_day_runway",
  "post_verdict",
] as const;
export type InvestorMissionPhaseSuggestion = (typeof INVESTOR_MISSION_PHASES)[number];

const missionSafetyBlockedPhrases = [
  "you are compliant",
  "legally compliant",
  "regulatory approval secured",
  "authorization granted",
  "license approved",
  "guaranteed funding",
  "funding is guaranteed",
  "real funding has been secured",
  "investors will invest",
];

const optionalMissionText = (max = 180) =>
  z.preprocess(
    (value) => (value === null || (typeof value === "string" && value.trim().length === 0) ? undefined : value),
    z.string().trim().min(1).max(max).optional()
  );

const compliancePlanningLanguage = [
  "clarify",
  "map",
  "identify",
  "prepare",
  "validate",
  "investigate",
  "document",
  "assess",
  "review",
  "outline",
  "confirm",
];

const investorMissionBaseSchema = z.object({
  id: optionalMissionText(80),
  source: z.enum(INVESTOR_MISSION_SOURCES).default("ai_roadmap"),
  firmId: optionalMissionText(120),
  category: z.enum(INVESTOR_MISSION_CATEGORIES),
  title: z.string().trim().min(4).max(140),
  summary: z.string().trim().min(12).max(700),
  whyItMatters: z.string().trim().min(12).max(700),
  acceptanceCriteria: z.array(z.string().trim().min(4).max(220)).min(2).max(6),
  evidenceSource: z.enum(INVESTOR_MISSION_EVIDENCE_SOURCES),
  priority: z.enum(INVESTOR_MISSION_PRIORITIES),
  status: z.enum(INVESTOR_MISSION_STATUSES).default("proposed"),
  phaseSuggestion: z.enum(INVESTOR_MISSION_PHASES),
  riskArea: optionalMissionText(180),
});

export const investorMissionSchema = investorMissionBaseSchema.superRefine((mission, ctx) => {
  const combined = [
    mission.title,
    mission.summary,
    mission.whyItMatters,
    mission.riskArea ?? "",
    ...mission.acceptanceCriteria,
  ].join(" ").toLowerCase();

  for (const phrase of missionSafetyBlockedPhrases) {
    if (combined.includes(phrase)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Mission contains unsafe claim: ${phrase}`,
      });
    }
  }

  if (mission.category === "compliance" || mission.category === "legal_planning") {
    const usesPlanningLanguage = compliancePlanningLanguage.some((word) => combined.includes(word));
    if (!usesPlanningLanguage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Compliance/legal-planning missions must use planning language such as clarify, map, identify, validate, or investigate.",
      });
    }
  }
});

export type InvestorMission = z.infer<typeof investorMissionSchema>;

export const investorMissionRoadmapSummarySchema = z.object({
  nextBestAction: z.string().trim().min(1).max(700),
  fundingBlockers: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
  investorConfidencePath: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
  recommendedOrder: z.array(z.string().trim().min(1).max(140)).max(8).default([]),
});

export type InvestorMissionRoadmapSummary = z.infer<typeof investorMissionRoadmapSummarySchema>;

export const investorMissionOutputSchema = z.object({
  missions: z.array(investorMissionSchema).min(3).max(8),
  roadmapSummary: investorMissionRoadmapSummarySchema,
});

export type InvestorMissionOutput = z.infer<typeof investorMissionOutputSchema>;

export function parseInvestorMissionModelOutput(rawText: string):
  | { ok: true; value: InvestorMissionOutput }
  | { ok: false; error: string } {
  let jsonText = rawText.trim();
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) jsonText = fenced[1].trim();

  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    return { ok: false, error: "Mission output contained no JSON object." };
  }
  jsonText = jsonText.slice(firstBrace, lastBrace + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "Mission output was not valid JSON." };
  }

  const result = investorMissionOutputSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.slice(0, 4).map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    return { ok: false, error: `Mission output failed schema validation (${issues.join("; ")}).` };
  }
  return { ok: true, value: result.data };
}

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
  "access_required",
  "invalid_pdf",
  "invalid_pitch",
  "invalid_profile",
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
