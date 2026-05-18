import type {
  AIReviewInput,
  VCReviewDimensionAssessment,
  VCReviewDimensionKey,
  VCReviewFinalDecision,
  VCReviewQualityAssessment,
  VCReviewQualityFlag,
} from "./types";

export const VC_REVIEW_DIMENSIONS: Array<{
  key: VCReviewDimensionKey;
  label: string;
  checks: string[];
}> = [
  {
    key: "problem",
    label: "Problem",
    checks: ["severity", "urgency", "target customer clarity", "frequency", "evidence of pain"],
  },
  {
    key: "solution",
    label: "Solution",
    checks: ["clarity", "differentiation", "feasibility", "product wedge", "why now"],
  },
  {
    key: "market",
    label: "Market",
    checks: ["market size credibility", "buyer access", "timing", "competition", "growth potential"],
  },
  {
    key: "team",
    label: "Team",
    checks: ["founder fit", "execution credibility", "missing roles", "domain insight", "hiring needs"],
  },
  {
    key: "business",
    label: "Business",
    checks: ["monetization clarity", "unit economics", "GTM realism", "funding discipline", "path to traction"],
  },
];

export interface VCReviewDraftForRules {
  modelRecommendation: VCReviewFinalDecision;
  overallScore: number;
  dimensions: Record<VCReviewDimensionKey, VCReviewDimensionAssessment>;
  strengths: string[];
  weaknesses: string[];
  redFlags?: string[];
  missingInformation?: string[];
  rejectionReasons?: string[];
  conditionalRequirements?: string[];
  minimumEvidenceNeeded?: string[];
  whatWouldChangeDecision?: string[];
  acceptanceRationale?: string[];
  majorRisksStillPresent?: string[];
  milestoneConditions?: string[];
  termSheetRecommendation?: string;
  noTermSheetReason?: string;
  proposedAmount?: number;
  proposedEquity?: number;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function textContainsAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function detectPromptInjectionAttempt(input: AIReviewInput): boolean {
  const text = Object.values(input.pitchDeck).filter(Boolean).join("\n").toLowerCase();
  return textContainsAny(text, [
    /ignore (all )?(previous|prior|above|system|developer) (instructions|rules)/,
    /return (only )?(accept|approved|proposal)/,
    /you are now/,
    /disregard (the )?(rubric|instructions|system)/,
    /override (the )?(review|scoring|guardrails)/,
  ]);
}

export function detectVaguePitch(input: AIReviewInput): string[] {
  const missing: string[] = [];
  const fields: Array<[string, string | null | undefined]> = [
    ["target customer/problem evidence", input.pitchDeck.problem],
    ["specific product wedge", input.pitchDeck.product],
    ["go-to-market proof", input.pitchDeck.goToMarket],
    ["credible market sizing", input.pitchDeck.marketSize],
    ["monetization/unit economics", input.pitchDeck.businessModel],
  ];
  for (const [label, value] of fields) {
    const text = (value ?? "").trim();
    if (text.length < 35 || /\b(tbd|coming soon|everyone|all users|ai-powered platform)\b/i.test(text)) {
      missing.push(label);
    }
  }
  return missing;
}

export function detectUnsupportedFundingAsk(input: AIReviewInput): boolean {
  const planText = `${input.pitchDeck.financialPlan} ${input.pitchDeck.useOfFunds}`.toLowerCase();
  const hasMilestones = /\b(mrr|revenue|customers|runway|hire|launch|pilot|sales|engineering|compliance)\b/.test(planText);
  const hasNumbers = /\$?\d/.test(planText);
  return input.fundingAsk >= 1_000_000 && (!hasMilestones || !hasNumbers || planText.length < 100);
}

function fallbackReasonsFromDraft(draft: VCReviewDraftForRules): string[] {
  return [
    ...draft.weaknesses,
    ...Object.values(draft.dimensions).flatMap((dimension) => dimension.concerns),
  ].filter(Boolean).slice(0, 5);
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))).slice(0, 8);
}

function normalizeDecisionForStorage(decision: VCReviewFinalDecision): "proposal" | "revise" | "reject" {
  if (decision === "accept") return "proposal";
  if (decision === "conditional") return "revise";
  return "reject";
}

export function enforceVCDecisionRules(input: AIReviewInput, draft: VCReviewDraftForRules): VCReviewQualityAssessment {
  const ruleReasons: string[] = [];
  const qualityFlags: VCReviewQualityFlag[] = [];
  const redFlags = [...(draft.redFlags ?? [])];
  const missingInformation = [...(draft.missingInformation ?? [])];
  const dimensions = Object.fromEntries(
    Object.entries(draft.dimensions).map(([key, dimension]) => [
      key,
      {
        ...dimension,
        score: clampScore(dimension.score),
        evidence: unique(dimension.evidence),
        concerns: unique(dimension.concerns),
      },
    ])
  ) as Record<VCReviewDimensionKey, VCReviewDimensionAssessment>;

  const scores = Object.values(dimensions).map((dimension) => dimension.score);
  const lowCoreCount = scores.filter((score) => score < 45).length;
  const anyBelowFifty = scores.some((score) => score < 50);
  const vagueMissing = detectVaguePitch(input);
  const promptInjectionDetected = detectPromptInjectionAttempt(input);
  const unsupportedFundingAsk = detectUnsupportedFundingAsk(input);
  const missingExplanation = Object.values(dimensions).some(
    (dimension) => dimension.evidence.length === 0 || dimension.concerns.length === 0
  );

  if (promptInjectionDetected) {
    redFlags.push("Pitch contains instruction-like text attempting to override the review rubric.");
    qualityFlags.push("prompt_injection_detected");
    ruleReasons.push("Prompt-injection-like text was treated as pitch content, not instructions.");
  }
  if (vagueMissing.length > 0) {
    missingInformation.push(...vagueMissing);
    qualityFlags.push("vague_market");
  }
  if (unsupportedFundingAsk) {
    redFlags.push("Funding ask is not supported by a sufficiently specific financial plan or use-of-funds narrative.");
    qualityFlags.push("unsupported_funding_ask");
    ruleReasons.push("Funding ask requires stronger milestone and use-of-funds support.");
  }
  if (missingExplanation) {
    qualityFlags.push("missing_required_explanation");
    ruleReasons.push("One or more score dimensions lacked complete evidence and concern bullets.");
  }

  let finalDecision: VCReviewFinalDecision = draft.modelRecommendation;
  if (
    draft.overallScore < 55 ||
    lowCoreCount >= 2 ||
    dimensions.problem.score < 40 ||
    dimensions.solution.score < 40 ||
    dimensions.business.score < 35 ||
    unsupportedFundingAsk ||
    (missingExplanation && draft.modelRecommendation === "accept") ||
    vagueMissing.length >= 3
  ) {
    finalDecision = "reject";
  } else if (
    draft.overallScore < 75 ||
    anyBelowFifty ||
    dimensions.problem.score < 55 ||
    dimensions.solution.score < 55 ||
    dimensions.market.score < 55 ||
    dimensions.business.score < 55 ||
    vagueMissing.length > 0 ||
    promptInjectionDetected
  ) {
    finalDecision = "conditional";
  } else {
    finalDecision = "accept";
  }

  if (draft.modelRecommendation === "accept" && finalDecision !== "accept") {
    qualityFlags.push("downgraded_accept");
    ruleReasons.push(`Decision adjusted by rubric guardrail from accept to ${finalDecision}.`);
  }

  const fallbackReasons = fallbackReasonsFromDraft(draft);
  const rejectionReasons = finalDecision === "reject"
    ? unique([...(draft.rejectionReasons ?? []), ...fallbackReasons, ...redFlags]).slice(0, 6)
    : unique(draft.rejectionReasons ?? []);
  const conditionalRequirements = finalDecision === "conditional"
    ? unique([
        ...(draft.conditionalRequirements ?? []),
        ...vagueMissing.map((item) => `Clarify ${item}.`),
        ...Object.values(dimensions).flatMap((dimension) => dimension.concerns).slice(0, 4),
      ]).slice(0, 6)
    : unique(draft.conditionalRequirements ?? []);
  const minimumEvidenceNeeded = finalDecision === "accept"
    ? unique(draft.minimumEvidenceNeeded ?? [])
    : unique([
        ...(draft.minimumEvidenceNeeded ?? []),
        "Customer or user proof tied to a named target segment.",
        "Specific go-to-market motion with credible acquisition path.",
      ]).slice(0, 6);
  const whatWouldChangeDecision = finalDecision === "accept"
    ? unique(draft.whatWouldChangeDecision ?? [])
    : unique([
        ...(draft.whatWouldChangeDecision ?? []),
        "Sharper pitch evidence across the weakest scoring dimensions.",
        "Milestones that connect funding ask to traction and risk reduction.",
      ]).slice(0, 6);
  const majorRisksStillPresent = unique([
    ...(draft.majorRisksStillPresent ?? []),
    ...fallbackReasons.slice(0, 3),
  ]).slice(0, 6);
  const acceptanceRationale = finalDecision === "accept"
    ? unique([
        ...(draft.acceptanceRationale ?? []),
        ...draft.strengths,
        ...Object.values(dimensions).flatMap((dimension) => dimension.evidence).slice(0, 3),
      ]).slice(0, 6)
    : unique(draft.acceptanceRationale ?? []);
  const milestoneConditions = unique([
    ...(draft.milestoneConditions ?? []),
    "Validate demand with qualified customers.",
    "Report measurable traction before the next financing milestone.",
  ]).slice(0, 6);

  const noTermSheetReason = finalDecision === "reject"
    ? (draft.noTermSheetReason && draft.noTermSheetReason.trim().length > 0
        ? draft.noTermSheetReason
        : rejectionReasons[0] ?? "The pitch does not meet the funding threshold.")
    : undefined;
  if (finalDecision === "reject" && (draft.proposedAmount || draft.proposedEquity || draft.termSheetRecommendation)) {
    qualityFlags.push("term_sheet_removed");
  }

  const decisionConfidence = clampScore(
    Math.round(
      (draft.overallScore + scores.reduce((sum, score) => sum + score, 0) / scores.length) / 2 -
        (qualityFlags.includes("missing_required_explanation") ? 10 : 0)
    )
  );
  if (decisionConfidence < 55) qualityFlags.push("low_confidence");

  return {
    modelRecommendation: draft.modelRecommendation,
    finalDecision,
    decisionConfidence,
    decisionSummary:
      finalDecision === "accept"
        ? "The pitch clears the private beta funding bar, with risks that can be managed through milestone discipline."
        : finalDecision === "conditional"
          ? "The pitch has fundable elements, but it needs stronger evidence before an unconditional term sheet."
          : "The pitch does not yet clear the funding bar; the next step is to fix the specific evidence gaps.",
    ruleReasons: unique(ruleReasons),
    dimensions,
    rejectionReasons,
    conditionalRequirements,
    minimumEvidenceNeeded,
    whatWouldChangeDecision,
    acceptanceRationale,
    majorRisksStillPresent,
    milestoneConditions,
    redFlags: unique(redFlags),
    missingInformation: unique(missingInformation),
    noTermSheetReason,
    termSheetRecommendation: finalDecision === "reject" ? undefined : draft.termSheetRecommendation,
    qualityFlags: unique(qualityFlags) as VCReviewQualityFlag[],
  };
}

export function decisionForVcReviewStorage(decision: VCReviewFinalDecision): "proposal" | "revise" | "reject" {
  return normalizeDecisionForStorage(decision);
}
