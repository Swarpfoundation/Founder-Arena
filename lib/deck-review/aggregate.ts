import type { AggregateReview, FirmReview, FundingLikelihood, OverallDecision } from "./schemas";

/**
 * Deterministic aggregation of firm reviews into the funding-market verdict.
 * Pure math over validated firm reviews — the model never writes the
 * aggregate, so it cannot fabricate an overall funding decision.
 */

const INTERESTED_DECISIONS = new Set(["interested", "conditional", "term_sheet_ready"]);

function dedupeBounded(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

export function aggregateFirmReviews(firmReviews: FirmReview[]): AggregateReview {
  if (firmReviews.length === 0) {
    return {
      overallDecision: "rejected",
      overallScore: 0,
      interestedFirmIds: [],
      passedFirmIds: [],
      strongestFitFirmId: null,
      fundingLikelihood: "low",
      topReasons: [],
      topRisks: ["No firm reviews were produced for this deck."],
      bestNextMilestones: [],
      suggestedPitchFixes: [],
      playerFacingSummary:
        "No investment firm completed a review of this deck, so the arena market has no verdict yet.",
    };
  }

  const interested = firmReviews.filter((review) => INTERESTED_DECISIONS.has(review.decision));
  const passed = firmReviews.filter((review) => review.decision === "pass");
  const termSheetReady = firmReviews.filter((review) => review.decision === "term_sheet_ready");

  const overallScore = Math.round(
    firmReviews.reduce((sum, review) => sum + review.score, 0) / firmReviews.length
  );

  const interestedShare = interested.length / firmReviews.length;

  let overallDecision: OverallDecision;
  if (termSheetReady.length > 0 && interestedShare >= 0.5) {
    overallDecision = "fundable";
  } else if (interested.some((review) => review.decision !== "conditional") && interestedShare >= 0.5) {
    overallDecision = "fundable";
  } else if (interested.length > 0 && passed.length > 0) {
    overallDecision = "mixed";
  } else if (interested.length > 0) {
    overallDecision = interested.every((review) => review.decision === "conditional") ? "conditional" : "mixed";
  } else {
    overallDecision = "rejected";
  }

  let fundingLikelihood: FundingLikelihood;
  if (termSheetReady.length > 0 || (interestedShare >= 0.5 && overallScore >= 70)) {
    fundingLikelihood = "high";
  } else if (interested.length > 0 && overallScore >= 45) {
    fundingLikelihood = "medium";
  } else {
    fundingLikelihood = "low";
  }

  const strongest = [...firmReviews].sort(
    (a, b) => (b.sectorFit + b.score) - (a.sectorFit + a.score)
  )[0];

  const topReasons = dedupeBounded(
    [...termSheetReady, ...interested].flatMap((review) => review.whyTheyLikeIt),
    6
  );
  const topRisks = dedupeBounded(
    firmReviews.flatMap((review) => [...review.dealBreakers, ...review.mainConcerns]),
    6
  );
  const bestNextMilestones = dedupeBounded(
    firmReviews.flatMap((review) => review.requiredMilestones),
    6
  );
  const suggestedPitchFixes = dedupeBounded(
    firmReviews.flatMap((review) => review.missingInformation),
    6
  );

  const interestedNames = interested.map((review) => review.firmName);
  const summaryParts: string[] = [];
  if (interested.length === 0) {
    summaryParts.push(`All ${firmReviews.length} arena firms passed on this deck.`);
  } else {
    summaryParts.push(
      `${interested.length} of ${firmReviews.length} arena firms showed interest (${interestedNames.join(", ")}).`
    );
  }
  if (termSheetReady.length > 0) {
    summaryParts.push(`${termSheetReady[0].firmName} signaled it is term-sheet ready.`);
  }
  if (topRisks[0]) {
    summaryParts.push(`Biggest concern across the market: ${topRisks[0]}`);
  }
  if (suggestedPitchFixes[0]) {
    summaryParts.push(`Most-requested fix: ${suggestedPitchFixes[0]}`);
  }

  return {
    overallDecision,
    overallScore,
    interestedFirmIds: interested.map((review) => review.firmId),
    passedFirmIds: passed.map((review) => review.firmId),
    strongestFitFirmId: strongest?.firmId ?? null,
    fundingLikelihood,
    topReasons,
    topRisks,
    bestNextMilestones,
    suggestedPitchFixes,
    playerFacingSummary: summaryParts.join(" ").slice(0, 1200),
  };
}
