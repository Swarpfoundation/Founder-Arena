import type {
  AIReviewInput,
  AIReviewProviderMetadata,
  AIReviewResult,
  VCReviewDimensionAssessment,
  VCReviewDimensionKey,
  VCReviewFinalDecision,
} from "./types";
import { aiReviewRawOutputSchema } from "./schemas";
import { decisionForVcReviewStorage, enforceVCDecisionRules } from "./rubric";

function clampInt(value: unknown, fallback: number, min = 0, max = 100): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(Math.min(max, Math.max(min, parsed)));
}

function clampMoney(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.min(20_000_000, Math.round(parsed));
}

function clampEquity(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Number(Math.min(49, Math.max(0.1, parsed)).toFixed(2));
}

function normalizeModelRecommendation(decision: string | undefined): VCReviewFinalDecision {
  if (decision === "conditional" || decision === "revise") return "conditional";
  if (decision === "accept" || decision === "proposal") return "accept";
  if (decision === "reject") return "reject";
  return "conditional";
}

function ensureList(value: string[] | undefined, fallback: string[]): string[] {
  const items = (value ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  return items.length > 0 ? items : fallback;
}

function buildDimension(
  score: number,
  detail: { evidence?: string[]; concerns?: string[]; confidence?: "low" | "medium" | "high" } | undefined,
  fallbackEvidence: string[],
  fallbackConcerns: string[]
): VCReviewDimensionAssessment {
  return {
    score,
    evidence: ensureList(detail?.evidence, fallbackEvidence).slice(0, 3),
    concerns: ensureList(detail?.concerns, fallbackConcerns).slice(0, 3),
    confidence: detail?.confidence ?? "medium",
  };
}

export function normalizeAIReviewOutput(
  raw: unknown,
  metadata: AIReviewProviderMetadata,
  input?: AIReviewInput
): AIReviewResult {
  const parsed = aiReviewRawOutputSchema.parse(raw);
  const modelRecommendation = normalizeModelRecommendation(parsed.modelRecommendation ?? parsed.decision);
  const overallScore = clampInt(parsed.overallScore, 50);
  const scoreProblem = clampInt(parsed.scoreProblem ?? parsed.problemScore, overallScore);
  const scoreSolution = clampInt(parsed.scoreSolution ?? parsed.solutionScore, overallScore);
  const scoreMarket = clampInt(parsed.scoreMarket ?? parsed.marketScore, overallScore);
  const scoreTeam = clampInt(parsed.scoreTeam ?? parsed.teamScore, 50);
  const scoreBusiness = clampInt(parsed.scoreBusiness ?? parsed.businessScore, overallScore);
  const dimensions: Record<VCReviewDimensionKey, VCReviewDimensionAssessment> = {
    problem: buildDimension(
      scoreProblem,
      parsed.dimensionEvidence?.problem,
      ["The pitch identifies a customer pain that can be evaluated."],
      ["The severity, urgency, or customer proof needs more precision."]
    ),
    solution: buildDimension(
      scoreSolution,
      parsed.dimensionEvidence?.solution,
      ["The solution describes a plausible product direction."],
      ["The wedge, differentiation, or feasibility requires sharper evidence."]
    ),
    market: buildDimension(
      scoreMarket,
      parsed.dimensionEvidence?.market,
      ["The pitch gives some market or timing rationale."],
      ["Market size, access, timing, or competition claims need stronger support."]
    ),
    team: buildDimension(
      scoreTeam,
      parsed.dimensionEvidence?.team,
      ["The team section gives some execution context."],
      ["Team fit, missing roles, or hiring plan needs more detail."]
    ),
    business: buildDimension(
      scoreBusiness,
      parsed.dimensionEvidence?.business,
      ["The pitch includes a monetization or use-of-funds plan."],
      ["Unit economics, GTM realism, or funding discipline needs more support."]
    ),
  };
  const fallbackInput =
    input ??
    ({
      startupId: "unknown",
      startupName: "Unknown Startup",
      sector: "unknown",
      region: "unknown",
      stage: "idea",
      fundingAsk: 0,
      monetizationModel: "unknown",
      pitchDeck: {
        problem: "",
        solution: "",
        marketSize: "",
        product: "",
        businessModel: "",
        goToMarket: "",
        competition: "",
        team: "",
        financialPlan: "",
        ask: "",
        useOfFunds: "",
      },
    } satisfies AIReviewInput);
  const reviewQuality = enforceVCDecisionRules(fallbackInput, {
    modelRecommendation,
    overallScore,
    dimensions,
    strengths: ensureList(parsed.strengths, ["Clear founder insight"]),
    weaknesses: ensureList(parsed.weaknesses, ["Needs more validation"]),
    redFlags: parsed.redFlags,
    missingInformation: parsed.missingInformation,
    rejectionReasons: parsed.rejectionReasons,
    conditionalRequirements: parsed.conditionalRequirements,
    minimumEvidenceNeeded: parsed.minimumEvidenceNeeded,
    whatWouldChangeDecision: parsed.whatWouldChangeDecision,
    acceptanceRationale: parsed.acceptanceRationale,
    majorRisksStillPresent: parsed.majorRisksStillPresent,
    milestoneConditions: parsed.milestoneConditions,
    termSheetRecommendation: parsed.termSheetRecommendation ?? parsed.termSheetDraft,
    noTermSheetReason: parsed.noTermSheetReason,
    proposedAmount: parsed.proposedAmount ?? undefined,
    proposedEquity: parsed.proposedEquity ?? parsed.equityPercent ?? undefined,
  });
  const decision = decisionForVcReviewStorage(reviewQuality.finalDecision);
  const proposedAmount = decision === "proposal" ? clampMoney(parsed.proposedAmount) : undefined;
  const proposedEquity = decision === "proposal"
    ? clampEquity(parsed.proposedEquity ?? parsed.equityPercent)
    : undefined;

  return {
    decision,
    overallScore,
    scoreProblem,
    scoreSolution,
    scoreMarket,
    scoreTeam,
    scoreBusiness,
    memo: parsed.memo,
    strengths: ensureList(parsed.strengths, ["Clear founder insight"]),
    weaknesses: ensureList(parsed.weaknesses, ["Needs more validation"]),
    marketTiming: parsed.marketTiming,
    milestones: ensureList(parsed.milestones ?? parsed.milestoneRecommendations, [
      "Validate demand with qualified customers",
      "Ship a focused MVP",
    ]),
    proposedAmount,
    proposedEquity,
    feedback:
      parsed.feedback ??
      parsed.founderCoachingNotes ??
      (decision === "proposal" ? "Investor interest is credible." : "Improve the pitch and de-risk execution."),
    providerMetadata: metadata,
    reviewQuality,
  };
}

export function parseJsonObjectFromText(text: string): unknown {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = codeBlock?.[1] ?? text.match(/(\{[\s\S]*\})/)?.[1] ?? text;
  return JSON.parse(candidate.trim());
}
